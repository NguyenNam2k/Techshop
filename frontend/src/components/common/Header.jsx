import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Sparkles, Sun, Moon, ShoppingBag, User,
  Cpu, ShieldCheck, Wrench, Truck,
  Plus, Minus, Trash2, ArrowRight, LayoutGrid, ChevronDown,
  UserCircle, Package, LifeBuoy, LayoutDashboard, LogOut
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { useAuth, ROLES, getDashboardRouteForRole } from '../../context/AuthContext';
import { api } from '../../services/api';
import { usePopularSearches } from '../../hooks/usePopularSearches';
import CategoryMenu from './CategoryMenu';
import ImageSearchModal from './ImageSearchModal';
import AuthModal from './AuthModal';

const COMPACT_HEADER_SCROLL_Y = 160;
const EXPANDED_HEADER_SCROLL_Y = 80;

const normalizeSearch = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').trim();

function HighlightMatch({ text = '', query = '' }) {
  if (!query) return text;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escapedQuery})`, 'ig'));

  return parts.map((part, index) =>
    index % 2 === 1
      ? <mark key={index} className="rounded bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">{part}</mark>
      : part
  );
}

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { cartItems, cartCount, cartSubtotal, updateQuantity, removeFromCart } = useCart();
  const { user, login, logout, setIsAuthOpen, isAuthOpen } = useAuth();
  const popularSearches = usePopularSearches(4);

  const [searchInput, setSearchInput] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [suggestProducts, setSuggestProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pastList, setPastList] = useState(false);
  const [isImageSearchModalOpen, setIsImageSearchModalOpen] = useState(false);
  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  const userItems = !user ? [] : user.role === 'customer'
    ? [
        { icon: UserCircle, label: 'Xem hồ sơ', section: null },
        { icon: Package, label: 'Đơn hàng của tôi', section: 'orders' },
        { icon: ShieldCheck, label: 'Bảo hành', section: 'warranty' },
        { icon: LifeBuoy, label: 'Hỗ trợ kỹ thuật', section: 'tickets' }
      ]
    : [{ icon: LayoutDashboard, label: 'Trang làm việc', section: null }];

  const openDashboard = (section) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (user.role === 'customer') {
      if (section) {
        navigate(`/profile/${section}/`);
      } else {
        navigate(`/profile/`);
      }
      return;
    }

    navigate(getDashboardRouteForRole(user.role), {
      state: section ? { section } : undefined
    });
  };

  const query = searchInput.trim();
  const normalizedQuery = normalizeSearch(query);
  const hasTyped = Boolean(query);
  const matchingCategories = useMemo(
    () => hasTyped
      ? categories.filter((category) =>
          normalizeSearch(`${category.name} ${category.slug || category.id}`).includes(normalizedQuery)
        ).slice(0, 4)
      : [],
    [categories, hasTyped, normalizedQuery]
  );
  const matchingBrands = useMemo(() => {
    if (!hasTyped) return [];
    const brands = new Set([
      ...suggestProducts.map((product) => product.brand)
    ].filter(Boolean));
    return [...brands]
      .filter((brand) => normalizeSearch(brand).includes(normalizedQuery))
      .slice(0, 4);
  }, [hasTyped, normalizedQuery, suggestProducts]);

  useEffect(() => {
    let active = true;
    api.getCategories()
      .then((data) => {
        if (active) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((error) => console.warn('Unable to load search categories:', error.message));
    return () => {
      active = false;
    };
  }, []);
  const matchingProducts = hasTyped ? suggestProducts.slice(0, 5) : [];
  const flat = useMemo(() => hasTyped
    ? [
        ...matchingCategories.map((category) => ({ type: 'category', category })),
        ...matchingBrands.map((brand) => ({ type: 'brand', brand })),
        ...matchingProducts.map((product) => ({ type: 'product', product }))
      ]
    : popularSearches.map((keyword) => ({ type: 'popular', keyword })),
  [hasTyped, matchingCategories, matchingBrands, matchingProducts, popularSearches]);

  useEffect(() => {
    if (!hasTyped) {
      setSuggestProducts([]);
      setActiveIdx(-1);
      return undefined;
    }

    setSuggestProducts([]);
    let isCurrent = true;
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.getProducts({ search: query, limit: 5 });
        if (isCurrent) setSuggestProducts(Array.isArray(response.data) ? response.data : []);
      } catch {
        if (isCurrent) setSuggestProducts([]);
      }
    }, 180);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [hasTyped, query]);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) setSuggestOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [userMenuOpen]);

  // Use hysteresis so collapsing the header cannot immediately toggle it back open
  // when the browser adjusts scroll position after the header height changes.
  useEffect(() => {
    let frameId = null;

    const onScroll = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const scrollY = window.scrollY;

        setScrolled((wasScrolled) =>
          wasScrolled
            ? scrollY > EXPANDED_HEADER_SCROLL_Y
            : scrollY > COMPACT_HEADER_SCROLL_Y
        );

        const flyer = document.getElementById('top-category-flyer');
        if (flyer) {
          const rect = flyer.getBoundingClientRect();
          // The category flyer has completely disappeared when its bottom is at or above the sticky header
          setPastList(rect.bottom <= 72);
        } else {
          setPastList(scrollY > 480);
        }
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  // When on homepage, pop the category button when user scrolled past the hero/category sidebar
  // When on other pages (/cart, /checkout, /manager), it can also be visible
  const isHome = location.pathname === '/';
  const showCategoryBtn = !isHome || pastList;

  useEffect(() => {
    if (!showCategoryBtn) setMenuOpen(false);
  }, [showCategoryBtn]);

  const goSearch = (value = searchInput) => {
    const nextQuery = value.trim();
    if (!nextQuery) return;
    void api.trackSearchQuery(nextQuery).catch(() => {});
    setSearchInput(nextQuery);
    setSuggestOpen(false);
    setActiveIdx(-1);
    navigate(`/search?search=${encodeURIComponent(nextQuery)}`);
  };

  const pickSuggestion = (item) => {
    setSuggestOpen(false);
    setActiveIdx(-1);

    if (item.type === 'popular') {
      goSearch(item.keyword);
    } else if (item.type === 'category') {
      navigate(`/?category=${encodeURIComponent(item.category.slug || item.category.id)}`);
    } else if (item.type === 'brand') {
      navigate(`/?brand=${encodeURIComponent(item.brand)}`);
    } else if (item.type === 'product') {
      navigate(`/products/${item.product.slug || item.product.id}`);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (activeIdx >= 0 && flat[activeIdx]) {
      pickSuggestion(flat[activeIdx]);
      return;
    }
    goSearch();
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' && flat.length > 0) {
      event.preventDefault();
      setSuggestOpen(true);
      setActiveIdx((current) => (current + 1) % flat.length);
    } else if (event.key === 'ArrowUp' && flat.length > 0) {
      event.preventDefault();
      setSuggestOpen(true);
      setActiveIdx((current) => (current <= 0 ? flat.length - 1 : current - 1));
    } else if (event.key === 'Escape') {
      setSuggestOpen(false);
      setActiveIdx(-1);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md shadow-lg shadow-slate-900/10'
            : 'bg-white dark:bg-[#0B0F17] shadow-sm'
        }`}
      >
        {/* Top Ticker Bar — thu gọn khi cuộn sâu */}
        <div className={`bg-slate-900 text-slate-200 text-xs px-4 overflow-hidden transition-all duration-300 ${scrolled ? 'max-h-0 py-0 opacity-0' : 'max-h-10 py-1.5 opacity-100'}`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5 text-sky-400 font-semibold">
                <Truck className="w-3.5 h-3.5" /> Hỏa tốc 2H trong phạm vi gần showroom
              </span>
              <span className="hidden md:inline text-slate-600">|</span>
              <span className="hidden md:inline text-slate-300">
                Tổng đài mua hàng: <strong className="text-white">1900 8888</strong> (8:00 - 21:30)
              </span>
            </div>
            {user && (
              <div className="flex items-center space-x-4 text-xs font-medium">
                <button 
                  onClick={() => navigate(getDashboardRouteForRole(user.role))}
                  className="hover:text-emerald-300 text-emerald-400 font-semibold flex items-center gap-1 cursor-pointer transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {user.role === 'customer'
                      ? 'Dashboard Khách Hàng'
                      : user.role === 'staff'
                      ? 'Dashboard Nhân Viên'
                      : user.role === 'manager'
                      ? 'Dashboard Quản Lý Kho'
                      : 'Dashboard Quản Trị'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Header */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${scrolled ? 'py-2.5' : 'py-3.5'}`}>
          <div className="flex items-center justify-between gap-3">
            
            {/* Nút Danh mục + flyout (Chỉ pop lên khi cuộn qua phần danh mục hoặc ở trang khác) */}
            <div
              className={`relative hidden lg:grid transition-[grid-template-columns,opacity,margin] duration-300 ease-out ${
                showCategoryBtn ? 'grid-cols-[1fr] opacity-100 mr-1' : 'grid-cols-[0fr] opacity-0 pointer-events-none -mr-4'
              }`}
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="min-w-0 overflow-hidden">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  aria-expanded={menuOpen}
                  className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    menuOpen
                      ? 'bg-sky-600 border-sky-600 text-white'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-sky-500'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Danh mục</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {menuOpen && (
                <div className="absolute left-0 top-full pt-2 z-50 w-[16.5rem]">
                  <CategoryMenu heightClass="h-[420px]" title={false} onSelectCategory={() => setMenuOpen(false)} />
                </div>
              )}
            </div>

            {/* Brand Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Cpu className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
                    TECH<span className="text-sky-600 dark:text-sky-400">SHOP</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                    STORE
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">PC Gaming & Gear Chính Hãng</p>
              </div>
            </div>

            {/* Clean E-Commerce Retail Search Bar */}
            <div ref={searchRef} className="relative flex-1 max-w-2xl mx-2 hidden md:block">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <div className="relative w-full flex items-center">
                  <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => {
                      setSearchInput(event.target.value);
                      setSuggestOpen(true);
                      setActiveIdx(-1);
                    }}
                    onFocus={() => setSuggestOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder="Tìm kiếm linh kiện, VGA, bàn phím cơ, chuột..."
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={suggestOpen && (hasTyped || flat.length > 0)}
                    aria-controls="header-search-suggestions"
                    className="w-full pl-10 pr-32 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm transition"
                  />
                  
                  {/* AI Search Sparkles Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSuggestOpen(false);
                      setIsImageSearchModalOpen(true);
                    }}
                    title="Tìm kiếm bằng AI (hình ảnh hoặc từ khóa)"
                    aria-label="Tìm kiếm bằng AI"
                    className="absolute right-24 p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer flex items-center justify-center"
                  >
                    <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </button>

                  {/* Search Action Button */}
                  <button
                    type="submit"
                    className="absolute right-1 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition shadow cursor-pointer"
                  >
                    Tìm Kiếm
                  </button>
                </div>
              </form>
              {suggestOpen && (hasTyped || flat.length > 0) && (
                <div
                  id="header-search-suggestions"
                  role="listbox"
                  className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
                >
                  {!hasTyped && (
                    <>
                      <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Tìm kiếm phổ biến
                      </div>
                      {flat.map((item, index) => (
                        <button
                          key={item.keyword}
                          type="button"
                          role="option"
                          aria-selected={activeIdx === index}
                          onMouseEnter={() => setActiveIdx(index)}
                          onClick={() => pickSuggestion(item)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition cursor-pointer ${
                            activeIdx === index
                              ? 'bg-sky-50 dark:bg-sky-500/10'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          <Search className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-700 dark:text-slate-200">{item.keyword}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {hasTyped && flat.length === 0 && (
                    <div className="px-4 py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                      Chưa có gợi ý khớp với “{query}”. Nhấn Enter để xem kết quả gần đúng.
                    </div>
                  )}

                  {hasTyped && (matchingCategories.length > 0 || matchingBrands.length > 0) && (
                    <div className="py-1">
                      <div className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Danh mục &amp; hãng
                      </div>
                      {matchingCategories.map((category) => {
                        const index = flat.findIndex((item) => item.type === 'category' && item.category.id === category.id);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            role="option"
                            aria-selected={activeIdx === index}
                            onMouseEnter={() => setActiveIdx(index)}
                            onClick={() => pickSuggestion({ type: 'category', category })}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition cursor-pointer ${
                              activeIdx === index ? 'bg-sky-50 dark:bg-sky-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <LayoutGrid className="w-4 h-4 text-sky-500" />
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                              <HighlightMatch text={category.name} query={query} />
                            </span>
                            <span className="text-[11px] text-slate-400">Danh mục</span>
                          </button>
                        );
                      })}
                      {matchingBrands.map((brand) => {
                        const index = flat.findIndex((item) => item.type === 'brand' && item.brand === brand);
                        return (
                          <button
                            key={brand}
                            type="button"
                            role="option"
                            aria-selected={activeIdx === index}
                            onMouseEnter={() => setActiveIdx(index)}
                            onClick={() => pickSuggestion({ type: 'brand', brand })}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition cursor-pointer ${
                              activeIdx === index ? 'bg-sky-50 dark:bg-sky-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                              <HighlightMatch text={brand} query={query} />
                            </span>
                            <span className="text-[11px] text-slate-400">Thương hiệu</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {hasTyped && matchingProducts.length > 0 && (
                    <div className="py-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Sản phẩm
                      </div>
                      {matchingProducts.map((product) => {
                        const index = flat.findIndex((item) => item.type === 'product' && item.product.id === product.id);
                        const image = product.images?.[0]?.image_url || product.images?.[0] || product.thumbnail_url;
                        const price = Number(product.price ?? product.base_price ?? 0);
                        return (
                          <button
                            key={product.id}
                            type="button"
                            role="option"
                            aria-selected={activeIdx === index}
                            onMouseEnter={() => setActiveIdx(index)}
                            onClick={() => pickSuggestion({ type: 'product', product })}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition cursor-pointer ${
                              activeIdx === index ? 'bg-sky-50 dark:bg-sky-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                            }`}
                          >
                            <img
                              src={image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=100'}
                              alt=""
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-slate-900 p-0.5 shrink-0"
                            />
                            <span className="flex-1 min-w-0 text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                              <HighlightMatch text={product.name} query={query} />
                            </span>
                            <span className="text-xs font-extrabold font-mono text-sky-600 dark:text-sky-400 shrink-0">
                              {price.toLocaleString('vi-VN')}₫
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {hasTyped && (
                    <button
                      type="button"
                      onClick={() => goSearch()}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-500/10 cursor-pointer transition"
                    >
                      <span className="truncate">Xem tất cả kết quả cho “{query}”</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Action Triggers */}
            <div className="flex items-center space-x-2.5 shrink-0">
              
              {/* Theme Toggle Icon Button */}
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

              {/* PC Builder Button */}
              <button
                onClick={() => navigate('/build-pc')}
                className="px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer border bg-indigo-50 dark:bg-indigo-950/60 border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
              >
                <Wrench className="w-4 h-4" />
                <span className="hidden sm:inline">Xây Dựng Cấu Hình</span>
              </button>

              {/* Shopping Cart — hover mini-cart popover + click navigates to /cart */}
              <div className="relative group">
                <button
                  onClick={() => navigate('/cart')}
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

                {/* Popover: appears on hover */}
                <div className="absolute right-0 top-full pt-3 w-80 z-50 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition duration-150">
                  <div className="rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Giỏ hàng ({cartCount})</h4>
                      <span className="text-[10px] text-slate-400">Xem nhanh</span>
                    </div>

                    {cartItems.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-8">Giỏ hàng của bạn đang trống.</p>
                    ) : (
                      <div className="max-h-72 overflow-y-auto p-3 space-y-2">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <img
                              src={item.variant?.image_url || item.product?.thumbnail_url || item.product?.images?.[0]}
                              alt=""
                              className="w-12 h-12 object-contain rounded-lg bg-white dark:bg-[#07090E] p-1 shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h5 className="text-[11px] font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{item.product?.name}</h5>
                              <p className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                                {Number(item.price).toLocaleString('vi-VN')}₫
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#07090E] text-slate-700 dark:text-slate-200">
                                  <button onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)} className="px-1.5 py-0.5 hover:text-sky-500 cursor-pointer"><Minus className="w-3 h-3" /></button>
                                  <span className="px-2 text-[11px] font-bold">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)} className="px-1.5 py-0.5 hover:text-sky-500 cursor-pointer"><Plus className="w-3 h-3" /></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-500 dark:text-slate-400">Tạm tính:</span>
                        <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">{cartSubtotal.toLocaleString('vi-VN')}₫</span>
                      </div>
                      <button
                        onClick={() => navigate('/cart')}
                        className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Xem Giỏ Hàng & Thanh Toán</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* User Profile & Auth Trigger */}
              <div
                ref={userMenuRef}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => user ? setUserMenuOpen((open) => !open) : setIsAuthOpen(true)}
                  aria-haspopup={user ? 'menu' : undefined}
                  aria-expanded={user ? userMenuOpen : undefined}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border bg-slate-50 dark:bg-slate-900 hover:border-sky-500 transition cursor-pointer ${userMenuOpen ? 'border-sky-500' : 'border-slate-200 dark:border-slate-800'}`}
                >
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                    alt={user ? user.name || 'User' : 'User'}
                    onError={(event) => { event.currentTarget.style.display = 'none'; }}
                    className="w-7 h-7 rounded-lg object-cover"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user ? user.name?.split(' ')[0] || 'Tài khoản' : 'Đăng Nhập'}
                  </span>
                  {user && (
                    <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition ${userMenuOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
                {user && userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 w-64 pt-2">
                    <div role="menu" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0F172A]">
                      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="h-11 w-11 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 font-bold text-white">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-slate-900 dark:text-white">{user.name || 'Tài khoản'}</div>
                          <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
                          <span className="mt-1 inline-block rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                            {ROLES[user.role]?.label || user.role}
                          </span>
                        </div>
                      </div>
                      <div className="py-1.5">
                        {userItems.map(({ icon: Icon, label, section }) => (
                          <button
                            key={label}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setUserMenuOpen(false);
                              openDashboard(section);
                            }}
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700 dark:text-slate-200 dark:hover:bg-sky-500/10 dark:hover:text-sky-300"
                          >
                            <Icon className="h-4 w-4 text-slate-400" />
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-100 py-1.5 dark:border-slate-800">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Multimodal AI Image Search Modal */}
      <ImageSearchModal
        isOpen={isImageSearchModalOpen}
        onClose={() => setIsImageSearchModalOpen(false)}
      />

      {/* Auth Modal (Login / Profile / Logout) */}
      <AuthModal />
    </>
  );
}
