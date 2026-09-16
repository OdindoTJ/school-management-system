from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta

from .models import Category, Book, Borrower, Loan, Reservation, Fine
from .serializers import (
    CategorySerializer, BookSerializer, BorrowerSerializer,
    LoanSerializer, ReservationSerializer, FineSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    @action(detail=False, methods=['get'])
    def available(self, request):
        books = Book.objects.filter(is_available=True)
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)


class BorrowerViewSet(viewsets.ModelViewSet):
    queryset = Borrower.objects.all()
    serializer_class = BorrowerSerializer


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        due_date = timezone.now().date() + timedelta(days=7)
        loan = serializer.save(due_date=due_date)
        loan.book.is_available = False
        loan.book.save()

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        loan = self.get_object()

        if loan.status == 'RETURNED':
            return Response({'error': 'This book has already been returned'}, status=400)

        loan.returned_date = timezone.now().date()
        loan.status = 'RETURNED'
        loan.save()

        loan.book.is_available = True
        loan.book.save()

        days_late = 0
        if loan.returned_date > loan.due_date:
            days_late = (loan.returned_date - loan.due_date).days
            fine_amount = days_late * 10
            Fine.objects.create(
                loan=loan,
                fine_type='OVERDUE',
                amount=fine_amount,
                reason=f'{days_late} day(s) overdue'
            )

        return Response({
            'status': 'returned',
            'message': 'Book returned successfully',
            'days_late': days_late,
        })

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        loan = self.get_object()

        if loan.status != 'BORROWED':
            return Response({'error': 'Only active loans can be renewed'}, status=400)

        if loan.due_date < timezone.now().date():
            return Response({'error': 'Cannot renew an overdue book.'}, status=400)

        loan.due_date = loan.due_date + timedelta(days=7)
        loan.save()

        return Response({'status': 'renewed', 'message': f'Loan extended to {loan.due_date}'})

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        overdue_loans = Loan.objects.filter(
            status='BORROWED',
            due_date__lt=timezone.now().date()
        )
        serializer = self.get_serializer(overdue_loans, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated], url_path='my-loans')
    def my_loans(self, request):
        user = request.user

        borrower = None
        if hasattr(user, 'student_profile'):
            borrower = Borrower.objects.filter(student=user.student_profile).first()
        elif hasattr(user, 'staff_profile'):
            borrower = Borrower.objects.filter(staff=user.staff_profile).first()

        if not borrower:
            return Response([])

        loans = Loan.objects.filter(borrower=borrower)
        serializer = self.get_serializer(loans, many=True)
        return Response(serializer.data)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer


class FineViewSet(viewsets.ModelViewSet):
    queryset = Fine.objects.all()
    serializer_class = FineSerializer