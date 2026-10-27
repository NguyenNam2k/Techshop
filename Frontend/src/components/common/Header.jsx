import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  User,
  Package,
  CreditCard,
  ShieldCheck,
  LogOut,
  LogIn,
  ChevronDown,
  Heart,
  TicketPercent,
  Coins,
  Cpu,
  Search,
  Sparkles,
  X,
  Loader2,
  Sun,
  Moon,
  Wrench
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import ReverseImageSearchDropdown from './ReverseImageSearchDropdown';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const DEFAULT_SLUG = 'asus-rog-zephyrus-g16-2024-oled-intel-core-ultra-9-rtx-4080-17';
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems = [], cartCount = 0, subtotal = 0, removeItem } = useCart();
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isImageSearchOpen, setIsImageSearchOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  const activeUser = user || {
    name: 'Đặng Minh Thuận',
    email: 'thuan.dang@techshop.vn',
    role: 'Thành viên VIP Diamond',
    avatar: DEFAULT_AVATAR
  };

  // Global Ctrl+K / Cmd+K shortcut to focus search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsImageSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setIsImageSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live product search
  useEffect(() => {
    const q = searchText.trim();
    setActiveIndex(-1);
    if (!q) {
      setSearchResults([]);
      setSearchLoading(false);
      return undefined;
    }

    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.getProducts({ search: q, limit: 6 });
        if (!cancelled) {
          setSearchResults(res.data || res.products || []);
        }
      } catch {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchText]);

  const handleSelectProduct = (product) => {
    if (!product) return;
    setIsSearchOpen(false);
    setSearchText('');
    navigate(`/products/${product.slug || product.id}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && searchResults[activeIndex]) {
      handleSelectProduct(searchResults[activeIndex]);
      return;
    }

    const q = searchText.trim();
    if (!q) return;

    setIsSearchOpen(false);
    navigate(`/catalog?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKeyDown = (e) => {
    if (!isSearchOpen || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLoggedOut = !user;

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white text-[10px] sm:text-xs py-1.5 px-3 text-center font-medium truncate">
        ⚡ Siêu sale phụ kiện công nghệ - Giảm tới 30% cho khách hàng mới | Giao hỏa tốc 2H
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-16 py-2 sm:py-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            💻
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
              Tech<span className="text-sky-400">shop</span>
            </h1>
            <p className="text-[10px] text-slate-400 leading-none">Gaming &amp; Gear Store</p>
          </div>
        </Link>

        {/* Redesigned Smart Search Bar */}
        <div ref={searchContainerRef} className="order-3 sm:order-none basis-full sm:basis-auto flex-1 max-w-2xl mx-0 sm:mx-2 relative">
          <form onSubmit={handleSearch} className="relative group/search">
            <div className="relative flex items-center rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus-within:border-sky-500 focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all shadow-inner">
              <Search className="w-4 h-4 text-slate-400 group-focus-within/search:text-sky-400 ml-3.5 shrink-0 transition-colors pointer-events-none" />

              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onFocus={() => {
                  if (searchText.trim()) setIsSearchOpen(true);
                }}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setIsSearchOpen(Boolean(e.target.value.trim()));
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm kiếm linh kiện, laptop, gaming gear..."
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 text-xs sm:text-sm pl-3 pr-20 py-2.5 outline-none font-medium"
              />

              <div className="absolute right-1.5 flex items-center gap-1">
                {searchLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin mr-1" />
                )}

                {searchText && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText('');
                      setIsSearchOpen(false);
                      searchInputRef.current?.focus();
                    }}
                    title="Xóa từ khóa"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Nút Tìm kiếm bằng hình ảnh (Reverse Image Search AI ✨) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsImageSearchOpen((prev) => !prev);
                    setIsSearchOpen(false);
                  }}
                  title="Tìm kiếm bằng hình ảnh (AI Visual Search) ✨"
                  className={`p-1.5 rounded-lg active:scale-95 transition cursor-pointer flex items-center justify-center ${
                    isImageSearchOpen
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/15'
                  }`}
                >
                  <Sparkles className="w-4 h-4 transition-transform hover:scale-110" />
                </button>

                {/* Nút Tìm kiếm 🔍 */}
                <button
                  type="submit"
                  title="Tìm kiếm ngay (🔍)"
                  onClick={(e) => {
                    e.preventDefault();
                    const q = searchText.trim();
                    if (!q) return;
                    setIsSearchOpen(false);
                    setActiveIndex(-1);
                    navigate(`/catalog?q=${encodeURIComponent(q)}`);
                  }}
                  className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 hover:border-sky-400 active:scale-95 transition cursor-pointer flex items-center justify-center shadow-sm"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Instant Search Dropdown - ONLY appears when user is actively searching */}
          {isSearchOpen && Boolean(searchText.trim()) && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50">
              {searchLoading && searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span>Đang tìm sản phẩm phù hợp...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center space-y-1">
                  <p className="text-xs font-semibold text-slate-300">
                    Không tìm thấy sản phẩm cho &ldquo;{searchText}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Thử tìm theo tên hãng (ASUS, Logitech, MSI) hoặc mã linh kiện (RTX 4090, Z790).
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  <div className="px-3.5 py-2 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-slate-300">
                      Gợi ý sản phẩm ({searchResults.length})
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">↑↓ Chọn · Enter Mở</span>
                  </div>
                  <div
                    className="max-h-80 overflow-y-auto p-1.5 space-y-1"
                    onMouseLeave={() => setActiveIndex(-1)}
                  >
                    {searchResults.map((item, idx) => {
                      const isHighlighted = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => handleSelectProduct(item)}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition cursor-pointer ${
                            isHighlighted
                              ? 'bg-sky-500/15 border border-sky-500/30 text-white'
                              : 'hover:bg-slate-800/80 border border-transparent text-slate-200'
                          }`}
                        >
                          <img
                            src={
                              item.thumbnail_url ||
                              'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200'
                            }
                            alt={item.name}
                            className="w-11 h-11 rounded-lg object-contain bg-slate-950 border border-slate-800 p-1 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-100 truncate">
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              {item.brand && (
                                <span className="font-semibold text-sky-400">{item.brand}</span>
                              )}
                              {item.category_name && (
                                <>
                                  <span>·</span>
                                  <span className="truncate">{item.category_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-extrabold font-mono text-sky-400 block">
                              {formatVND(item.min_price || item.base_price || item.price)}
                            </span>
                            <span className="text-[10px] text-slate-500">Xem chi tiết →</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reverse Image Search Dropdown (Dính liền ngay bên dưới thanh search bar) */}
          {isImageSearchOpen && (
            <ReverseImageSearchDropdown onClose={() => setIsImageSearchOpen(false)} />
          )}
        </div>

        {/* Right Navigation Actions: Build PC, Theme, Giỏ hàng, Profile Avatar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Nút Xây Dựng PC */}
          <Link
            to="/build-pc"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-sky-400 text-xs font-bold transition shadow-sm"
          >
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
            <span>Build PC</span>
          </Link>

          {/* Nút chuyển giao diện Sáng / Tối */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Chuyển sang giao diện tối' : 'Chuyển sang giao diện sáng'}
            aria-label="Chuyển đổi giao diện sáng / tối"
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-slate-100 transition cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          {/* Cart Button + Hover Mini-Cart */}
          <div className="relative group">
            <Link
              to="/cart"
              className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition shadow-sm ${
                location.pathname === '/cart'
                  ? 'bg-sky-500/15 border-sky-500/50 text-sky-400'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200 hover:text-slate-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Giỏ hàng</span>
              {cartCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-sky-500 text-white rounded-full min-w-[18px] text-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Dropdown Mini-Cart */}
            <div className="absolute right-0 top-full pt-2 w-80 sm:w-96 hidden group-hover:block z-50">
              <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-sky-400" /> Giỏ hàng ({cartCount})
                  </span>
                </div>

                {cartItems.length === 0 ? (
                  <div className="p-6 text-center">
                    <ShoppingCart className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Giỏ hàng của bạn đang trống</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 p-2">
                      {cartItems.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition"
                        >
                          <img
                            src={
                              item.image ||
                              'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200'
                            }
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${item.slug || item.productId || item.id}`}
                              className="text-xs font-bold text-slate-200 hover:text-sky-400 truncate block"
                            >
                              {item.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 truncate">{item.variant}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-bold text-sky-400">
                                {formatVND(item.price)}
                              </span>
                              <span className="text-[11px] text-slate-400">x{item.quantity}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg transition cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Tạm tính:</span>
                        <span className="text-sm font-extrabold text-sky-400">
                          {formatVND(subtotal)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link
                          to="/cart"
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs text-center border border-slate-700 transition"
                        >
                          Xem Giỏ Hàng
                        </Link>
                        <Link
                          to="/checkout"
                          className="py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs text-center flex items-center justify-center gap-1 shadow-md shadow-sky-500/20 transition"
                        >
                          Thanh Toán <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Profile Avatar / Auth Buttons */}
          {user ? (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/60 transition cursor-pointer shadow-sm"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-xs border border-sky-400/30">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
                </div>
                <span className="text-xs font-bold text-slate-200 hidden md:inline max-w-[100px] truncate">
                  {user.name || user.email}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 transition-transform group-hover:rotate-180" />
              </button>

              {/* Dropdown Menu on Hover */}
              <div className="absolute right-0 top-full pt-2 w-64 hidden group-hover:block z-50">
                <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                  {/* User Info Header */}
                  <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow-md">
                      {(user.name || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {user.name || 'Người dùng'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.email || ''}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30 capitalize">
                        {user.role || 'Khách hàng'}
                      </span>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="p-2 space-y-1 text-xs max-h-80 overflow-y-auto no-scrollbar">

                    {String(user.role || '').toLowerCase() === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-300 hover:text-amber-200 hover:bg-amber-500/15 transition font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>Quản trị hệ thống (Admin)</span>
                      </Link>
                    )}

                    {['admin', 'manager'].includes(String(user.role || '').toLowerCase()) && (
                      <Link
                        to="/manager/products"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-indigo-300 hover:text-indigo-200 hover:bg-indigo-500/15 transition font-semibold"
                      >
                        <Package className="w-4 h-4 text-indigo-400" />
                        <span>Quản lý sản phẩm (Manager)</span>
                      </Link>
                    )}

                    <Link
                      to="/profile/orders"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-indigo-400" />
                        <span>Đơn hàng của tôi</span>
                      </span>
                    </Link>

                    <Link
                      to="/profile/account"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      <User className="w-4 h-4 text-sky-400" />
                      <span>Hồ sơ &amp; Bảo mật</span>
                    </Link>
                  </div>

                  {/* Footer Action: Logout */}
                  <div className="p-2 bg-slate-950/60 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-sky-400" />
                <span>Đăng nhập</span>
              </Link>
              <Link
                to="/register"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-md shadow-sky-500/20 transition"
              >
                <span>Đăng ký</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Sub-Bar (Thanh điều hướng nhanh đến Catalog, Home, Dashboard...) */}
      <nav className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-bold">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              location.pathname === '/' || location.pathname === '/home'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🏠</span>
            <span>Trang Chủ</span>
          </Link>

          <Link
            to="/catalog"
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              location.pathname === '/catalog' || location.pathname === '/products'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🛍️</span>
            <span>Tất Cả Sản Phẩm (Catalog)</span>
          </Link>

          <Link
            to="/build-pc"
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
              location.pathname === '/build-pc'
                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
            <span>Xây Dựng Cấu Hình PC</span>
          </Link>

          {['admin', 'manager'].includes(String(user?.role || '').toLowerCase()) && (
            <Link
              to="/manager/products"
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                location.pathname.startsWith('/manager')
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
              }`}
            >
              <span>📦</span>
              <span>Quản Lý Cửa Hàng (Manager)</span>
            </Link>
          )}

          {String(user?.role || '').toLowerCase() === 'admin' && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                location.pathname.startsWith('/admin')
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <span>👑</span>
              <span>Quản Trị Admin</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
