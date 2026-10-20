import { createContext, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, clearAuthToken } from '../services/api';
import { requestCartMerge, requestCartReset } from './cartBridge';

export const ROLES = {
  customer: {
    label: 'Khách hàng (Tú)',
    email: 'tu.tran@techshop.vn',
    name: 'Trần Văn Tú',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
  },
  staff: {
    label: 'Nhân viên (Hải)',
    email: 'staff@techshop.vn',
    name: 'Phạm Hải Dương',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
  },
  manager: {
    label: 'Quản lý kho (Khánh)',
    email: 'khanh.le@techshop.vn',
    name: 'Lê Hoàng Khánh',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100'
  },
  admin: {
    label: 'Quản trị viên (Admin)',
    email: 'admin@techshop.vn',
    name: 'Quản Trị Viên',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'
  }
};

export const roleFromEmail = (email = '') => {
  const e = String(email).toLowerCase();
  if (e.includes('admin')) return 'admin';
  if (e.includes('khanh') || e.includes('manager')) return 'manager';
  if (e.includes('staff') || e.includes('hai.pham') || e.includes('duong') || e.includes('nhanvien')) return 'staff';
  return 'customer';
};

export const getDashboardRouteForRole = (role) => {
  // All roles now redirect to profile page instead of dashboard
  return '/profile';
};

export const getPostLoginRouteForRole = (role) =>
  role === 'customer' ? '/' : '/profile';

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
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartMergeError, setCartMergeError] = useState('');

  const login = (emailOrUserData, explicitRole) => {
    let userObj;
    if (typeof emailOrUserData === 'object' && emailOrUserData !== null) {
      userObj = emailOrUserData;
    } else {
      const email = String(emailOrUserData);
      const role = explicitRole || roleFromEmail(email);
      const preset = ROLES[role] || ROLES.customer;
      userObj = {
        email,
        role,
        name: preset.name || email.split('@')[0],
        avatar: preset.avatar
      };
    }
    setUser(userObj);
    try {
      localStorage.setItem('techgear_user', JSON.stringify(userObj));
    } catch {}
    return userObj;
  };

  const completeAuthenticatedLogin = async ({ token, user: account }) => {
    const preset = ROLES[account.role] || {};
    const userObj = {
      id: account.id,
      email: account.email,
      role: account.role,
      name: account.name || preset.name || account.email.split('@')[0],
      avatar: account.avatar || preset.avatar || null,
      code: account.code || null
    };
    void token;
    setUser(userObj);
    try {
      localStorage.setItem('techgear_user', JSON.stringify(userObj));
    } catch {}

    // Guest -> authenticated transition. This is the only place the guest cart
    // is merged, so restoring a session from localStorage or re-rendering the
    // cart never triggers a second merge. The guest session token is kept as-is.
    setCartMergeError('');
    let mergeError = '';
    try {
      await requestCartMerge();
    } catch (error) {
      mergeError = error?.response?.data?.message
        || error?.message
        || 'Không thể gộp giỏ hàng sau khi đăng nhập.';
      setCartMergeError(mergeError);
    }

    // The returned object is a copy: the stored user must not carry UI-only state.
    return { ...userObj, cartMergeError: mergeError };
  };

  // The first login step may return a short-lived challenge instead of an
  // authenticated session when the customer has enabled authenticator codes.
  const loginWithPassword = async (email, password) => {
    const result = await api.login(email, password);
    if (result.requiresTwoFactor) return result;
    return completeAuthenticatedLogin(result);
  };

  const loginWithTwoFactor = async (challengeToken, code) => {
    const result = await api.loginWithTwoFactor(challengeToken, code);
    return completeAuthenticatedLogin(result);
  };

  // Drop a stored session whose token is gone or expired, so the UI never shows
  // a signed-in manager while the API would answer 401.
  useEffect(() => {
    if (!user) return;
    if (getAuthToken()) return;
    setUser(null);
    try {
      localStorage.removeItem('techgear_user');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateUser = (updates) => {
    setUser(currentUser => {
      if (!currentUser) return currentUser;
      const updatedUser = { ...currentUser, ...updates };
      try {
        localStorage.setItem('techgear_user', JSON.stringify(updatedUser));
      } catch {}
      return updatedUser;
    });
  };

  const logout = () => {
    api.logout();
    clearAuthToken();
    setUser(null);
    try {
      localStorage.removeItem('techgear_user');
    } catch {}
    setCartMergeError('');
    // The guest session token survives the logout, so the cart state must be
    // reloaded for that guest instead of keeping the customer's lines around.
    void requestCartReset();
  };

  const clearCartMergeError = () => setCartMergeError('');

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      updateUser,
      login,
      loginWithPassword,
      loginWithTwoFactor,
      logout,
      cartMergeError,
      clearCartMergeError,
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
      updateUser: () => {},
      login: () => {},
      loginWithPassword: async () => {
        throw new Error('Không thể đăng nhập.');
      },
      loginWithTwoFactor: async () => {
        throw new Error('Không thể xác minh đăng nhập.');
      },
      logout: () => {},
      cartMergeError: '',
      clearCartMergeError: () => {},
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
