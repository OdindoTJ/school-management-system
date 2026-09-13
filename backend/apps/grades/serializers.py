"""
Serializers for grades app.
"""
from rest_framework import serializers
from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    """
    Grade with subject and term details.
    """
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    term_name = serializers.SerializerMethodField()
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    grade_letter_display = serializers.CharField(source='get_grade_letter_display', read_only=True)
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)

    class Meta:
        model = Grade
        fields = [
            'id', 'subject_name', 'subject_code', 'term_name',
            'exam_type', 'exam_type_display',
            'score', 'max_score', 'percentage',
            'grade_letter', 'grade_letter_display',
            'remarks', 'created_at'
        ]

    def get_term_name(self, obj):
        if obj.term:
            return f"{obj.term.name} {obj.term.year}"
        return None