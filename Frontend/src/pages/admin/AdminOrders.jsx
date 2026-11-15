import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Pagination from '../../components/admin/Pagination';
import {
  Search,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  CreditCard,
  QrCode,
  X,
  Calendar,
  DollarSign,
  AlertCircle,
  ShoppingBag,
  User,
  MapPin,
  FileText,
  Mail,
  Printer
} from 'lucide-react';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [shippingStatus, setShippingStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal chi tiết đơn hàng
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Form cập nhật trạng thái trong Modal
  const [editShippingStatus, setEditShippingStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState({ type: '', message: '' });

  // Tải danh sách đơn hàng
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search.trim() || undefined,
        paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        shippingStatus: shippingStatus !== 'all' ? shippingStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };

      const res = await axiosInstance.get('/admin/orders', { params });
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
        setSummary(res.data.summary || {});
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, search, paymentMethod, paymentStatus, shippingStatus, startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Reset về trang 1 khi lọc
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setPaymentMethod('all');
    setPaymentStatus('all');
    setShippingStatus('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Xem chi tiết đơn hàng
  const handleViewDetail = async (orderCode) => {
    setSelectedOrderCode(orderCode);
    setShowDetailModal(true);
    setDetailLoading(true);
    setUpdateFeedback({ type: '', message: '' });
    try {
      const res = await axiosInstance.get(`/admin/orders/${orderCode}`);
      if (res.data.success) {
        setOrderDetail(res.data.data);
        setEditShippingStatus(res.data.data.shipping_status || 'pending');
        setEditPaymentStatus(res.data.data.payment_status || 'unpaid');
      }
    } catch (err) {
      console.error('Lỗi xem chi tiết đơn:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!orderDetail) return;
    setUpdateLoading(true);
    setUpdateFeedback({ type: '', message: '' });

    try {
      const res = await axiosInstance.patch(`/admin/orders/${orderDetail.order_code}/status`, {
        shippingStatus: editShippingStatus,
        paymentStatus: editPaymentStatus
      });

      if (res.data.success) {
        setOrderDetail(res.data.data);
        setUpdateFeedback({
          type: 'success',
          message: 'Cập nhật trạng thái đơn hàng thành công!'
        });
        // Tải lại danh sách
        fetchOrders();
      }
    } catch (err) {
      setUpdateFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng!'
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Badge renderers
  const renderPaymentMethod = (method) => {
    if (method === 'vietqr_banking') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
          <QrCode className="w-3.5 h-3.5" />
          <span>VietQR</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <CreditCard className="w-3.5 h-3.5" />
        <span>COD</span>
      </span>
    );
  };

  const renderPaymentStatus = (status) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã thanh toán</span>
        </span>
      );
    }
    if (status === 'refunded') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Đã hoàn tiền</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" />
        <span>Chưa thanh toán</span>
      </span>
    );
  };

  const renderShippingStatus = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Giao thành công</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Truck className="w-3.5 h-3.5" />
            <span>Đang giao hàng</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Đang xử lý</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Đã hủy</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ xác nhận</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <span className="text-2xl">📦</span>
            <span>Quản Lý Đơn Hàng</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Theo dõi, tra cứu chi tiết và cập nhật tiến trình đơn hàng của khách hàng
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 text-sm font-semibold cursor-pointer active:scale-95 self-start sm:self-auto"
        >
          <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
          <p className="text-xs font-medium text-slate-400">Tổng số đơn</p>
          <p className="text-2xl font-extrabold text-white mt-1">{summary.total_orders || 0}</p>
        </div>
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
          <p className="text-xs font-medium text-amber-400">Chờ xác nhận</p>
          <p className="text-2xl font-extrabold text-amber-400 mt-1">{summary.pending_count || 0}</p>
        </div>
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
          <p className="text-xs font-medium text-sky-400">Đang giao</p>
          <p className="text-2xl font-extrabold text-sky-400 mt-1">{summary.shipping_count || 0}</p>
        </div>
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
          <p className="text-xs font-medium text-emerald-400">Giao thành công</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{summary.delivered_count || 0}</p>
        </div>
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
          <p className="text-xs font-medium text-emerald-400">Đã thanh toán</p>
          <p className="text-2xl font-extrabold text-emerald-400 mt-1">{summary.paid_count || 0}</p>
        </div>
        <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700/80">
          <p className="text-xs font-medium text-rose-400">Đã hủy</p>
          <p className="text-2xl font-extrabold text-rose-400 mt-1">{summary.cancelled_count || 0}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="Tìm mã đơn, tên, SĐT, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Phương thức thanh toán */}
          <select
            value={paymentMethod}
            onChange={(e) => handleFilterChange(setPaymentMethod, e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Phương thức: Tất cả</option>
            <option value="cod">COD (Thanh toán khi nhận)</option>
            <option value="vietqr_banking">VietQR Banking</option>
          </select>

          {/* Trạng thái thanh toán */}
          <select
            value={paymentStatus}
            onChange={(e) => handleFilterChange(setPaymentStatus, e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Thanh toán: Tất cả</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>

          {/* Trạng thái vận chuyển */}
          <select
            value={shippingStatus}
            onChange={(e) => handleFilterChange(setShippingStatus, e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="all">Vận chuyển: Tất cả</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="processing">Đang đóng gói/xử lý</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="delivered">Giao thành công</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {/* Date Filter & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/60 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-medium">Khoảng ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <span className="text-slate-500">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-sky-400 hover:text-sky-300 transition font-medium flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-5 py-4">Mã Đơn Hàng</th>
                <th className="px-5 py-4">Thời Gian Đặt</th>
                <th className="px-5 py-4">Khách Hàng</th>
                <th className="px-5 py-4">Phương Thức</th>
                <th className="px-5 py-4">Thanh Toán</th>
                <th className="px-5 py-4">Trạng Thái Đơn</th>
                <th className="px-5 py-4 text-right">Tổng Tiền</th>
                <th className="px-5 py-4 text-center">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Đang tải danh sách đơn hàng...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3 text-xl">
                      📭
                    </div>
                    <p className="font-semibold text-slate-300">Không tìm thấy đơn hàng nào</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thử điều chỉnh lại từ khóa hoặc xóa bớt điều kiện lọc
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-750/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(o.order_code)}
                        className="font-mono font-bold text-sky-400 hover:text-sky-300 hover:underline transition text-left cursor-pointer"
                      >
                        #{o.order_code}
                      </button>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {o.total_items} món
                        {o.first_item_name ? ` · ${o.first_item_name.slice(0, 25)}...` : ''}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-300 whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{o.recipient_name}</p>
                      <p className="text-xs text-slate-400">{o.recipient_phone}</p>
                      {o.recipient_email && (
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {o.recipient_email}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {renderPaymentMethod(o.payment_method)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {renderPaymentStatus(o.payment_status)}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {renderShippingStatus(o.shipping_status)}
                    </td>

                    <td className="px-5 py-4 text-right font-extrabold text-white whitespace-nowrap">
                      {formatVND(o.final_amount)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewDetail(o.order_code)}
                        title="Xem chi tiết đơn hàng"
                        className="p-2 rounded-xl bg-slate-700/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 border border-slate-600/60 hover:border-sky-500/40 transition cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalCount > 0 && (
          <div className="p-4 border-t border-slate-700 bg-slate-900/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newLimit) => {
                setItemsPerPage(newLimit);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal Chi Tiết Đơn Hàng */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-white font-mono">
                    #{orderDetail?.order_code || selectedOrderCode}
                  </h2>
                  {orderDetail && renderShippingStatus(orderDetail.shipping_status)}
                  {orderDetail && renderPaymentStatus(orderDetail.payment_status)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Thời gian tạo: {formatDate(orderDetail?.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="In đơn hàng"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setOrderDetail(null);
                  }}
                  className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {detailLoading ? (
                <div className="py-20 text-center">
                  <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Đang tải toàn bộ thông tin chi tiết đơn hàng...</p>
                </div>
              ) : !orderDetail ? (
                <div className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
                  <p>Không thể tải dữ liệu chi tiết của đơn hàng này.</p>
                </div>
              ) : (
                <>
                  {/* Hai cột: Thông tin giao hàng & Thông tin thanh toán + cập nhật */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Cột 1: Thông tin người nhận & Địa chỉ */}
                    <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>Thông Tin Người Nhận</span>
                      </h3>
                      <div className="text-sm space-y-1.5 text-slate-300">
                        <p>
                          <span className="text-slate-500 text-xs block">Họ và tên:</span>
                          <span className="font-semibold text-white">{orderDetail.recipient_name}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 text-xs block">Số điện thoại:</span>
                          <span className="font-semibold text-white">{orderDetail.recipient_phone}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 text-xs block">Email nhận thông báo:</span>
                          <span className="text-slate-200">{orderDetail.recipient_email || '—'}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 text-xs block">Địa chỉ nhận hàng:</span>
                          <span className="text-slate-200">{orderDetail.shipping_address}</span>
                        </p>
                        {orderDetail.order_notes && (
                          <p className="pt-2 border-t border-slate-700/60">
                            <span className="text-slate-500 text-xs block">Ghi chú của khách:</span>
                            <span className="italic text-amber-300/90">{orderDetail.order_notes}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cột 2: Cập nhật Trạng thái đơn hàng */}
                    <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Cập Nhật Tiến Trình Đơn Hàng</span>
                      </h3>

                      <form onSubmit={handleUpdateStatus} className="space-y-3.5">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 mb-1 block">
                            Trạng thái vận chuyển:
                          </label>
                          <select
                            value={editShippingStatus}
                            onChange={(e) => setEditShippingStatus(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                          >
                            <option value="pending">Chờ xác nhận (Pending)</option>
                            <option value="processing">Đang chuẩn bị hàng (Processing)</option>
                            <option value="shipping">Đang giao hàng (Shipping)</option>
                            <option value="delivered">Giao thành công (Delivered)</option>
                            <option value="cancelled">Đã hủy đơn (Cancelled)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-400 mb-1 block">
                            Trạng thái thanh toán:
                          </label>
                          <select
                            value={editPaymentStatus}
                            onChange={(e) => setEditPaymentStatus(e.target.value)}
                            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                          >
                            <option value="unpaid">Chưa thanh toán (Unpaid)</option>
                            <option value="paid">Đã thanh toán (Paid)</option>
                            <option value="refunded">Đã hoàn tiền (Refunded)</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-sky-400" />
                            <span>
                              Email xác nhận:{' '}
                              {orderDetail.confirmation_email_sent ? (
                                <strong className="text-emerald-400">Đã gửi</strong>
                              ) : (
                                <span className="text-slate-500">Chưa gửi</span>
                              )}
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={updateLoading}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            {updateLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                          </button>
                        </div>

                        {updateFeedback.message && (
                          <div
                            className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                              updateFeedback.type === 'success'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {updateFeedback.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{updateFeedback.message}</span>
                          </div>
                        )}
                      </form>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm trong đơn */}
                  <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden">
                    <div className="px-5 py-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-sky-400" />
                        <span>Danh Sách Sản Phẩm ({orderDetail.items?.length || 0})</span>
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">
                        Phương thức: {orderDetail.payment_method === 'vietqr_banking' ? 'VietQR Banking' : 'COD'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                          <tr>
                            <th className="px-4 py-3">Sản phẩm</th>
                            <th className="px-4 py-3">Mã SKU</th>
                            <th className="px-4 py-3 text-right">Đơn giá</th>
                            <th className="px-4 py-3 text-center">Số lượng</th>
                            <th className="px-4 py-3 text-right">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                          {(orderDetail.items || []).map((item) => (
                            <tr key={item.id} className="hover:bg-slate-750/30">
                              <td className="px-4 py-3 flex items-center gap-3">
                                <img
                                  src={item.image_url || '/placeholder.svg'}
                                  alt={item.product_name}
                                  className="w-12 h-12 object-cover rounded-xl bg-slate-900 border border-slate-700 shrink-0"
                                  onError={(e) => {
                                    e.target.src = '/placeholder.svg';
                                  }}
                                />
                                <div>
                                  <p className="font-semibold text-white text-sm line-clamp-1">
                                    {item.product_name}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {item.variant_name || `${item.color || ''} ${item.spec_version || ''}`.trim() || 'Bản tiêu chuẩn'}
                                  </p>
                                </div>
                              </td>

                              <td className="px-4 py-3 font-mono text-xs text-slate-400">
                                {item.sku || '—'}
                              </td>

                              <td className="px-4 py-3 text-right font-medium text-slate-300">
                                {formatVND(item.unit_price)}
                              </td>

                              <td className="px-4 py-3 text-center font-bold text-white">
                                {item.quantity}
                              </td>

                              <td className="px-4 py-3 text-right font-extrabold text-sky-400">
                                {formatVND(item.subtotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-5 bg-slate-900/60 border-t border-slate-700 flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4">
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>Techshop Hệ thống Bán lẻ Thiết bị Công nghệ chính hãng</p>
                        <p>Đơn hàng được lưu tự động trên hệ thống dữ liệu đám mây Techshop</p>
                      </div>

                      <div className="w-full sm:w-64 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Tạm tính tiền hàng:</span>
                          <span className="font-semibold text-slate-200">{formatVND(orderDetail.total_amount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Phí vận chuyển:</span>
                          <span className="font-semibold text-emerald-400">
                            {Number(orderDetail.shipping_fee) > 0 ? formatVND(orderDetail.shipping_fee) : 'Miễn phí'}
                          </span>
                        </div>
                        {Number(orderDetail.discount_amount) > 0 && (
                          <div className="flex justify-between text-rose-400 font-semibold">
                            <span>Giảm giá coupon:</span>
                            <span>-{formatVND(orderDetail.discount_amount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-extrabold text-white border-t border-slate-700 pt-2">
                          <span>Tổng thanh toán:</span>
                          <span className="text-sky-400">{formatVND(orderDetail.final_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-800/90 border-t border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setOrderDetail(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
