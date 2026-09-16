from django.contrib import admin
from .models import Category, Book, Borrower, Loan, Reservation, Fine


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'isbn', 'category', 'is_available', 'shelf_location']
    list_filter = ['is_available', 'category']
    search_fields = ['title', 'author', 'isbn']
    list_editable = ['is_available']


@admin.register(Borrower)
class BorrowerAdmin(admin.ModelAdmin):
    list_display = ['library_card_number', 'borrower_type', 'is_active', 'created_at']
    list_filter = ['borrower_type', 'is_active']
    search_fields = ['library_card_number']


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['book', 'borrower', 'borrowed_date', 'due_date', 'status']
    list_filter = ['status', 'borrowed_date']
    search_fields = ['book__title', 'borrower__library_card_number']
    date_hierarchy = 'borrowed_date'
    readonly_fields = ['created_at']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['book', 'borrower', 'status', 'reserved_at']
    list_filter = ['status']
    search_fields = ['book__title']


@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ['loan', 'fine_type', 'amount', 'paid', 'created_at']
    list_filter = ['paid', 'fine_type']
    search_fields = ['loan__book__title']