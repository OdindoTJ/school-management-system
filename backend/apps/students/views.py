"""
Views for the students app.
Includes both Student Portal endpoints and Admin CRUD endpoints.
"""
import secrets
import string
import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Student, Attendance, Assignment,
    LibraryRecord, ClubMembership, SportMembership
)
from .serializers import (
    StudentProfileSerializer, StudentLoginSerializer,
    StudentChangePasswordSerializer, AttendanceSerializer,
    AttendanceSummarySerializer, AssignmentSerializer,
    LibraryRecordSerializer, ClubMembershipSerializer,
    SportMembershipSerializer,
    AdminStudentListSerializer,
    AdminStudentDetailSerializer,
    AdminStudentCreateSerializer,
    AdminStudentUpdateSerializer,
)

logger = logging.getLogger(__name__)


# ============================================================
# HELPERS
# ============================================================

def get_current_student(user):
    """Get the Student object linked to the logged-in user."""
    try:
        return user.student_profile
    except Student.DoesNotExist:
        return None


def _is_admin(user):
    """Return True if the logged-in user is a staff member with the admin role."""
    if not user or not user.is_authenticated:
        return False
    try:
        return user.staff_profile.is_admin
    except Exception:
        return False


# ============================================================
# AUTHENTICATION VIEWS
# ============================================================

class StudentLoginView(APIView):
    """
    Student login: admission number + password → JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        admission_number = serializer.validated_data['admission_number']
        password = serializer.validated_data['password']

        try:
            student = Student.objects.select_related('user', 'school_class').get(
                admission_number=admission_number,
                is_active=True
            )
        except Student.DoesNotExist:
            return Response(
                {'error': 'Invalid admission number or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        user = authenticate(username=student.user.username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid admission number or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Login successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'must_change_password': student.must_change_password,
            'student': StudentProfileSerializer(student).data,
        }, status=status.HTTP_200_OK)


class StudentChangePasswordView(APIView):
    """
    Change password. Also used for forced first-login change.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response(
                {'error': 'You are not a student.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = StudentChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': ['Incorrect password.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        if student.must_change_password:
            student.must_change_password = False
            student.save(update_fields=['must_change_password'])

        return Response({'message': 'Password changed successfully.'})


class StudentMeView(APIView):
    """
    Get the logged-in student's profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response(
                {'error': 'You are not a student.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return Response(StudentProfileSerializer(student).data)


# ============================================================
# STUDENT PORTAL DATA VIEWS
# ============================================================

class MyGradesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        from apps.grades.models import Grade
        from apps.grades.serializers import GradeSerializer

        term_id = request.query_params.get('term')
        grades = Grade.objects.filter(student=student).select_related(
            'subject', 'term', 'entered_by'
        )
        if term_id:
            grades = grades.filter(term_id=term_id)

        return Response(GradeSerializer(grades, many=True).data)


class MyReportCardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        from apps.grades.models import Grade
        from apps.classes.models import AcademicTerm

        term_id = request.query_params.get('term')
        if term_id:
            try:
                term = AcademicTerm.objects.get(id=term_id)
            except AcademicTerm.DoesNotExist:
                return Response({'error': 'Term not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            term = AcademicTerm.get_current()
            if not term:
                return Response({'error': 'No current term set.'}, status=status.HTTP_404_NOT_FOUND)

        grades = Grade.objects.filter(student=student, term=term).select_related('subject')

        subjects_data = {}
        for grade in grades:
            subject_name = grade.subject.name
            if subject_name not in subjects_data:
                subjects_data[subject_name] = {
                    'subject': subject_name,
                    'subject_code': grade.subject.code,
                    'exams': [],
                }
            subjects_data[subject_name]['exams'].append({
                'exam_type': grade.get_exam_type_display(),
                'score': float(grade.score),
                'max_score': float(grade.max_score),
                'percentage': grade.percentage,
                'grade_letter': grade.grade_letter,
            })

        report = []
        for subject_name, data in subjects_data.items():
            percentages = [e['percentage'] for e in data['exams']]
            avg = round(sum(percentages) / len(percentages), 2) if percentages else 0
            report.append({**data, 'average_percentage': avg})

        all_percentages = [
            e['percentage'] for data in subjects_data.values() for e in data['exams']
        ]
        overall_avg = round(sum(all_percentages) / len(all_percentages), 2) if all_percentages else 0

        return Response({
            'term': {
                'name': term.name,
                'year': term.year,
                'start_date': term.start_date,
                'end_date': term.end_date,
            },
            'student': {
                'admission_number': student.admission_number,
                'full_name': student.full_name,
                'class_name': student.school_class.name if student.school_class else None,
            },
            'subjects': report,
            'overall_average': overall_avg,
        })


class MyTimetableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        if not student.school_class:
            return Response({'error': 'You are not assigned to a class.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.classes.models import Timetable
        from apps.classes.serializers import TimetableSerializer

        entries = Timetable.objects.filter(
            school_class=student.school_class,
            is_active=True
        ).select_related('subject', 'teacher').order_by('day_of_week', 'start_time')

        if request.query_params.get('today') == 'true':
            today_index = timezone.now().weekday()
            entries = entries.filter(day_of_week=today_index)

        return Response(TimetableSerializer(entries, many=True).data)


class MyAttendanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        records = Attendance.objects.filter(student=student).order_by('-date')

        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if from_date:
            records = records.filter(date__gte=from_date)
        if to_date:
            records = records.filter(date__lte=to_date)

        return Response(AttendanceSerializer(records, many=True).data)


class MyAttendanceSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        records = Attendance.objects.filter(student=student)

        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if from_date:
            records = records.filter(date__gte=from_date)
        if to_date:
            records = records.filter(date__lte=to_date)

        total = records.count()
        present = records.filter(status='present').count()
        absent = records.filter(status='absent').count()
        late = records.filter(status='late').count()
        excused = records.filter(status='excused').count()

        percentage = round((present / total * 100), 2) if total > 0 else 0

        return Response({
            'total_days': total,
            'present': present,
            'absent': absent,
            'late': late,
            'excused': excused,
            'attendance_percentage': percentage,
        })


class MyAssignmentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        if not student.school_class:
            return Response([])

        assignments = Assignment.objects.filter(
            school_class=student.school_class,
            is_active=True
        ).select_related('subject', 'teacher').order_by('-due_date')

        subject_id = request.query_params.get('subject')
        if subject_id:
            assignments = assignments.filter(subject_id=subject_id)

        return Response(AssignmentSerializer(assignments, many=True).data)


class MyLibraryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        records = LibraryRecord.objects.filter(student=student).order_by('-borrowed_date')
        return Response(LibraryRecordSerializer(records, many=True).data)


class MyClubsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        memberships = ClubMembership.objects.filter(
            student=student,
            is_active=True
        ).select_related('club', 'club__patron')

        return Response(ClubMembershipSerializer(memberships, many=True).data)


class MySportsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        memberships = SportMembership.objects.filter(
            student=student,
            is_active=True
        ).select_related('sport', 'sport__coach')

        return Response(SportMembershipSerializer(memberships, many=True).data)


# ============================================================
# ADMIN — STUDENT MANAGEMENT VIEWSET
# ============================================================

class AdminStudentViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for students.

    Endpoints:
    - GET    /api/v1/students/admin/                      → list
    - POST   /api/v1/students/admin/                      → create
    - GET    /api/v1/students/admin/{id}/                 → detail
    - PATCH  /api/v1/students/admin/{id}/                 → update
    - POST   /api/v1/students/admin/{id}/deactivate/      → soft delete
    - POST   /api/v1/students/admin/{id}/reactivate/      → restore
    - POST   /api/v1/students/admin/{id}/reset-password/  → new temp password
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Student.objects.select_related('user', 'school_class').order_by('admission_number')

    def _require_admin(self):
        if not _is_admin(self.request.user):
            raise PermissionDenied("Admin access required.")

    def get_serializer_class(self):
        if self.action == 'list':
            return AdminStudentListSerializer
        if self.action == 'create':
            return AdminStudentCreateSerializer
        if self.action in ('update', 'partial_update'):
            return AdminStudentUpdateSerializer
        return AdminStudentDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()

        class_id = self.request.query_params.get('class_id')
        active = self.request.query_params.get('active')
        gender = self.request.query_params.get('gender')
        search = self.request.query_params.get('search')

        if class_id:
            qs = qs.filter(school_class_id=class_id)
        if active in ('true', 'false'):
            qs = qs.filter(is_active=(active == 'true'))
        if gender:
            qs = qs.filter(gender=gender)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(admission_number__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return qs

    # ---------- LIST ----------
    def list(self, request, *args, **kwargs):
        self._require_admin()
        return super().list(request, *args, **kwargs)

    # ---------- CREATE ----------
    def create(self, request, *args, **kwargs):
        self._require_admin()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        from apps.staff.utils import log_audit
        log_audit(
            request, 'create',
            model_name='Student',
            object_id=student.id,
            object_repr=f"{student.admission_number} — {student.full_name}",
            changes={
                'admission_number': student.admission_number,
                'class': student.school_class.name if student.school_class else None,
            },
            actor=request.user,
        )

        response_data = AdminStudentDetailSerializer(student, context={'request': request}).data
        response_data['temporary_password'] = getattr(student, '_temp_password', None)
        return Response(response_data, status=status.HTTP_201_CREATED)

    # ---------- DETAIL ----------
    def retrieve(self, request, *args, **kwargs):
        self._require_admin()
        return super().retrieve(request, *args, **kwargs)

    # ---------- UPDATE ----------
    def update(self, request, *args, **kwargs):
        self._require_admin()
        student = self.get_object()

        try:
            from apps.staff.utils import compute_diff
            changes = compute_diff(student, request.data)
        except Exception:
            changes = {}

        response = super().update(request, *args, **kwargs)

        from apps.staff.utils import log_audit
        log_audit(
            request, 'update',
            model_name='Student',
            object_id=student.id,
            object_repr=f"{student.admission_number} — {student.full_name}",
            changes=changes,
            actor=request.user,
        )
        return response

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    # ---------- DEACTIVATE ----------
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        self._require_admin()
        student = self.get_object()

        if not student.is_active:
            return Response({'error': 'Student is already deactivated.'}, status=400)

        reason = request.data.get('reason', '').strip()
        if len(reason) < 5:
            return Response(
                {'error': 'A reason is required (minimum 5 characters).'},
                status=400,
            )

        student.is_active = False
        student.user.is_active = False
        student.user.save(update_fields=['is_active'])
        student.save(update_fields=['is_active', 'updated_at'])

        from apps.staff.utils import log_audit
        log_audit(
            request, 'update',
            model_name='Student',
            object_id=student.id,
            object_repr=f"{student.admission_number} — {student.full_name}",
            changes={'action': 'deactivated', 'reason': reason},
            actor=request.user,
        )

        return Response({'message': f'{student.full_name} has been deactivated.'})

    # ---------- REACTIVATE ----------
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        self._require_admin()
        student = self.get_object()

        if student.is_active:
            return Response({'error': 'Student is already active.'}, status=400)

        student.is_active = True
        student.user.is_active = True
        student.user.save(update_fields=['is_active'])
        student.save(update_fields=['is_active', 'updated_at'])

        from apps.staff.utils import log_audit
        log_audit(
            request, 'update',
            model_name='Student',
            object_id=student.id,
            object_repr=f"{student.admission_number} — {student.full_name}",
            changes={'action': 'reactivated'},
            actor=request.user,
        )

        return Response({'message': f'{student.full_name} has been reactivated.'})

    # ---------- RESET PASSWORD ----------
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        self._require_admin()
        student = self.get_object()

        alphabet = string.ascii_letters + string.digits + "!@#$%&*"
        temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        student.user.set_password(temp_password)
        student.user.save()

        student.must_change_password = True
        student.save(update_fields=['must_change_password'])

        from apps.staff.utils import log_audit
        log_audit(
            request, 'password_reset',
            model_name='Student',
            object_id=student.id,
            object_repr=f"{student.admission_number} — {student.full_name}",
            actor=request.user,
        )

        return Response({
            'message': f'Password reset for {student.full_name}.',
            'temporary_password': temp_password,
        })