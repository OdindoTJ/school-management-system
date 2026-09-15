import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { staff, highestRole, dashboardConfig, isAdmin } = useAuth();

  const roleName = highestRole?.name || 'Staff';
  const quickActions = dashboardConfig?.quick_actions || [];

  const actionLabels = {
    add_student: { label: 'Add Student', path: '/students/new' },
    add_staff: { label: 'Add Staff', path: '/staff/new' },
    send_invitation: { label: 'Send Parent Invitation', path: '/invitations' },
    review_change_requests: { label: 'Review Requests', path: '/change-requests' },
    view_audit_log: { label: 'View Audit Log', path: '/audit-log' },
    view_reports: { label: 'View Reports', path: '/reports' },
    send_announcement: { label: 'Send Announcement', path: '/announcements/new' },
    mark_attendance: { label: 'Mark Attendance', path: '/attendance' },
    enter_grades: { label: 'Enter Grades', path: '/grade-entry' },
    post_assignment: { label: 'Post Assignment', path: '/assignments/new' },
    review_department_grades: { label: 'Review Dept Grades', path: '/grades' },
    record_payment: { label: 'Record Payment', path: '/payments/new' },
    request_fee_waiver: { label: 'Request Fee Waiver', path: '/fee-waivers/new' },
    view_financial_reports: { label: 'Financial Reports', path: '/reports' },
    log_loan: { label: 'Log Book Loan', path: '/library/new' },
    log_return: { label: 'Log Book Return', path: '/library/return' },
  };

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white border-l-4 border-primary-900 rounded-lg p-6 shadow-sm">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Staff Dashboard
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {staff?.full_name}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mt-2">
          <span>Staff ID: <strong className="text-gray-900">{staff?.staff_id}</strong></span>
          <span>Role: <strong className="text-gray-900">{roleName}</strong></span>
          {isAdmin && (
            <span className="text-red-600 font-semibold">Admin access</span>
          )}
        </div>
      </div>

      {/* MFA reminder */}
      {staff?.mfa_required && !staff?.mfa_enabled && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-amber-800">MFA Setup Required</p>
            <p className="text-amber-700 mt-1">
              Your role requires multi-factor authentication. Please set it up at your earliest convenience.
              (MFA setup UI is coming soon.)
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickActions
              .filter((key) => actionLabels[key])
              .map((key) => {
                const action = actionLabels[key];
                return (
                  <Link
                    key={key}
                    to={action.path}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-900 hover:bg-primary-50 transition group"
                  >
                    <span className="font-medium text-gray-800 group-hover:text-primary-900">
                      {action.label}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Role-specific welcome card */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          What you can do
        </h2>
        <p className="text-sm text-gray-600">
          {getRoleDescription(roleName)}
        </p>
      </div>

      {/* Coming next banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Coming in Phase 4F+:</strong> Role-specific features — student management, grade entry, attendance marking, announcements, and more.
        </p>
      </div>
    </div>
  );
};

const getRoleDescription = (roleName) => {
  const descriptions = {
    'System Administrator': 'You have full system access. Manage students, staff, roles, audit logs, and all operations.',
    'Principal': 'You oversee academics and can approve change requests, view reports, and manage announcements.',
    'Deputy Principal': 'You assist with daily operations, academics, and can approve change requests.',
    'Head of Department': 'You manage your department\'s subjects, staff, and grades. You can review and approve grade changes.',
    'Bursar': 'You manage fees, payments, and financial records. Fee waivers require approval.',
    'Librarian': 'You manage library records, books, and student loans.',
    'Teacher': 'You can enter grades, mark attendance, post assignments, and send class announcements.',
  };
  return descriptions[roleName] || 'Your dashboard will show features based on your role.';
};

export default Dashboard;