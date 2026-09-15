"""
Seed the 7 built-in staff roles.
"""
from django.db import migrations


ROLES = [
    {
        'name': 'System Administrator',
        'slug': 'admin',
        'level': 1,
        'description': 'Full system access. Manages all aspects of the platform.',
        'requires_mfa': True,
        'dashboard_config': {
            'sidebar': [
                'dashboard', 'students', 'staff', 'classes', 'subjects',
                'grades', 'attendance', 'assignments', 'library',
                'activities', 'announcements', 'parents',
                'invitations', 'change-requests', 'audit-log', 'settings',
            ],
            'quick_actions': [
                'add_student', 'add_staff', 'send_invitation',
                'review_change_requests', 'view_audit_log',
            ],
        },
    },
    {
        'name': 'Principal',
        'slug': 'principal',
        'level': 2,
        'description': 'Oversees academics and operations. Approves changes.',
        'requires_mfa': True,
        'dashboard_config': {
            'sidebar': [
                'dashboard', 'students', 'staff', 'classes',
                'grades', 'attendance', 'announcements',
                'change-requests', 'reports',
            ],
            'quick_actions': [
                'review_change_requests', 'view_reports', 'send_announcement',
            ],
        },
    },
    {
        'name': 'Deputy Principal',
        'slug': 'deputy_principal',
        'level': 3,
        'description': 'Assists the principal with daily academic operations.',
        'requires_mfa': True,
        'dashboard_config': {
            'sidebar': [
                'dashboard', 'students', 'classes', 'grades',
                'attendance', 'assignments', 'announcements', 'change-requests',
            ],
            'quick_actions': [
                'mark_attendance', 'review_change_requests', 'send_announcement',
            ],
        },
    },
    {
        'name': 'Head of Department',
        'slug': 'hod',
        'level': 4,
        'description': 'Manages a department\'s subjects, staff, and grades.',
        'requires_mfa': True,
        'dashboard_config': {
            'sidebar': [
                'dashboard', 'my-department', 'grade-entry',
                'attendance', 'assignments', 'change-requests',
            ],
            'quick_actions': [
                'enter_grades', 'mark_attendance', 'review_department_grades',
            ],
        },
    },
    {
        'name': 'Bursar',
        'slug': 'bursar',
        'level': 5,
        'description': 'Manages fees, payments, and financial records.',
        'requires_mfa': True,
        'dashboard_config': {
            'sidebar': [
                'dashboard', 'students', 'fees', 'payments',
                'fee-waivers', 'reports', 'change-requests',
            ],
            'quick_actions': [
                'record_payment', 'request_fee_waiver', 'view_financial_reports',
            ],
        },
    },
    {
        'name': 'Librarian',
        'slug': 'librarian',
        'level': 6,
        'description': 'Manages library records, books, and loans.',
        'requires_mfa': False,
        'dashboard_config': {
            'sidebar': ['dashboard', 'library', 'books', 'borrowers'],
            'quick_actions': ['log_loan', 'log_return'],
        },
    },
    {
        'name': 'Teacher',
        'slug': 'teacher',
        'level': 7,
        'description': 'Enters grades, marks attendance, posts assignments.',
        'requires_mfa': False,
        'dashboard_config': {
            'sidebar': [
                'dashboard', 'my-classes', 'grade-entry',
                'attendance', 'assignments', 'announcements',
            ],
            'quick_actions': [
                'enter_grades', 'mark_attendance', 'post_assignment',
            ],
        },
    },
]


def seed_roles(apps, schema_editor):
    StaffRole = apps.get_model('staff', 'StaffRole')
    for role_data in ROLES:
        StaffRole.objects.update_or_create(
            slug=role_data['slug'],
            defaults={
                **role_data,
                'is_system_role': True,
                'is_active': True,
            },
        )


def unseed_roles(apps, schema_editor):
    StaffRole = apps.get_model('staff', 'StaffRole')
    StaffRole.objects.filter(slug__in=[r['slug'] for r in ROLES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('staff', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_roles, unseed_roles),
    ]