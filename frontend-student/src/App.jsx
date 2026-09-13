import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout from './components/Layout/StudentLayout';

import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Grades from './pages/Grades';
import ReportCard from './pages/ReportCard';
import Timetable from './pages/Timetable';
import Attendance from './pages/Attendance';
import Assignments from './pages/Assignments';
import Library from './pages/Library';
import Activities from './pages/Activities';
import Announcements from './pages/Announcements';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/report-card" element={<ReportCard />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/library" element={<Library />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/announcements" element={<Announcements />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;