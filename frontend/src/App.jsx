import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'));
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const ManagerPage = lazy(() => import('./pages/ManagerPage.jsx'));
const PCBuilderPage = lazy(() => import('./pages/PCBuilderPage.jsx'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const LegacyProfileRedirect = lazy(() => import('./pages/ProfilePage.jsx').then((module) => ({ default: module.LegacyProfileRedirect })));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard.jsx'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const CatalogView = lazy(() => import('./pages/CatalogPage.jsx'));

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07090E] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors font-sans">
              <Header />

              <main className="flex-grow">
                <Suspense
                  fallback={
                    <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600 dark:border-slate-700 dark:border-t-sky-400" />
                    </div>
                  }
                >
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<CatalogView />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/products" element={<HomePage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/manager" element={<ManagerPage />} />
                    <Route path="/admin" element={<ManagerPage />} />
                    <Route path="/build-pc" element={<PCBuilderPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/*" element={<ProfilePage />} />
                    <Route path="/profiles" element={<LegacyProfileRedirect />} />
                    <Route path="/profiles/*" element={<LegacyProfileRedirect />} />
                    <Route
                      path="*"
                      element={
                        <div className="text-center py-24 space-y-4">
                          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">404 - Không Tìm Thấy Trang</h1>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi.</p>
                          <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow transition"
                          >
                            ← Về Trang Chủ TechShop
                          </Link>
                        </div>
                      }
                    />
                  </Routes>
                </Suspense>
              </main>

              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
