"""
Admin configuration for students app.
"""
from django.contrib import admin
from .models import (
    Student, Attendance, Assignment,
    LibraryRecord, Club, ClubMembership,
    Sport, SportMembership
)


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['admission_number', 'first_name', 'last_name', 'school_class', 'is_active', 'must_change_password']
    list_filter = ['is_active', 'must_change_password', 'gender', 'school_class']
    search_fields = ['admission_number', 'first_name', 'last_name', 'user__email']
    autocomplete_fields = ['user', 'school_class']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Personal Information', {
            'fields': ('user', 'first_name', 'last_name', 'admission_number',
                       'date_of_birth', 'gender', 'photo')
        }),
        ('Academic', {
            'fields': ('school_class', 'enrollment_date')
        }),
        ('Contact', {
            'fields': ('address',)
        }),
        ('Status', {
            'fields': ('is_active', 'must_change_password', 'created_at', 'updated_at')
        }),
    )


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'status', 'marked_by']
    list_filter = ['status', 'date']
    search_fields = ['student__admission_number', 'student__first_name', 'student__last_name']
    autocomplete_fields = ['student', 'marked_by']
    date_hierarchy = 'date'


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'school_class', 'subject', 'teacher', 'due_date', 'is_active']
    list_filter = ['is_active', 'school_class', 'subject', 'due_date']
    search_fields = ['title', 'description']
    autocomplete_fields = ['school_class', 'subject', 'teacher']
    date_hierarchy = 'due_date'


@admin.register(LibraryRecord)
class LibraryRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'book_title', 'borrowed_date', 'due_date', 'returned_date', 'status', 'fine_amount']
    list_filter = ['status', 'borrowed_date', 'due_date']
    search_fields = ['student__admission_number', 'book_title', 'book_author', 'book_isbn']
    autocomplete_fields = ['student']
    date_hierarchy = 'borrowed_date'


class ClubMembershipInline(admin.TabularInline):
    model = ClubMembership
    extra = 1
    autocomplete_fields = ['student']


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'patron', 'meeting_day', 'meeting_time', 'is_active']
    list_filter = ['category', 'is_active', 'meeting_day']
    search_fields = ['name', 'description']
    autocomplete_fields = ['patron']
    inlines = [ClubMembershipInline]


@admin.register(ClubMembership)
class ClubMembershipAdmin(admin.ModelAdmin):
    list_display = ['club', 'student', 'role', 'joined_date', 'is_active']
    list_filter = ['role', 'is_active', 'club']
    search_fields = ['student__admission_number', 'student__first_name', 'student__last_name', 'club__name']
    autocomplete_fields = ['club', 'student']


class SportMembershipInline(admin.TabularInline):
    model = SportMembership
    extra = 1
    autocomplete_fields = ['student']


@admin.register(Sport)
class SportAdmin(admin.ModelAdmin):
    list_display = ['name', 'coach', 'season', 'training_days', 'training_time', 'is_active']
    list_filter = ['is_active', 'season']
    search_fields = ['name', 'description']
    autocomplete_fields = ['coach']
    inlines = [SportMembershipInline]


@admin.register(SportMembership)
class SportMembershipAdmin(admin.ModelAdmin):
    list_display = ['sport', 'student', 'joined_date', 'is_active']
    list_filter = ['is_active', 'sport']
    search_fields = ['student__admission_number', 'student__first_name', 'student__last_name', 'sport__name']
    autocomplete_fields = ['sport', 'student']