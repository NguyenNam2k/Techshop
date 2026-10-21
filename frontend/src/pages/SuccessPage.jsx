import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

export default function SuccessPage() {
  const { orderCode } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await api.getOrder(orderCode);
        if (active && res?.success && res.data) setOrder(res.data);
        else if (active) setFailed(true);
      } catch {
        if (active) setFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [orderCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        <span className="text-sm">Đang tải đơn hàng...</span>
      </div>
    );
  }

  if (failed || !order) return <Navigate to="/profile/orders" replace />;

  // Đơn VietQR chưa nhận được tiền thì không được xem trang thành công
  if (order.paymentMethod === 'vietqr_banking' && order.paymentStatus !== 'paid') {
    return <Navigate to="/profile/orders" replace />;
  }

  const isVietqr = order.paymentMethod === 'vietqr_banking';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-8 text-white text-center space-y-3">
          <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Đặt Hàng Thành Công!</h1>
          <p className="text-sky-100 text-sm max-w-md mx-auto">
            Cảm ơn <span className="font-bold text-white">{order.recipientName}</span> đã mua sắm tại
            Techshop. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
          </p>
          <div className="inline-flex items-center gap-2 bg-slate-950/40 px-4 py-1.5 rounded-full text-xs font-mono border border-white/20">
            <span>Mã đơn hàng:</span>
            <span className="font-extrabold text-amber-300 text-sm">{order.orderCode}</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-sm">
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500">Thông tin người nhận</span>
              <p className="font-bold text-white">{order.recipientName}</p>
              <p className="text-slate-300 font-mono text-xs">{order.recipientPhone}</p>
              <p className="text-slate-400 text-xs">{order.shippingAddress}</p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-bold uppercase text-slate-500">Thanh toán &amp; Vận chuyển</span>
              <p className="font-bold text-slate-200">
                {isVietqr ? 'Chuyển khoản VietQR 24/7' : 'Thanh toán khi nhận hàng (COD)'}
              </p>
              <p className="text-xs">
                Trạng thái:{' '}
                <span className="font-bold text-emerald-400">
                  {isVietqr ? 'Đã nhận tiền' : order.statusLabel || 'Đã xác nhận'}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                Tổng thanh toán:{' '}
                <span className="font-extrabold text-sky-400 text-base">
                  {formatVND(order.finalAmount)}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Danh sách sản phẩm ({order.items?.length || 0})
            </h3>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-bold text-white">{item.product_name || item.name}</p>
                    <p className="text-xs text-slate-400">
                      Phiên bản:{' '}
                      {item.variant_name ||
                        item.variant ||
                        [item.color, item.spec_version].filter(Boolean).join(' — ') ||
                        'Tiêu chuẩn'}{' '}
                      | SL: x{item.quantity}
                    </p>
                  </div>
                  <span className="font-bold text-sky-400 shrink-0">{formatVND(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/profile/orders"
              className="flex-1 py-3.5 px-5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold text-center transition text-sm"
            >
              Xem Đơn Hàng Của Tôi →
            </Link>
            <Link
              to="/"
              className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-center shadow-lg shadow-sky-500/25 transition text-sm"
            >
              Tiếp Tục Mua Sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
