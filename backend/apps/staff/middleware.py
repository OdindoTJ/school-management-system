"""
Middleware to automatically audit write actions on authenticated API requests.

Only logs unsafe HTTP methods (POST, PUT, PATCH, DELETE) on /api/v1/ paths
for authenticated users. Views can opt out by setting request._audit_logged = True
after logging their own richer audit entry.
"""

import logging

from .utils import log_audit

logger = logging.getLogger(__name__)

WRITE_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

EXCLUDED_PATH_PREFIXES = (
    '/admin/',
    '/api/v1/staff/audit-logs/',
    '/static/',
    '/media/',
)


class AuditWriteMiddleware:
    """Adds an audit entry for every authenticated write action."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request._audit_logged = False

        response = self.get_response(request)

        if getattr(request, '_audit_logged', False):
            return response

        if request.method not in WRITE_METHODS:
            return response

        if not request.path.startswith('/api/v1/'):
            return response

        if any(request.path.startswith(p) for p in EXCLUDED_PATH_PREFIXES):
            return response

        if response.status_code >= 400:
            return response

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response

        path_parts = [p for p in request.path.split('/') if p]
        resource = path_parts[2] if len(path_parts) > 2 else 'unknown'

        action_map = {
            'POST': 'create',
            'PUT': 'update',
            'PATCH': 'update',
            'DELETE': 'delete',
        }

        log_audit(
            request,
            action_map.get(request.method, 'other'),
            model_name=resource,
            object_repr=f"{request.method} {request.path}",
            changes={},
        )
        request._audit_logged = True

        return response
class StaffNoIndexMiddleware:
    """
    Adds X-Robots-Tag header to staff API responses.
    Prevents search engines from indexing staff endpoints.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith('/api/v1/staff/'):
            response['X-Robots-Tag'] = 'noindex, nofollow, noarchive'
        return response