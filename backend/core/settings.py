"""
Django settings for the School Management System.
Configured to work with Supabase as the database and authentication provider.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
load_dotenv()

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-dev-key-change-me')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG', 'True') == 'True'

# Allowed hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '.supabase.co',
]

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',   # Public website
    'http://localhost:5174',   # Student portal  
    'http://localhost:5175',   # Parent portal 
    'http://localhost:5176',  # Staff portal
    os.getenv('PUBLIC_FRONTEND_URL', 'http://localhost:5173'),
    os.getenv('STUDENT_FRONTEND_URL', 'http://localhost:5174'),
    os.getenv('PARENT_FRONTEND_URL', 'http://localhost:5175'),
    os.getenv('STAFF_FRONTEND_URL', 'http://localhost:5176'),
]

CORS_ALLOW_CREDENTIALS = True

# Allow local network IPs (for testing from phone on same WiFi)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://192\.168\.\d+\.\d+:\d+$",
    r"^http://10\.\d+\.\d+\.\d+:\d+$",
    r"^http://172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$",
]

# Security settings
if not DEBUG:
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True') == 'True'
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True') == 'True'
    CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'True') == 'True'
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'axes',  # Login lockout

    # Local apps
    'apps.accounts.apps.AccountsConfig',
    'apps.schools.apps.SchoolsConfig',
    'apps.students.apps.StudentsConfig',
    'apps.teachers.apps.TeachersConfig',
    'apps.classes.apps.ClassesConfig',
    'apps.grades.apps.GradesConfig',
    'apps.fees.apps.FeesConfig',
    'apps.parents.apps.ParentsConfig',
    'apps.staff.apps.StaffConfig', 
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware', 
    'apps.staff.middleware.AuditWriteMiddleware', 
    'apps.staff.middleware.StaffNoIndexMiddleware',
]
AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',  # Must be first for django-axes to work
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database - Supabase PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'apps.accounts.authentication.SupabaseJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_RATES': {
        'parent_login': '10/min',
        'parent_invitation_accept': '20/hour',
        'parent_self_link': '10/hour',
        'parent_invitation_validate': '60/hour',
        'parent_password_change': '5/hour',
        'parent_email_change': '3/hour',
    },
}

# Spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'School Management System API',
    'DESCRIPTION': 'API for the School Management System with Supabase integration',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # 1 hour
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # 1 week
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# ============================================================================
# PASSWORD HASHING (Argon2 primary, PBKDF2 fallback)
# ============================================================================
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',        # Primary
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',        # Fallback
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.BCryptSHA256PasswordHasher',
    'django.contrib.auth.hashers.ScryptPasswordHasher',
]


# ============================================================================
# DJANGO-AXES (Login lockout)
# ============================================================================
AXES_FAILURE_LIMIT = 5                       # Lock after 5 failed attempts
AXES_COOLOFF_TIME = 0.25                     # 15 minutes (fraction of hour)
AXES_LOCKOUT_PARAMETERS = [['username', 'ip_address']]  # Lock on combo
AXES_RESET_ON_SUCCESS = True                 # Reset counter on successful login
AXES_ENABLE_ACCESS_FAILURE_LOG = True        # Log failed attempts
AXES_LOCKOUT_CALLABLE = None                 # Use default lockout response

# Axes doesn't play well with DRF — this makes it return a 403 for API requests
AXES_ENABLE_ADMIN = True                     # Track admin logins too


# ============================================================================
# THROTTLING (per-endpoint rate limits)
# ============================================================================
REST_FRAMEWORK_THROTTLE_RATES = {
    'parent_login': '10/min',           # 10 login attempts per minute per IP
    'parent_invitation_accept': '20/hour',  # 20 invite accepts per hour per IP
    'parent_self_link': '10/hour',      # 10 self-link attempts per hour per parent
    'parent_invitation_validate': '60/hour',  # Token validation checks
    'parent_password_change': '5/hour', # Password change attempts
    'parent_email_change': '3/hour',    # Email change requests
}

# ============================================================================
# STAFF PORTAL SECURITY
# ============================================================================
# Staff portal is intentionally hidden from search engines and crawlers.
# These headers apply to all responses (frontend sets its own noindex tags).

# Prevent framing of the entire app (protects against clickjacking)
X_FRAME_OPTIONS = 'DENY'

# Prevent MIME-type sniffing
SECURE_CONTENT_TYPE_NOSNIFF = True

# Referrer policy — don't leak URLs to external sites
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Cross-Origin policies
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'