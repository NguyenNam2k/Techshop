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

// Dashboard page
import DashboardPage from './pages/dashboard/DashboardPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';

// Manager pages
import ManagerProductsPage from './pages/manager/ManagerProductsPage';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '383514140787-3gl2e75k1791mv20alfm401t9o56i9ks.apps.googleusercontent.com';

function AppContent() {
  const location = useLocation();
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
          {/* Public Storefront */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/build-pc" element={<PCBuildPage />} />
          <Route path="/pc-build" element={<Navigate to="/build-pc" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success/:orderCode" element={<SuccessPage />} />
          <Route path="/success" element={<Navigate to="/profile/orders" replace />} />
          <Route path="/profile" element={<OrdersPage />} />
          <Route path="/profile/:tab" element={<OrdersPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/my-orders" element={<OrdersPage />} />
          <Route path="/tracking" element={<OrdersPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Manager routes */}
          <Route path="/manager" element={<Navigate to="/manager/products" replace />} />
          <Route
            path="/manager/products"
            element={
              <ProtectedRoute allowedRoles={['manager', 'admin']}>
                <ManagerProductsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
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
          </Route>

          {/* Fallback for slug id or not found */}
          <Route path="/:id" element={<ProductDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isStandalone && <Footer />}
      {!isStandalone && <SupportBubble />}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <AppContent />
            </Router>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
