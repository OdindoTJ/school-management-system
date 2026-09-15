"""
URL configuration for the schools app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'school-info', views.SchoolInfoViewSet)
router.register(r'about', views.AboutPageViewSet)
router.register(r'academics', views.AcademicProgramViewSet)
router.register(r'academic-terms', views.AcademicTermViewSet, basename='academic-term')
router.register(r'announcements', views.AnnouncementViewSet)
router.register(r'staff', views.StaffViewSet)
router.register(r'gallery', views.GalleryViewSet)
router.register(r'school-life-categories', views.SchoolLifeCategoryViewSet)
router.register(r'school-life-items', views.SchoolLifeItemViewSet)
router.register(r'news', views.NewsViewSet)
router.register(r'events', views.EventViewSet)
router.register(r'classes', views.ClassViewSet, basename='class')
router.register(r'contact', views.ContactMessageViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
]