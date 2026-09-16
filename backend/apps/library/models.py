from django.db import models
from django.utils import timezone
from apps.students.models import Student
from apps.schools.models import Staff


class Category(models.Model):
    """Book categories (Fiction, Science, History, etc.)"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


class Book(models.Model):
    """A book in the library catalog (single copy per book)"""
    title = models.CharField(max_length=300)
    author = models.CharField(max_length=200)
    isbn = models.CharField(max_length=20, unique=True)
    publisher = models.CharField(max_length=200, blank=True)
    year_published = models.IntegerField(null=True, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='books'
    )
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='books/covers/', blank=True, null=True)
    shelf_location = models.CharField(max_length=50, blank=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return f"{self.title} by {self.author}"


class Borrower(models.Model):
    """Anyone who can borrow books (students or staff)"""
    BORROWER_TYPE = [
        ('STUDENT', 'Student'),
        ('STAFF', 'Staff'),
    ]
    borrower_type = models.CharField(max_length=10, choices=BORROWER_TYPE)
    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='library_profile'
    )
    staff = models.OneToOneField(
        Staff,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='library_profile'
    )
    library_card_number = models.CharField(max_length=20, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.student:
            return f"Student: {self.student}"
        elif self.staff:
            return f"Staff: {self.staff}"
        return f"Borrower {self.id}"


class Loan(models.Model):
    """A book loan transaction"""
    STATUS_CHOICES = [
        ('BORROWED', 'Borrowed'),
        ('RETURNED', 'Returned'),
        ('OVERDUE', 'Overdue'),
        ('LOST', 'Lost'),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='loans')
    borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, related_name='loans')
    borrowed_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    returned_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='BORROWED')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-borrowed_date']

    def __str__(self):
        return f"{self.book.title} → {self.borrower}"

    @property
    def is_overdue(self):
        if self.status == 'BORROWED' and self.due_date < timezone.now().date():
            return True
        return False

    @property
    def days_overdue(self):
        if self.is_overdue:
            return (timezone.now().date() - self.due_date).days
        return 0


class Reservation(models.Model):
    """Reserve a book that's currently checked out"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('READY', 'Ready for Pickup'),
        ('FULFILLED', 'Fulfilled'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
    ]
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reservations')
    borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, related_name='reservations')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    reserved_at = models.DateTimeField(auto_now_add=True)
    notified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['reserved_at']

    def __str__(self):
        return f"{self.borrower} reserved {self.book.title}"


class Fine(models.Model):
    """Fines for late returns or lost books"""
    FINE_TYPE = [
        ('OVERDUE', 'Overdue'),
        ('LOST', 'Lost Book'),
        ('DAMAGED', 'Damaged Book'),
    ]
    loan = models.OneToOneField(Loan, on_delete=models.CASCADE, related_name='fine')
    fine_type = models.CharField(max_length=10, choices=FINE_TYPE, default='OVERDUE')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Fine KES {self.amount} - {self.loan}"