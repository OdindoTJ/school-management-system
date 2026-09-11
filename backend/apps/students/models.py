"""
Models for student management.

Tables:
- Student: Core student record
- Attendance: Daily attendance
- Assignment: Homework/assignments
- LibraryRecord: Books borrowed
- Club: Clubs offered
- ClubMembership: Students in clubs
- Sport: Sports offered
- SportMembership: Students in sports
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.utils import timezone


class Student(models.Model):
    """
    Core student record. Each student has an associated Django User for login.
    """
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile',
        help_text="Django user used for login (username = admission number)."
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    admission_number = models.CharField(max_length=50, unique=True)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    school_class = models.ForeignKey(
        'classes.Class',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='students',
        help_text="Current class the student belongs to."
    )
    address = models.TextField(blank=True, null=True)
    photo = models.ImageField(
        upload_to='students/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    enrollment_date = models.DateField(default=timezone.now)
    must_change_password = models.BooleanField(
        default=True,
        help_text="Forces the student to change password on next login."
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['admission_number']

    def __str__(self):
        return f"{self.admission_number} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Attendance(models.Model):
    """
    Daily attendance record for a student.
    """
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    reason = models.TextField(blank=True, null=True)
    marked_by = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attendance_marked'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance'
        ordering = ['-date', 'student']
        unique_together = [['student', 'date']]

    def __str__(self):
        return f"{self.student.admission_number} - {self.date} - {self.status}"


class Assignment(models.Model):
    """
    An assignment given to a class by a teacher.
    """
    school_class = models.ForeignKey(
        'classes.Class',
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    subject = models.ForeignKey(
        'classes.Subject',
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    teacher = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assignments_given'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    attachment = models.FileField(
        upload_to='assignments/',
        blank=True,
        null=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.title} ({self.school_class.name})"

    @property
    def is_overdue(self):
        return timezone.now() > self.due_date


class LibraryRecord(models.Model):
    """
    A book borrowed by a student.
    """
    STATUS_CHOICES = [
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue', 'Overdue'),
        ('lost', 'Lost'),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='library_records'
    )
    book_title = models.CharField(max_length=255)
    book_author = models.CharField(max_length=255, blank=True, null=True)
    book_isbn = models.CharField(max_length=50, blank=True, null=True)
    borrowed_date = models.DateField()
    due_date = models.DateField()
    returned_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='borrowed')
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Library Record'
        verbose_name_plural = 'Library Records'
        ordering = ['-borrowed_date']

    def __str__(self):
        return f"{self.student.admission_number} - {self.book_title}"


class Club(models.Model):
    """
    A club or society offered by the school.
    """
    CATEGORY_CHOICES = [
        ('academic', 'Academic'),
        ('arts', 'Arts'),
        ('service', 'Community Service'),
        ('religious', 'Religious'),
        ('leadership', 'Leadership'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    patron = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clubs_patron'
    )
    meeting_day = models.CharField(max_length=20, blank=True, null=True)
    meeting_time = models.TimeField(blank=True, null=True)
    meeting_location = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Club'
        verbose_name_plural = 'Clubs'
        ordering = ['name']

    def __str__(self):
        return self.name


class ClubMembership(models.Model):
    """
    Which students belong to which clubs.
    """
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('secretary', 'Secretary'),
        ('treasurer', 'Treasurer'),
        ('vice_chairperson', 'Vice Chairperson'),
        ('chairperson', 'Chairperson'),
    ]

    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='club_memberships'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_date = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Club Membership'
        verbose_name_plural = 'Club Memberships'
        unique_together = [['club', 'student']]
        ordering = ['club', 'student']

    def __str__(self):
        return f"{self.student.admission_number} - {self.club.name}"


class Sport(models.Model):
    """
    A sport offered by the school.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    coach = models.ForeignKey(
        'schools.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sports_coached'
    )
    season = models.CharField(max_length=50, blank=True, null=True, help_text="e.g., Term 1 2026")
    training_days = models.CharField(max_length=100, blank=True, null=True, help_text="e.g., Mon, Wed, Fri")
    training_time = models.TimeField(blank=True, null=True)
    training_location = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Sport'
        verbose_name_plural = 'Sports'
        ordering = ['name']

    def __str__(self):
        return self.name


class SportMembership(models.Model):
    """
    Which students belong to which sports.
    """
    sport = models.ForeignKey(
        Sport,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='sport_memberships'
    )
    joined_date = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Sport Membership'
        verbose_name_plural = 'Sport Memberships'
        unique_together = [['sport', 'student']]
        ordering = ['sport', 'student']

    def __str__(self):
        return f"{self.student.admission_number} - {self.sport.name}"