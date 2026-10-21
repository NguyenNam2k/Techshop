import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import SupportBubble from './components/common/SupportBubble';
import ProductDetailPage from './pages/ProductDetailPage';
import HomePage from './pages/HomePage';
import PCBuildPage from './pages/PCBuildPage';
import DashboardPage from './pages/DashboardPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';
import OrdersPage from './pages/OrdersPage';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/products" element={<ProductDetailPage />} />
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
          {/* Also support typing /:id directly at root (e.g., /14 -> /products/<slug>) */}
          <Route path="/:id" element={<ProductDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <SupportBubble />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
