import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import ProductTable from './components/ProductTable';
import GalleryModal from './components/GalleryModal';
import ImageViewerModal from './components/ImageViewerModal';
import LogoutModal from './components/LogoutModal';
import { ToastContainer, showToast } from './components/Toast';

// Dedicated Full-Page Views
import CreateProductView from './views/CreateProductView';
import CategoriesView from './views/CategoriesView';
import BatchStockView from './views/BatchStockView';
import InventoryLogsView from './views/InventoryLogsView';
import CouponsView from './views/CouponsView';
import ReportsView from './views/ReportsView';
import StaffsView from './views/StaffsView';

export default function App() {
  // Theme State ('dark' | 'light') - synchronized with main branch techshop_theme standard
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('techshop_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.add('dark');
        root.classList.remove('light');
      }
      localStorage.setItem('techshop_theme', theme);
    } catch (e) {
      console.error('Error applying theme:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      showToast(
        next === 'light'
          ? 'Đã chuyển sang giao diện Sáng'
          : 'Đã chuyển sang giao diện Tối',
        'info'
      );
      return next;
    });
  };

  // Navigation / View State
  const [activeView, setActiveView] = useState('products');

  // Products & Pagination Data
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    startIndex: 1,
    endIndex: 0,
    hasPrev: false,
    hasNext: false
  });
  const [stats, setStats] = useState({});
  const [categories, setCategories] = useState([]);
  const [staffCount, setStaffCount] = useState(0);

  // Filters State
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    category_id: 'all',
    search: '',
    stock_status: 'all',
    sort: 'newest'
  });

  // Editing state for Create/Edit View
  const [editingProduct, setEditingProduct] = useState(null);

  // Stock Adjustment Target (passed to BatchStockView)
  const [batchStockTarget, setBatchStockTarget] = useState(null);

  // Modals state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [imageViewer, setImageViewer] = useState({
    isOpen: false,
    imageUrl: '',
    caption: ''
  });
  const [galleryModal, setGalleryModal] = useState({
    isOpen: false,
    productId: null,
    productName: ''
  });

  // Load KPI Stats
  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/products/stats');
      const json = await res.json();
      if (json.success) setStats(json.data || {});
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  }, []);

  // Load Categories
  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  }, []);

  // Load Staff count
  const loadStaffs = useCallback(async () => {
    try {
      const res = await fetch('/api/staffs');
      const json = await res.json();
      if (json.success) setStaffCount(json.data?.length || 0);
    } catch (e) {
      console.error('Error fetching staffs:', e);
    }
  }, []);

  // Load Products with filters
  const loadProducts = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        category_id: filters.category_id,
        search: filters.search,
        stock_status: filters.stock_status,
        sort: filters.sort
      }).toString();

      const res = await fetch(`/api/products?${query}`);
      const json = await res.json();
      if (json.success) {
        const productList = Array.isArray(json.data)
          ? json.data
          : json.data?.products || [];
        setProducts(productList);

        const pageInfo = json.pagination || json.data?.pagination;
        if (pageInfo) {
          setPagination(pageInfo);
        }
      }
    } catch (e) {
      console.error('Error fetching products:', e);
      showToast('Không thể kết nối đến máy chủ Express', 'error');
    }
  }, [filters]);

  useEffect(() => {
    loadStats();
    loadCategories();
    loadStaffs();
  }, [loadStats, loadCategories, loadStaffs]);

  useEffect(() => {
    if (activeView === 'products' || activeView === 'batch-stock') {
      loadProducts();
    }
  }, [loadProducts, activeView]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleSelectView = (viewName) => {
    if (viewName === 'create-product') {
      setEditingProduct(null);
    }
    setActiveView(viewName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (formData.id) {
        // UPDATE
        const res = await fetch(`/api/products/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            category_id: Number(formData.category_id),
            brand: formData.brand,
            base_price: Number(formData.base_price),
            sku_code: formData.sku_code,
            description: formData.description,
            thumbnail_url: formData.thumbnail_url
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Lỗi cập nhật thiết bị');

        showToast(`Đã cập nhật thiết bị #${formData.id} thành công!`, 'success');
      } else {
        // CREATE
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            category_id: Number(formData.category_id),
            brand: formData.brand,
            base_price: Number(formData.base_price),
            initial_stock: Number(formData.initial_stock || 0),
            sku_code: formData.sku_code,
            description: formData.description,
            thumbnail_url: formData.thumbnail_url
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Lỗi thêm thiết bị');

        showToast('Thêm mới thiết bị thành công!', 'success');
      }

      setEditingProduct(null);
      setActiveView('products');
      loadProducts();
      loadStats();
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Không thể lưu thiết bị', 'error');
      throw err;
    }
  };

  const handleDeleteProduct = async (product) => {
    const stock = Number(product.total_stock ?? 0);
    if (stock > 0) {
      if (
        !window.confirm(
          `CẢNH BÁO: Thiết bị "${product.name}" hiện vẫn còn ${stock} sản phẩm trong kho.\n\nTheo quy tắc toàn vẹn kho hàng (Constraint), bạn cần điều chỉnh tồn kho về 0 trước khi xóa an toàn.\n\nBạn có muốn chuyển sang màn hình điều chỉnh tồn kho ngay bây giờ không?`
        )
      ) {
        return;
      }
      setBatchStockTarget({
        variant_id: product.default_variant_id || product.id,
        sku_code: product.sku_code,
        total_stock: product.total_stock,
        name: product.name
      });
      setActiveView('batch-stock');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn thiết bị "${product.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi xóa thiết bị');

      showToast(`Đã xóa thiết bị "${product.name}" thành công!`, 'success');
      loadProducts();
      loadStats();
      loadCategories();
    } catch (err) {
      showToast(err.message || 'Không thể xóa thiết bị', 'error');
    }
  };

  return (
    <div className="flex flex-1 min-h-screen overflow-hidden bg-[#0b0f19] text-slate-100 selection:bg-cyan-500 selection:text-slate-900">
      <ToastContainer />

      {/* SIDEBAR NAVIGATION WITH ACTIVE HIGHLIGHT & MULTI-VIEW NAVIGATION */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        categoryCount={categories.length}
        staffCount={staffCount}
        onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
        {/* HEADER BAR WITH LIGHT / DARK MODE TOGGLE */}
        <Header
          activeView={activeView}
          onSelectView={handleSelectView}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* BODY CONTAINER */}
        <div className="p-8 space-y-8 max-w-[1600px] w-full mx-auto">
          {/* VIEW 1: PRODUCTS CATALOG (CLEAN FULL-WIDTH, NO RIGHT COLUMN FORM) */}
          {activeView === 'products' && (
            <div className="space-y-8 animate-fade-in">
              {/* KPI METRICS OVERVIEW */}
              <KpiCards
                stats={stats}
                onOpenCategoryModal={() => setActiveView('categories')}
              />

              {/* FULL-WIDTH PRODUCT TABLE */}
              <ProductTable
                products={products}
                categories={categories}
                pagination={pagination}
                filters={filters}
                onFilterChange={handleFilterChange}
                onNavigateCreateProduct={() => {
                  setEditingProduct(null);
                  setActiveView('create-product');
                }}
                onOpenImageViewer={(url, name) =>
                  setImageViewer({ isOpen: true, imageUrl: url, caption: name })
                }
                onOpenGalleryModal={(id, name) =>
                  setGalleryModal({ isOpen: true, productId: id, productName: name })
                }
                onEditProduct={(prod) => {
                  setEditingProduct(prod);
                  setActiveView('create-product');
                }}
                onQuickAdjustStock={(target) => {
                  setBatchStockTarget(target);
                  setActiveView('batch-stock');
                }}
                onDeleteProduct={handleDeleteProduct}
              />
            </div>
          )}

          {/* VIEW 2: CREATE / EDIT PRODUCT (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'create-product' && (
            <CreateProductView
              categories={categories}
              editingProduct={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => {
                setEditingProduct(null);
                setActiveView('products');
              }}
              onOpenImageViewer={(url, name) =>
                setImageViewer({ isOpen: true, imageUrl: url, caption: name })
              }
            />
          )}

          {/* VIEW 3: HARDWARE CATEGORIES (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'categories' && (
            <CategoriesView
              categories={categories}
              onRefreshCategories={() => {
                loadCategories();
                loadProducts();
                loadStats();
              }}
            />
          )}

          {/* VIEW 4: BATCH STOCK ADJUSTMENT (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'batch-stock' && (
            <BatchStockView
              products={products}
              initialTarget={batchStockTarget}
              onSuccess={() => {
                loadProducts();
                loadStats();
              }}
            />
          )}

          {/* VIEW 5: INVENTORY LOGS & AUDIT (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'inventory-logs' && <InventoryLogsView />}

          {/* VIEW 6: COUPONS & PROMOTIONS (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'coupons' && <CouponsView />}

          {/* VIEW 7: MONTHLY REPORTS (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'reports' && <ReportsView />}

          {/* VIEW 8: STAFFS & ROLES (DEDICATED FULL-SCREEN VIEW) */}
          {activeView === 'staffs' && (
            <StaffsView onStaffUpdated={() => loadStaffs()} />
          )}
        </div>
      </main>

      {/* POPUP LIGHTBOX FOR IMAGES & GALLERY */}
      <GalleryModal
        isOpen={galleryModal.isOpen}
        productId={galleryModal.productId}
        productName={galleryModal.productName}
        onClose={() => setGalleryModal({ isOpen: false, productId: null, productName: '' })}
        onOpenImageViewer={(url, name) =>
          setImageViewer({ isOpen: true, imageUrl: url, caption: name })
        }
        onImagesUpdated={() => {
          loadProducts();
        }}
      />

      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        imageUrl={imageViewer.imageUrl}
        caption={imageViewer.caption}
        onClose={() => setImageViewer({ isOpen: false, imageUrl: '', caption: '' })}
      />

      {/* LOGOUT CONFIRMATION MODAL */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
