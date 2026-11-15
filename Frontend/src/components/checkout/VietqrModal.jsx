import React, { useState } from 'react';
import { QrCode, X, Copy, CheckCircle2, ShieldCheck, Loader2, Terminal, Zap } from 'lucide-react';
import { api } from '../../services/api';

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

const isDevEnvironment =
  import.meta.env.DEV ||
  typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const VietqrModal = ({ isOpen, onClose, vietQRData, orderCode, onPaymentSuccess }) => {
  const [copiedField, setCopiedField] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  if (!isOpen || !vietQRData) return null;

  const accountNumber = vietQRData.accountNo || vietQRData.accountNumber || '0358599999';
  const transferContent =
    vietQRData.transferMemo || vietQRData.transferContent || `TECHSHOP ${orderCode}`;
  const bankLabel = vietQRData.bankName || vietQRData.bankId || 'MBBank';

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePayment = async () => {
    if (!orderCode) return;
    try {
      setSimulating(true);
      await api.simulatePayment(orderCode);
      setSimulatedSuccess(true);
      setTimeout(() => {
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }, 600);
    } catch (err) {
      console.error('Lỗi giả lập thanh toán:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base">Thanh Toán VietQR 24/7</h3>
                {/* {isDevEnvironment && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-400 text-slate-950 rounded-md uppercase tracking-wider">
                    TEST MODE
                  </span>
                )} */}
              </div>
              <p className="text-sky-100 text-xs">Quét mã bằng mọi ứng dụng Ngân hàng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center space-y-4 overflow-y-auto">
          {/* QR Code Container */}
          <div className="bg-white p-3.5 rounded-2xl shadow-lg border-2 border-sky-500/40 relative">
            {/* {isDevEnvironment && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[9px] uppercase rounded-md tracking-wider shadow">
                Sandbox QR
              </div>
            )} */}
            <img
              src={vietQRData.qrUrl}
              alt="VietQR Payment Code"
              className="w-52 h-52 object-contain"
            />
            {/* <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tự động điền số tiền &amp; nội dung</span>
            </div> */}
          </div>

          {/* Dev / Sandbox Test Simulator */}
          {/* {isDevEnvironment && (
            <div className="w-full bg-amber-500/10 border border-dashed border-amber-500/40 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  Môi trường Thử nghiệm (Dev / Test)
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded">
                  Webhook Mock
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Không cần chuyển khoản tiền thật. Nhấn nút bên dưới để giả lập webhook ngân hàng nhận tiền và chuyển sang trang hoàn tất.
              </p>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={simulating || simulatedSuccess}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  simulatedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                } disabled:opacity-70`}
              >
                {simulating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi xác nhận webhook...</span>
                  </>
                ) : simulatedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã giả lập thành công! Đang chuyển trang...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>⚡ Giả lập thanh toán thành công ngay</span>
                  </>
                )}
              </button>
            </div>
          )} */}

          {/* Bank Transfer Info */}
          <div className="w-full bg-slate-950/90 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-sm">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">Ngân hàng:</span>
              <span className="font-bold text-white uppercase">{bankLabel}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">Chủ tài khoản:</span>
              <span className="font-bold text-slate-200 text-right">{vietQRData.accountName}</span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">Số tài khoản:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sky-400">{accountNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, 'account')}
                  className="text-slate-400 hover:text-sky-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  {copiedField === 'account' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-xs">Số tiền:</span>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-rose-400 text-base">
                  {formatVND(vietQRData.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(String(vietQRData.amount), 'amount')}
                  className="text-slate-400 hover:text-sky-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  {copiedField === 'amount' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-400 text-xs">Nội dung CK:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-xs">
                  {transferContent}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(transferContent, 'content')}
                  className="text-slate-400 hover:text-sky-400 p-1 rounded bg-slate-900 border border-slate-800 cursor-pointer"
                >
                  {copiedField === 'content' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl py-2.5 px-3 text-center">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>
              {simulatedSuccess
                ? 'Thanh toán thành công! Đang chuyển trang...'
                : 'Đang chờ nhận tiền... Hệ thống sẽ tự động chuyển trang khi hoàn tất.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-700 font-bold text-slate-300 hover:bg-slate-800 transition text-sm cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default VietqrModal;
