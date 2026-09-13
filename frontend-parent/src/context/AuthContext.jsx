import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentParent,
  getAccessToken,
  isAuthenticated as checkAuth,
  setCurrentParent,
  parentAuthAPI,
} from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (checkAuth()) {
      setParent(getCurrentParent());
    }
    setLoading(false);
  }, []);

  const login = (parentData) => {
    setCurrentParent(parentData);
    setParent(parentData);
  };

  const updateParent = (parentData) => {
    setCurrentParent(parentData);
    setParent(parentData);
  };

  const logout = () => {
    parentAuthAPI.logout();
    setParent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        parent,
        loading,
        isAuthenticated: !!parent && !!getAccessToken(),
        mustChangePassword: parent?.must_change_password === true,
        login,
        logout,
        updateParent,
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