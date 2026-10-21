import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Phone,
  User,
  CreditCard,
  Truck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Loader2,
  Banknote,
  FileText,
  Sparkles,
  Tag,
  Ticket,
  X,
  AlertCircle,
  Terminal,
  Zap
} from 'lucide-react';
import VietqrModal from '../components/checkout/VietqrModal';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import vietnamAdminUnits from '../data/vietnam-administrative-units.json';

const isDevEnvironment =
  import.meta.env.DEV ||
  typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200&auto=format&fit=crop&q=80';

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const getWardsForProvince = (provinceId) => {
  if (Array.isArray(vietnamAdminUnits.wards)) {
    return vietnamAdminUnits.wards.filter((w) => String(w.province_id) === String(provinceId));
  }
  return vietnamAdminUnits.wardsByProvince?.[provinceId] || [];
};

const DEFAULT_PROVINCE_ID = '79'; // TP. Hồ Chí Minh
const DEFAULT_WARD_ID = getWardsForProvince('79')[0]?.id || '25747';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems = [], subtotal = 0, clearCart } = useCart();

  const [formData, setFormData] = useState({
    recipientName: 'Nguyễn Văn Nam',
    recipientPhone: '0988123456',
    provinceId: DEFAULT_PROVINCE_ID,
    wardId: DEFAULT_WARD_ID,
    streetAddress: 'Số 123 Nguyễn Huệ',
    paymentMethod: 'cod',
    orderNotes: ''
  });

  const [shippingQuote, setShippingQuote] = useState({
    deliveryMethod: 'express',
    deliveryLabel: 'Giao Hỏa Tốc 2H (Nội thành)',
    shippingFee: 0,
    distanceKm: 5.4
  });
  const [shippingLoading, setShippingLoading] = useState(false);

  // Coupon states
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Order submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [isVietqrModalOpen, setIsVietqrModalOpen] = useState(false);
  const [simulatingWaiting, setSimulatingWaiting] = useState(false);

  const provinces = useMemo(() => vietnamAdminUnits.provinces || [], []);
  const wards = useMemo(
    () => getWardsForProvince(formData.provinceId),
    [formData.provinceId]
  );

  const selectedProvince = useMemo(
    () => provinces.find((item) => item.id === formData.provinceId) || null,
    [provinces, formData.provinceId]
  );
  const selectedWard = useMemo(
    () => wards.find((item) => item.id === formData.wardId) || null,
    [wards, formData.wardId]
  );

  // Load active coupons from DB (/api/coupons)
  useEffect(() => {
    api
      .getCoupons()
      .then((list) => {
        if (Array.isArray(list)) {
          setAvailableCoupons(
            list.filter((c) => c.is_active === undefined || Number(c.is_active) === 1)
          );
        }
      })
      .catch(() => {});
  }, []);

  // Calculate shipping quote whenever provinceId or wardId changes
  useEffect(() => {
    if (!formData.provinceId || !formData.wardId) return;
    let cancelled = false;
    setShippingLoading(true);
    api
      .getShippingQuote(formData.provinceId, formData.wardId)
      .then((quote) => {
        if (!cancelled && quote) setShippingQuote(quote);
      })
      .catch(() => {
        if (!cancelled) {
          const isInnerCity = formData.provinceId === '79' || formData.provinceId === '01';
          setShippingQuote({
            deliveryMethod: isInnerCity ? 'express' : 'standard',
            deliveryLabel: isInnerCity
              ? 'Giao Hỏa Tốc 2H (Nội thành)'
              : 'Giao Tiêu Chuẩn Toàn Quốc',
            shippingFee: isInnerCity ? 0 : 35000,
            distanceKm: isInnerCity ? 5.4 : 120
          });
        }
      })
      .finally(() => {
        if (!cancelled) setShippingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.provinceId, formData.wardId]);

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const isPercent =
      appliedCoupon.discount_type === 'percent' ||
      appliedCoupon.discount_type === 'percentage';
    if (isPercent) {
      const raw = Math.round((subtotal * Number(appliedCoupon.discount_value)) / 100);
      const maxCap = appliedCoupon.max_discount ?? appliedCoupon.max_discount_amount ?? null;
      return maxCap ? Math.min(raw, Number(maxCap)) : raw;
    }
    return Math.min(subtotal, Number(appliedCoupon.discount_value || 0));
  }, [appliedCoupon, subtotal]);

  const shippingFee = shippingQuote ? Number(shippingQuote.shippingFee || 0) : 0;
  const finalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyCouponCode = async (codeToApply) => {
    const cleanCode = String(codeToApply ?? couponInput)
      .trim()
      .toUpperCase();
    if (!cleanCode) {
      setCouponError('Vui lòng nhập hoặc chọn mã giảm giá.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon(cleanCode, subtotal);
      if (res.valid && res.coupon) {
        setAppliedCoupon(res.coupon);
        setCouponInput(res.coupon.code);
        setIsVoucherModalOpen(false);
      } else {
        setCouponError(res.message || 'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện.');
      }
    } catch (err) {
      setCouponError(err.message || 'Không thể kiểm tra mã giảm giá.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'provinceId') {
        const firstWard = getWardsForProvince(value)[0]?.id || '';
        return { ...prev, provinceId: value, wardId: firstWard };
      }
      return { ...prev, [name]: value };
    });
    setSubmitError('');
  };

  const handleQuickPresetAddress = (preset) => {
    if (preset === 'hcm') {
      const firstWard = getWardsForProvince('79')[0]?.id || '';
      setFormData((prev) => ({
        ...prev,
        provinceId: '79',
        wardId: firstWard,
        streetAddress: 'Số 123 Nguyễn Huệ, Quận 1'
      }));
    } else if (preset === 'hn') {
      const firstWard = getWardsForProvince('01')[0]?.id || '';
      setFormData((prev) => ({
        ...prev,
        provinceId: '01',
        wardId: firstWard,
        streetAddress: 'Số 88 Cầu Giấy'
      }));
    } else if (preset === 'dn') {
      const firstWard = getWardsForProvince('48')[0]?.id || '';
      setFormData((prev) => ({
        ...prev,
        provinceId: '48',
        wardId: firstWard,
        streetAddress: 'Số 45 Nguyễn Văn Linh'
      }));
    }
  };

  const composeFullAddress = () => {
    const parts = [
      formData.streetAddress.trim(),
      selectedWard?.fullName || selectedWard?.name,
      selectedProvince?.fullName || selectedProvince?.name
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.recipientName.trim() || !formData.recipientPhone.trim()) {
      setSubmitError('Vui lòng nhập đầy đủ Họ tên và Số điện thoại người nhận.');
      return;
    }
    if (!formData.streetAddress.trim()) {
      setSubmitError('Vui lòng nhập địa chỉ số nhà, tên đường nhận hàng.');
      return;
    }
    if (cartItems.length === 0) {
      setSubmitError('Giỏ hàng của bạn đang trống.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createOrder({
        recipientName: formData.recipientName.trim(),
        recipientPhone: formData.recipientPhone.trim(),
        provinceId: formData.provinceId,
        wardId: formData.wardId,
        shippingAddress: composeFullAddress(),
        paymentMethod: formData.paymentMethod,
        orderNotes: formData.orderNotes.trim(),
        couponCode: appliedCoupon?.code || '',
        items: cartItems.map((item) => ({
          variantId: item.variantId || item.id,
          quantity: item.quantity
        }))
      });

      if (response.success && response.data) {
        setCreatedOrder(response.data);
        try {
          const prevOrders = JSON.parse(localStorage.getItem('techshop_orders') || '[]');
          const formatted = {
            orderId: response.data.orderCode || `ORD-${Date.now().toString().slice(-4)}`,
            date: new Date().toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
            phase: 0,
            statusLabel: 'Chờ xác nhận',
            carrier: 'GIAO HÀNG NHANH (GHN)',
            trackingCode: `GHN${Date.now().toString().slice(-9)}`,
            paymentMethod:
              formData.paymentMethod === 'vietqr_banking'
                ? 'VietQR Banking Auto'
                : 'COD (Thanh toán khi nhận)',
            total: Number(response.data.totalAmount || finalTotal),
            items: cartItems.map((item) => ({
              id: item.productId || item.id,
              name: item.name,
              variant: item.variant,
              quantity: item.quantity,
              price: item.price,
              image: item.image
            }))
          };
          localStorage.setItem('techshop_orders', JSON.stringify([formatted, ...prevOrders]));
        } catch {
          // ignore storage error
        }
        await clearCart();
        if (formData.paymentMethod === 'vietqr_banking' && response.data.vietQR) {
          setIsVietqrModalOpen(true);
        } else {
          navigate(`/success/${response.data.orderCode}`, { replace: true });
        }
      } else {
        setSubmitError(response.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ khi tạo đơn hàng.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Poll backend mỗi 3s; khi đã nhận tiền thì tự động chuyển sang /success
  useEffect(() => {
    if (!createdOrder || createdOrder.paymentMethod !== 'vietqr_banking') return undefined;
    let cancelled = false;
    const check = async () => {
      try {
        const status = await api.getPaymentStatus(createdOrder.orderCode);
        if (!cancelled && status?.paid) {
          navigate(`/success/${createdOrder.orderCode}`, { replace: true });
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời, lần poll sau sẽ thử lại
      }
    };
    check();
    const timer = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [createdOrder, navigate]);

  const handleSimulatePaymentFromWaiting = async () => {
    if (!createdOrder?.orderCode) return;
    try {
      setSimulatingWaiting(true);
      await api.simulatePayment(createdOrder.orderCode);
      navigate(`/success/${createdOrder.orderCode}`, { replace: true });
    } catch (err) {
      console.error('Lỗi giả lập thanh toán:', err);
    } finally {
      setSimulatingWaiting(false);
    }
  };

  // VietQR: chờ nhận tiền (không hiện "thành công" khi chưa có tiền)
  if (createdOrder) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 text-white text-center space-y-3">
            <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
              <Loader2 className="w-9 h-9 text-white animate-spin" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold">Đang Chờ Thanh Toán</h1>
              {isDevEnvironment && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-400 text-slate-950 rounded uppercase tracking-wider">
                  TEST MODE
                </span>
              )}
            </div>
            <p className="text-sky-100 text-sm max-w-sm mx-auto">
              Vui lòng quét mã VietQR để chuyển khoản. Hệ thống sẽ tự động chuyển trang ngay khi nhận được tiền.
            </p>
            <div className="inline-flex items-center gap-2 bg-slate-950/40 px-4 py-1.5 rounded-full text-xs font-mono border border-white/20">
              <span>Mã đơn hàng:</span>
              <span className="font-extrabold text-amber-300 text-sm">{createdOrder.orderCode}</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-sm">
              <span className="text-slate-400">Số tiền cần thanh toán</span>
              <span className="font-extrabold text-sky-400 text-lg">{formatVND(createdOrder.finalAmount)}</span>
            </div>

            {/* Dev / Test Sandbox Box */}
            {isDevEnvironment && (
              <div className="bg-amber-500/10 border border-dashed border-amber-500/40 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    Chế độ Thử nghiệm (Dev / Sandbox)
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded">
                    MOCK PAYMENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Đang chạy trên môi trường test. Bấm nút dưới đây để giả lập webhook ngân hàng xác nhận đã chuyển tiền và tự động chuyển sang trang đơn hàng thành công.
                </p>
                <button
                  type="button"
                  onClick={handleSimulatePaymentFromWaiting}
                  disabled={simulatingWaiting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {simulatingWaiting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang gửi xác nhận webhook giả lập...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>⚡ Giả lập thanh toán thành công ngay</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {createdOrder.vietQR && (
                <button
                  type="button"
                  onClick={() => setIsVietqrModalOpen(true)}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400 font-bold hover:bg-sky-500/25 transition flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Mở mã QR Thanh Toán</span>
                </button>
              )}
              <Link
                to="/profile/orders"
                className="flex-1 py-3.5 px-5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold text-center transition text-sm"
              >
                Xem Đơn Hàng Của Tôi
              </Link>
            </div>
          </div>
        </div>

        <VietqrModal
          isOpen={isVietqrModalOpen}
          onClose={() => setIsVietqrModalOpen(false)}
          vietQRData={createdOrder.vietQR}
          orderCode={createdOrder.orderCode}
          onPaymentSuccess={() => navigate(`/success/${createdOrder.orderCode}`, { replace: true })}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Progress Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
          <div>
            <Link
              to="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-sky-400 mb-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại giỏ hàng</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-sky-400" />
              <span>Thanh Toán &amp; Giao Nhận</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <Link
              to="/cart"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-500/40 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>1. Giỏ hàng</span>
            </Link>
            <ArrowRight className="w-4 h-4 text-slate-600" />
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-400">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Thanh toán</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500">
              <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Hoàn tất</span>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center max-w-lg mx-auto space-y-4">
            <p className="text-slate-300 font-semibold">
              Chưa có sản phẩm nào trong giỏ hàng để thanh toán.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm"
            >
              <span>Chọn sản phẩm ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Column (7 cols): Shipping Info & Payment Method */}
            <div className="lg:col-span-7 space-y-6">
              {/* Recipient & Address Card */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-white">
                        1. Thông Tin Giao Nhận Hàng
                      </h2>
                      <p className="text-xs text-slate-400">
                        Tự động tính phí giao hàng theo Tỉnh/Thành và Phường/Xã
                      </p>
                    </div>
                  </div>

                  {/* Quick Address Presets for fast testing */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickPresetAddress('hcm')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-[11px] font-semibold text-sky-400 border border-slate-700 transition"
                    >
                      TP.HCM (Free 2H)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPresetAddress('hn')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-[11px] font-semibold text-sky-400 border border-slate-700 transition"
                    >
                      Hà Nội (Free 2H)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPresetAddress('dn')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 text-[11px] font-semibold text-slate-300 border border-slate-700 transition"
                    >
                      Đà Nẵng
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Họ và tên người nhận *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        name="recipientName"
                        value={formData.recipientName}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập họ tên người nhận"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-sm text-white outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Số điện thoại liên hệ *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        name="recipientPhone"
                        value={formData.recipientPhone}
                        onChange={handleInputChange}
                        required
                        placeholder="Ví dụ: 0988123456"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-sm text-white outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Tỉnh / Thành phố *
                    </label>
                    <select
                      name="provinceId"
                      value={formData.provinceId}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-sm text-white outline-none transition"
                    >
                      {provinces.map((province) => (
                        <option key={province.id} value={province.id}>
                          {province.fullName || province.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                      Phường / Xã *
                    </label>
                    <select
                      name="wardId"
                      value={formData.wardId}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-sm text-white outline-none transition"
                    >
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.fullName || ward.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Số nhà, tên đường, tòa nhà *
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    required
                    placeholder="Ví dụ: Số 123 Nguyễn Huệ, Tòa nhà Bitexco"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-sm text-white outline-none transition"
                  />
                </div>

                {/* Instant Shipping Quote Banner */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>
                          {shippingQuote?.deliveryLabel || 'Giao Hỏa Tốc 2H (Nội thành)'}
                        </span>
                        {shippingLoading && (
                          <span className="text-[11px] text-sky-400 animate-pulse">
                            Đang tính...
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Địa chỉ đầy đủ: {composeFullAddress()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400 shrink-0">
                    {shippingFee === 0 ? 'MIỄN PHÍ (0₫)' : formatVND(shippingFee)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                    Ghi chú giao hàng (Tùy chọn)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="orderNotes"
                      value={formData.orderNotes}
                      onChange={handleInputChange}
                      placeholder="Ghi chú giờ hành chính, gọi trước khi giao, xuất hóa đơn VAT..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-sm text-white outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-white">
                      2. Phương Thức Thanh Toán
                    </h2>
                    <p className="text-xs text-slate-400">
                      An toàn, bảo mật tuyệt đối &amp; xác nhận tức thì
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* COD Option */}
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'cod'
                        ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={handleInputChange}
                      className="mt-1 accent-sky-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <Banknote className="w-4 h-4 text-emerald-400" />
                        <span>Thanh toán khi nhận (COD)</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Kiểm tra sản phẩm nguyên seal trước khi thanh toán tiền mặt cho shipper.
                      </p>
                    </div>
                  </label>

                  {/* VietQR Option */}
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.paymentMethod === 'vietqr_banking'
                        ? 'bg-sky-500/10 border-sky-500 ring-1 ring-sky-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="vietqr_banking"
                      checked={formData.paymentMethod === 'vietqr_banking'}
                      onChange={handleInputChange}
                      className="mt-1 accent-sky-500"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <QrCode className="w-4 h-4 text-sky-400" />
                        <span>Chuyển khoản VietQR 24/7</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Sinh mã QR tự động theo đơn hàng, xác nhận thanh toán trong 5 giây.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Order Summary + Voucher + Place Order */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h2 className="text-base font-extrabold text-white uppercase tracking-wider">
                    Đơn Hàng Của Bạn ({cartItems.length})
                  </h2>
                  <Link
                    to="/cart"
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 transition"
                  >
                    Sửa giỏ hàng
                  </Link>
                </div>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/70">
                  {cartItems.map((item) => (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <img
                        src={item.image || FALLBACK_IMAGE}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1.5 shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.variant}</p>
                        <p className="text-[11px] text-slate-500">Số lượng: x{item.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-sky-400">
                          {formatVND(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon / Voucher Box (Synced with /views/manager/products.ejs coupons table) */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <Ticket className="w-4 h-4 text-sky-400" />
                      <span>Mã giảm giá / Voucher</span>
                    </span>
                    {availableCoupons.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsVoucherModalOpen(true)}
                        className="text-xs font-bold text-sky-400 hover:text-sky-300 transition"
                      >
                        Chọn mã ({availableCoupons.length}) →
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError('');
                      }}
                      placeholder="Nhập mã (VD: TECH10, SALE500)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-xs font-mono font-bold uppercase text-white outline-none"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponInput('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition"
                      >
                        Bỏ mã
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={couponLoading}
                        onClick={() => handleApplyCouponCode()}
                        className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-extrabold transition disabled:opacity-50"
                      >
                        {couponLoading ? '...' : 'Áp dụng'}
                      </button>
                    )}
                  </div>

                  {/* Quick Coupon Chips */}
                  {availableCoupons.length > 0 && !appliedCoupon && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableCoupons.slice(0, 4).map((c) => (
                        <button
                          key={c.id || c.code}
                          type="button"
                          onClick={() => handleApplyCouponCode(c.code)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-sky-500/15 border border-slate-800 hover:border-sky-500/40 text-[11px] font-mono font-bold text-sky-400 transition flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{c.code}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs text-rose-400 font-medium">{couponError}</p>
                  )}

                  {appliedCoupon && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                      <span className="font-bold">
                        Đã áp dụng mã {appliedCoupon.code}
                      </span>
                      <span className="font-extrabold">-{formatVND(discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Totals Breakdown */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Tạm tính</span>
                    <span className="font-bold text-slate-200">{formatVND(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Giảm giá Voucher</span>
                    <span className="font-bold text-emerald-400">
                      -{formatVND(discountAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Phí vận chuyển</span>
                    <span className="font-bold text-sky-400">
                      {shippingFee === 0 ? 'Miễn phí (0₫)' : formatVND(shippingFee)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Tổng thanh toán</span>
                    <span className="text-2xl font-extrabold text-sky-400">
                      {formatVND(finalAmount)}
                    </span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'ĐANG XỬ LÝ ĐƠN HÀNG...'
                      : formData.paymentMethod === 'vietqr_banking'
                      ? `ĐẶT HÀNG & QUÉT MÃ VIETQR (${formatVND(finalAmount)})`
                      : `HOÀN TẤT ĐẶT HÀNG (${formatVND(finalAmount)})`}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Bảo mật giao dịch SSL 256-bit • Đồng bộ kho thời gian thực</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Voucher Selection Modal */}
      {isVoucherModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsVoucherModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-extrabold text-white text-sm">
                <Ticket className="w-5 h-5 text-sky-400" />
                <span>Chọn Mã Giảm Giá Techshop</span>
              </div>
              <button
                type="button"
                onClick={() => setIsVoucherModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-3">
              {availableCoupons.map((coupon) => {
                const eligible = subtotal >= Number(coupon.min_order_value || 0);
                return (
                  <div
                    key={coupon.id || coupon.code}
                    className={`p-4 rounded-2xl border transition ${
                      eligible
                        ? 'bg-slate-950/90 border-slate-800 hover:border-sky-500/50'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-mono font-extrabold text-xs">
                        {coupon.code}
                      </span>
                      <button
                        type="button"
                        disabled={!eligible}
                        onClick={() => handleApplyCouponCode(coupon.code)}
                        className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs transition"
                      >
                        {eligible ? 'Áp dụng' : 'Chưa đủ ĐK'}
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 font-semibold mt-2">
                      {coupon.description}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Đơn tối thiểu: {formatVND(coupon.min_order_value || 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;