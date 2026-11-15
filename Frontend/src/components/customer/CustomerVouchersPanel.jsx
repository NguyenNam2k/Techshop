import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TicketPercent,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  Trash2,
  CalendarClock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);

function formatDateVi(dateStr) {
  if (!dateStr) return 'Không giới hạn';
  const parts = String(dateStr).slice(0, 10).split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

function formatDiscountBadge(coupon) {
  const isPercent =
    coupon.discount_type === 'percent' || coupon.discount_type === 'percentage';
  if (isPercent) {
    return `Giảm ${Number(coupon.discount_value)}%`;
  }
  return `Giảm ${formatVND(coupon.discount_value)}`;
}

const STATUS_BADGES = {
  available: {
    label: 'Sẵn sàng dùng',
    cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  },
  used: {
    label: 'Đã sử dụng',
    cls: 'bg-slate-800 text-slate-400 border-slate-700'
  },
  expired: {
    label: 'Đã hết hạn',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  },
  exhausted: {
    label: 'Hết lượt',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  },
  disabled: {
    label: 'Tạm ngừng',
    cls: 'bg-slate-800 text-slate-400 border-slate-700'
  },
  upcoming: {
    label: 'Sắp diễn ra',
    cls: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  }
};

function VoucherCard({
  coupon,
  copiedCode,
  savingCode,
  removingId,
  onCopy,
  onSave,
  onRemove,
  onUse,
  showSaveButton = false,
  showRemoveButton = false
}) {
  const isUsable = coupon.status === 'available';
  const statusMeta = STATUS_BADGES[coupon.status] || STATUS_BADGES.available;
  const isPercent =
    coupon.discount_type === 'percent' || coupon.discount_type === 'percentage';

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
        isUsable
          ? 'border-slate-800 bg-slate-900 hover:border-sky-500/40 shadow-sm'
          : 'border-slate-800/70 bg-slate-900/50 opacity-75'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
            isUsable
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-800/80 border-slate-700 text-slate-400'
          }`}
        >
          <TicketPercent className="w-6 h-6" />
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-extrabold text-white tracking-wider">
              {coupon.code}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {formatDiscountBadge(coupon)}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.cls}`}>
              {statusMeta.label}
              {coupon.status === 'used' && coupon.used_order_code
                ? ` · ${coupon.used_order_code}`
                : ''}
            </span>
          </div>

          <p className="text-xs text-slate-300 line-clamp-2">{coupon.description}</p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 pt-0.5">
            <span>
              Đơn tối thiểu:{' '}
              <strong className="text-slate-200">{formatVND(coupon.min_order_value)}</strong>
            </span>
            {isPercent && coupon.max_discount_amount ? (
              <span>
                Tối đa:{' '}
                <strong className="text-slate-200">{formatVND(coupon.max_discount_amount)}</strong>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="w-3 h-3 text-slate-500" />
              HSD: {formatDateVi(coupon.end_date)}
            </span>
            {coupon.usage_limit > 0 && (
              <span>
                Còn <strong className="text-sky-400">{coupon.remaining_uses}</strong>/
                {coupon.usage_limit} lượt
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-stretch justify-end gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onCopy(coupon.code)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            {copiedCode === coupon.code ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </button>

          {showRemoveButton && !coupon.is_used && (
            <button
              type="button"
              onClick={() => onRemove(coupon)}
              disabled={removingId === coupon.id}
              title="Gỡ voucher khỏi ví"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer disabled:opacity-50"
            >
              {removingId === coupon.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {showSaveButton && !coupon.is_saved ? (
          <button
            type="button"
            onClick={() => onSave(coupon.code)}
            disabled={savingCode === coupon.code || !isUsable}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            {savingCode === coupon.code ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5" />
            )}
            <span>Lưu vào ví</span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onUse(coupon.code)}
          disabled={!isUsable}
          className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold text-center transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
        >
          {isUsable ? 'Dùng ngay' : statusMeta.label}
        </button>
      </div>
    </div>
  );
}

export default function CustomerVouchersPanel() {
  const navigate = useNavigate();
  const { cartCount = 0 } = useCart();

  const [savedVouchers, setSavedVouchers] = useState([]);
  const [discoverCoupons, setDiscoverCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [savingCode, setSavingCode] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [activeSubTab, setActiveSubTab] = useState('all');

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
  };

  const loadVouchers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getVouchers();
      setSavedVouchers(Array.isArray(res?.saved) ? res.saved : []);
      setDiscoverCoupons(Array.isArray(res?.discover) ? res.discover : []);
    } catch (err) {
      showFeedback('error', err.message || 'Không thể tải danh sách voucher từ máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const handleCopy = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const handleSaveCode = async (codeToSave) => {
    const clean = String(codeToSave ?? inputCode).trim().toUpperCase();
    if (!clean) {
      showFeedback('error', 'Vui lòng nhập mã voucher cần lưu.');
      return;
    }

    setSavingCode(clean);
    try {
      const res = await api.saveVoucher(clean);
      if (res?.data) {
        setSavedVouchers(Array.isArray(res.data.saved) ? res.data.saved : []);
        setDiscoverCoupons(Array.isArray(res.data.discover) ? res.data.discover : []);
      } else {
        await loadVouchers();
      }
      if (!codeToSave) setInputCode('');
      showFeedback('success', res?.message || `Đã lưu mã "${clean}" vào kho voucher!`);
    } catch (err) {
      showFeedback(
        'error',
        err.response?.data?.message || err.message || `Không thể lưu mã "${clean}".`
      );
    } finally {
      setSavingCode('');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSaveCode();
  };

  const handleRemoveVoucher = async (coupon) => {
    setRemovingId(coupon.id);
    try {
      const res = await api.removeSavedVoucher(coupon.id);
      if (res?.data) {
        setSavedVouchers(Array.isArray(res.data.saved) ? res.data.saved : []);
        setDiscoverCoupons(Array.isArray(res.data.discover) ? res.data.discover : []);
      }
      showFeedback('success', res?.message || `Đã gỡ voucher "${coupon.code}".`);
    } catch (err) {
      showFeedback('error', err.response?.data?.message || err.message || 'Không thể gỡ voucher.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleUseNow = (code) => {
    try {
      sessionStorage.setItem('techshop_pending_voucher', code);
    } catch {
      // ignore storage errors
    }
    const target = cartCount > 0 ? `/checkout?voucher=${encodeURIComponent(code)}` : `/cart?voucher=${encodeURIComponent(code)}`;
    navigate(target);
  };

  const readySavedCount = savedVouchers.filter((c) => c.status === 'available').length;
  const discoverNotSaved = discoverCoupons.filter((c) => !c.is_saved);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Kho Voucher &amp; Ưu Đãi Của Tôi
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Thu thập, lưu vào ví cá nhân và áp dụng trực tiếp khi thanh toán đơn hàng.
          </p>
        </div>

        <button
          type="button"
          onClick={loadVouchers}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Collect Voucher Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-4 rounded-2xl border border-slate-800 bg-slate-900 flex flex-col sm:flex-row gap-3 shadow-sm"
      >
        <div className="relative flex-1">
          <TicketPercent className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Nhập mã voucher từ TechShop (VD: WELCOME, GAMING500K)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 uppercase focus:outline-none focus:border-sky-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={Boolean(savingCode)}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-md cursor-pointer shrink-0 flex items-center justify-center gap-2"
        >
          {savingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Lưu mã</span>
        </button>
      </form>

      {feedback.text && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            feedback.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filter Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            activeSubTab === 'all'
              ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Tất cả ({savedVouchers.length + discoverNotSaved.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('saved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            activeSubTab === 'saved'
              ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Ví của tôi ({readySavedCount}/{savedVouchers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('discover')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
            activeSubTab === 'discover'
              ? 'bg-sky-600 border-sky-500 text-white shadow-sm'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Ưu đãi công khai ({discoverCoupons.length})
        </button>
      </div>

      {loading ? (
        <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span>Đang đồng bộ kho voucher từ cơ sở dữ liệu...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Saved Customer Wallet Section */}
          {(activeSubTab === 'all' || activeSubTab === 'saved') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <TicketPercent className="w-4 h-4 text-sky-400" />
                  <span>Voucher trong ví của bạn ({savedVouchers.length})</span>
                </h2>
              </div>

              {savedVouchers.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 text-center text-xs text-slate-400">
                  Ví của bạn chưa có mã giảm giá nào được lưu. Hãy nhập mã ở trên hoặc bấm{' '}
                  <strong className="text-sky-400">Lưu vào ví</strong> ở danh sách ưu đãi bên dưới.
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {savedVouchers.map((coupon) => (
                    <VoucherCard
                      key={`saved-${coupon.id}`}
                      coupon={coupon}
                      copiedCode={copiedCode}
                      savingCode={savingCode}
                      removingId={removingId}
                      onCopy={handleCopy}
                      onSave={handleSaveCode}
                      onRemove={handleRemoveVoucher}
                      onUse={handleUseNow}
                      showRemoveButton
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Active Public Coupons Section */}
          {(activeSubTab === 'all' || activeSubTab === 'discover') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    Ưu đãi TechShop đang mở ({activeSubTab === 'all' ? discoverNotSaved.length : discoverCoupons.length})
                  </span>
                </h2>
              </div>

              {(activeSubTab === 'all' ? discoverNotSaved : discoverCoupons).length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 text-center text-xs text-slate-400">
                  {discoverCoupons.length > 0
                    ? 'Bạn đã lưu tất cả mã ưu đãi đang có hiệu lực vào ví!'
                    : 'Hiện chưa có chương trình mã giảm giá công khai nào đang diễn ra.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {(activeSubTab === 'all' ? discoverNotSaved : discoverCoupons).map((coupon) => (
                    <VoucherCard
                      key={`discover-${coupon.id}`}
                      coupon={coupon}
                      copiedCode={copiedCode}
                      savingCode={savingCode}
                      removingId={removingId}
                      onCopy={handleCopy}
                      onSave={handleSaveCode}
                      onRemove={handleRemoveVoucher}
                      onUse={handleUseNow}
                      showSaveButton
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

