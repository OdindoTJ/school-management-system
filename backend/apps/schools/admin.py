"""
Admin configuration for the schools app.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    SchoolInfo, AboutPage, AcademicProgram, Staff, Gallery,
    SchoolLifeCategory, SchoolLifeItem, News, Event, ContactMessage
)


@admin.register(SchoolInfo)
class SchoolInfoAdmin(admin.ModelAdmin):
    list_display = ['school_name', 'phone', 'email', 'is_active']
    fieldsets = (
        ('Basic Information', {
            'fields': ('school_name', 'slogan', 'logo', 'favicon')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone', 'email', 'website')
        }),
        ('Social Media', {
            'fields': ('facebook_url', 'twitter_url', 'instagram_url', 'youtube_url'),
            'classes': ('collapse',)
        }),
        ('Map', {
            'fields': ('google_maps_embed',),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(AboutPage)
class AboutPageAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'updated_at']
    fieldsets = (
        ('Content', {
            'fields': ('title', 'content', 'mission', 'vision', 'core_values')
        }),
        ('Images', {
            'fields': ('main_image', 'mission_image')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )


@admin.register(AcademicProgram)
class AcademicProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'order', 'is_active']
    list_filter = ['level', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['order', 'name']


@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['name', 'title', 'role', 'is_leadership', 'order', 'is_active']
    list_filter = ['role', 'is_leadership', 'is_active']
    search_fields = ['name', 'title', 'email']
    ordering = ['order', 'name']
    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'title', 'role', 'bio', 'photo', 'email', 'phone')
        }),
        ('Professional', {
            'fields': ('qualifications', 'order', 'is_leadership', 'is_active')
        }),
    )


@admin.register(Gallery)
class GalleryAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'is_featured', 'order', 'is_active']
    list_filter = ['category', 'is_featured', 'is_active']
    search_fields = ['title', 'description']
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 100px; max-width: 150px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Preview'


@admin.register(SchoolLifeCategory)
class SchoolLifeCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'order', 'is_active']
    list_filter = ['category', 'is_active']


@admin.register(SchoolLifeItem)
class SchoolLifeItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'order', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['title', 'description']


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ['title', 'published_at', 'is_published', 'is_featured', 'category']
    list_filter = ['is_published', 'is_featured', 'category', 'published_at']
    search_fields = ['title', 'content']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'time', 'location', 'is_upcoming', 'is_featured']
    list_filter = ['is_upcoming', 'is_featured', 'date']
    search_fields = ['title', 'description', 'location']
    date_hierarchy = 'date'


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'subject', 'created_at', 'is_read', 'replied']
    list_filter = ['is_read', 'replied', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['created_at']