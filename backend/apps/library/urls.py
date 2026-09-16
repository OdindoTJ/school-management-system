from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, BookViewSet, BorrowerViewSet,
    LoanViewSet, ReservationViewSet, FineViewSet
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'books', BookViewSet)
router.register(r'borrowers', BorrowerViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'reservations', ReservationViewSet)
router.register(r'fines', FineViewSet)

urlpatterns = [
    path('', include(router.urls)),
]