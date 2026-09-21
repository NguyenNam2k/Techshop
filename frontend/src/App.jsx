import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/common/Header.jsx';
import Footer from './components/common/Footer.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
              <Header />

              <main className="flex-grow">
                <Routes>
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/products" element={<ProductDetailPage />} />
                  <Route path="/" element={
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                        Chào Mừng Đến Với TECHSHOP 
                      </h1>
                      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-xl mx-auto text-sm">
                        Hệ sinh thái phân phối linh kiện máy tính cao cấp, card đồ họa RTX 50 Series, bo mạch chủ và gaming gear chính hãng hàng đầu Việt Nam.
                      </p>
                      <Link
                        to="/products"
                        className="inline-flex items-center px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                      >
                        Khám Phá Sản Phẩm Nổi Bật →
                      </Link>
                    </div>
                  } />
                  <Route
                    path="*"
                    element={
                      <div className="text-center py-24">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">404 - Không Tìm Thấy Trang</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi.</p>
                        <Link
                          to="/products"
                          className="inline-block mt-4 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          Quay lại trang sản phẩm →
                        </Link>
                      </div>
                    }
                  />
                </Routes>
              </main>

              <Footer />
            </div>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;