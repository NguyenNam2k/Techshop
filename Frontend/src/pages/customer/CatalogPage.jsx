import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Home, ChevronRight, Filter, X } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import FilterSidebar from '../../components/catalog/FilterSidebar';
import ProductGrid from '../../components/catalog/ProductGrid';
import Pagination from '../../components/admin/Pagination';
import { getCategoryDisplayName, getCategoryInfo } from '../../constants/categories';

function formatPricePill(min, max) {
  const f = (n) => new Intl.NumberFormat('vi-VN').format(n) + '₫';
  if (min && max) return `${f(min)} - ${f(max)}`;
  if (min) return `Từ ${f(min)}`;
  if (max) return `Dưới ${f(max)}`;
  return '';
}

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const currentCategory = searchParams.get('category') || '';
  const currentBrands = searchParams.get('brands') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentSearch = searchParams.get('q') || searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page'), 10) || 1;
  const currentLimit = parseInt(searchParams.get('limit'), 10) || 12;

  // State
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [metadata, setMetadata] = useState({ categories: [], brands: [], priceRange: { min: 0, max: 100000000 } });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // 1. Tải Metadata cho Bộ Lọc (Categories, Brands, Price Range)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await axiosInstance.get('/catalog/filters-meta', {
          params: { category: currentCategory || undefined }
        });
        if (res.data.success) {
          setMetadata(res.data.metadata);
        }
      } catch (err) {
        console.error('Lỗi khi tải filter metadata:', err);
      }
    };
    fetchMetadata();
  }, [currentCategory]);

  // 2. Tải Danh Sách Sản Phẩm khi Query Params thay đổi
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/catalog', {
        params: {
          page: currentPage,
          limit: currentLimit,
          category: currentCategory || undefined,
          brands: currentBrands || undefined,
          minPrice: currentMinPrice || undefined,
          maxPrice: currentMaxPrice || undefined,
          inStock: currentInStock || undefined,
          sort: currentSort,
          search: currentSearch || undefined
        }
      });

      if (res.data.success) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh mục sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    currentLimit,
    currentCategory,
    currentBrands,
    currentMinPrice,
    currentMaxPrice,
    currentInStock,
    currentSort,
    currentSearch
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Cập nhật URL Query Params (hỗ trợ 1 key hoặc batch nhiều key cùng lúc)
  const updateQueryParam = (keyOrUpdates, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (typeof keyOrUpdates === 'object' && keyOrUpdates !== null) {
      Object.entries(keyOrUpdates).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          newParams.set(k, v);
        } else {
          newParams.delete(k);
        }
      });
      newParams.delete('page');
    } else {
      if (value !== undefined && value !== null && value !== '') {
        newParams.set(keyOrUpdates, value);
      } else {
        newParams.delete(keyOrUpdates);
      }
      if (keyOrUpdates !== 'page') {
        newParams.delete('page');
      }
    }
    setSearchParams(newParams);
  };

  // Xóa 1 brand khỏi danh sách brands đang lọc
  const handleRemoveBrand = (brandToRemove) => {
    const brands = currentBrands ? currentBrands.split(',').filter(Boolean) : [];
    const updated = brands.filter((b) => b !== brandToRemove);
    updateQueryParam('brands', updated.join(','));
  };

  // Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    const newParams = new URLSearchParams();
    if (currentSearch) newParams.set('q', currentSearch);
    setSearchParams(newParams);
  };

  // Thông tin danh mục hiện tại (tên tiếng Việt đầy đủ & icon, mô tả)
  const categoryDisplayName = getCategoryDisplayName(currentCategory, metadata.categories);
  const categoryInfo = getCategoryInfo(currentCategory);
  const selectedBrands = currentBrands ? currentBrands.split(',').filter(Boolean) : [];
  const hasActiveFilters = Boolean(
    currentCategory ||
    selectedBrands.length > 0 ||
    currentMinPrice ||
    currentMaxPrice ||
    currentInStock
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 1. Breadcrumb Trail */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-4 overflow-x-auto py-1">
          <Link to="/" className="flex items-center gap-1 hover:text-blue-400 transition-colors shrink-0">
            <Home className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <Link
            to="/catalog"
            onClick={(e) => {
              if (currentCategory || selectedBrands.length > 0 || currentMinPrice || currentMaxPrice || currentInStock) {
                // Navigate cleanly
              }
            }}
            className={`hover:text-blue-400 transition-colors shrink-0 ${
              !currentCategory && !currentSearch ? 'text-white font-semibold' : ''
            }`}
          >
            Sản phẩm & Linh kiện
          </Link>
          {currentCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-blue-400 font-semibold flex items-center gap-1.5 whitespace-nowrap">
                <span>{categoryInfo?.icon || '📁'}</span>
                <span>{categoryDisplayName}</span>
              </span>
            </>
          )}
          {currentSearch && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-amber-400 font-semibold whitespace-nowrap">
                Tìm kiếm: "{currentSearch}"
              </span>
            </>
          )}
        </nav>

        {/* 2. Header & Filter Bar Hero */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 mb-6 backdrop-blur-sm shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{categoryInfo?.icon || '🛍️'}</span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentSearch ? (
                    <span>
                      Kết quả cho: <span className="text-blue-400">"{currentSearch}"</span>
                    </span>
                  ) : currentCategory ? (
                    <span>{categoryDisplayName}</span>
                  ) : (
                    'Tất Cả Sản Phẩm Thiết Bị & Linh Kiện'
                  )}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                {categoryInfo?.desc && (
                  <span className="text-slate-300 font-normal">{categoryInfo.desc} • </span>
                )}
                <span>
                  Hiển thị <strong className="text-white">{products.length}</strong> trên tổng số{' '}
                  <strong className="text-white">{pagination.total}</strong> sản phẩm
                </span>
              </p>
            </div>

            {/* Controls: Mobile Filter Trigger + Sort dropdown */}
            <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 border border-slate-700 text-xs font-semibold rounded-xl text-slate-200 hover:bg-slate-700 transition"
              >
                <span>⚙️</span> Bộ Lọc
              </button>

              {/* Sắp Xếp (Sort) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Sắp xếp:</span>
                <select
                  value={currentSort}
                  onChange={(e) => updateQueryParam('sort', e.target.value)}
                  className="bg-slate-900 text-xs text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="newest">✨ Mới nhất</option>
                  <option value="price_asc">💵 Giá: Thấp đến Cao</option>
                  <option value="price_desc">💎 Giá: Cao đến Thấp</option>
                  <option value="popular">🔥 Phổ biến nhất</option>
                  <option value="name_asc">🔤 Tên A - Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Đang lọc theo:
              </span>

              {/* Category Pill */}
              {currentCategory && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-medium">
                  <span>{categoryInfo?.icon || '📁'}</span>
                  <span>{categoryDisplayName}</span>
                  <button
                    onClick={() => updateQueryParam('category', '')}
                    className="hover:text-white p-0.5 rounded transition cursor-pointer"
                    title="Bỏ lọc danh mục"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Brand Pills */}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/60 text-slate-200 border border-slate-600 rounded-lg text-xs font-medium"
                >
                  <span>🏷️ {b}</span>
                  <button
                    onClick={() => handleRemoveBrand(b)}
                    className="hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                    title={`Bỏ lọc hãng ${b}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Price Pill */}
              {(currentMinPrice || currentMaxPrice) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700/60 text-slate-200 border border-slate-600 rounded-lg text-xs font-medium">
                  <span>💵 {formatPricePill(currentMinPrice, currentMaxPrice)}</span>
                  <button
                    onClick={() => updateQueryParam({ minPrice: '', maxPrice: '' })}
                    className="hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                    title="Bỏ lọc khoảng giá"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* In-Stock Pill */}
              {currentInStock === 'true' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium">
                  <span>✅ Chỉ còn hàng</span>
                  <button
                    onClick={() => updateQueryParam('inStock', '')}
                    className="hover:text-red-400 p-0.5 rounded transition cursor-pointer"
                    title="Bỏ lọc còn hàng"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Reset all button */}
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-red-400 hover:text-red-300 hover:underline ml-2 font-medium cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* 3. Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Desktop Filter Sidebar (Left Col - 1/4) */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterSidebar
              metadata={metadata}
              filters={{
                category: currentCategory,
                brands: currentBrands,
                minPrice: currentMinPrice,
                maxPrice: currentMaxPrice,
                inStock: currentInStock
              }}
              onFilterChange={updateQueryParam}
              onResetFilters={handleResetFilters}
            />
          </div>

          {/* Mobile Drawer Filter Sidebar */}
          {mobileFilterOpen && (
            <div onClick={() => setMobileFilterOpen(false)} className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden flex justify-end">
              <div onClick={(e) => e.stopPropagation()} className="w-80 max-w-[85vw] h-full bg-slate-800 p-4 overflow-y-auto shadow-2xl">
                <FilterSidebar
                  metadata={metadata}
                  filters={{
                    category: currentCategory,
                    brands: currentBrands,
                    minPrice: currentMinPrice,
                    maxPrice: currentMaxPrice,
                    inStock: currentInStock
                  }}
                  onFilterChange={updateQueryParam}
                  onResetFilters={handleResetFilters}
                  onCloseMobile={() => setMobileFilterOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Product Grid & Pagination (Right Col - 3/4) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Lưới sản phẩm */}
            <ProductGrid
              products={products}
              loading={loading}
              onResetFilters={handleResetFilters}
            />

            {/* Phân trang */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex justify-center">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={(p) => updateQueryParam('page', p)}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CatalogPage;
