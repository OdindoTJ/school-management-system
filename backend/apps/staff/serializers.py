"""
Serializers for the staff app.
"""
from django.contrib.auth.models import User, Permission
from rest_framework import serializers
from django.db import transaction
from .models import (
    StaffRole,
    Staff,
    StaffRoleAssignment,
    AuditLog,
    ChangeRequest,
)


# ============================================================
# ROLE SERIALIZERS
# ============================================================

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'name']


class StaffRoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(
        source='default_permissions',
        many=True,
        read_only=True,
    )
    staff_count = serializers.SerializerMethodField()

    class Meta:
        model = StaffRole
        fields = [
            'id', 'name', 'slug', 'description', 'level',
            'requires_mfa', 'dashboard_config',
            'is_system_role', 'is_active',
            'permissions', 'staff_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'staff_count']

    def get_staff_count(self, obj):
        return obj.assignments.filter(is_active=True).count()


class StaffRoleBriefSerializer(serializers.ModelSerializer):
    """Compact role info for embedding in staff responses."""
    class Meta:
        model = StaffRole
        fields = ['id', 'name', 'slug', 'level', 'requires_mfa']


# ============================================================
# AUTH SERIALIZERS
# ============================================================

class StaffLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    mfa_code = serializers.CharField(required=False, allow_blank=True, write_only=True)


class StaffChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs


# ============================================================
# STAFF SERIALIZERS
# ============================================================

class StaffProfileSerializer(serializers.ModelSerializer):
    """
    Full staff profile (for the logged-in staff's own profile view).
    """
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    roles = serializers.SerializerMethodField()
    highest_role = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'staff_id', 'full_name', 'email', 'username',
            'phone', 'national_id', 'date_of_birth',
            'date_hired', 'employment_type', 'contract_end_date',
            'photo', 'bio',
            'must_change_password',
            'mfa_required', 'mfa_enabled',
            'is_active', 'access_review_date',
            'roles', 'highest_role', 'is_admin',
            'created_at',
        ]
        read_only_fields = fields

    def get_roles(self, obj):
        return [
            StaffRoleBriefSerializer(role).data
            for role in obj.active_roles
        ]

    def get_highest_role(self, obj):
        role = obj.highest_role
        if role:
            return StaffRoleBriefSerializer(role).data
        return None


class StaffListSerializer(serializers.ModelSerializer):
    """
    Compact staff info for listing (admin view).
    """
    roles = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'staff_id', 'full_name', 'email', 'phone',
            'employment_type', 'is_active', 'photo',
            'mfa_required', 'mfa_enabled',
            'roles', 'is_admin',
            'date_hired',
        ]

    def get_roles(self, obj):
        return [
            StaffRoleBriefSerializer(role).data
            for role in obj.active_roles
        ]


# ============================================================
# ROLE ASSIGNMENT SERIALIZERS
# ============================================================

class StaffRoleAssignmentSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    assigned_by_name = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = StaffRoleAssignment
        fields = [
            'id', 'staff', 'role', 'role_name',
            'assigned_by', 'assigned_by_name',
            'assigned_at', 'expires_at', 'is_active',
            'is_expired', 'notes',
        ]
        read_only_fields = ['id', 'assigned_at', 'assigned_by', 'assigned_by_name', 'is_expired']

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.username
        return None


# ============================================================
# AUDIT LOG SERIALIZERS
# ============================================================

class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'actor', 'actor_staff_id', 'actor_name',
            'action', 'action_display',
            'model_name', 'object_id', 'object_repr',
            'changes', 'ip_address', 'user_agent',
            'request_method', 'request_path',
            'is_flagged', 'flag_reason',
        ]
        read_only_fields = fields


# ============================================================
# CHANGE REQUEST SERIALIZERS
# ============================================================

class ChangeRequestSerializer(serializers.ModelSerializer):
    request_type_display = serializers.CharField(
        source='get_request_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = ChangeRequest
        fields = [
            'id', 'request_type', 'request_type_display',
            'requested_by', 'requested_by_name',
            'target_model', 'target_object_id',
            'current_value', 'requested_value',
            'reason',
            'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'review_notes',
            'applied_at',
            'is_expired', 'expires_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'requested_by', 'requested_by_name',
            'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'applied_at',
            'status', 'status_display',
            'is_expired', 'expires_at',
            'created_at', 'updated_at',
        ]

    def get_requested_by_name(self, obj):
        if obj.requested_by:
            return obj.requested_by.get_full_name() or obj.requested_by.username
        return None

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None


class ChangeRequestReviewSerializer(serializers.Serializer):
    """Payload for approving/rejecting a change request."""
    decision = serializers.ChoiceField(choices=['approved', 'rejected'])
    review_notes = serializers.CharField(required=False, allow_blank=True)


# ============================================================
# ADMIN — STAFF MANAGEMENT SERIALIZERS
# ============================================================

class AdminStaffListSerializer(serializers.ModelSerializer):
    """
    Compact staff info for the admin list view.
    """
    roles = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(read_only=True)
    photo_url = serializers.SerializerMethodField()
    active_role_names = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = [
            'id', 'staff_id', 'full_name', 'email', 'phone',
            'employment_type', 'date_hired',
            'photo_url', 'is_active',
            'mfa_required', 'mfa_enabled',
            'is_admin', 'roles', 'active_role_names',
        ]

    def get_roles(self, obj):
        return [
            StaffRoleBriefSerializer(r).data
            for r in obj.active_roles
        ]

    def get_active_role_names(self, obj):
        return [r.name for r in obj.active_roles]

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class AdminStaffDetailSerializer(serializers.ModelSerializer):
    """
    Full staff info for admin detail/edit views.
    """
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)
    photo_url = serializers.SerializerMethodField()
    roles = serializers.SerializerMethodField()
    highest_role = serializers.SerializerMethodField()
    is_admin = serializers.BooleanField(read_only=True)
    bio_name = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = [
            'id', 'staff_id',
            'full_name', 'email', 'username',
            'phone', 'national_id', 'date_of_birth',
            'date_hired', 'employment_type', 'contract_end_date',
            'photo', 'photo_url', 'bio', 'bio_name',
            'must_change_password',
            'mfa_required', 'mfa_enabled',
            'is_active', 'user_is_active',
            'access_review_date',
            'deactivated_at', 'deactivation_reason',
            'roles', 'highest_role', 'is_admin',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'email', 'username', 'user_is_active',
            'must_change_password', 'mfa_required', 'mfa_enabled',
            'deactivated_at', 'deactivation_reason',
            'roles', 'highest_role', 'is_admin',
            'created_at', 'updated_at',
        ]

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None

    def get_roles(self, obj):
        return [
            StaffRoleBriefSerializer(r).data
            for r in obj.active_roles
        ]

    def get_highest_role(self, obj):
        role = obj.highest_role
        if role:
            return StaffRoleBriefSerializer(role).data
        return None

    def get_bio_name(self, obj):
        return obj.bio.name if obj.bio else None


class AdminStaffCreateSerializer(serializers.Serializer):
    """
    Creates a Django User + Staff record in one atomic transaction.
    Returns the generated temporary password to the admin ONCE.
    """
    # Required fields
    full_name = serializers.CharField(max_length=200)
    staff_id = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    date_hired = serializers.DateField()
    employment_type = serializers.ChoiceField(choices=Staff.EMPLOYMENT_TYPE_CHOICES)

    # Optional fields
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    national_id = serializers.CharField(max_length=50, required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    contract_end_date = serializers.DateField(required=False, allow_null=True)
    access_review_date = serializers.DateField(required=False, allow_null=True)
    bio = serializers.PrimaryKeyRelatedField(
        # Placeholder queryset at class-definition time (DRF requires a
        # non-None queryset here or it raises AssertionError on import).
        # `bio` actually links to apps.schools.models.Staff (the public-
        # facing staff/bio page), not this app's own Staff model — that
        # import happens lazily in __init__ below to avoid a circular
        # import between apps.staff and apps.schools. Staff.objects.none()
        # here is just a harmless placeholder of the right "shape" and is
        # immediately overwritten before any real request is processed.
        queryset=Staff.objects.none(),
        required=False,
        allow_null=True,
    )

    # Initial roles
    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.schools.models import Staff as PublicStaff
        self.fields['bio'].queryset = PublicStaff.objects.all()

    def validate_staff_id(self, value):
        v = value.strip().upper()
        if Staff.objects.filter(staff_id=v).exists():
            raise serializers.ValidationError("A staff member with this ID already exists.")
        return v

    def validate_email(self, value):
        email = value.lower().strip()
        if User.objects.filter(username=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email

    def validate(self, attrs):
        if attrs.get('employment_type') == 'contract' and not attrs.get('contract_end_date'):
            raise serializers.ValidationError({
                'contract_end_date': 'Contract end date is required for contract staff.'
            })
        return attrs

    def create(self, validated_data):
        import secrets
        import string

        role_ids = validated_data.pop('role_ids', [])
        validated_data.pop('email', None)  # handled below

        alphabet = string.ascii_letters + string.digits + "!@#$%&*"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        email = validated_data['email'].lower().strip() if 'email' in validated_data else None
        # Re-read email from initial data (since we popped)
        email = self.initial_data.get('email', '').lower().strip()
        if not email:
            raise serializers.ValidationError({'email': 'Email is required.'})

        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                email=email,
                password=temp_password,
                first_name='',
                last_name='',
            )

            staff = Staff.objects.create(
                user=user,
                full_name=validated_data['full_name'],
                staff_id=validated_data['staff_id'],
                email=email,
                phone=validated_data.get('phone', ''),
                national_id=validated_data.get('national_id', ''),
                date_of_birth=validated_data.get('date_of_birth'),
                date_hired=validated_data['date_hired'],
                employment_type=validated_data['employment_type'],
                contract_end_date=validated_data.get('contract_end_date'),
                access_review_date=validated_data.get('access_review_date'),
                bio=validated_data.get('bio'),
                must_change_password=True,
            )

            # Assign initial roles
            if role_ids:
                roles = StaffRole.objects.filter(id__in=role_ids, is_active=True)
                for role in roles:
                    StaffRoleAssignment.objects.create(
                        staff=staff,
                        role=role,
                        assigned_by=self.context['request'].user,
                    )
                    # Auto-flag MFA if any role requires it
                    if role.requires_mfa and not staff.mfa_required:
                        staff.mfa_required = True
                        staff.save(update_fields=['mfa_required'])

        staff._temp_password = temp_password
        return staff


class AdminStaffUpdateSerializer(serializers.ModelSerializer):
    """
    Update staff record (no user/password changes here).
    """
    class Meta:
        model = Staff
        fields = [
            'full_name', 'phone', 'national_id', 'date_of_birth',
            'date_hired', 'employment_type', 'contract_end_date',
            'photo', 'bio', 'access_review_date',
        ]


class StaffResetPasswordResponseSerializer(serializers.Serializer):
    """Response for reset-password action."""
    message = serializers.CharField()
    temporary_password = serializers.CharField()


# ============================================================
# STAFF ROLE ASSIGNMENT — inline serializers for admin forms
# ============================================================

class AdminRoleAssignmentCreateSerializer(serializers.Serializer):
    staff = serializers.IntegerField()
    role = serializers.IntegerField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class DeactivateStaffSerializer(serializers.Serializer):
    reason = serializers.CharField(min_length=5)