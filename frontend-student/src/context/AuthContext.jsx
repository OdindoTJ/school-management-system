import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentStudent,
  getAccessToken,
  isAuthenticated as checkAuth,
  setCurrentStudent,
  studentAuthAPI,
} from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage on mount
    if (checkAuth()) {
      setStudent(getCurrentStudent());
    }
    setLoading(false);
  }, []);

  const login = (studentData) => {
    setCurrentStudent(studentData);
    setStudent(studentData);
  };

  const updateStudent = (studentData) => {
    setCurrentStudent(studentData);
    setStudent(studentData);
  };

  const logout = () => {
    studentAuthAPI.logout();
    setStudent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        student,
        loading,
        isAuthenticated: !!student && !!getAccessToken(),
        mustChangePassword: student?.must_change_password === true,
        login,
        logout,
        updateStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};