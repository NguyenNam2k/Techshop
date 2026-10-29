import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const TOKEN_KEY = 'techshop_token';
const USER_KEY  = 'techshop_user';
const LEGACY_USER_KEY = 'techgear_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Restore session từ localStorage khi app khởi động
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
      if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
        const parsed = JSON.parse(rawUser);
        if (parsed && typeof parsed === 'object') {
          const roleLower = String(parsed.role || '').toLowerCase();
          if (!roleLower || roleLower.includes('vip') || roleLower.includes('diamond')) {
            parsed.role = 'customer';
          }
          setUserState(parsed);
        }
      }
    } catch {
      // ignore parse error
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Đăng nhập: lưu token + user vào localStorage */
  const login = (token, userData) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (userData) {
      const normalizedUser = { ...userData };
      const roleLower = String(normalizedUser.role || '').toLowerCase();
      if (!roleLower || roleLower.includes('vip') || roleLower.includes('diamond')) {
        normalizedUser.role = 'customer';
      }
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(normalizedUser));
      setUserState(normalizedUser);
    }
  };

  /** Đăng xuất: xóa token + user */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setUserState(null);
  };

  /** Cập nhật thông tin user */
  const setUser = (userData) => {
    if (!userData) {
      logout();
      return;
    }
    setUserState((prev) => {
      const finalUser = typeof userData === 'function' ? userData(prev) : userData;
      if (!finalUser) return null;
      const r = String(finalUser.role || '').toLowerCase();
      if (!r || r.includes('vip') || r.includes('diamond')) {
        finalUser.role = 'customer';
      }
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(finalUser));
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(finalUser));
      } catch {
        // ignore
      }
      return finalUser;
    });
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
