import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChildProvider } from './context/ChildContext';
import ProtectedRoute from './components/ProtectedRoute';
import ParentLayout from './components/Layout/ParentLayout';

import Login from './pages/Login';
import AcceptInvitation from './pages/AcceptInvitation';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import ChildProfile from './pages/ChildProfile';
import Grades from './pages/Grades';
import ReportCard from './pages/ReportCard';
import Timetable from './pages/Timetable';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Library from './pages/Library';
import Activities from './pages/Activities';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';

const App = () => {
  return (
    <AuthProvider>
      <ChildProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/accept-invitation" element={<AcceptInvitation />} />

            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <ParentLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/child-profile" element={<ChildProfile />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/report-card" element={<ReportCard />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/library" element={<Library />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ChildProvider>
    </AuthProvider>
  );
};

export default App;