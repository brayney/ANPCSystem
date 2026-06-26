import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';
import i18n from '../i18n/config';

const AuthContext = createContext(null);

const applySystemLanguage = (language) => {
  if (!language) return;

  localStorage.setItem('systemLanguage', language);
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  i18n.changeLanguage(language);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      applySystemLanguage(data.user?.language);
      setUser(data.user);
      return {
        success: true,
        user: data.user,
        attemptsRemaining: data.user.loginAttempts,
        lockUntil: data.user.lockedUntil,
      };
    } catch (err) {
      const message = err.response?.data?.message;
      const isLocked = err.response?.status === 403;
      return {
        success: false,
        status: err.response?.status,
        message: message || 'Login failed',
        isLocked,
        attemptsRemaining: err.response?.data?.attemptsRemaining,
        lockUntil: err.response?.data?.lockUntil || err.response?.data?.lockedUntil,
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore errors, still clear local auth state
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('anpc-login-attempts');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    console.log('🔄 Updating user state:', updatedUserData);
    const newUser = { ...user, ...updatedUserData };
    applySystemLanguage(updatedUserData.language);
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
