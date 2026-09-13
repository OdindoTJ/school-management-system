"""
Serializers for the parents app.
"""
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import serializers

from .models import (
    StudentGuardian,
    Parent,
    StudentParent,
    ParentInvitation,
    ParentLinkAttempt,
)


# ============================================================
# INVITATION SERIALIZERS
# ============================================================

class InvitationValidateSerializer(serializers.ModelSerializer):
    """
    Returned when a parent clicks an invitation link.
    Only exposes student first name + guardian relationship for confirmation.
    Never exposes full student data.
    """
    student_first_name = serializers.CharField(source='student.first_name', read_only=True)
    student_initials = serializers.SerializerMethodField()
    guardian_relationship = serializers.CharField(
        source='student_guardian.get_relationship_display',
        read_only=True,
    )
    guardian_name_hint = serializers.SerializerMethodField()

    class Meta:
        model = ParentInvitation
        fields = [
            'email',
            'student_first_name',
            'student_initials',
            'guardian_relationship',
            'guardian_name_hint',
            'expires_at',
        ]

    def get_student_initials(self, obj):
        first = obj.student.first_name or ''
        last = obj.student.last_name or ''
        return f"{first[:1]}. {last[:1]}." if first and last else ''

    def get_guardian_name_hint(self, obj):
        """Show partial name so parent can confirm it's them."""
        name = obj.student_guardian.full_name or ''
        parts = name.split()
        if len(parts) < 2:
            return name
        return f"{parts[0]} {parts[-1][:1]}."


class InvitationAcceptSerializer(serializers.Serializer):
    """
    Payload when accepting an invitation.
    All verification fields MUST match the StudentGuardian record.
    """
    phone = serializers.CharField(required=True, max_length=20)
    national_id = serializers.CharField(required=True, max_length=50)
    student_dob = serializers.DateField(required=True)
    password = serializers.CharField(required=True, min_length=8, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs


# ============================================================
# PARENT SERIALIZERS
# ============================================================

class ParentProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    linked_children_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Parent
        fields = [
            'id', 'full_name', 'email', 'username',
            'phone', 'national_id', 'relationship',
            'email_verified', 'must_change_password', 'is_active',
            'linked_children_count', 'created_at',
        ]
        read_only_fields = fields


class ParentLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class ParentChangePasswordSerializer(serializers.Serializer):
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
# STUDENT-PARENT LINK SERIALIZERS
# ============================================================

class ChildBasicSerializer(serializers.Serializer):
    """
    Child info exposed to the parent.
    """
    id = serializers.IntegerField()
    admission_number = serializers.CharField()
    full_name = serializers.CharField()
    class_name = serializers.CharField(allow_null=True)
    photo = serializers.ImageField(allow_null=True)
    relationship = serializers.CharField()
    can_view_academic = serializers.BooleanField()
    can_view_financials = serializers.BooleanField()
    is_primary_contact = serializers.BooleanField()
    linked_at = serializers.DateTimeField()


class SelfLinkSerializer(serializers.Serializer):
    """
    Payload for a logged-in parent to link an additional child.
    Uses the same two-field verification as the initial invitation.
    """
    admission_number = serializers.CharField(required=True, max_length=50)
    phone = serializers.CharField(required=True, max_length=20)
    national_id = serializers.CharField(required=True, max_length=50)


class CoparentInviteSerializer(serializers.Serializer):
    """
    Payload for a parent to invite a coparent.
    The coparent must already exist as a StudentGuardian for that student.
    """
    student_id = serializers.IntegerField(required=True)
    email = serializers.EmailField(required=True)


# ============================================================
# AUDIT LOG SERIALIZER
# ============================================================

class ParentLinkAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParentLinkAttempt
        fields = '__all__'