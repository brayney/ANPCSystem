import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
