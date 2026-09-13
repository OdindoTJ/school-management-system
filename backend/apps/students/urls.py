"""
URL configuration for the students app.
"""
from django.urls import path
from . import views

app_name = 'students'

urlpatterns = [
    # ============================================================
    # Authentication
    # ============================================================
    path('auth/login/', views.StudentLoginView.as_view(), name='student-login'),
    path('auth/change-password/', views.StudentChangePasswordView.as_view(), name='student-change-password'),
    path('auth/me/', views.StudentMeView.as_view(), name='student-me'),

    # ============================================================
    # Student Data
    # ============================================================
    path('me/grades/', views.MyGradesView.as_view(), name='my-grades'),
    path('me/grades/report-card/', views.MyReportCardView.as_view(), name='my-report-card'),
    path('me/timetable/', views.MyTimetableView.as_view(), name='my-timetable'),
    path('me/attendance/', views.MyAttendanceView.as_view(), name='my-attendance'),
    path('me/attendance/summary/', views.MyAttendanceSummaryView.as_view(), name='my-attendance-summary'),
    path('me/assignments/', views.MyAssignmentsView.as_view(), name='my-assignments'),
    path('me/library/', views.MyLibraryView.as_view(), name='my-library'),
    path('me/clubs/', views.MyClubsView.as_view(), name='my-clubs'),
    path('me/sports/', views.MySportsView.as_view(), name='my-sports'),
]