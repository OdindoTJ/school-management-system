"""
Models for school content - About, Academics, News, Staff, Gallery, School Life, Events.
All content is database-driven - no hardcoded values.
"""

from django.db import models
from django.utils import timezone
from django.core.validators import FileExtensionValidator


class SchoolInfo(models.Model):
    """Basic school information displayed on the website."""
    school_name = models.CharField(max_length=255, default='Our School')
    slogan = models.CharField(max_length=255, blank=True, null=True)
    logo = models.ImageField(upload_to='school/', blank=True, null=True)
    favicon = models.ImageField(upload_to='school/', blank=True, null=True)

    # Contact info
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    # Social media
    facebook_url = models.URLField(blank=True, null=True)
    twitter_url = models.URLField(blank=True, null=True)
    instagram_url = models.URLField(blank=True, null=True)
    youtube_url = models.URLField(blank=True, null=True)

    # Map
    google_maps_embed = models.TextField(blank=True, null=True, help_text='Google Maps embed iframe code')

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'School Information'
        verbose_name_plural = 'School Information'

    def __str__(self):
        return self.school_name

    @classmethod
    def get_active(cls):
        """Get the active school info record."""
        return cls.objects.filter(is_active=True).first()


class AboutPage(models.Model):
    """About page content."""
    title = models.CharField(max_length=255, default='About Us')
    content = models.TextField()
    mission = models.TextField(blank=True, null=True)
    vision = models.TextField(blank=True, null=True)
    core_values = models.TextField(blank=True, null=True, help_text='List core values, one per line')

    # Images
    main_image = models.ImageField(upload_to='about/', blank=True, null=True)
    mission_image = models.ImageField(upload_to='about/', blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'About Page'
        verbose_name_plural = 'About Page'

    def __str__(self):
        return self.title

    @classmethod
    def get_active(cls):
        """Get the active about page."""
        return cls.objects.filter(is_active=True).first()


class AcademicProgram(models.Model):
    """Academic programs offered by the school."""
    LEVEL_CHOICES = [
        ('primary', 'Primary School'),
        ('junior', 'Junior Secondary (Forms 1-2)'),
        ('senior', 'Senior Secondary (Forms 3-4)'),
        ('advanced', 'Advanced Level (Forms 5-6)'),
    ]

    name = models.CharField(max_length=100)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    description = models.TextField()
    icon_svg = models.TextField(blank=True, null=True, help_text='Custom SVG icon code')
    image = models.ImageField(upload_to='academics/', blank=True, null=True)

    # Subjects offered
    subjects = models.TextField(blank=True, null=True, help_text='List subjects, one per line')

    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Academic Program'
        verbose_name_plural = 'Academic Programs'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"


class Staff(models.Model):
    """Staff members - top leadership and teaching staff."""
    ROLE_CHOICES = [
        ('principal', 'Principal'),
        ('deputy_academics', 'Deputy Principal (Academics)'),
        ('deputy_admin', 'Deputy Principal (Administration)'),
        ('head_academics', 'Head of Academics'),
        ('dean_students', 'Dean of Students'),
        ('head_finance', 'Head of Finance'),
        ('hod', 'Head of Department'),
        ('senior_teacher', 'Senior Teacher'),
        ('teacher', 'Teacher'),
        ('support', 'Support Staff'),
    ]

    name = models.CharField(max_length=200)
    title = models.CharField(max_length=100)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='teacher')
    bio = models.TextField(blank=True, null=True)
    photo = models.ImageField(
        upload_to='staff/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    qualifications = models.TextField(blank=True, null=True, help_text='List qualifications, one per line')
    order = models.IntegerField(default=0, help_text='Lower number = higher display priority')
    is_active = models.BooleanField(default=True)
    is_leadership = models.BooleanField(default=False, help_text='Show on leadership page')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Staff Member'
        verbose_name_plural = 'Staff'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} - {self.title}"


class Gallery(models.Model):
    """Gallery images for the website."""
    CATEGORY_CHOICES = [
        ('facilities', 'Facilities'),
        ('students', 'Students'),
        ('events', 'Events'),
        ('academics', 'Academics'),
        ('sports', 'Sports'),
        ('community', 'Community'),
        ('general', 'General'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(
        upload_to='gallery/',
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp', 'gif'])]
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    is_featured = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Gallery Image'
        verbose_name_plural = 'Gallery'
        ordering = ['category', 'order', '-created_at']

    def __str__(self):
        return self.title


class SchoolLifeCategory(models.Model):
    """Categories for school life (Sports, Clubs, Societies, Facilities)."""
    CATEGORY_CHOICES = [
        ('sports', 'Sports'),
        ('clubs', 'Clubs'),
        ('societies', 'Societies'),
        ('facilities', 'Facilities'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, unique=True)
    icon_svg = models.TextField(blank=True, null=True, help_text='Custom SVG icon code for this category')
    description = models.TextField(blank=True, null=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'School Life Category'
        verbose_name_plural = 'School Life Categories'
        ordering = ['order', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class SchoolLifeItem(models.Model):
    """Individual items within school life categories."""
    category = models.ForeignKey(
        SchoolLifeCategory,
        on_delete=models.CASCADE,
        related_name='items'
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    image = models.ImageField(
        upload_to='school_life/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(['jpg', 'jpeg', 'png', 'webp'])]
    )
    icon_svg = models.TextField(blank=True, null=True, help_text='Custom SVG icon for this item')
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'School Life Item'
        verbose_name_plural = 'School Life Items'
        ordering = ['category', 'order', 'title']

    def __str__(self):
        return f"{self.title} ({self.category.name})"


class News(models.Model):
    """School news and announcements."""
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    content = models.TextField()
    excerpt = models.TextField(blank=True, null=True, help_text='Short summary for listing')

    image = models.ImageField(upload_to='news/', blank=True, null=True)

    # Metadata
    author = models.CharField(max_length=100, blank=True, null=True)
    published_at = models.DateTimeField(default=timezone.now)
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    # Optional category
    category = models.CharField(max_length=50, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'News'
        verbose_name_plural = 'News'
        ordering = ['-published_at']

    def __str__(self):
        return self.title


class Event(models.Model):
    """School events (separate from news)."""
    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    location = models.CharField(max_length=255)
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    is_upcoming = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['date', 'time']

    def __str__(self):
        return self.title

    @property
    def is_past(self):
        """Check if event has passed."""
        from datetime import datetime
        event_datetime = datetime.combine(self.date, self.time)
        return event_datetime < datetime.now()


class ContactMessage(models.Model):
    """Messages sent through the contact form."""
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, null=True)
    subject = models.CharField(max_length=255)
    message = models.TextField()

    is_read = models.BooleanField(default=False)
    replied = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Contact Message'
        verbose_name_plural = 'Contact Messages'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject}"


class Announcement(models.Model):
    """
    Internal announcements visible only to logged-in students, parents, or staff.
    Different from News (public website articles).
    """
    AUDIENCE_CHOICES = [
        ('all', 'Everyone (Students, Parents, Staff)'),
        ('students', 'All Students'),
        ('parents', 'All Parents'),
        ('teachers', 'All Teachers'),
        ('specific_class', 'Specific Class'),
    ]

    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    audience = models.CharField(
        max_length=20,
        choices=AUDIENCE_CHOICES,
        default='all'
    )
    target_class = models.ForeignKey(
        'classes.Class',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='announcements',
        help_text="Only used when audience is 'Specific Class'."
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='normal'
    )
    published_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Optional. Announcement auto-hides after this date."
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'
        ordering = ['-priority', '-published_at']

    def __str__(self):
        return f"{self.title} ({self.get_audience_display()})"

    @property
    def is_expired(self):
        """Check if announcement has expired."""
        from django.utils import timezone
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False