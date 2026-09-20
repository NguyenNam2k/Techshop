import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

/**
 * AuthContext — Quản lý trạng thái xác thực toàn cục.
 * Cung cấp: user, token, isLoading, login(), logout()
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true khi đang restore session

  /**
   * Khi app khởi động: kiểm tra token trong localStorage.
   * Nếu có → gọi /api/auth/me để lấy thông tin user mới nhất.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('techshop_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await axiosInstance.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setToken(storedToken);
        }
      } catch {
        // Token hết hạn hoặc không hợp lệ → xóa
        localStorage.removeItem('techshop_token');
        localStorage.removeItem('techshop_user');
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  /**
   * Đăng nhập: lưu token + user vào state và localStorage
   */
  const login = useCallback((newToken, userData) => {
    localStorage.setItem('techshop_token', newToken);
    localStorage.setItem('techshop_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  /**
   * Đăng xuất: xóa state và localStorage
   */
  const logout = useCallback(() => {
    localStorage.removeItem('techshop_token');
    localStorage.removeItem('techshop_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook tiện ích — dùng trong bất kỳ component nào:
 *   const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>');
  return ctx;
}

export default AuthContext;
