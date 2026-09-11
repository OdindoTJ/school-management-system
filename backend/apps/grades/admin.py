"""
Admin configuration for grades app.
"""
from django.contrib import admin
from .models import Grade


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'subject', 'term', 'exam_type',
        'score', 'max_score', 'percentage', 'grade_letter'
    ]
    list_filter = ['term', 'exam_type', 'subject', 'grade_letter']
    search_fields = [
        'student__admission_number',
        'student__first_name',
        'student__last_name',
        'subject__name'
    ]
    autocomplete_fields = ['student', 'subject', 'term', 'entered_by']
    readonly_fields = ['grade_letter', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Grade Information', {
            'fields': ('student', 'subject', 'term', 'exam_type')
        }),
        ('Score', {
            'fields': ('score', 'max_score', 'grade_letter')
        }),
        ('Additional Info', {
            'fields': ('remarks', 'entered_by')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def percentage(self, obj):
        return f"{obj.percentage}%"
    percentage.short_description = 'Percentage'