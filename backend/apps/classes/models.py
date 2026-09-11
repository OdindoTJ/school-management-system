"""
Models for class and academic structure.

Tables:
- AcademicTerm: Term 1 2026, Term 2 2026, etc.
- Class: Form 1A 2026, Form 2B 2026
- Subject: Mathematics, English, etc.
- ClassSubject: Which teacher teaches which subject in which class
- Timetable: Weekly class schedule
"""

from django.db import models
from django.core.exceptions import ValidationError


class AcademicTerm(models.Model):
    """
    Academic term (Term 1 2026, Term 2 2026, etc.).
    """
    name = models.CharField(max_length=50, help_text="e.g., Term 1")
    year = models.CharField(max_length=4, help_text="e.g., 2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(
        default=False,
        help_text="Only one term should be marked as current."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Academic Term'
        verbose_name_plural = 'Academic Terms'
        ordering = ['-year', 'name']
        unique_together = [['name', 'year']]
        constraints = [
            models.UniqueConstraint(
                fields=['is_current'],
                condition=models.Q(is_current=True),
                name='only_one_current_term'
            )
        ]

    def __str__(self):
        return f"{self.name} {self.year}"

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date.")

    @classmethod
    def get_current(cls):
        return cls.objects.filter(is_current=True).first()


class Class(models.Model):
    """
    A class in the school (Form 1A 2026, Form 2B 2026, etc.).
    """
    LEVEL_CHOICES = [
        ('junior', 'Junior Secondary'),
        ('senior', 'Senior Secondary'),
        ('advanced', 'Advanced Level'),
    ]

    name = models.CharField(max_length=50, help_text="e.g., Form 1A")
    academic_year = models.CharField(max_length=4, help_text="e.g., 2026")
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    class_teacher = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='classes_led',
        help_text="The class teacher for this class."
    )
    room_number = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Class'
        verbose_name_plural = 'Classes'
        ordering = ['academic_year', 'name']
        unique_together = [['name', 'academic_year']]

    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class Subject(models.Model):
    """
    A subject taught in the school.
    """
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, help_text="e.g., MATH101")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Subject'
        verbose_name_plural = 'Subjects'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class ClassSubject(models.Model):
    """
    Links a subject to a class with the teacher assigned.
    """
    school_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='class_subjects'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='class_assignments'
    )
    teacher = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teaching_assignments',
        help_text="The teacher assigned to teach this subject in this class."
    )
    academic_year = models.CharField(max_length=4, help_text="e.g., 2026")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Class Subject'
        verbose_name_plural = 'Class Subjects'
        ordering = ['school_class', 'subject']
        unique_together = [['school_class', 'subject', 'academic_year']]

    def __str__(self):
        return f"{self.school_class.name} - {self.subject.name}"


class Timetable(models.Model):
    """
    Weekly class timetable entry.
    """
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    school_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='timetable_entries'
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='timetable_entries'
    )
    teacher = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='timetable_entries'
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50, blank=True, null=True)
    academic_year = models.CharField(max_length=4)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Timetable Entry'
        verbose_name_plural = 'Timetable'
        ordering = ['school_class', 'day_of_week', 'start_time']
        unique_together = [['school_class', 'day_of_week', 'start_time', 'academic_year']]

    def __str__(self):
        return f"{self.school_class.name} - {self.get_day_of_week_display()} {self.start_time}"

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("End time must be after start time.")