from rest_framework import serializers
from .models import Category, Book, Borrower, Loan, Reservation, Fine


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class BookSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Book
        fields = '__all__'


class BorrowerSerializer(serializers.ModelSerializer):
    borrower_name = serializers.SerializerMethodField()

    class Meta:
        model = Borrower
        fields = '__all__'

    def get_borrower_name(self, obj):
        if obj.student:
            return str(obj.student)
        elif obj.staff:
            return str(obj.staff)
        return None


class LoanSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_author = serializers.CharField(source='book.author', read_only=True)
    borrower_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Loan
        fields = '__all__'

    def get_borrower_name(self, obj):
        if obj.borrower.student:
            return str(obj.borrower.student)
        elif obj.borrower.staff:
            return str(obj.borrower.staff)
        return None


class ReservationSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)

    class Meta:
        model = Reservation
        fields = '__all__'


class FineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fine
        fields = '__all__'