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
function ProtectedRoute({ children, requiredRole }) {
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

  // Đã đăng nhập nhưng không đủ quyền → về dashboard
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Hợp lệ → render component con
  return children;
}

export default ProtectedRoute;

