"""
Models for grades.

Tables:
- Grade: A student's exam score in a subject for a term.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Grade(models.Model):
    """
    A grade for a student in a subject for a specific exam in a term.
    """
    EXAM_TYPE_CHOICES = [
        ('cat', 'Continuous Assessment Test'),
        ('assignment', 'Assignment'),
        ('midterm', 'Midterm Exam'),
        ('endterm', 'End of Term Exam'),
        ('mock', 'Mock Exam'),
    ]

    GRADE_LETTER_CHOICES = [
        ('A', 'A (80-100)'),
        ('B+', 'B+ (75-79)'),
        ('B', 'B (70-74)'),
        ('B-', 'B- (65-69)'),
        ('C+', 'C+ (60-64)'),
        ('C', 'C (55-59)'),
        ('C-', 'C- (50-54)'),
        ('D+', 'D+ (45-49)'),
        ('D', 'D (40-44)'),
        ('E', 'E (Below 40)'),
    ]

    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='grades'
    )
    subject = models.ForeignKey(
        'classes.Subject',
        on_delete=models.CASCADE,
        related_name='grades'
    )
    term = models.ForeignKey(
        'classes.AcademicTerm',
        on_delete=models.CASCADE,
        related_name='grades'
    )
    exam_type = models.CharField(max_length=20, choices=EXAM_TYPE_CHOICES)
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(1000)]
    )
    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(1000)]
    )
    grade_letter = models.CharField(
        max_length=3,
        choices=GRADE_LETTER_CHOICES,
        blank=True,
        null=True
    )
    remarks = models.TextField(blank=True, null=True)
    entered_by = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='grades_entered'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Grade'
        verbose_name_plural = 'Grades'
        ordering = ['-term__year', 'term__name', 'subject__name', 'exam_type']
        unique_together = [['student', 'subject', 'term', 'exam_type']]

    def __str__(self):
        return f"{self.student.admission_number} - {self.subject.name} - {self.get_exam_type_display()} - {self.score}"

    @property
    def percentage(self):
        """Return score as a percentage."""
        if self.max_score and self.max_score > 0:
            return round((float(self.score) / float(self.max_score)) * 100, 2)
        return 0

    def save(self, *args, **kwargs):
        """Auto-calculate grade_letter when saving if not set."""
        if self.grade_letter is None or self.grade_letter == '':
            self.grade_letter = self.calculate_grade_letter()
        super().save(*args, **kwargs)

    def calculate_grade_letter(self):
        """Calculate grade letter from percentage."""
        pct = self.percentage
        if pct >= 80:
            return 'A'
        elif pct >= 75:
            return 'B+'
        elif pct >= 70:
            return 'B'
        elif pct >= 65:
            return 'B-'
        elif pct >= 60:
            return 'C+'
        elif pct >= 55:
            return 'C'
        elif pct >= 50:
            return 'C-'
        elif pct >= 45:
            return 'D+'
        elif pct >= 40:
            return 'D'
        else:
            return 'E'