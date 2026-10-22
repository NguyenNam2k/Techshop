import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — Bảo vệ các route yêu cầu đăng nhập.
 *
 * Cách dùng trong App.jsx (wrapper pattern):
 *
 *   <Route
 *     path="/dashboard"
 *     element={
 *       <ProtectedRoute>
 *         <DashboardPage />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 *   // Chỉ admin mới vào được:
 *   <Route
 *     path="/admin"
 *     element={
 *       <ProtectedRoute requiredRole="admin">
 *         <AdminPanel />
 *       </ProtectedRoute>
 *     }
 *   />
 *
 * @param {React.ReactNode} children  - Component cần bảo vệ
 * @param {string} [requiredRole]     - Nếu truyền vào, kiểm tra thêm role của user
 */
function ProtectedRoute({ children, requiredRole, allowedRoles }) {
  const { user, isLoading } = useAuth();

  // Đang restore session → hiển thị spinner, chờ xác thực xong
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → về trang login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

<<<<<<< Updated upstream
  // Kiểm tra danh sách allowedRoles nếu được truyền vào
  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/catalog" replace />;
  }

  // Đã đăng nhập nhưng không đủ quyền đơn lẻ → về catalog
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/catalog" replace />;
=======
  const userRole = (user.role || '').toLowerCase();

  const getHomeForRole = (role) => {
    if (role === 'admin') return '/admin';
    if (role === 'manager' || role === 'staff') return '/manager/products';
    return '/catalog';
  };

  // Đã đăng nhập nhưng không đủ quyền → cách ly và chuyển về trang của chính vai trò đó
  if (requiredRole && userRole !== requiredRole.toLowerCase()) {
    return <Navigate to={getHomeForRole(userRole)} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
    if (!normalizedAllowed.includes(userRole)) {
      return <Navigate to={getHomeForRole(userRole)} replace />;
    }
>>>>>>> Stashed changes
  }

  // Hợp lệ → render component con
  return children;
}

export default ProtectedRoute;

