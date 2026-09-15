"""
Serializers for the students app.
"""
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Student, Attendance, Assignment,
    LibraryRecord, Club, ClubMembership,
    Sport, SportMembership,
)


# ============================================================
# BASIC SERIALIZERS
# ============================================================

class StudentBasicSerializer(serializers.ModelSerializer):
    """
    Compact student info - used in nested responses.
    """
    full_name = serializers.CharField(read_only=True)
    class_name = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name',
            'full_name', 'class_name', 'photo'
        ]

    def get_class_name(self, obj):
        if obj.school_class:
            return f"{obj.school_class.name} ({obj.school_class.academic_year})"
        return None


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Full student profile - used on the profile page.
    """
    full_name = serializers.CharField(read_only=True)
    class_name = serializers.SerializerMethodField()
    class_teacher = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    must_change_password = serializers.BooleanField(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'photo', 'address',
            'class_name', 'class_teacher', 'enrollment_date',
            'email', 'username', 'must_change_password',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'admission_number', 'enrollment_date', 'created_at']

    def get_class_name(self, obj):
        if obj.school_class:
            return f"{obj.school_class.name} ({obj.school_class.academic_year})"
        return None

    def get_class_teacher(self, obj):
        if obj.school_class and obj.school_class.class_teacher:
            return obj.school_class.class_teacher.name
        return None


# ============================================================
# AUTHENTICATION SERIALIZERS
# ============================================================

class StudentLoginSerializer(serializers.Serializer):
    """
    Login with admission number + password.
    """
    admission_number = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class StudentChangePasswordSerializer(serializers.Serializer):
    """
    Change password (used for first-login forced change and regular changes).
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs


# ============================================================
# ATTENDANCE SERIALIZERS
# ============================================================

class AttendanceSerializer(serializers.ModelSerializer):
    """
    Attendance record.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'date', 'status', 'status_display', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class AttendanceSummarySerializer(serializers.Serializer):
    """
    Aggregated attendance summary (not a model).
    """
    total_days = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()
    excused = serializers.IntegerField()
    attendance_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)


# ============================================================
# ASSIGNMENT SERIALIZERS
# ============================================================

class AssignmentSerializer(serializers.ModelSerializer):
    """
    Assignment for a student's class.
    """
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'due_date',
            'subject_name', 'subject_code', 'teacher_name', 'class_name',
            'attachment', 'is_overdue', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_teacher_name(self, obj):
        if obj.teacher:
            return obj.teacher.name
        return None


# ============================================================
# LIBRARY SERIALIZERS
# ============================================================

class LibraryRecordSerializer(serializers.ModelSerializer):
    """
    Library record for a student.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = LibraryRecord
        fields = [
            'id', 'book_title', 'book_author', 'book_isbn',
            'borrowed_date', 'due_date', 'returned_date',
            'status', 'status_display', 'fine_amount', 'notes',
            'is_overdue', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status == 'borrowed' and obj.due_date < timezone.now().date():
            return True
        return False


# ============================================================
# CLUB SERIALIZERS
# ============================================================

class ClubSerializer(serializers.ModelSerializer):
    """
    Club details.
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    patron_name = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'patron_name', 'meeting_day', 'meeting_time', 'meeting_location',
            'is_active'
        ]

    def get_patron_name(self, obj):
        if obj.patron:
            return obj.patron.name
        return None


class ClubMembershipSerializer(serializers.ModelSerializer):
    """
    Student's club membership with club details.
    """
    club = ClubSerializer(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = ClubMembership
        fields = ['id', 'club', 'role', 'role_display', 'joined_date', 'is_active']


# ============================================================
# SPORT SERIALIZERS
# ============================================================

class SportSerializer(serializers.ModelSerializer):
    """
    Sport details.
    """
    coach_name = serializers.SerializerMethodField()

    class Meta:
        model = Sport
        fields = [
            'id', 'name', 'description', 'coach_name',
            'season', 'training_days', 'training_time', 'training_location',
            'is_active'
        ]

    def get_coach_name(self, obj):
        if obj.coach:
            return obj.coach.name
        return None


class SportMembershipSerializer(serializers.ModelSerializer):
    """
    Student's sport membership with sport details.
    """
    sport = SportSerializer(read_only=True)

    class Meta:
        model = SportMembership
        fields = ['id', 'sport', 'joined_date', 'is_active']


# ============================================================
# ADMIN — STUDENT MANAGEMENT SERIALIZERS
# ============================================================

class AdminStudentListSerializer(serializers.ModelSerializer):
    """
    Compact student info for the admin list view.
    """
    full_name = serializers.CharField(read_only=True)
    class_name = serializers.SerializerMethodField()
    parent_count = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number', 'first_name', 'last_name', 'full_name',
            'gender', 'date_of_birth',
            'school_class', 'class_name',
            'photo_url',
            'parent_count',
            'must_change_password',
            'is_active',
            'enrollment_date',
        ]

    def get_class_name(self, obj):
        if obj.school_class:
            return f"{obj.school_class.name} ({obj.school_class.academic_year})"
        return None

    def get_parent_count(self, obj):
        return obj.parent_links.filter(is_active=True).count()

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class AdminStudentDetailSerializer(serializers.ModelSerializer):
    """
    Full student info for admin detail/edit views.
    """
    full_name = serializers.CharField(read_only=True)
    class_name = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_is_active = serializers.BooleanField(source='user.is_active', read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'admission_number',
            'first_name', 'last_name', 'full_name',
            'date_of_birth', 'gender',
            'school_class', 'class_name',
            'address', 'photo', 'photo_url',
            'enrollment_date',
            'must_change_password',
            'is_active', 'user_is_active',
            'username', 'user_email',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'username', 'user_email', 'user_is_active']

    def get_class_name(self, obj):
        if obj.school_class:
            return f"{obj.school_class.name} ({obj.school_class.academic_year})"
        return None

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class AdminStudentCreateSerializer(serializers.Serializer):
    """
    Creates a Django User + Student in one atomic transaction.
    Returns the generated temporary password to the admin ONCE.
    """
    # Student fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    admission_number = serializers.CharField(max_length=50)
    date_of_birth = serializers.DateField()
    gender = serializers.ChoiceField(choices=Student.GENDER_CHOICES)
    school_class = serializers.PrimaryKeyRelatedField(
        # Placeholder queryset at class-definition time (DRF requires a non-None
        # queryset here or it raises AssertionError on import). The real
        # queryset — scoped to the classes app — is set below in __init__,
        # once the app registry is ready. This avoids a circular import
        # between apps.students and apps.classes at module load time.
        queryset=Student.objects.none(),
        allow_null=True,
        required=False,
    )
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    enrollment_date = serializers.DateField(required=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        from apps.classes.models import Class
        self.fields['school_class'].queryset = Class.objects.filter(is_active=True)

    def validate_admission_number(self, value):
        from .models import Student
        if Student.objects.filter(admission_number=value.strip()).exists():
            raise serializers.ValidationError("A student with this admission number already exists.")
        return value.strip().upper()

    def create(self, validated_data):
        from .models import Student
        from django.contrib.auth.models import User
        import secrets
        import string

        # Generate temp password
        alphabet = string.ascii_letters + string.digits + "!@#$%&*"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        admission = validated_data['admission_number']
        username = admission.lower().replace(' ', '')

        # Ensure username uniqueness (safety net)
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'admission_number': 'This admission number maps to an existing user.'
            })

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email='',  # Students don't have email by default
                password=temp_password,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
            )
            user.is_active = True
            user.save(update_fields=['is_active'])

            student = Student.objects.create(
                user=user,
                first_name=validated_data['first_name'],
                last_name=validated_data['last_name'],
                admission_number=admission,
                date_of_birth=validated_data['date_of_birth'],
                gender=validated_data['gender'],
                school_class=validated_data.get('school_class'),
                address=validated_data.get('address', ''),
                enrollment_date=validated_data.get('enrollment_date') or timezone.now().date(),
                must_change_password=True,
            )

        # Attach the plain temp password to the instance for the response
        student._temp_password = temp_password
        return student


class AdminStudentUpdateSerializer(serializers.ModelSerializer):
    """
    Update student record (no user/password changes here).
    """
    class Meta:
        model = Student
        fields = [
            'first_name', 'last_name',
            'date_of_birth', 'gender',
            'school_class', 'address',
            'photo', 'enrollment_date',
            'is_active',
        ]