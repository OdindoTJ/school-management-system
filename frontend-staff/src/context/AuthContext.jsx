import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentStaff,
  getAccessToken,
  isAuthenticated as checkAuth,
  setCurrentStaff,
  clearAuth,
  staffAuthAPI,
} from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = async () => {
      if (!checkAuth()) {
        setLoading(false);
        return;
      }

      // Load from localStorage first (fast render)
      const cached = getCurrentStaff();
      setStaff(cached);

      // Then refresh from backend to pick up latest roles / config
      try {
        const res = await staffAuthAPI.me();
        setCurrentStaff(res.data);
        setStaff(res.data);
      } catch (err) {
        // 401 handled by interceptor; other errors leave cache as-is
        console.warn('Could not refresh staff profile:', err?.message);
      } finally {
        setLoading(false);
      }
    };

    hydrate();
  }, []);

  const login = (staffData) => {
    setCurrentStaff(staffData);
    setStaff(staffData);
  };

  const updateStaff = (staffData) => {
    setCurrentStaff(staffData);
    setStaff(staffData);
  };

  const logout = async () => {
    try {
      await staffAuthAPI.logout();
    } catch {
      // Ignore network errors on logout
    }
    clearAuth();
    setStaff(null);
  };

  const value = {
    staff,
    loading,
    isAuthenticated: !!staff && !!getAccessToken(),
    mustChangePassword: staff?.must_change_password === true,
    mfaRequired: staff?.mfa_required === true,
    mfaEnabled: staff?.mfa_enabled === true,
    isAdmin: staff?.is_admin === true,
    dashboardConfig: staff?.dashboard_config || {},
    roles: staff?.roles || [],
    highestRole: staff?.highest_role,
    login,
    logout,
    updateStaff,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};