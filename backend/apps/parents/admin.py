"""
Admin configuration for parents app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    StudentGuardian,
    Parent,
    StudentParent,
    ParentInvitation,
    ParentLinkAttempt,
)


@admin.register(StudentGuardian)
class StudentGuardianAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'student', 'relationship', 'phone',
        'email', 'is_primary',
    ]
    list_filter = ['relationship', 'is_primary']
    search_fields = [
        'full_name', 'phone', 'national_id', 'email',
        'student__admission_number', 'student__first_name', 'student__last_name',
    ]
    autocomplete_fields = ['student']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Student', {
            'fields': ('student', 'is_primary')
        }),
        ('Guardian Details', {
            'fields': ('full_name', 'relationship', 'phone', 'national_id', 'email')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = [
        'full_name', 'user_email', 'phone', 'relationship',
        'children_count', 'email_verified', 'is_active',
    ]
    list_filter = ['relationship', 'email_verified', 'is_active']
    search_fields = ['full_name', 'user__email', 'phone', 'national_id']
    autocomplete_fields = ['user']
    readonly_fields = ['created_at', 'updated_at', 'children_count']
    fieldsets = (
        ('Account', {
            'fields': ('user', 'email_verified', 'must_change_password', 'is_active')
        }),
        ('Personal Information', {
            'fields': ('full_name', 'relationship', 'phone', 'national_id')
        }),
        ('Metadata', {
            'fields': ('children_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    user_email.admin_order_field = 'user__email'

    def children_count(self, obj):
        return obj.linked_children_count
    children_count.short_description = 'Linked Children'


class StudentParentInline(admin.TabularInline):
    model = StudentParent
    extra = 0
    autocomplete_fields = ['parent', 'student']
    fields = [
        'parent', 'student', 'relationship',
        'can_view_academic', 'can_view_financials', 'is_primary_contact',
        'linked_via', 'is_active',
    ]


@admin.register(StudentParent)
class StudentParentAdmin(admin.ModelAdmin):
    list_display = [
        'parent', 'student', 'relationship',
        'can_view_academic', 'can_view_financials', 'is_primary_contact',
        'linked_via', 'is_active',
    ]
    list_filter = [
        'relationship', 'can_view_academic', 'can_view_financials',
        'is_primary_contact', 'linked_via', 'is_active',
    ]
    search_fields = [
        'parent__full_name', 'parent__user__email',
        'student__admission_number', 'student__first_name', 'student__last_name',
    ]
    autocomplete_fields = ['parent', 'student']
    readonly_fields = ['linked_at', 'updated_at']
    fieldsets = (
        ('Link', {
            'fields': ('parent', 'student', 'relationship', 'is_active')
        }),
        ('Permissions', {
            'fields': ('can_view_academic', 'can_view_financials', 'is_primary_contact')
        }),
        ('Audit', {
            'fields': ('linked_via', 'linked_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ParentInvitation)
class ParentInvitationAdmin(admin.ModelAdmin):
    list_display = [
        'email', 'student', 'invite_type', 'status_badge',
        'attempts', 'expires_at', 'created_at',
    ]
    list_filter = ['invite_type', 'accepted_at', 'revoked_at']
    search_fields = [
        'email', 'token',
        'student__admission_number', 'student__first_name', 'student__last_name',
    ]
    autocomplete_fields = ['student', 'student_guardian', 'invited_by_parent', 'invited_by_staff']
    readonly_fields = [
        'token', 'attempts', 'last_attempt_at',
        'accepted_at', 'revoked_at',
        'created_at', 'updated_at',
    ]
    fieldsets = (
        ('Invitation', {
            'fields': ('token', 'email', 'invite_type', 'expires_at')
        }),
        ('Who/For Whom', {
            'fields': ('student', 'student_guardian', 'invited_by_parent', 'invited_by_staff')
        }),
        ('Status', {
            'fields': ('accepted_at', 'revoked_at', 'attempts', 'last_attempt_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['revoke_selected', 'regenerate_tokens']

    def status_badge(self, obj):
        if obj.is_accepted:
            return format_html('<span style="color: green;">✓ Accepted</span>')
        if obj.is_revoked:
            return format_html('<span style="color: gray;">⊘ Revoked</span>')
        if obj.is_expired:
            return format_html('<span style="color: red;">✗ Expired</span>')
        if obj.attempts >= 5:
            return format_html('<span style="color: orange;">⚠ Too Many Attempts</span>')
        return format_html('<span style="color: blue;">● Pending</span>')
    status_badge.short_description = 'Status'

    @admin.action(description='Revoke selected invitations')
    def revoke_selected(self, request, queryset):
        count = 0
        for inv in queryset:
            if not inv.is_accepted and not inv.is_revoked:
                inv.revoke()
                count += 1
        self.message_user(request, f'{count} invitation(s) revoked.')

    @admin.action(description='Regenerate tokens for selected')
    def regenerate_tokens(self, request, queryset):
        from django.utils import timezone
        from datetime import timedelta
        count = 0
        for inv in queryset:
            if inv.is_accepted:
                continue
            inv.token = ParentInvitation.generate_token()
            inv.expires_at = timezone.now() + timedelta(hours=72)
            inv.attempts = 0
            inv.revoked_at = None
            inv.save()
            count += 1
        self.message_user(request, f'{count} invitation(s) regenerated.')


@admin.register(ParentLinkAttempt)
class ParentLinkAttemptAdmin(admin.ModelAdmin):
    list_display = [
        'email_attempted', 'student', 'success_badge',
        'failure_reason', 'ip_address', 'created_at',
    ]
    list_filter = ['success', 'failure_reason', 'created_at']
    search_fields = [
        'email_attempted', 'phone_attempted', 'national_id_attempted',
        'student__admission_number', 'ip_address',
    ]
    readonly_fields = [field.name for field in ParentLinkAttempt._meta.fields]
    date_hierarchy = 'created_at'

    def success_badge(self, obj):
        if obj.success:
            return format_html('<span style="color: green;">✓</span>')
        return format_html('<span style="color: red;">✗</span>')
    success_badge.short_description = 'Result'

    def has_add_permission(self, request):
        return False  # Audit log — no manual adds

    def has_change_permission(self, request, obj=None):
        return False  # Audit log — no edits

    def has_delete_permission(self, request, obj=None):
        return False  # Audit log — no deletes