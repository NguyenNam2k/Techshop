import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Camera, Sun, Moon, ShoppingBag, User, 
  Cpu, Layers, ShieldCheck, Flame, Wrench, PackageCheck, PhoneCall, Truck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onOpenImageSearchModal }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { cartCount, setIsCartOpen } = useCart();
  const { activeTab, setActiveTab, setIsAuthOpen, user, searchQuery, setSearchQuery } = useAuth();
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchQuery(searchInput.trim());
      setActiveTab('linh-kien');
      navigate(`/products?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleNavClick = (tab, path) => {
    setActiveTab(tab);
    if (path) {
      navigate(path);
    }
  };

  const handleCameraClick = () => {
    if (onOpenImageSearchModal) {
      onOpenImageSearchModal();
    } else {
      alert('Tính năng Tìm Kiếm Bằng Hình Ảnh AI (Multimodal Search): Hãy tải ảnh linh kiện hoặc góc máy để tìm sản phẩm tương thích!');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#0B0F17] border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">

      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
              <Truck className="w-3.5 h-3.5" /> Giao hàng hỏa tốc 2H toàn quốc
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-300">Tổng đài mua hàng: <strong className="text-white">1900 8888</strong> (8:00 - 21:30)</span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <button 
              onClick={() => handleNavClick('tracking', '/tracking')}
              className="hover:text-sky-300 text-slate-300 flex items-center gap-1 cursor-pointer transition"
            >
              <PackageCheck className="w-3.5 h-3.5 text-sky-400" /> Tra Cứu Đơn Hàng
            </button>
            <span className="text-slate-700">|</span>
            <button 
              onClick={() => handleNavClick('admin', '/admin')}
              className="hover:text-emerald-300 text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Quản Trị Store
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('home', '/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                  TECH<span className="text-sky-600 dark:text-sky-400">SHOP</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-sky-100 text-sky-700 border border-sky-200">
                  STORE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold">PC Gaming & Gear Chính Hãng</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl mx-2 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="relative w-full flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm kiếm linh kiện, VGA, bàn phím cơ, chuột..."
                  className="w-full pl-10 pr-32 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm transition"
                />

                <button
                  type="button"
                  onClick={handleCameraClick}
                  title="Tìm kiếm bằng hình ảnh (Shopee / Lens Search)"
                  className="absolute right-24 p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 text-sky-600" />
                </button>

                <button
                  type="submit"
                  className="absolute right-1 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer"
                >
                  Tìm Kiếm
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center space-x-3">
            
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Đang ở Chế độ Tối (Dark Mode)' : 'Đang ở Chế độ Sáng (Light Mode)'}
            >
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-sky-400 fill-sky-400/20" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              )}
            </button>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <div className="hidden lg:block text-left text-xs leading-tight">
                <span className="text-[10px] text-slate-400 block font-medium">Giỏ hàng</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{cartCount} sản phẩm</span>
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-sky-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-sky-500 transition cursor-pointer"
            >
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt="User"
                className="w-7 h-7 rounded-lg object-cover"
              />
              <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                {user ? user.name.split(' ')[0] : 'Đăng Nhập'}
              </span>
            </button>
          </div>
        </div>

        <nav className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 overflow-x-auto no-scrollbar">
          <div className="flex items-center space-x-1 sm:space-x-3 whitespace-nowrap">
            
            <button
              onClick={() => handleNavClick('home', '/')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              Trang Chủ
            </button>

            <button
              onClick={() => handleNavClick('linh-kien', '/products')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'linh-kien'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              Linh Kiện PC
            </button>

            <button
              onClick={() => handleNavClick('gaming-gear', '/products?category=gaming-gear')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'gaming-gear'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              Gaming Gear
            </button>

            <button
              onClick={() => handleNavClick('laptop-man-hinh', '/products?category=laptops')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'laptop-man-hinh'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              Laptop & Màn Hình
            </button>

            <button
              onClick={() => handleNavClick('build-pc', '/build-pc')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'build-pc'
                  ? 'bg-indigo-600 text-white shadow-sm font-bold'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Xây Dựng Cấu Hình</span>
            </button>

            <button
              onClick={() => handleNavClick('promos', '/promos')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer ${
                activeTab === 'promos'
                  ? 'bg-rose-600 text-white shadow-sm font-bold'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 hover:bg-rose-100 font-bold'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Khuyến Mãi Hot 🔥</span>
            </button>

            <button
              onClick={() => handleNavClick('tracking', '/tracking')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-sky-600 text-white shadow-sm font-bold'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              Tra Cứu Đơn Hàng
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
