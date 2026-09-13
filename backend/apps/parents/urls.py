"""
URL configuration for the parents app.
"""
from django.urls import path

from . import views

app_name = 'parents'

urlpatterns = [
    # ============================================================
    # Invitations (public)
    # ============================================================
    path(
        'invitations/<str:token>/',
        views.InvitationValidateView.as_view(),
        name='invitation-validate',
    ),
    path(
        'invitations/<str:token>/accept/',
        views.InvitationAcceptView.as_view(),
        name='invitation-accept',
    ),

    # ============================================================
    # Auth
    # ============================================================
    path('auth/login/', views.ParentLoginView.as_view(), name='parent-login'),
    path('auth/logout/', views.ParentLogoutView.as_view(), name='parent-logout'),
    path('auth/me/', views.ParentMeView.as_view(), name='parent-me'),
    path(
        'auth/change-password/',
        views.ParentChangePasswordView.as_view(),
        name='parent-change-password',
    ),

    # ============================================================
    # Children
    # ============================================================
    path('me/children/', views.MyChildrenView.as_view(), name='my-children'),
    path(
        'me/children/<int:student_id>/',
        views.ChildDetailView.as_view(),
        name='child-detail',
    ),
    path(
        'me/children/<int:student_id>/grades/',
        views.ChildGradesView.as_view(),
        name='child-grades',
    ),
    path(
        'me/children/<int:student_id>/report-card/',
        views.ChildReportCardView.as_view(),
        name='child-report-card',
    ),
    path(
        'me/children/<int:student_id>/timetable/',
        views.ChildTimetableView.as_view(),
        name='child-timetable',
    ),
    path(
        'me/children/<int:student_id>/attendance/',
        views.ChildAttendanceView.as_view(),
        name='child-attendance',
    ),
    path(
        'me/children/<int:student_id>/attendance/summary/',
        views.ChildAttendanceSummaryView.as_view(),
        name='child-attendance-summary',
    ),
    path(
        'me/children/<int:student_id>/assignments/',
        views.ChildAssignmentsView.as_view(),
        name='child-assignments',
    ),
    path(
        'me/children/<int:student_id>/library/',
        views.ChildLibraryView.as_view(),
        name='child-library',
    ),
    path(
        'me/children/<int:student_id>/activities/',
        views.ChildActivitiesView.as_view(),
        name='child-activities',
    ),
    path(
        'me/children/<int:student_id>/announcements/',
        views.ChildAnnouncementsView.as_view(),
        name='child-announcements',
    ),

    # ============================================================
    # Linking
    # ============================================================
    path('link/self/', views.SelfLinkChildView.as_view(), name='self-link'),
    path(
        'link/invite-coparent/',
        views.InviteCoparentView.as_view(),
        name='invite-coparent',
    ),
    path(
        'link/resend-invitation/<int:invitation_id>/',
        views.ResendInvitationView.as_view(),
        name='resend-invitation',
    ),
]