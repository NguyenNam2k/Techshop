import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Header from '../components/common/Header';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ProductGrid from '../components/catalog/ProductGrid';
import Pagination from '../components/admin/Pagination';

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL query params
  const currentCategory = searchParams.get('category') || '';
  const currentBrands = searchParams.get('brands') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentInStock = searchParams.get('inStock') || '';
  const currentSort = searchParams.get('sort') || 'newest';
  const currentSearch = searchParams.get('q') || '';
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

  // Reset toàn bộ bộ lọc
  const handleResetFilters = () => {
    const newParams = new URLSearchParams();
    if (currentSearch) newParams.set('q', currentSearch);
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* 1. Header with Smart Search */}
      <Header
        initialSearch={currentSearch}
        onSearchSubmit={(val) => updateQueryParam('q', val.trim())}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb & Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>🛍️</span>
              {currentSearch ? (
                <span>
                  Kết quả cho: <span className="text-blue-400">"{currentSearch}"</span>
                </span>
              ) : currentCategory ? (
                <span>
                  Danh mục:{' '}
                  <span className="text-blue-400 capitalize">
                    {metadata.categories.find((c) => c.slug === currentCategory)?.name || currentCategory}
                  </span>
                </span>
              ) : (
                'Tất Cả Sản Phẩm Thiết Bị & Linh Kiện'
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Hiển thị <strong className="text-white">{products.length}</strong> trên tổng số{' '}
              <strong className="text-white">{pagination.total}</strong> sản phẩm
            </p>
          </div>

          {/* Controls: Mobile Filter Trigger + Sort dropdown */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
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
                className="bg-slate-800 text-xs text-white border border-slate-700 rounded-xl px-3 py-2 outline-none focus:border-blue-500 cursor-pointer"
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

        {/* 2. Main 2-Column Layout */}
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
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden flex justify-end">
              <div className="w-80 max-w-full h-full bg-slate-800 p-4 overflow-y-auto shadow-2xl">
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

      {/* Footer */}
      <footer className="mt-16 bg-slate-950 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Techshop E-Commerce Platform. All rights reserved.</p>
        <p className="mt-1">Xây dựng với Node.js, Express, React, TailwindCSS & MySQL</p>
      </footer>
    </div>
  );
}

export default CatalogPage;
