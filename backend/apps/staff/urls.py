"""
URL configuration for the staff app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'staff'

router = DefaultRouter()
router.register(r'roles', views.StaffRoleViewSet, basename='staff-role')
router.register(r'members', views.StaffViewSet, basename='staff-member')
router.register(r'role-assignments', views.StaffRoleAssignmentViewSet, basename='staff-role-assignment')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'change-requests', views.ChangeRequestViewSet, basename='change-request')

urlpatterns = [
    # Auth
    path('auth/login/', views.StaffLoginView.as_view(), name='staff-login'),
    path('auth/me/', views.StaffMeView.as_view(), name='staff-me'),
    path('auth/logout/', views.StaffLogoutView.as_view(), name='staff-logout'),
    path('auth/change-password/', views.StaffChangePasswordView.as_view(), name='staff-change-password'),

    # Admin actions
    path('admin/force-logout/<uuid:staff_id>/', views.ForceLogoutView.as_view(), name='force-logout'),

    # Routers
    path('', include(router.urls)),
]