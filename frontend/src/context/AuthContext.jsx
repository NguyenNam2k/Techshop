import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      login,
      logout,
      isAuthOpen,
      setIsAuthOpen,
      activeTab,
      setActiveTab,
      searchQuery,
      setSearchQuery
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      setUser: () => {},
      login: () => {},
      logout: () => {},
      isAuthOpen: false,
      setIsAuthOpen: () => {},
      activeTab: 'home',
      setActiveTab: () => {},
      searchQuery: '',
      setSearchQuery: () => {}
    };
  }
  return ctx;
}
