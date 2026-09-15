"""
Admin configuration for staff app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    StaffRole,
    Staff,
    StaffRoleAssignment,
    AuditLog,
    ChangeRequest,
)


@admin.register(StaffRole)
class StaffRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'level', 'requires_mfa', 'is_system_role', 'is_active']
    list_filter = ['requires_mfa', 'is_system_role', 'is_active']
    search_fields = ['name', 'slug', 'description']
    filter_horizontal = ['default_permissions']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Role Definition', {
            'fields': ('name', 'slug', 'description', 'level')
        }),
        ('Permissions', {
            'fields': ('default_permissions',)
        }),
        ('Security', {
            'fields': ('requires_mfa', 'is_system_role', 'is_active')
        }),
        ('Dashboard Configuration', {
            'fields': ('dashboard_config',),
            'description': (
                'JSON defining sidebar items and quick actions. '
                'Example: {"sidebar": ["dashboard", "grade-entry"], '
                '"quick_actions": ["enter_grades"]}'
            )
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = [
        'staff_id', 'full_name', 'email', 'employment_type',
        'role_badge', 'must_change_password', 'mfa_status', 'is_active',
    ]
    list_filter = [
        'employment_type', 'is_active', 'must_change_password',
        'mfa_required', 'mfa_enabled',
    ]
    search_fields = ['staff_id', 'full_name', 'email', 'national_id', 'phone']
    autocomplete_fields = ['user', 'bio']
    readonly_fields = [
        'created_at', 'updated_at',
        'deactivated_at', 'deactivated_by',
    ]
    date_hierarchy = 'date_hired'
    fieldsets = (
        ('Authentication', {
            'fields': ('user', 'must_change_password', 'is_active')
        }),
        ('Identification', {
            'fields': ('staff_id', 'full_name', 'email', 'phone', 'national_id', 'date_of_birth')
        }),
        ('Employment', {
            'fields': ('date_hired', 'employment_type', 'contract_end_date', 'access_review_date')
        }),
        ('Profile', {
            'fields': ('photo', 'bio')
        }),
        ('MFA (schema ready, enforcement later)', {
            'fields': ('mfa_required', 'mfa_enabled', 'mfa_secret'),
            'classes': ('collapse',),
        }),
        ('Deactivation', {
            'fields': ('deactivated_at', 'deactivated_by', 'deactivation_reason'),
            'classes': ('collapse',),
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def role_badge(self, obj):
        roles = obj.active_roles
        if not roles.exists():
            return format_html('<span style="color: gray;">No role</span>')
        return ', '.join([r.name for r in roles])
    role_badge.short_description = 'Roles'

    def mfa_status(self, obj):
        if not obj.mfa_required:
            return '—'
        if obj.mfa_enabled:
            return format_html('<span style="color: green;">✓ Enabled</span>')
        return format_html('<span style="color: orange;">⚠ Required</span>')
    mfa_status.short_description = 'MFA'


@admin.register(StaffRoleAssignment)
class StaffRoleAssignmentAdmin(admin.ModelAdmin):
    list_display = [
        'staff', 'role', 'assigned_by', 'assigned_at',
        'expires_at', 'is_active',
    ]
    list_filter = ['is_active', 'role']
    search_fields = ['staff__staff_id', 'staff__full_name', 'role__name']
    autocomplete_fields = ['staff', 'role', 'assigned_by']
    readonly_fields = ['assigned_at']
    fieldsets = (
        ('Assignment', {
            'fields': ('staff', 'role', 'is_active')
        }),
        ('Audit', {
            'fields': ('assigned_by', 'assigned_at', 'expires_at', 'notes')
        }),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'actor_name', 'action', 'model_name',
        'object_repr_short', 'ip_address', 'is_flagged',
    ]
    list_filter = ['action', 'is_flagged', 'timestamp']
    search_fields = [
        'actor_name', 'actor_staff_id', 'model_name',
        'object_id', 'object_repr', 'ip_address',
    ]
    readonly_fields = [f.name for f in AuditLog._meta.fields]
    date_hierarchy = 'timestamp'

    def object_repr_short(self, obj):
        if not obj.object_repr:
            return '—'
        return obj.object_repr[:60] + ('...' if len(obj.object_repr) > 60 else '')
    object_repr_short.short_description = 'Object'

    # Append-only — no writes via admin
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(ChangeRequest)
class ChangeRequestAdmin(admin.ModelAdmin):
    list_display = [
        'created_at', 'request_type', 'requested_by',
        'target_model', 'status_badge', 'reviewed_by',
    ]
    list_filter = ['request_type', 'status', 'created_at']
    search_fields = [
        'requested_by__username', 'target_model',
        'target_object_id', 'reason',
    ]
    autocomplete_fields = ['requested_by', 'reviewed_by']
    readonly_fields = ['created_at', 'updated_at', 'applied_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Request', {
            'fields': ('request_type', 'requested_by', 'reason')
        }),
        ('Target', {
            'fields': ('target_model', 'target_object_id')
        }),
        ('Values', {
            'fields': ('current_value', 'requested_value'),
            'classes': ('collapse',)
        }),
        ('Review', {
            'fields': ('status', 'reviewed_by', 'reviewed_at', 'review_notes', 'applied_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['mark_approved', 'mark_rejected']

    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'green',
            'rejected': 'red',
            'cancelled': 'gray',
            'expired': 'gray',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {};">●</span> {}',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'

    @admin.action(description='Mark selected as approved')
    def mark_approved(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='pending').update(
            status='approved',
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f'{updated} request(s) approved.')

    @admin.action(description='Mark selected as rejected')
    def mark_rejected(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='pending').update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )
        self.message_user(request, f'{updated} request(s) rejected.')