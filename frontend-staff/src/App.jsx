import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StaffLayout from './components/Layout/StaffLayout';

import StaffList from './pages/staff/List';
import StaffDetail from './pages/staff/Detail';
import StaffNew from './pages/staff/New';
import StaffEdit from './pages/staff/Edit';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';

// Students
import StudentsList from './pages/students/List';
import StudentDetail from './pages/students/Detail';
import StudentNew from './pages/students/New';
import StudentEdit from './pages/students/Edit';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Main portal */}
          <Route
            element={
              <ProtectedRoute>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Placeholder title="My Profile" />} />

            {/* Student Management */}
            <Route path="/students" element={<StudentsList />} />
            <Route path="/students/new" element={<StudentNew />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/students/:id/edit" element={<StudentEdit />} />

            {/* Other routes (placeholders for now) */}
            <Route path="/staff" element={<StaffList />} />
            <Route path="/staff/new" element={<StaffNew />} />
            <Route path="/staff/:id" element={<StaffDetail />} />
            <Route path="/staff/:id/edit" element={<StaffEdit />} />
            <Route path="/classes" element={<Placeholder title="Classes" />} />
            <Route path="/subjects" element={<Placeholder title="Subjects" />} />
            <Route path="/parents" element={<Placeholder title="Parents" />} />
            <Route path="/invitations" element={<Placeholder title="Parent Invitations" />} />
            <Route path="/audit-log" element={<Placeholder title="Audit Log" />} />
            <Route path="/settings" element={<Placeholder title="Settings" />} />

            <Route path="/my-classes" element={<Placeholder title="My Classes" />} />
            <Route path="/my-department" element={<Placeholder title="My Department" />} />
            <Route path="/grade-entry" element={<Placeholder title="Grade Entry" />} />
            <Route path="/grades" element={<Placeholder title="Grades" />} />
            <Route path="/attendance" element={<Placeholder title="Attendance" />} />
            <Route path="/assignments" element={<Placeholder title="Assignments" />} />
            <Route path="/assignments/new" element={<Placeholder title="Post Assignment" />} />
            <Route path="/announcements" element={<Placeholder title="Announcements" />} />
            <Route path="/announcements/new" element={<Placeholder title="New Announcement" />} />

            <Route path="/library" element={<Placeholder title="Library" />} />
            <Route path="/library/new" element={<Placeholder title="Log Book Loan" />} />
            <Route path="/library/return" element={<Placeholder title="Log Book Return" />} />
            <Route path="/books" element={<Placeholder title="Books" />} />
            <Route path="/borrowers" element={<Placeholder title="Borrowers" />} />

            <Route path="/activities" element={<Placeholder title="Clubs & Sports" />} />

            <Route path="/fees" element={<Placeholder title="Fees" />} />
            <Route path="/payments" element={<Placeholder title="Payments" />} />
            <Route path="/payments/new" element={<Placeholder title="Record Payment" />} />
            <Route path="/fee-waivers" element={<Placeholder title="Fee Waivers" />} />
            <Route path="/fee-waivers/new" element={<Placeholder title="Request Fee Waiver" />} />
            <Route path="/reports" element={<Placeholder title="Reports" />} />

            <Route path="/change-requests" element={<Placeholder title="Change Requests" />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;