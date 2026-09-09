"""
ASGI config for the School Management System.
(For future WebSocket support - e.g., real-time notifications, chatbot)
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
application = get_asgi_application()