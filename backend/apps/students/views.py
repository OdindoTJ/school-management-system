"""
Views for the students app - Student Portal endpoints.
"""
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
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
    SportMembershipSerializer
)


# ============================================================
# HELPER: Get the student for the current user
# ============================================================

def get_current_student(user):
    """Get the Student object linked to the logged-in user."""
    try:
        return user.student_profile
    except Student.DoesNotExist:
        return None


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

        # Find the student by admission number
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

        # Authenticate using Django User
        user = authenticate(username=student.user.username, password=password)
        if user is None:
            return Response(
                {'error': 'Invalid admission number or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
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

        # Clear the must_change_password flag
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
# STUDENT DATA VIEWS
# ============================================================

class MyGradesView(APIView):
    """
    Get the logged-in student's grades.
    """
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
    """
    Get an aggregated report card for a specific term.
    """
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

        grades = Grade.objects.filter(
            student=student, term=term
        ).select_related('subject')

        # Group by subject
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

        # Calculate average per subject
        report = []
        for subject_name, data in subjects_data.items():
            percentages = [e['percentage'] for e in data['exams']]
            avg = round(sum(percentages) / len(percentages), 2) if percentages else 0
            report.append({
                **data,
                'average_percentage': avg,
            })

        # Overall average
        all_percentages = [
            e['percentage']
            for data in subjects_data.values()
            for e in data['exams']
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
    """
    Get the timetable for the student's class.
    """
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

        # Filter to today if requested
        if request.query_params.get('today') == 'true':
            today_index = timezone.now().weekday()  # 0=Monday
            entries = entries.filter(day_of_week=today_index)

        return Response(TimetableSerializer(entries, many=True).data)


class MyAttendanceView(APIView):
    """
    Get the student's attendance records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        records = Attendance.objects.filter(student=student).order_by('-date')

        # Optional date filters
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if from_date:
            records = records.filter(date__gte=from_date)
        if to_date:
            records = records.filter(date__lte=to_date)

        return Response(AttendanceSerializer(records, many=True).data)


class MyAttendanceSummaryView(APIView):
    """
    Get the student's attendance summary (percentages).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        records = Attendance.objects.filter(student=student)

        # Optional date filters
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
    """
    Get assignments for the student's class.
    """
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
    """
    Get the student's library records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = get_current_student(request.user)
        if student is None:
            return Response({'error': 'Not a student.'}, status=status.HTTP_403_FORBIDDEN)

        records = LibraryRecord.objects.filter(student=student).order_by('-borrowed_date')
        return Response(LibraryRecordSerializer(records, many=True).data)


class MyClubsView(APIView):
    """
    Get clubs the student belongs to.
    """
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
    """
    Get sports the student belongs to.
    """
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