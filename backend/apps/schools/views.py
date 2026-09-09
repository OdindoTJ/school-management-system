"""
Views for the schools app.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    SchoolInfo, AboutPage, AcademicProgram, Staff, Gallery,
    SchoolLifeCategory, SchoolLifeItem, News, Event, ContactMessage
)
from .serializers import (
    SchoolInfoSerializer, AboutPageSerializer, AcademicProgramSerializer,
    StaffSerializer, GallerySerializer, SchoolLifeCategorySerializer,
    SchoolLifeItemSerializer, NewsSerializer, EventSerializer,
    ContactMessageSerializer
)


class SchoolInfoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SchoolInfo.objects.filter(is_active=True)
    serializer_class = SchoolInfoSerializer
    
    def get_queryset(self):
        # Return only active records
        return self.queryset
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the active school info."""
        instance = SchoolInfo.get_active()
        if instance:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({'detail': 'No active school info found.'}, status=status.HTTP_404_NOT_FOUND)


class AboutPageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AboutPage.objects.filter(is_active=True)
    serializer_class = AboutPageSerializer
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the active about page."""
        instance = AboutPage.get_active()
        if instance:
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return Response({'detail': 'No active about page found.'}, status=status.HTTP_404_NOT_FOUND)


class AcademicProgramViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AcademicProgram.objects.filter(is_active=True)
    serializer_class = AcademicProgramSerializer
    filterset_fields = ['level']


class StaffViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Staff.objects.filter(is_active=True)
    serializer_class = StaffSerializer
    filterset_fields = ['role', 'is_leadership']
    
    @action(detail=False, methods=['get'])
    def leadership(self, request):
        """Get only leadership staff."""
        queryset = self.queryset.filter(is_leadership=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class GalleryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Gallery.objects.filter(is_active=True)
    serializer_class = GallerySerializer
    filterset_fields = ['category', 'is_featured']


class SchoolLifeCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SchoolLifeCategory.objects.filter(is_active=True).prefetch_related('items')
    serializer_class = SchoolLifeCategorySerializer
    filterset_fields = ['category']


class SchoolLifeItemViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SchoolLifeItem.objects.filter(is_active=True)
    serializer_class = SchoolLifeItemSerializer
    filterset_fields = ['category']


class NewsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = News.objects.filter(is_published=True)
    serializer_class = NewsSerializer
    filterset_fields = ['is_featured', 'category']
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured news."""
        queryset = self.queryset.filter(is_featured=True)[:5]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Event.objects.filter(is_upcoming=True)
    serializer_class = EventSerializer
    filterset_fields = ['is_upcoming', 'is_featured']
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming events."""
        from datetime import datetime
        queryset = Event.objects.filter(is_upcoming=True, date__gte=datetime.now().date())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def create(self, request, *args, **kwargs):
        """Allow unauthenticated users to submit contact messages."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {'message': 'Your message has been sent successfully.'},
            status=status.HTTP_201_CREATED
        )