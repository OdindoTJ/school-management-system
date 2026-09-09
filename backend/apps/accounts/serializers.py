"""
Serializers for the accounts app.
Handles user registration, login, and profile data.
"""
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for UserProfile model.
    """
    full_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'supabase_id', 'role', 'phone_number', 
            'full_name', 'email', 'username', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'supabase_id']
    
    def get_full_name(self, obj):
        return obj.full_name


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True
    )
    role = serializers.ChoiceField(
        choices=UserProfile.ROLE_CHOICES,
        required=True
    )
    phone_number = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'password2', 
            'role', 'phone_number', 'first_name', 'last_name'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data):
        # Remove fields that don't belong to User model
        role = validated_data.pop('role')
        phone_number = validated_data.pop('phone_number', '')
        password = validated_data.pop('password')
        password2 = validated_data.pop('password2')
        email = validated_data.get('email')
        username = validated_data.get('username', email.split('@')[0])
        
        # Create user
        user = User.objects.create(
            username=username,
            email=email,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone_number=phone_number
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UserSerializer(serializers.ModelSerializer):
    """
    Basic User serializer.
    """
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'profile', 'last_login', 'date_joined'
        ]
        read_only_fields = ['id', 'last_login', 'date_joined']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, 
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Password fields didn't match."
            })
        return attrs