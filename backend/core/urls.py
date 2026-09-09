"""
URL configuration for the School Management System.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import JsonResponse
from django.views.decorators.http import require_GET

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # API Schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Health check
    path('api/health/', require_GET(lambda request: JsonResponse({
        'status': 'ok',
        'message': 'School Management System API is running',
    })), name='health_check'),
    
    # API v1 endpoints
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/schools/', include('apps.schools.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)