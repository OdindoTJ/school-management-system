"""
Utility functions for the staff app.
"""
import logging
from django.db.models import Model
from .models import AuditLog, ChangeRequest


logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Extract the real client IP, handling proxies."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_actor_info(user):
    """Return (staff_id, full_name) or (None, None) for non-staff users."""
    if not user or not getattr(user, 'is_authenticated', False):
        return None, None

    if hasattr(user, 'staff_profile'):
        return user.staff_profile.staff_id, user.staff_profile.full_name

    name = user.get_full_name() or user.username
    return None, name


def _serialize_value(value):
    """Make a value JSON-safe for storage in AuditLog.changes."""
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    if hasattr(value, 'pk'):
        return str(value.pk)
    return str(value)


def compute_diff(old_instance, new_data):
    """
    Compute a field-level diff between an existing instance and proposed new data.
    Returns: dict of {field: {'before': x, 'after': y}}
    """
    diff = {}
    for field, new_value in new_data.items():
        if field in ('id', 'pk', 'created_at', 'updated_at'):
            continue
        if not hasattr(old_instance, field):
            continue
        old_value = getattr(old_instance, field)
        if _serialize_value(old_value) != _serialize_value(new_value):
            diff[field] = {
                'before': _serialize_value(old_value),
                'after': _serialize_value(new_value),
            }
    return diff


def log_audit(
    request,
    action,
    *,
    model_name=None,
    object_id=None,
    object_repr=None,
    changes=None,
    is_flagged=False,
    flag_reason=None,
    actor=None,
):
    """
    Create an AuditLog entry.

    Usage:
        log_audit(request, 'login', actor=user)
        log_audit(request, 'update', model_name='Student', object_id=student.id,
                  object_repr=str(student), changes={'name': {'before': 'A', 'after': 'B'}})
    """
    try:
        # Determine the actor safely — handles request.user being None
        request_user = getattr(request, 'user', None)
        if (
            actor is None
            and request_user is not None
            and getattr(request_user, 'is_authenticated', False)
        ):
            actor = request_user

        # Normalize actor to an authenticated User or None
        safe_actor = None
        if actor is not None and getattr(actor, 'is_authenticated', False):
            safe_actor = actor

        staff_id, actor_name = get_actor_info(safe_actor)

        AuditLog.objects.create(
            actor=safe_actor,
            actor_staff_id=staff_id,
            actor_name=actor_name,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id is not None else None,
            object_repr=object_repr,
            changes=changes or {},
            request_method=getattr(request, 'method', None),
            request_path=getattr(request, 'path', None),
            ip_address=get_client_ip(request) if hasattr(request, 'META') else None,
            user_agent=(
                request.META.get('HTTP_USER_AGENT', '')[:1000]
                if hasattr(request, 'META') else None
            ),
            is_flagged=is_flagged,
            flag_reason=flag_reason,
        )
    except Exception as e:
        # Never let audit failures break the actual operation
        logger.exception(f"Failed to write audit log: {e}")


def request_change(
    request,
    request_type,
    *,
    target_model,
    target_object_id,
    current_value,
    requested_value,
    reason,
):
    """
    Create a ChangeRequest for approval workflow.
    """
    from django.utils import timezone
    from datetime import timedelta

    user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
    if user is None:
        raise ValueError("Change requests require an authenticated user.")

    if not reason or len(reason.strip()) < 10:
        raise ValueError("A meaningful reason is required (minimum 10 characters).")

    return ChangeRequest.objects.create(
        request_type=request_type,
        requested_by=user,
        target_model=target_model,
        target_object_id=str(target_object_id),
        current_value=current_value,
        requested_value=requested_value,
        reason=reason.strip(),
        expires_at=timezone.now() + timedelta(days=7),
    )