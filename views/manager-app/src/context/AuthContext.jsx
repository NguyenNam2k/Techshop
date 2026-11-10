import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [dashboardSection, setDashboardSection] = useState('orders');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user') || localStorage.getItem('techshop_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('techshop_token');
      localStorage.removeItem('techshop_user');
    } catch (e) {}
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        dashboardSection,
        setDashboardSection,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    let savedUser = null;
    try {
      const saved = localStorage.getItem('user') || localStorage.getItem('techshop_user');
      if (saved) savedUser = JSON.parse(saved);
    } catch (e) {}

    return {
      user: savedUser,
      dashboardSection: 'orders',
      setDashboardSection: () => {},
      logout: () => {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (e) {}
        window.location.href = '/login';
      }
    };
  }
  return ctx;
}

