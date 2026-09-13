"""
Models for the parents app.

Tables:
- StudentGuardian: Guardian info captured at admission (source of truth for verification)
- Parent: Parent login account
- StudentParent: Verified link between Parent and Student, with permission flags
- ParentInvitation: Single-use, expiring invitation token
- ParentLinkAttempt: Audit log of every link attempt
"""

import secrets
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class StudentGuardian(models.Model):
    """
    Guardian info captured during student admission.
    This is the SOURCE OF TRUTH for verification when a parent claims an invitation.
    Only admin/staff can create/edit these records.
    """
    RELATIONSHIP_CHOICES = [
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Legal Guardian'),
        ('step_parent', 'Step-Parent'),
        ('grandparent', 'Grandparent'),
        ('other', 'Other'),
    ]

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='guardians',
    )
    full_name = models.CharField(max_length=200)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    phone = models.CharField(max_length=20, help_text="Primary phone for this guardian")
    national_id = models.CharField(
        max_length=50,
        help_text="National ID / Passport number",
    )
    email = models.EmailField(help_text="Used for sending invitations")
    is_primary = models.BooleanField(
        default=False,
        help_text="Primary contact for this student",
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Student Guardian'
        verbose_name_plural = 'Student Guardians'
        ordering = ['-is_primary', 'full_name']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'phone'],
                name='unique_guardian_phone_per_student',
            ),
            models.UniqueConstraint(
                fields=['student', 'national_id'],
                name='unique_guardian_national_id_per_student',
            ),
            models.UniqueConstraint(
                fields=['student'],
                condition=Q(is_primary=True),
                name='only_one_primary_guardian_per_student',
            ),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.get_relationship_display()}) — {self.student.admission_number}"


class Parent(models.Model):
    """
    Parent login account. Linked to Django User for authentication.
    One Parent account can be linked to MANY students (via StudentParent).
    """
    RELATIONSHIP_CHOICES = [
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('guardian', 'Legal Guardian'),
        ('step_parent', 'Step-Parent'),
        ('grandparent', 'Grandparent'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='parent_profile',
    )
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    national_id = models.CharField(max_length=50)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default='guardian')
    email_verified = models.BooleanField(default=False)
    must_change_password = models.BooleanField(
        default=False,
        help_text="Set True when admin resets the parent's password.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Parent'
        verbose_name_plural = 'Parents'
        ordering = ['full_name']

    def __str__(self):
        return f"{self.full_name} ({self.user.email})"

    @property
    def linked_children_count(self):
        return self.student_links.filter(is_active=True).count()


class StudentParent(models.Model):
    """
    Verified link between a Parent and a Student.
    Includes permission flags for coparenting / restricted cases.
    """
    LINK_VIA_CHOICES = [
        ('invitation', 'Via Invitation'),
        ('self_service', 'Self-Service Link'),
        ('coparent_invite', 'Invited by Co-Parent'),
        ('admin', 'Created by Admin'),
    ]

    RELATIONSHIP_CHOICES = StudentGuardian.RELATIONSHIP_CHOICES

    parent = models.ForeignKey(
        Parent,
        on_delete=models.CASCADE,
        related_name='student_links',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='parent_links',
    )
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)

    # Permission flags — set by admin
    can_view_academic = models.BooleanField(
        default=True,
        help_text="Can view grades, attendance, timetable, assignments, etc.",
    )
    can_view_financials = models.BooleanField(
        default=True,
        help_text="Can view fees, payments, balances.",
    )
    is_primary_contact = models.BooleanField(
        default=False,
        help_text="Only one primary contact per student. Used for urgent communications.",
    )

    # Audit
    linked_via = models.CharField(max_length=20, choices=LINK_VIA_CHOICES, default='invitation')
    is_active = models.BooleanField(default=True)
    linked_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Student-Parent Link'
        verbose_name_plural = 'Student-Parent Links'
        ordering = ['-is_primary_contact', 'student', 'parent']
        constraints = [
            models.UniqueConstraint(
                fields=['parent', 'student'],
                name='unique_parent_student_link',
            ),
            models.UniqueConstraint(
                fields=['student'],
                condition=Q(is_primary_contact=True, is_active=True),
                name='only_one_primary_contact_per_student',
            ),
        ]

    def __str__(self):
        return f"{self.parent.full_name} → {self.student.admission_number}"


class ParentInvitation(models.Model):
    """
    Single-use, expiring token for onboarding a parent.
    """
    INVITE_TYPE_CHOICES = [
        ('initial', 'Initial Invitation'),
        ('coparent', 'Co-Parent Invitation'),
        ('resend', 'Resent Invitation'),
    ]

    token = models.CharField(max_length=64, unique=True, db_index=True)
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='parent_invitations',
    )
    student_guardian = models.ForeignKey(
        StudentGuardian,
        on_delete=models.CASCADE,
        related_name='invitations',
    )
    email = models.EmailField(help_text="Email the invitation is sent to")
    invite_type = models.CharField(max_length=20, choices=INVITE_TYPE_CHOICES, default='initial')

    invited_by_parent = models.ForeignKey(
        Parent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invitations_sent',
        help_text="If a parent invited a co-parent",
    )
    invited_by_staff = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='parent_invitations_sent',
        help_text="If admin/staff sent the invitation",
    )

    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    attempts = models.IntegerField(default=0, help_text="Failed accept attempts")
    last_attempt_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Parent Invitation'
        verbose_name_plural = 'Parent Invitations'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token', 'expires_at']),
        ]

    def __str__(self):
        return f"Invite for {self.email} ({self.get_invite_type_display()})"

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self.generate_token()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=72)
        super().save(*args, **kwargs)

    @staticmethod
    def generate_token():
        """Generate a URL-safe 64-character token."""
        return secrets.token_urlsafe(48)[:64]

    @property
    def is_valid(self):
        """Check if invitation is still valid."""
        return (
            self.accepted_at is None
            and self.revoked_at is None
            and self.expires_at > timezone.now()
            and self.attempts < 5
        )

    @property
    def is_expired(self):
        return self.expires_at <= timezone.now()

    @property
    def is_accepted(self):
        return self.accepted_at is not None

    @property
    def is_revoked(self):
        return self.revoked_at is not None

    def revoke(self):
        """Mark invitation as revoked."""
        self.revoked_at = timezone.now()
        self.save(update_fields=['revoked_at'])

    def accept(self):
        """Mark invitation as accepted."""
        self.accepted_at = timezone.now()
        self.save(update_fields=['accepted_at'])


class ParentLinkAttempt(models.Model):
    """
    Audit log of every linking attempt (success or fail).
    Used for security analysis — detect brute-force attempts.
    """
    FAILURE_REASON_CHOICES = [
        ('invalid_token', 'Invalid Token'),
        ('expired', 'Token Expired'),
        ('revoked', 'Token Revoked'),
        ('already_accepted', 'Token Already Accepted'),
        ('phone_mismatch', 'Phone Mismatch'),
        ('id_mismatch', 'National ID Mismatch'),
        ('dob_mismatch', 'Student DOB Mismatch'),
        ('already_linked', 'Student Already Linked to This Parent'),
        ('too_many_attempts', 'Too Many Attempts'),
        ('rate_limited', 'Rate Limited'),
        ('email_conflict', 'Email Already in Use'),
        ('other', 'Other'),
    ]

    parent = models.ForeignKey(
        Parent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='link_attempts',
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='parent_link_attempts',
    )
    invitation = models.ForeignKey(
        ParentInvitation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='link_attempts',
    )

    email_attempted = models.EmailField(blank=True, null=True)
    phone_attempted = models.CharField(max_length=20, blank=True, null=True)
    national_id_attempted = models.CharField(max_length=50, blank=True, null=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)

    success = models.BooleanField(default=False)
    failure_reason = models.CharField(
        max_length=30,
        choices=FAILURE_REASON_CHOICES,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Parent Link Attempt'
        verbose_name_plural = 'Parent Link Attempts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ip_address', 'created_at']),
            models.Index(fields=['student', 'created_at']),
        ]

    def __str__(self):
        status = 'Success' if self.success else f'Failed ({self.failure_reason})'
        return f"{self.email_attempted or 'unknown'} — {status} — {self.created_at}"