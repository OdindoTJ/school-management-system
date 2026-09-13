"""
Serializers for classes app.
"""
from rest_framework import serializers
from .models import AcademicTerm, Class, Subject, ClassSubject, Timetable


class AcademicTermSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicTerm
        fields = ['id', 'name', 'year', 'start_date', 'end_date', 'is_current']


class ClassSerializer(serializers.ModelSerializer):
    class_teacher_name = serializers.SerializerMethodField()
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Class
        fields = [
            'id', 'name', 'academic_year', 'level', 'level_display',
            'class_teacher_name', 'room_number', 'is_active'
        ]

    def get_class_teacher_name(self, obj):
        if obj.class_teacher:
            return obj.class_teacher.name
        return None


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'description', 'is_active']


class ClassSubjectSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='school_class.name', read_only=True)

    class Meta:
        model = ClassSubject
        fields = [
            'id', 'school_class', 'class_name',
            'subject', 'subject_name', 'subject_code',
            'teacher', 'teacher_name', 'academic_year'
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.name
        return None


class TimetableSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'school_class', 'class_name',
            'subject', 'subject_name', 'subject_code',
            'teacher', 'teacher_name',
            'day_of_week', 'day_name',
            'start_time', 'end_time', 'room', 'academic_year'
        ]

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.name
        return None