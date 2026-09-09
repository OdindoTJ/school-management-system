"""
Views for the accounts app.
Handles authentication, registration, and user profile operations.
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    UserProfileSerializer, ChangePasswordSerializer
)
from .models import UserProfile
import logging

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    """
    User registration endpoint.
    Creates a new user account with the specified role.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'User registered successfully',
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    User login endpoint.
    Authenticates a user and returns user data with Supabase token.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Try to find the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Authenticate the user
        authenticated_user = authenticate(
            request, 
            username=user.username, 
            password=password
        )
        
        if not authenticated_user:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Login the user (creates session)
        login(request, authenticated_user)
        
        # Get user profile
        try:
            profile = authenticated_user.profile
        except UserProfile.DoesNotExist:
            profile = None
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(authenticated_user).data,
            'profile': UserProfileSerializer(profile).data if profile else None
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    User logout endpoint.
    Logs out the current user.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout successful'
        }, status=status.HTTP_200_OK)


class ProfileView(APIView):
    """
    Get or update the current user's profile.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request):
        user = request.user
        profile = user.profile
        
        # Update user fields
        user_fields = ['first_name', 'last_name', 'email']
        for field in user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
        
        # Update profile fields
        profile_fields = ['phone_number', 'role']
        for field in profile_fields:
            if field in request.data:
                setattr(profile, field, request.data[field])
        profile.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    """
    Change the current user's password.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Check old password
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'old_password': ['Wrong password']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)


class UserListView(APIView):
    """
    List all users (admin only).
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Check if user is admin
        if request.user.profile.role != 'admin':
            return Response({
                'error': 'Admin access required'
            }, status=status.HTTP_403_FORBIDDEN)
        
        users = User.objects.all().select_related('profile')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)