import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'techshop_token';
const USER_KEY  = 'techshop_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Restore session từ localStorage khi app khởi động
  useEffect(() => {
    try {
      const savedUser  = localStorage.getItem(USER_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedUser && savedToken) {
        setUserState(JSON.parse(savedUser));
      }
    } catch {
      // ignore parse error
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Đăng nhập: lưu token + user vào localStorage */
  const login = (token, userData) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUserState(userData);
  };

  /** Đăng xuất: xóa token + user */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUserState(null);
  };

  /** Cập nhật thông tin user (dùng trong Dashboard role-switcher) */
  const setUser = (userData) => {
    if (!userData) {
      logout();
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUserState(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        isLoading,
        searchQuery,
        setSearchQuery,
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
      login: () => {},
      logout: () => {},
      isLoading: false,
      searchQuery: '',
      setSearchQuery: () => {},
    };
  }
  return ctx;
}
