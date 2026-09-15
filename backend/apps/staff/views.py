"""
Views for the staff app.
"""
import logging

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from django.utils import timezone
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    StaffRole,
    Staff,
    StaffRoleAssignment,
    AuditLog,
    ChangeRequest,
)
from .serializers import (
    StaffRoleSerializer,
    StaffProfileSerializer,
    StaffListSerializer,
    StaffRoleAssignmentSerializer,
    AuditLogSerializer,
    ChangeRequestSerializer,
    ChangeRequestReviewSerializer,
    StaffLoginSerializer,
    StaffChangePasswordSerializer,
)
from .utils import log_audit

logger = logging.getLogger(__name__)


# ============================================================
# HELPERS
# ============================================================

def get_current_staff(user):
    """Get the Staff object linked to the logged-in user, or None."""
    try:
        return user.staff_profile
    except (Staff.DoesNotExist, AttributeError):
        return None


def _build_staff_payload(staff):
    """
    Build the staff payload with dashboard_config attached.
    Used by login and me endpoints.
    """
    data = StaffProfileSerializer(staff).data
    highest = staff.highest_role
    data['dashboard_config'] = highest.dashboard_config if highest else {}
    return data


# ============================================================
# AUTH VIEWS
# ============================================================

class StaffLoginView(APIView):
    """
    POST /api/v1/staff/auth/login/
    Staff login: email + password → JWT tokens.
    Logs the attempt to AuditLog.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StaffLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email'].lower().strip()
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)

        # Failure path
        if user is None:
            log_audit(
                request, 'login_failed',
                changes={'email': email},
                is_flagged=False,
            )
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        staff = get_current_staff(user)
        if staff is None:
            log_audit(
                request, 'login_failed',
                changes={'email': email, 'reason': 'not_a_staff_account'},
                actor=user,
            )
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not staff.is_active:
            log_audit(
                request, 'login_failed',
                changes={'email': email, 'reason': 'staff_inactive'},
                actor=user,
            )
            return Response(
                {'error': 'This account is inactive. Please contact the administrator.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Success path
        refresh = RefreshToken.for_user(user)

        log_audit(
            request, 'login',
            model_name='Staff',
            object_id=staff.id,
            object_repr=f"{staff.staff_id} — {staff.full_name}",
            actor=user,
        )

        return Response({
            'message': 'Login successful.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'must_change_password': staff.must_change_password,
            'mfa_required': staff.mfa_required,
            'mfa_enabled': staff.mfa_enabled,
            'staff': _build_staff_payload(staff),
        })


class StaffMeView(APIView):
    """
    GET /api/v1/staff/auth/me/
    Get the logged-in staff's profile + roles + dashboard config.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        staff = get_current_staff(request.user)
        if staff is None:
            return Response(
                {'error': 'Not a staff account.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(_build_staff_payload(staff))


class StaffChangePasswordView(APIView):
    """
    POST /api/v1/staff/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        staff = get_current_staff(request.user)
        if staff is None:
            return Response(
                {'error': 'Not a staff account.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StaffChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            log_audit(
                request, 'password_change',
                model_name='Staff',
                object_id=staff.id,
                changes={'result': 'failed', 'reason': 'incorrect_old_password'},
                actor=user,
            )
            return Response(
                {'old_password': ['Incorrect password.']},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        was_forced = staff.must_change_password
        if was_forced:
            staff.must_change_password = False
            staff.save(update_fields=['must_change_password'])

        log_audit(
            request, 'password_change',
            model_name='Staff',
            object_id=staff.id,
            object_repr=f"{staff.staff_id} — {staff.full_name}",
            changes={'forced_initial_change': was_forced},
            actor=user,
        )

        return Response({'message': 'Password changed successfully.'})


class StaffLogoutView(APIView):
    """
    POST /api/v1/staff/auth/logout/
    Client-side clears tokens. Server logs the action.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        staff = get_current_staff(request.user)
        log_audit(
            request, 'logout',
            model_name='Staff',
            object_id=staff.id if staff else None,
            object_repr=f"{staff.staff_id} — {staff.full_name}" if staff else None,
            actor=request.user,
        )
        return Response({'message': 'Logged out.'})


# ============================================================
# ADMIN: FORCE LOGOUT
# ============================================================

class ForceLogoutView(APIView):
    """
    POST /api/v1/staff/admin/force-logout/{staff_id}/
    Invalidate all JWTs for the target staff member.
    Requires admin role.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, staff_id):
        actor_staff = get_current_staff(request.user)
        if actor_staff is None or not actor_staff.is_admin:
            return Response(
                {'error': 'Admin access required.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            target = Staff.objects.get(id=staff_id)
        except Staff.DoesNotExist:
            return Response(
                {'error': 'Staff member not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # For real enforcement we'd need JWT blacklist; for now we log it.
        # Phase 4C+ will wire up rest_framework_simplejwt.token_blacklist.
        log_audit(
            request, 'force_logout',
            model_name='Staff',
            object_id=target.id,
            object_repr=f"{target.staff_id} — {target.full_name}",
            changes={'forced_by': actor_staff.staff_id},
            actor=request.user,
        )

        return Response({
            'message': f'Logout signal sent for {target.full_name}.',
        })


# ============================================================
# ADMIN: ROLES VIEWSET
# ============================================================

class StaffRoleViewSet(viewsets.ModelViewSet):
    """
    CRUD for staff roles. Admin-only for writes; everyone can read.
    """
    queryset = StaffRole.objects.all().order_by('level', 'name')
    serializer_class = StaffRoleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _is_admin(self, request):
        staff = get_current_staff(request.user)
        return staff is not None and staff.is_admin

    def create(self, request, *args, **kwargs):
        if not self._is_admin(request):
            return Response({'error': 'Admin access required.'}, status=403)
        response = super().create(request, *args, **kwargs)
        log_audit(
            request, 'create',
            model_name='StaffRole',
            object_id=response.data.get('id'),
            object_repr=response.data.get('name'),
            actor=request.user,
        )
        return response

    def update(self, request, *args, **kwargs):
        if not self._is_admin(request):
            return Response({'error': 'Admin access required.'}, status=403)
        instance = self.get_object()
        response = super().update(request, *args, **kwargs)
        log_audit(
            request, 'update',
            model_name='StaffRole',
            object_id=instance.id,
            object_repr=instance.name,
            actor=request.user,
        )
        return response

    def destroy(self, request, *args, **kwargs):
        if not self._is_admin(request):
            return Response({'error': 'Admin access required.'}, status=403)
        instance = self.get_object()
        if instance.is_system_role:
            return Response(
                {'error': 'System roles cannot be deleted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        log_audit(
            request, 'delete',
            model_name='StaffRole',
            object_id=instance.id,
            object_repr=instance.name,
            actor=request.user,
        )
        return super().destroy(request, *args, **kwargs)


# ============================================================
# ADMIN: STAFF VIEWSET
# ============================================================

class StaffViewSet(viewsets.ModelViewSet):
    """
    CRUD for staff members. Admin-only for writes.
    Read access: admin sees all; staff sees own profile via /auth/me/.
    """
    queryset = Staff.objects.all().select_related('user', 'bio').order_by('full_name')
    permission_classes = [permissions.IsAuthenticated]

    def _is_admin(self, request):
        staff = get_current_staff(request.user)
        return staff is not None and staff.is_admin

    def get_serializer_class(self):
        if self.action == 'list':
            return StaffListSerializer
        return StaffProfileSerializer

    def get_queryset(self):
        user = self.request.user
        staff = get_current_staff(user)
        if staff is None:
            return Staff.objects.none()
        if staff.is_admin:
            return Staff.objects.all().select_related('user', 'bio').order_by('full_name')
        # Non-admin: only own record
        return Staff.objects.filter(id=staff.id)

    def create(self, request, *args, **kwargs):
        return Response(
            {'error': 'Staff creation is via Django admin only (Phase 4C).'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def update(self, request, *args, **kwargs):
        if not self._is_admin(request):
            return Response({'error': 'Admin access required.'}, status=403)
        instance = self.get_object()
        response = super().update(request, *args, **kwargs)
        log_audit(
            request, 'update',
            model_name='Staff',
            object_id=instance.id,
            object_repr=f"{instance.staff_id} — {instance.full_name}",
            actor=request.user,
        )
        return response

    def destroy(self, request, *args, **kwargs):
        if not self._is_admin(request):
            return Response({'error': 'Admin access required.'}, status=403)
        instance = self.get_object()

        # Soft delete — deactivate instead of hard delete
        instance.deactivate(
            by_user=request.user,
            reason=request.data.get('reason', 'Deactivated by admin'),
        )

        log_audit(
            request, 'delete',
            model_name='Staff',
            object_id=instance.id,
            object_repr=f"{instance.staff_id} — {instance.full_name}",
            changes={'action': 'deactivated'},
            actor=request.user,
        )
        return Response({'message': f'{instance.full_name} has been deactivated.'})


# ============================================================
# ADMIN: ROLE ASSIGNMENT VIEWSET
# ============================================================

class StaffRoleAssignmentViewSet(viewsets.ModelViewSet):
    """
    CRUD for role assignments. Admin-only.
    """
    queryset = StaffRoleAssignment.objects.all().select_related('staff', 'role', 'assigned_by')
    serializer_class = StaffRoleAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _is_admin(self, request):
        staff = get_current_staff(request.user)
        return staff is not None and staff.is_admin

    def get_queryset(self):
        if not self._is_admin(self.request):
            return StaffRoleAssignment.objects.none()
        return self.queryset

    def perform_create(self, serializer):
        assignment = serializer.save(assigned_by=self.request.user)

        # Auto-flag MFA requirement
        if assignment.role.requires_mfa:
            staff = assignment.staff
            if not staff.mfa_required:
                staff.mfa_required = True
                staff.save(update_fields=['mfa_required'])

        log_audit(
            self.request, 'role_assign',
            model_name='Staff',
            object_id=assignment.staff.id,
            object_repr=f"{assignment.staff.staff_id} ← {assignment.role.name}",
            actor=self.request.user,
        )

    def perform_destroy(self, instance):
        log_audit(
            self.request, 'role_revoke',
            model_name='Staff',
            object_id=instance.staff.id,
            object_repr=f"{instance.staff.staff_id} ⊘ {instance.role.name}",
            actor=self.request.user,
        )
        instance.is_active = False
        instance.save(update_fields=['is_active'])


# ============================================================
# ADMIN: AUDIT LOG VIEWSET (read-only)
# ============================================================

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only audit log. Admin-only.
    """
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        staff = get_current_staff(self.request.user)
        if staff is None or not staff.is_admin:
            return AuditLog.objects.none()

        qs = self.queryset

        # Filters via query params
        actor = self.request.query_params.get('actor')
        action = self.request.query_params.get('action')
        model_name = self.request.query_params.get('model_name')
        flagged = self.request.query_params.get('flagged')
        date_from = self.request.query_params.get('from')
        date_to = self.request.query_params.get('to')

        if actor:
            qs = qs.filter(actor_id=actor)
        if action:
            qs = qs.filter(action=action)
        if model_name:
            qs = qs.filter(model_name=model_name)
        if flagged == 'true':
            qs = qs.filter(is_flagged=True)
        if date_from:
            qs = qs.filter(timestamp__gte=date_from)
        if date_to:
            qs = qs.filter(timestamp__lte=date_to)

        return qs


# ============================================================
# ADMIN: CHANGE REQUEST VIEWSET
# ============================================================

class ChangeRequestViewSet(viewsets.ModelViewSet):
    """
    Approval workflow viewset.
    - Any staff can create a request.
    - Any staff can list their own.
    - Admin can list all and approve/reject.
    """
    queryset = ChangeRequest.objects.all().select_related(
        'requested_by', 'reviewed_by'
    ).order_by('-created_at')
    serializer_class = ChangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def _is_admin(self, request):
        staff = get_current_staff(request.user)
        return staff is not None and staff.is_admin

    def get_queryset(self):
        staff = get_current_staff(self.request.user)
        if staff is None:
            return ChangeRequest.objects.none()
        if staff.is_admin:
            return self.queryset
        return self.queryset.filter(requested_by=self.request.user)

    def perform_create(self, serializer):
        instance = serializer.save(requested_by=self.request.user)
        log_audit(
            self.request, 'other',
            model_name='ChangeRequest',
            object_id=instance.id,
            object_repr=f"{instance.get_request_type_display()} — {instance.target_model}",
            changes={
                'reason': instance.reason,
                'requested_value': instance.requested_value,
            },
            actor=self.request.user,
        )

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        """
        POST /api/v1/staff/change-requests/{id}/review/
        Body: {"decision": "approved" | "rejected", "review_notes": "..."}
        Admin-only.
        """
        if not self._is_admin(request):
            return Response({'error': 'Admin access required.'}, status=403)

        change_request = self.get_object()

        if change_request.status != 'pending':
            return Response(
                {'error': f'Cannot review a request that is {change_request.status}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if change_request.is_expired:
            change_request.status = 'expired'
            change_request.save(update_fields=['status'])
            return Response(
                {'error': 'This request has expired.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ChangeRequestReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        decision = serializer.validated_data['decision']
        review_notes = serializer.validated_data.get('review_notes', '')

        change_request.status = decision
        change_request.reviewed_by = request.user
        change_request.reviewed_at = timezone.now()
        change_request.review_notes = review_notes

        if decision == 'approved':
            change_request.applied_at = timezone.now()

        change_request.save()

        action = 'approval_granted' if decision == 'approved' else 'approval_rejected'
        log_audit(
            request, action,
            model_name='ChangeRequest',
            object_id=change_request.id,
            object_repr=f"{change_request.get_request_type_display()} — {change_request.target_model}",
            changes={'decision': decision, 'review_notes': review_notes},
            actor=request.user,
        )

        return Response(ChangeRequestSerializer(change_request).data)