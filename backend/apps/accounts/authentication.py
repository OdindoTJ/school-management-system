"""
Supabase JWT Authentication for Django REST Framework
"""
import jwt
import requests
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    """
    Authentication class that validates JWT tokens from Supabase.
    """
    
    def authenticate(self, request):
        # Get the authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        # Check if it's a Bearer token
        try:
            prefix, token = auth_header.split(' ')
            if prefix.lower() != 'bearer':
                return None
        except ValueError:
            return None
        
        # Validate the token
        try:
            # Decode without verification first to get the user info
            unverified = jwt.decode(token, options={"verify_signature": False})
            
            # Get Supabase JWT secret from settings
            supabase_jwt_secret = getattr(settings, 'SUPABASE_JWT_SECRET', None)
            if not supabase_jwt_secret:
                raise exceptions.AuthenticationFailed('Supabase JWT secret not configured')
            
            # Verify the token with the secret
            try:
                payload = jwt.decode(
                    token, 
                    supabase_jwt_secret, 
                    algorithms=['HS256'],
                    audience='authenticated',
                    options={"verify_aud": False}  # Supabase uses different audience
                )
            except jwt.ExpiredSignatureError:
                raise exceptions.AuthenticationFailed('Token has expired')
            except jwt.InvalidTokenError:
                raise exceptions.AuthenticationFailed('Invalid token')
            
            # Get the user email from the payload
            user_email = payload.get('email')
            if not user_email:
                raise exceptions.AuthenticationFailed('No email in token')
            
            # Find or create the user in Django
            user, created = User.objects.get_or_create(
                username=user_email,
                defaults={
                    'email': user_email,
                    'is_active': True,
                }
            )
            
            # Store the full payload in request for later use
            request.supabase_payload = payload
            
            return (user, token)
            
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception as e:
            logger.error(f'Authentication error: {str(e)}')
            raise exceptions.AuthenticationFailed(f'Authentication error: {str(e)}')
    
    def authenticate_header(self, request):
        return 'Bearer'