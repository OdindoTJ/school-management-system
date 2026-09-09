"""
Serializers for the schools app.
"""
from rest_framework import serializers
from .models import (
    SchoolInfo, AboutPage, AcademicProgram, Staff, Gallery,
    SchoolLifeCategory, SchoolLifeItem, News, Event, ContactMessage
)


class SchoolInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolInfo
        fields = '__all__'


class AboutPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPage
        fields = '__all__'


class AcademicProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicProgram
        fields = '__all__'


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'


class GallerySerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Gallery
        fields = '__all__'
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None


class SchoolLifeItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = SchoolLifeItem
        fields = '__all__'


class SchoolLifeCategorySerializer(serializers.ModelSerializer):
    items = SchoolLifeItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = SchoolLifeCategory
        fields = '__all__'


class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = '__all__'


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'