"""
Views for the parents app.

Endpoints:
- Invitation validation + accept
- Parent auth (login, logout, me, change password)
- Self-link additional child
- Invite coparent
- Child data proxy (permission-gated passthrough)
"""

import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    StudentGuardian,
    Parent,
    StudentParent,
    ParentInvitation,
    ParentLinkAttempt,
)
from .serializers import (
    InvitationValidateSerializer,
    InvitationAcceptSerializer,
    ParentProfileSerializer,
    ParentLoginSerializer,
    ParentChangePasswordSerializer,
    ChildBasicSerializer,
    SelfLinkSerializer,
    CoparentInviteSerializer,
)

logger = logging.getLogger(__name__)


# ============================================================
# HELPERS
# ============================================================

def get_current_parent(user):
    """Get the Parent object linked to the logged-in user."""
    try:
        return user.parent_profile
    except Parent.DoesNotExist:
        return None


def get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def log_link_attempt(
    request,
    *,
    success,
    failure_reason=None,
    email=None,
    phone=None,
    national_id=None,
    student=None,
    invitation=None,
    parent=None,
):
    """Create an audit log record."""
    try:
        ParentLinkAttempt.objects.create(
            parent=parent,
            student=student,
            invitation=invitation,
            email_attempted=email,
            phone_attempted=phone,
            national_id_attempted=national_id,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            success=success,
            failure_reason=failure_reason,
        )
    except Exception as e:
        logger.exception(f"Failed to log link attempt: {e}")


def get_linked_student(request, student_id):
    """
    Get a student that the logged-in parent is linked to, verifying permission.
    Returns (parent, link, student) or raises PermissionDenied.
    """
    from rest_framework.exceptions import PermissionDenied, NotFound

    parent = get_current_parent(request.user)
    if parent is None:
        raise PermissionDenied("Not a parent account.")

    link = (
        StudentParent.objects
        .filter(parent=parent, student_id=student_id, is_active=True)
        .select_related('student', 'student__school_class')
        .first()
    )

    if link is None:
        raise NotFound("Student not found or not linked to your account.")

    return parent, link, link.student


# ============================================================
# INVITATION ENDPOINTS (public)
# ============================================================

class InvitationValidateView(APIView):
    """
    GET /api/v1/parents/invitations/{token}/
    Validate an invitation token before showing the accept form.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            inv = ParentInvitation.objects.select_related(
                'student', 'student_guardian'
            ).get(token=token)
        except ParentInvitation.DoesNotExist:
            return Response(
                {'error': 'This invitation link is invalid.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if inv.is_accepted:
            return Response(
                {'error': 'This invitation has already been used.'},
                status=status.HTTP_410_GONE,
            )
        if inv.is_revoked:
            return Response(
                {'error': 'This invitation has been revoked.'},
                status=status.HTTP_410_GONE,
            )
        if inv.is_expired:
            return Response(
                {'error': 'This invitation has expired. Please contact the school.'},
                status=status.HTTP_410_GONE,
            )
        if inv.attempts >= 5:
            return Response(
                {'error': 'Too many failed attempts. Please contact the school.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        return Response(InvitationValidateSerializer(inv).data)


class InvitationAcceptView(APIView):
    """
    POST /api/v1/parents/invitations/{token}/accept/
    Accept an invitation and create a Parent account linked to the student.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, token):
        try:
            inv = ParentInvitation.objects.select_related(
                'student', 'student_guardian'
            ).get(token=token)
        except ParentInvitation.DoesNotExist:
            log_link_attempt(
                request, success=False, failure_reason='invalid_token',
            )
            return Response(
                {'error': 'This invitation link is invalid.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Pre-flight checks
        if inv.is_accepted:
            log_link_attempt(
                request, success=False, failure_reason='already_accepted',
                email=inv.email, student=inv.student, invitation=inv,
            )
            return Response({'error': 'This invitation has already been used.'},
                            status=status.HTTP_410_GONE)
        if inv.is_revoked:
            log_link_attempt(
                request, success=False, failure_reason='revoked',
                email=inv.email, student=inv.student, invitation=inv,
            )
            return Response({'error': 'This invitation has been revoked.'},
                            status=status.HTTP_410_GONE)
        if inv.is_expired:
            log_link_attempt(
                request, success=False, failure_reason='expired',
                email=inv.email, student=inv.student, invitation=inv,
            )
            return Response({'error': 'This invitation has expired.'},
                            status=status.HTTP_410_GONE)
        if inv.attempts >= 5:
            log_link_attempt(
                request, success=False, failure_reason='too_many_attempts',
                email=inv.email, student=inv.student, invitation=inv,
            )
            return Response({'error': 'Too many failed attempts.'},
                            status=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = InvitationAcceptSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        guardian = inv.student_guardian
        student = inv.student

        # Generic failure helper — never reveal which field mismatched
        def reject(reason):
            inv.attempts += 1
            inv.last_attempt_at = timezone.now()
            if inv.attempts >= 5:
                inv.revoked_at = timezone.now()
            inv.save(update_fields=['attempts', 'last_attempt_at', 'revoked_at'])
            log_link_attempt(
                request, success=False, failure_reason=reason,
                email=inv.email, phone=data['phone'],
                national_id=data['national_id'],
                student=student, invitation=inv,
            )
            return Response(
                {'error': "We couldn't match your details. Please contact the school office to update your records."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify against admission record
        if str(data['phone']).strip() != str(guardian.phone).strip():
            return reject('phone_mismatch')
        if str(data['national_id']).strip().upper() != str(guardian.national_id).strip().upper():
            return reject('id_mismatch')
        if data['student_dob'] != student.date_of_birth:
            return reject('dob_mismatch')

        # Check if this email already has a Parent account
        email = inv.email.lower().strip()
        existing_user = User.objects.filter(username=email).first()

        if existing_user and hasattr(existing_user, 'parent_profile'):
            # Existing parent — link to this student
            parent = existing_user.parent_profile
            if StudentParent.objects.filter(parent=parent, student=student).exists():
                return reject('already_linked')
        else:
            # Create new Parent account
            if existing_user:
                return Response(
                    {'error': 'An account with this email already exists. Please contact the school.'},
                    status=status.HTTP_409_CONFLICT,
                )

            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password=data['password'],
                )
                parent = Parent.objects.create(
                    user=user,
                    full_name=guardian.full_name,
                    phone=guardian.phone,
                    national_id=guardian.national_id,
                    relationship=guardian.relationship,
                    email_verified=True,
                )

        # Create the link
        with transaction.atomic():
            is_first_link = not StudentParent.objects.filter(
                student=student, is_active=True
            ).exists()

            StudentParent.objects.create(
                parent=parent,
                student=student,
                relationship=guardian.relationship,
                is_primary_contact=is_first_link,
                linked_via='invitation',
            )

            inv.accept()

        log_link_attempt(
            request, success=True,
            email=email, phone=data['phone'], national_id=data['national_id'],
            student=student, invitation=inv, parent=parent,
        )

        return Response({
            'message': 'Account created successfully. You can now log in.',
            'parent': ParentProfileSerializer(parent).data,
        }, status=status.HTTP_201_CREATED)


# ============================================================
# AUTH ENDPOINTS
# ============================================================

class ParentLoginView(APIView):
    """
    POST /api/v1/parents/auth/login/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ParentLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].lower().strip()
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)

        # Generic error — no enumeration
        if user is None or not hasattr(user, 'parent_profile'):
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        parent = user.parent_profile
        if not parent.is_active:
            return Response(
                {'error': 'This account is inactive. Please contact the school.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Login successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'must_change_password': parent.must_change_password,
            'parent': ParentProfileSerializer(parent).data,
        })


class ParentMeView(APIView):
    """
    GET /api/v1/parents/auth/me/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        parent = get_current_parent(request.user)
        if parent is None:
            return Response({'error': 'Not a parent account.'},
                            status=status.HTTP_403_FORBIDDEN)
        return Response(ParentProfileSerializer(parent).data)


class ParentChangePasswordView(APIView):
    """
    POST /api/v1/parents/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        parent = get_current_parent(request.user)
        if parent is None:
            return Response({'error': 'Not a parent account.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = ParentChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'old_password': ['Incorrect password.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        if parent.must_change_password:
            parent.must_change_password = False
            parent.save(update_fields=['must_change_password'])

        return Response({'message': 'Password changed successfully.'})


class ParentLogoutView(APIView):
    """
    POST /api/v1/parents/auth/logout/
    Client-side action — just a courtesy endpoint.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response({'message': 'Logged out.'})


# ============================================================
# CHILDREN
# ============================================================

class MyChildrenView(APIView):
    """
    GET /api/v1/parents/me/children/
    List all students linked to this parent.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        parent = get_current_parent(request.user)
        if parent is None:
            return Response({'error': 'Not a parent account.'},
                            status=status.HTTP_403_FORBIDDEN)

        links = (
            StudentParent.objects
            .filter(parent=parent, is_active=True)
            .select_related('student', 'student__school_class')
            .order_by('-is_primary_contact', 'student__first_name')
        )

        children = []
        for link in links:
            s = link.student
            children.append({
                'id': s.id,
                'admission_number': s.admission_number,
                'full_name': s.full_name,
                'class_name': (
                    f"{s.school_class.name} ({s.school_class.academic_year})"
                    if s.school_class else None
                ),
                'photo': s.photo.url if s.photo else None,
                'relationship': link.get_relationship_display(),
                'can_view_academic': link.can_view_academic,
                'can_view_financials': link.can_view_financials,
                'is_primary_contact': link.is_primary_contact,
                'linked_at': link.linked_at,
            })

        return Response(children)


class ChildDetailView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/
    Detailed profile of a specific linked child.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)

        return Response({
            'id': student.id,
            'admission_number': student.admission_number,
            'first_name': student.first_name,
            'last_name': student.last_name,
            'full_name': student.full_name,
            'date_of_birth': student.date_of_birth,
            'gender': student.gender,
            'photo': student.photo.url if student.photo else None,
            'address': student.address,
            'class_name': (
                f"{student.school_class.name} ({student.school_class.academic_year})"
                if student.school_class else None
            ),
            'class_teacher': (
                student.school_class.class_teacher.name
                if student.school_class and student.school_class.class_teacher
                else None
            ),
            'enrollment_date': student.enrollment_date,
            'is_active': student.is_active,
            'relationship': link.get_relationship_display(),
            'can_view_academic': link.can_view_academic,
            'can_view_financials': link.can_view_financials,
            'is_primary_contact': link.is_primary_contact,
        })



# ============================================================
# CHILD DATA ENDPOINTS (permission-gated proxy)
# ============================================================

def _check_academic_permission(link):
    """Raise PermissionDenied if the parent can't view academic data."""
    from rest_framework.exceptions import PermissionDenied
    if not link.can_view_academic:
        raise PermissionDenied("You do not have access to academic records for this student.")


class ChildGradesView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/grades/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        from apps.grades.models import Grade
        from apps.grades.serializers import GradeSerializer

        grades = Grade.objects.filter(student=student).select_related(
            'subject', 'term', 'entered_by'
        )

        term_id = request.query_params.get('term')
        if term_id:
            grades = grades.filter(term_id=term_id)

        return Response(GradeSerializer(grades, many=True).data)


class ChildReportCardView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/report-card/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

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
            name = grade.subject.name
            if name not in subjects_data:
                subjects_data[name] = {
                    'subject': name,
                    'subject_code': grade.subject.code,
                    'exams': [],
                }
            subjects_data[name]['exams'].append({
                'exam_type': grade.get_exam_type_display(),
                'score': float(grade.score),
                'max_score': float(grade.max_score),
                'percentage': grade.percentage,
                'grade_letter': grade.grade_letter,
            })

        report = []
        for name, data in subjects_data.items():
            percentages = [e['percentage'] for e in data['exams']]
            avg = round(sum(percentages) / len(percentages), 2) if percentages else 0
            report.append({**data, 'average_percentage': avg})

        all_pcts = [e['percentage'] for d in subjects_data.values() for e in d['exams']]
        overall = round(sum(all_pcts) / len(all_pcts), 2) if all_pcts else 0

        return Response({
            'term': {
                'name': term.name, 'year': term.year,
                'start_date': term.start_date, 'end_date': term.end_date,
            },
            'student': {
                'admission_number': student.admission_number,
                'full_name': student.full_name,
                'class_name': student.school_class.name if student.school_class else None,
            },
            'subjects': report,
            'overall_average': overall,
        })


class ChildTimetableView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/timetable/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        if not student.school_class:
            return Response([])

        from apps.classes.models import Timetable
        from apps.classes.serializers import TimetableSerializer

        entries = Timetable.objects.filter(
            school_class=student.school_class, is_active=True
        ).select_related('subject', 'teacher').order_by('day_of_week', 'start_time')

        if request.query_params.get('today') == 'true':
            today_index = timezone.now().weekday()
            entries = entries.filter(day_of_week=today_index)

        return Response(TimetableSerializer(entries, many=True).data)


class ChildAttendanceView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/attendance/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        from apps.students.models import Attendance
        from apps.students.serializers import AttendanceSerializer

        records = Attendance.objects.filter(student=student).order_by('-date')
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        if from_date:
            records = records.filter(date__gte=from_date)
        if to_date:
            records = records.filter(date__lte=to_date)

        return Response(AttendanceSerializer(records, many=True).data)


class ChildAttendanceSummaryView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/attendance/summary/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        from apps.students.models import Attendance

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


class ChildAssignmentsView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/assignments/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        if not student.school_class:
            return Response([])

        from apps.students.models import Assignment
        from apps.students.serializers import AssignmentSerializer

        assignments = Assignment.objects.filter(
            school_class=student.school_class, is_active=True
        ).select_related('subject', 'teacher').order_by('-due_date')

        subject_id = request.query_params.get('subject')
        if subject_id:
            assignments = assignments.filter(subject_id=subject_id)

        return Response(AssignmentSerializer(assignments, many=True).data)


class ChildLibraryView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/library/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        from apps.students.models import LibraryRecord
        from apps.students.serializers import LibraryRecordSerializer

        records = LibraryRecord.objects.filter(student=student).order_by('-borrowed_date')
        return Response(LibraryRecordSerializer(records, many=True).data)


class ChildActivitiesView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/activities/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        _check_academic_permission(link)

        from apps.students.models import ClubMembership, SportMembership
        from apps.students.serializers import (
            ClubMembershipSerializer, SportMembershipSerializer,
        )

        clubs = ClubMembership.objects.filter(
            student=student, is_active=True
        ).select_related('club', 'club__patron')

        sports = SportMembership.objects.filter(
            student=student, is_active=True
        ).select_related('sport', 'sport__coach')

        return Response({
            'clubs': ClubMembershipSerializer(clubs, many=True).data,
            'sports': SportMembershipSerializer(sports, many=True).data,
        })


class ChildAnnouncementsView(APIView):
    """
    GET /api/v1/parents/me/children/{student_id}/announcements/
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        parent, link, student = get_linked_student(request, student_id)
        # Announcements are visible even without academic permission

        from django.db import models as django_models
        from apps.schools.models import Announcement
        from apps.schools.serializers import AnnouncementSerializer

        qs = Announcement.objects.filter(is_active=True).filter(
            django_models.Q(expires_at__isnull=True) |
            django_models.Q(expires_at__gte=timezone.now())
        ).filter(
            django_models.Q(audience__in=['all', 'parents']) |
            django_models.Q(audience='specific_class', target_class=student.school_class)
        )

        return Response(AnnouncementSerializer(qs, many=True).data)


# ============================================================
# SELF-LINK (existing parent adds another child)
# ============================================================

class SelfLinkChildView(APIView):
    """
    POST /api/v1/parents/link/self/
    Logged-in parent links an additional child using admission + phone + ID verification.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from apps.students.models import Student

        parent = get_current_parent(request.user)
        if parent is None:
            return Response({'error': 'Not a parent account.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = SelfLinkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Generic reject helper
        def reject(reason, message=None):
            log_link_attempt(
                request, success=False, failure_reason=reason,
                email=parent.user.email,
                phone=data['phone'], national_id=data['national_id'],
                parent=parent,
            )
            return Response(
                {'error': message or "We couldn't match those details. Please verify and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find the student
        try:
            student = Student.objects.select_related('school_class').get(
                admission_number=data['admission_number'].strip(),
                is_active=True,
            )
        except Student.DoesNotExist:
            return reject('invalid_token', "No student found with that admission number.")

        # Check not already linked
        if StudentParent.objects.filter(parent=parent, student=student).exists():
            return reject('already_linked', "This child is already linked to your account.")

        # Find matching guardian
        guardian = StudentGuardian.objects.filter(student=student).filter(
            Q(phone=data['phone'].strip()) |
            Q(national_id=data['national_id'].strip().upper())
        ).first()

        if guardian is None:
            return reject('phone_mismatch')

        # Strict two-field match
        if guardian.phone.strip() != data['phone'].strip():
            return reject('phone_mismatch')
        if guardian.national_id.strip().upper() != data['national_id'].strip().upper():
            return reject('id_mismatch')

        with transaction.atomic():
            StudentParent.objects.create(
                parent=parent,
                student=student,
                relationship=guardian.relationship,
                is_primary_contact=False,
                linked_via='self_service',
            )

        log_link_attempt(
            request, success=True,
            email=parent.user.email, phone=data['phone'],
            national_id=data['national_id'],
            student=student, parent=parent,
        )

        return Response({
            'message': f'{student.full_name} has been linked to your account.',
            'student': {
                'id': student.id,
                'admission_number': student.admission_number,
                'full_name': student.full_name,
            },
        }, status=status.HTTP_201_CREATED)


class InviteCoparentView(APIView):
    """
    POST /api/v1/parents/link/invite-coparent/
    Logged-in parent invites a coparent for one of their linked children.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        parent = get_current_parent(request.user)
        if parent is None:
            return Response({'error': 'Not a parent account.'},
                            status=status.HTTP_403_FORBIDDEN)

        serializer = CoparentInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify the logged-in parent is linked to this student
        try:
            my_link = StudentParent.objects.select_related('student').get(
                parent=parent, student_id=data['student_id'], is_active=True
            )
        except StudentParent.DoesNotExist:
            return Response({'error': 'You are not linked to this student.'},
                            status=status.HTTP_403_FORBIDDEN)

        student = my_link.student

        # Find a guardian record for that email
        guardian = StudentGuardian.objects.filter(
            student=student, email__iexact=data['email']
        ).first()

        if guardian is None:
            return Response(
                {'error': 'This email is not on the admission record. Please contact the school.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create invitation
        invitation = ParentInvitation.objects.create(
            student=student,
            student_guardian=guardian,
            email=data['email'],
            invite_type='coparent',
            invited_by_parent=parent,
        )

        # TODO: Send email here (Phase 2C — Email integration)

        return Response({
            'message': f'Invitation sent to {data["email"]}.',
            'invitation_token': invitation.token,  # For testing only — remove in prod
            'expires_at': invitation.expires_at,
        }, status=status.HTTP_201_CREATED)


class ResendInvitationView(APIView):
    """
    POST /api/v1/parents/link/resend-invitation/{invitation_id}/
    Parent can request a resend of a coparent invitation they sent.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, invitation_id):
        parent = get_current_parent(request.user)
        if parent is None:
            return Response({'error': 'Not a parent account.'},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            inv = ParentInvitation.objects.get(
                id=invitation_id, invited_by_parent=parent
            )
        except ParentInvitation.DoesNotExist:
            return Response({'error': 'Invitation not found.'},
                            status=status.HTTP_404_NOT_FOUND)

        if inv.is_accepted:
            return Response({'error': 'This invitation has already been accepted.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Revoke old, create new
        inv.revoke()
        new_inv = ParentInvitation.objects.create(
            student=inv.student,
            student_guardian=inv.student_guardian,
            email=inv.email,
            invite_type='resend',
            invited_by_parent=parent,
        )

        # TODO: Send email here

        return Response({
            'message': 'Invitation resent.',
            'invitation_token': new_inv.token,
            'expires_at': new_inv.expires_at,
        })