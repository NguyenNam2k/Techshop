import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Menu,
  ChevronRight,
  Boxes,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

import axiosInstance from '../../api/axiosInstance';
import ManagerSidebar from '../../components/manager/ManagerSidebar';
import ProductStatsCards from '../../components/manager/ProductStatsCards';
import ProductFilterBar from '../../components/manager/ProductFilterBar';
import ProductTable from '../../components/manager/ProductTable';
import ProductFormModal from '../../components/manager/ProductFormModal';
import QuickStockModal from '../../components/manager/QuickStockModal';
import CategoryModal from '../../components/manager/CategoryModal';
import InventoryLogsModal from '../../components/manager/InventoryLogsModal';
import DeleteConfirmModal from '../../components/manager/DeleteConfirmModal';
import ToastNotification from '../../components/manager/ToastNotification';

function ManagerProductsPage() {
  // Data States
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalStockUnits: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    zeroStockCount: 0,
    totalCategories: 0
  });
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasPrev: false,
    hasNext: false,
    startIndex: 1,
    endIndex: 0
  });

  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    category_id: 'all',
    stock_status: 'all',
    sort: 'newest',
    page: 1,
    limit: 10
  });

  // UI / Loading States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals States
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [showQuickStockModal, setShowQuickStockModal] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch KPI Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/products/stats');
      if (res.data?.success && res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê KPI:', err);
    }
  }, []);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/categories');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  }, []);

  // Fetch Products with filters & pagination
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        category_id: filters.category_id !== 'all' ? filters.category_id : undefined,
        stock_status: filters.stock_status !== 'all' ? filters.stock_status : undefined,
        sort: filters.sort
      };

      const res = await axiosInstance.get('/products', { params });

      if (res.data?.success) {
        setProducts(res.data.data || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách thiết bị', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial Data Load
  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, [fetchStats, fetchCategories]);

  // Refetch products whenever filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter change handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to page 1 on filter modification
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category_id: 'all',
      stock_status: 'all',
      sort: 'newest',
      page: 1,
      limit: 10
    });
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  // Open Edit Form
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  // Submit Product Form (Create or Edit)
  const handleSubmitProductForm = async (formData) => {
    setActionLoading(true);
    try {
      if (formData.id) {
        // Edit Mode: PUT /api/products/:id
        const res = await axiosInstance.put(`/products/${formData.id}`, formData);
        addToast(res.data?.message || 'Cập nhật thiết bị thành công!', 'success');
      } else {
        // Create Mode: POST /api/products
        const res = await axiosInstance.post('/products', formData);
        addToast(res.data?.message || 'Thêm thiết bị mới thành công!', 'success');
      }

      setShowFormModal(false);
      setEditingProduct(null);
      fetchProducts();
      fetchStats();
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Thao tác thất bại', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Quick Stock Modal
  const handleOpenQuickStock = (product = null) => {
    setQuickStockProduct(product);
    setShowQuickStockModal(true);
  };

  // Submit Quick Stock Adjustment
  const handleSubmitQuickStock = async (payload) => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.post('/products/batch-stock', payload);
      addToast(res.data?.message || 'Điều chỉnh tồn kho thành công!', 'success');
      setShowQuickStockModal(false);
      setQuickStockProduct(null);
      fetchProducts();
      fetchStats();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Lỗi điều chỉnh tồn kho', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async (productId) => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.delete(`/products/${productId}`);
      addToast(res.data?.message || 'Đã xóa thiết bị an toàn!', 'success');
      setShowDeleteModal(false);
      setDeletingProduct(null);
      fetchProducts();
      fetchStats();
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Lỗi khi xóa thiết bị', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Create Category
  const handleCreateCategory = async (name) => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.post('/categories', { name });
      addToast(res.data?.message || 'Đã tạo danh mục mới thành công!', 'success');
      fetchCategories();
      fetchStats();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Lỗi thêm danh mục', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Category (Cascade Reassignment)
  const handleDeleteCategory = async (categoryId) => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.delete(`/categories/${categoryId}`, {
        data: { target_category_id: 1 }
      });
      addToast(res.data?.message || 'Đã xóa danh mục và chuyển giao thiết bị an toàn!', 'success');
      fetchCategories();
      fetchProducts();
      fetchStats();
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Lỗi xóa danh mục', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex overflow-hidden font-sans">
      {/* Toast Feedback notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      {/* Manager Sidebar */}
      <ManagerSidebar
        categoriesCount={categories.length}
        onOpenCategories={() => setShowCategoryModal(true)}
        onOpenBatchStock={() => handleOpenQuickStock(null)}
        onOpenLogs={() => setShowLogsModal(true)}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 sm:px-8 border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-400">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="hidden sm:inline hover:text-slate-200">Bảng điều khiển</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
            <span className="hover:text-slate-200">Catalog Quản trị</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-cyan-400 font-semibold truncate">Thiết bị công nghệ</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Restock button */}
            <button
              type="button"
              onClick={() => handleOpenQuickStock(null)}
              className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Boxes className="w-3.5 h-3.5 text-violet-400" />
              <span className="hidden sm:inline">Điều chỉnh tồn kho</span>
            </button>

            {/* Quick Add Product button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm mới</span>
            </button>

            {/* View Catalog Storefront link */}
            <Link
              to="/catalog"
              target="_blank"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
              title="Xem cửa hàng khách"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-[1600px] w-full mx-auto">
          {/* Section 1: KPI Overview Cards */}
          <ProductStatsCards
            stats={stats}
            onOpenCategories={() => setShowCategoryModal(true)}
          />

          {/* Section 2: Filter Toolbar */}
          <ProductFilterBar
            filters={filters}
            onFilterChange={handleFilterChange}
            categories={categories}
            onOpenCreate={handleOpenCreate}
            onOpenBatchStock={() => handleOpenQuickStock(null)}
            onOpenCategories={() => setShowCategoryModal(true)}
            onOpenLogs={() => setShowLogsModal(true)}
            onResetFilters={handleResetFilters}
          />

          {/* Section 3: Product Table */}
          <ProductTable
            products={products}
            pagination={pagination}
            loading={loading}
            onPageChange={handlePageChange}
            onEdit={handleOpenEdit}
            onQuickStock={handleOpenQuickStock}
            onDelete={handleOpenDelete}
            onOpenCreate={handleOpenCreate}
          />
        </main>
      </div>

      {/* Modals */}
      <ProductFormModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingProduct(null);
        }}
        initialData={editingProduct}
        categories={categories}
        onSubmit={handleSubmitProductForm}
        loading={actionLoading}
      />

      <QuickStockModal
        isOpen={showQuickStockModal}
        onClose={() => {
          setShowQuickStockModal(false);
          setQuickStockProduct(null);
        }}
        products={products}
        selectedProduct={quickStockProduct}
        onSubmit={handleSubmitQuickStock}
        loading={actionLoading}
      />

      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        loading={actionLoading}
      />

      <InventoryLogsModal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingProduct(null);
        }}
        product={deletingProduct}
        onConfirmDelete={handleConfirmDelete}
        onOpenQuickStock={(p) => handleOpenQuickStock(p)}
        loading={actionLoading}
      />
    </div>
  );
}

export default ManagerProductsPage;
