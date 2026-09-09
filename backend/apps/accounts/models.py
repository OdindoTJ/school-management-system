"""
Account models for the School Management System
"""
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    Extended user profile linked to Django's User model.
    This stores additional information for all user types.
    """
    # User roles
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
        ('student', 'Student'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='parent'
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    supabase_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        unique=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.role})"
    
    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile automatically when a User is created."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile when the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()