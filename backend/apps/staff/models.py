"""
Staff management models.

Tables:
- StaffRole: Role definitions with permissions and dashboard config
- Staff: Staff member record linked to Django User
- StaffRoleAssignment: Which staff has which role(s)
- AuditLog: Append-only log of all write actions
- ChangeRequest: Approval workflow for sensitive actions
"""

import secrets
from datetime import timedelta

from django.contrib.auth.models import User, Permission
from django.core.validators import FileExtensionValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class StaffRole(models.Model):
    """
    Role definition with default permissions and dashboard config.
    Built-in roles are seeded via data migration.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    # Hierarchy: 1 = highest authority, 10 = lowest
    level = models.IntegerField(
        default=10,
        help_text="Lower number = higher authority. 1 = Admin, 10 = lowest.",
    )

    # Default Django permissions granted when this role is assigned
    default_permissions = models.ManyToManyField(
        Permission,
        blank=True,
        related_name='staff_roles',
        help_text="Django permissions granted by default.",
    )

    # MFA requirement
    requires_mfa = models.BooleanField(
        default=False,
        help_text="Whether staff with this role must use MFA.",
    )

    # Dashboard configuration (JSON)
    dashboard_config = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Defines sidebar items and quick actions. "
            'Example: {"sidebar": ["dashboard", "grade-entry"], "quick_actions": ["enter_grades"]}'
        ),
    )

    # System role flag — built-in roles can't be deleted
    is_system_role = models.BooleanField(
        default=False,
        help_text="System roles cannot be deleted by admin.",
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Staff Role'
        verbose_name_plural = 'Staff Roles'
        ordering = ['level', 'name']

    def __str__(self):
        return f"{self.name} (Level {self.level})"


class Staff(models.Model):
    """
    Staff member record with authentication and employment lifecycle.
    """
    EMPLOYMENT_TYPE_CHOICES = [
        ('permanent', 'Permanent'),
        ('contract', 'Contract'),
        ('intern', 'Intern'),
        ('part_time', 'Part-Time'),
        ('volunteer', 'Volunteer'),
    ]

    # Authentication
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='staff_profile',
        help_text="Django user used for login (email + password).",
    )

    # Identification
    staff_id = models.CharField(
        max_length=50,
        unique=True,
        help_text="Human-readable staff ID, e.g. STAFF-2026-001",
    )
    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    national_id = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    # Employment
    date_hired = models.DateField()
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default='permanent',
    )
    contract_end_date = models.DateField(
        blank=True,
        null=True,
        help_text="Required for contract staff.",
    )

    # Profile
    photo = models.ImageField(
        upload_to='staff/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])],
    )
    bio = models.OneToOneField(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='auth_profile',
        help_text="Optional link to public-facing bio on the school website.",
    )

    # Authentication lifecycle
    must_change_password = models.BooleanField(
        default=True,
        help_text="Forces password change on next login (for admin-created accounts).",
    )

    # MFA (schema ready, enforcement later)
    mfa_required = models.BooleanField(
        default=False,
        help_text="Set True for high-privilege roles (admin, principal, bursar, HOD).",
    )
    mfa_enabled = models.BooleanField(
        default=False,
        help_text="Set True once the staff has completed MFA setup.",
    )
    mfa_secret = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="TOTP secret (stored encrypted at rest).",
    )
    mfa_backup_codes = models.JSONField(
        default=list,
        blank=True,
        help_text="Hashed backup codes for MFA recovery.",
    )

    # Status and lifecycle
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(blank=True, null=True)
    deactivated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deactivated_staff',
        help_text="Who revoked this staff's access.",
    )
    deactivation_reason = models.TextField(blank=True, null=True)

    # Access review (for contract staff or security audits)
    access_review_date = models.DateField(
        blank=True,
        null=True,
        help_text="Next scheduled access review.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Staff Member'
        verbose_name_plural = 'Staff Members'
        ordering = ['full_name']
        indexes = [
            models.Index(fields=['staff_id']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.staff_id} — {self.full_name}"

    @property
    def active_roles(self):
        """Currently active roles assigned to this staff."""
        return StaffRole.objects.filter(
            assignments__staff=self,
            assignments__is_active=True,
        ).filter(
            Q(assignments__expires_at__isnull=True) |
            Q(assignments__expires_at__gte=timezone.now())
        ).distinct()

    @property
    def highest_role(self):
        """Return the role with lowest level number (highest authority)."""
        return self.active_roles.order_by('level').first()

    @property
    def is_admin(self):
        return self.active_roles.filter(slug='admin').exists()

    def deactivate(self, by_user, reason=''):
        """Deactivate this staff member and revoke access."""
        self.is_active = False
        self.deactivated_at = timezone.now()
        self.deactivated_by = by_user
        self.deactivation_reason = reason
        self.user.is_active = False
        self.user.save(update_fields=['is_active'])
        self.save(update_fields=[
            'is_active', 'deactivated_at', 'deactivated_by', 'deactivation_reason',
        ])


class StaffRoleAssignment(models.Model):
    """
    Links a staff member to a role. Supports temporary elevation and expiry.
    """
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name='role_assignments',
    )
    role = models.ForeignKey(
        StaffRole,
        on_delete=models.PROTECT,
        related_name='assignments',
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_staff_roles',
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Optional. For temporary role elevation.",
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = 'Staff Role Assignment'
        verbose_name_plural = 'Staff Role Assignments'
        ordering = ['staff', 'role__level']
        constraints = [
            models.UniqueConstraint(
                fields=['staff', 'role'],
                condition=Q(is_active=True),
                name='unique_active_staff_role',
            ),
        ]

    def __str__(self):
        return f"{self.staff.full_name} → {self.role.name}"

    @property
    def is_expired(self):
        if self.expires_at:
            return self.expires_at <= timezone.now()
        return False


class AuditLog(models.Model):
    """
    Append-only audit trail. Records every sensitive action.
    No updates or deletes should ever be performed on this table.
    """
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('login_failed', 'Login Failed'),
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        ('permission_change', 'Permission Change'),
        ('role_assign', 'Role Assignment'),
        ('role_revoke', 'Role Revocation'),
        ('force_logout', 'Force Logout'),
        ('export', 'Data Export'),
        ('grade_publish', 'Grade Publish'),
        ('fee_waiver', 'Fee Waiver'),
        ('approval_granted', 'Approval Granted'),
        ('approval_rejected', 'Approval Rejected'),
        ('other', 'Other'),
    ]

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="The user who performed the action. Null if system action.",
    )
    actor_staff_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Cached staff_id — survives actor deletion.",
    )
    actor_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Cached full name — survives actor deletion.",
    )

    action = models.CharField(max_length=30, choices=ACTION_CHOICES)

    model_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Affected model, e.g. 'Grade' or 'Student'.",
    )
    object_id = models.CharField(max_length=100, blank=True, null=True)
    object_repr = models.TextField(
        blank=True,
        null=True,
        help_text="Human-readable representation of the object.",
    )

    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Diff of what changed: {'field': {'before': x, 'after': y}}.",
    )

    request_method = models.CharField(max_length=10, blank=True, null=True)
    request_path = models.CharField(max_length=500, blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

    # Flagging for suspicious activity
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.CharField(max_length=200, blank=True, null=True)

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['actor', '-timestamp']),
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['action', '-timestamp']),
        ]

    def __str__(self):
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.actor_name or 'System'} → {self.action}"


class ChangeRequest(models.Model):
    """
    Approval workflow for sensitive actions.
    Examples: grade changes after publish, fee waivers, bulk exports.
    """
    REQUEST_TYPE_CHOICES = [
        ('grade_change', 'Grade Change (after publish)'),
        ('fee_waiver', 'Fee Waiver'),
        ('bulk_export', 'Bulk Data Export'),
        ('permission_elevation', 'Permission Elevation'),
        ('student_delete', 'Student Deletion'),
        ('staff_delete', 'Staff Deletion'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]

    request_type = models.CharField(max_length=30, choices=REQUEST_TYPE_CHOICES)
    requested_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='change_requests_made',
    )

    target_model = models.CharField(
        max_length=100,
        help_text="Model name, e.g. 'Grade'.",
    )
    target_object_id = models.CharField(max_length=100)

    current_value = models.JSONField(
        default=dict,
        help_text="Snapshot of current state.",
    )
    requested_value = models.JSONField(
        default=dict,
        help_text="Proposed new state.",
    )

    reason = models.TextField(
        help_text="Why is this change needed? (Required for audit trail.)",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )

    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='change_requests_reviewed',
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    review_notes = models.TextField(blank=True, null=True)

    applied_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the approved change was applied.",
    )

    expires_at = models.DateTimeField(
        help_text="Auto-expires if not reviewed.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Change Request'
        verbose_name_plural = 'Change Requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['requested_by', '-created_at']),
        ]

    def __str__(self):
        return f"{self.get_request_type_display()} — {self.get_status_display()}"

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return self.expires_at <= timezone.now() and self.status == 'pending'