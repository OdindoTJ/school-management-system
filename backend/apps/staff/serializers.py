"""
Serializers for the staff app.
"""
from django.contrib.auth.models import User, Permission
from rest_framework import serializers

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