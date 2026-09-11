"""
Admin configuration for classes app.
"""
from django.contrib import admin
from .models import AcademicTerm, Class, Subject, ClassSubject, Timetable


@admin.register(AcademicTerm)
class AcademicTermAdmin(admin.ModelAdmin):
    list_display = ['name', 'year', 'start_date', 'end_date', 'is_current']
    list_filter = ['year', 'is_current']
    search_fields = ['name', 'year']
    ordering = ['-year', 'name']


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'academic_year', 'level', 'class_teacher', 'room_number', 'is_active']
    list_filter = ['level', 'academic_year', 'is_active']
    search_fields = ['name', 'room_number']
    autocomplete_fields = ['class_teacher']
    ordering = ['-academic_year', 'name']


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']
    ordering = ['name']


@admin.register(ClassSubject)
class ClassSubjectAdmin(admin.ModelAdmin):
    list_display = ['school_class', 'subject', 'teacher', 'academic_year']
    list_filter = ['academic_year', 'school_class']
    search_fields = ['school_class__name', 'subject__name', 'teacher__name']
    autocomplete_fields = ['school_class', 'subject', 'teacher']


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ['school_class', 'day_of_week', 'start_time', 'end_time', 'subject', 'teacher', 'room']
    list_filter = ['day_of_week', 'academic_year', 'school_class']
    search_fields = ['school_class__name', 'subject__name', 'teacher__name']
    autocomplete_fields = ['school_class', 'subject', 'teacher']
    ordering = ['school_class', 'day_of_week', 'start_time']