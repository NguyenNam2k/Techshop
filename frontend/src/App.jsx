import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import Footer from './components/common/Footer.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between">

        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-black tracking-tight text-white flex items-center gap-1.5 group">
              <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">TECH</span>GEAR
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 ml-1">
                Store
              </span>
            </Link>

            <nav className="flex items-center gap-6 text-sm text-slate-300">
              <Link to="/products" className="hover:text-cyan-400 transition-colors">
                Linh kiện & Gears
              </Link>
              <a
                href="tel:19008888"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/60 px-3 py-1 rounded-full transition-all"
              >
                Hotline: 1900 8888
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/products" element={<ProductDetailPage />} />
            <Route path="/" element={
              <div className="text-center py-20">
                <h1 className="text-3xl font-bold mb-4">Welcome to TechGear</h1>
                <p className="text-slate-400">
                  Navigate to /products/:id or /products/:slug to view product details
                </p>
              </div>
            } />
            <Route
              path="*"
              element={
                <div className="text-center py-24">
                  <h1 className="text-2xl font-bold text-white">404 - Không Tìm Thấy Trang</h1>
                  <p className="text-slate-400 mt-2 text-sm">Đường dẫn bạn truy cập không tồn tại hoặc đã thay đổi.</p>
                  <Link
                    to="/products"
                    className="inline-block mt-4 text-xs font-semibold text-cyan-400 hover:underline"
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
  );
}

export default App;