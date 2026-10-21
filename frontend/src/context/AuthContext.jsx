import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('techgear_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        searchQuery,
        setSearchQuery
      }}
    >
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
      searchQuery: '',
      setSearchQuery: () => {}
    };
  }
  return ctx;
}
