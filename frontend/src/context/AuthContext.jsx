/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { clearTokens, setTokens } from '../api/apiClient';
import { normalizeClientRole } from '../utils/appUtils'; // We will need to move this from App.jsx or appUtils

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('zmate_current_user') || null;
  });

  const [currentRole, setCurrentRole] = useState(() => {
    const role = localStorage.getItem('zmate_current_role');
    return normalizeClientRole(role);
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authNotifications, setAuthNotifications] = useState([
    { type: 'info', title: 'Mẹo', message: 'Đăng nhập đúng vai trò để tránh lỗi truy cập.' }
  ]);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const pushAuthNotice = useCallback((message, type = 'info', title = 'Thông báo') => {
    setAuthNotifications([{ type, title, message }]);
  }, []);

  const login = (user, role, tokens) => {
    setCurrentUser(user);
    const normalizedRole = normalizeClientRole(role);
    setCurrentRole(normalizedRole);
    localStorage.setItem('zmate_current_user', user);
    localStorage.setItem('zmate_current_role', normalizedRole);
    if (tokens) {
        setTokens(tokens);
    }
    setIsAuthOpen(false);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentRole('student');
    localStorage.removeItem('zmate_current_user');
    localStorage.removeItem('zmate_current_role');
    localStorage.removeItem('zmate_token');
    clearTokens();
  };

  const value = {
    currentUser,
    currentRole,
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    authNotifications,
    pushAuthNotice,
    isAuthLoading,
    setIsAuthLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
