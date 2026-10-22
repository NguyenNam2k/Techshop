<<<<<<< Updated upstream
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
=======
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import SupportBubble from './components/common/SupportBubble';

// Customer pages
import HomePage from './pages/customer/HomePage';
import CatalogPage from './pages/customer/CatalogPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';
import PCBuildPage from './pages/customer/PCBuildPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import SuccessPage from './pages/customer/SuccessPage';
import OrdersPage from './pages/customer/OrdersPage';

// Auth pages
>>>>>>> Stashed changes
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CatalogPage from './pages/customer/CatalogPage';
import ProductDetailPage from './pages/customer/ProductDetailPage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import RoleManagement from './pages/admin/RoleManagement';
import PermissionManagement from './pages/admin/PermissionManagement';

// Manager pages
import ManagerProductsPage from './pages/manager/ManagerProductsPage';

<<<<<<< Updated upstream
function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Storefront & Catalog routes */}
            <Route path="/" element={<CatalogPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/products" element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
=======
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '383514140787-3gl2e75k1791mv20alfm401t9o56i9ks.apps.googleusercontent.com';

function AppContent() {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const userRole = (user?.role || '').toLowerCase();

  // Phân quyền cách ly nghiêm ngặt giữa các Role (Strict Role Isolation):
  // Admin CHỈ VÀO trang admin, Manager CHỈ VÀO trang manager, Customer CHỈ VÀO trang customer
  if (!isLoading && user) {
    // 1. Admin không được phép vào các trang của role khác (manager, customer...)
    if (userRole === 'admin' && !location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin" replace />;
    }

    // 2. Manager / Staff không được phép vào các trang của role khác (admin, customer...)
    if (
      (userRole === 'manager' || userRole === 'staff') &&
      !location.pathname.startsWith('/manager')
    ) {
      return <Navigate to="/manager/products" replace />;
    }

    // 3. Customer không được phép vào trang của Admin hoặc Manager
    if (
      userRole === 'customer' &&
      (location.pathname.startsWith('/admin') || location.pathname.startsWith('/manager'))
    ) {
      return <Navigate to="/catalog" replace />;
    }
  }

  const isStandalone =
    location.pathname.startsWith('/manager') ||
    location.pathname.startsWith('/admin') ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {!isStandalone && <Header />}
      <main className={isStandalone ? 'min-h-screen' : 'flex-grow'}>
        <Routes>
          {/* Public Storefront cho Khách & Customer */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/build-pc" element={<PCBuildPage />} />
          <Route path="/pc-build" element={<Navigate to="/build-pc" replace />} />
          <Route path="/cart" element={<CartPage />} />

          {/* Customer Protected Routes (Chỉ Customer được phép truy cập) */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route path="/success/:orderCode" element={<SuccessPage />} />
          <Route path="/success" element={<Navigate to="/profile/orders" replace />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:tab"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tracking"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
>>>>>>> Stashed changes

          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

<<<<<<< Updated upstream
          {/* Redirect /dashboard cũ về /catalog */}
          <Route path="/dashboard" element={<Navigate to="/catalog" replace />} />

          {/* Manager routes - yêu cầu đăng nhập + role manager hoặc admin */}
=======
          {/* Manager routes (Chỉ Manager & Staff được phép truy cập) */}
>>>>>>> Stashed changes
          <Route path="/manager" element={<Navigate to="/manager/products" replace />} />
          <Route
            path="/manager/products"
            element={
              <ProtectedRoute allowedRoles={['manager', 'staff']}>
                <ManagerProductsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/products" element={<Navigate to="/manager/products" replace />} />

<<<<<<< Updated upstream
          {/* Admin routes - yêu cầu đăng nhập + role admin */}
=======
          {/* Admin routes (Chỉ Admin được phép truy cập) */}
>>>>>>> Stashed changes
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<RoleManagement />} />
            <Route path="permissions" element={<PermissionManagement />} />
          </Route>

          {/* Route 404 - Redirect mặc định */}
          <Route path="*" element={<Navigate to="/catalog" replace />} />
        </Routes>
      </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
