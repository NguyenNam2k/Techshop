import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, X, Loader2, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

const SUGGESTED_PROMPTS = [
  { label: 'Cấu hình PC Gaming 2K max setting', query: 'RTX 4080' },
  { label: 'Laptop đồ họa & lập trình mỏng nhẹ', query: 'Zephyrus' },
  { label: 'Card đồ họa RTX 40 series', query: 'RTX' },
  { label: 'Chuột & bàn phím cơ gaming', query: 'Logitech' }
];

export default function AiSearchModal({ isOpen, onClose, initialQuery = '' }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialQuery);
      if (initialQuery.trim()) {
        handleAiSearch(initialQuery.trim());
      } else {
        setResults([]);
        setAiAnalysis('');
      }
    }
  }, [isOpen, initialQuery]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAiSearch = async (searchPrompt) => {
    const q = (searchPrompt || prompt).trim();
    if (!q) return;

    setLoading(true);
    setResults([]);
    setAiAnalysis('');

    try {
      // Simulate intelligent AI parsing + DB query
      const res = await api.getProducts({ search: q, limit: 6 });
      const products = res.data || res.products || [];

      setResults(products);
      if (products.length > 0) {
        setAiAnalysis(
          `AI đã phân tích nhu cầu "${q}" và tìm thấy ${products.length} sản phẩm tối ưu nhất về hiệu năng, độ tương thích và mức giá chính hãng tại Techshop.`
        );
      } else {
        setAiAnalysis(
          `Không tìm thấy linh kiện chính xác cho "${q}". Bạn có thể thử tìm theo mã GPU (RTX 4070, 4080), tên máy hoặc linh kiện cụ thể.`
        );
      }
    } catch {
      setAiAnalysis('Có lỗi xảy ra khi kết nối máy chủ AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleAiSearch(prompt);
  };

  const handleSelectProduct = (product) => {
    onClose();
    navigate(`/products/${product.slug || product.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles className="w-4 h-4 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                TechGear AI Assistant
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  Thông minh
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Nhập yêu cầu bằng tiếng Việt (ví dụ: &ldquo;PC gaming 30 triệu&rdquo;, &ldquo;Laptop mỏng nhẹ&rdquo;)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Sparkles className="absolute left-3.5 w-4 h-4 text-amber-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Bạn đang cần tìm cấu hình hoặc thiết bị gì?..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-400/70 rounded-xl text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-2 focus:ring-amber-400/15 transition"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Hỏi AI</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </form>

          {/* Quick Prompts */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            <span className="text-[11px] text-slate-500 font-medium">Gợi ý nhanh:</span>
            {SUGGESTED_PROMPTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setPrompt(item.label);
                  handleAiSearch(item.query);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-amber-400/15 text-slate-300 hover:text-amber-400 border border-slate-700/60 hover:border-amber-400/40 transition cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-amber-400/20 blur-md animate-ping" />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                AI đang tìm kiếm &amp; tổng hợp cấu hình phù hợp...
              </p>
            </div>
          )}

          {!loading && aiAnalysis && (
            <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{aiAnalysis}</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Linh kiện / Thiết bị đề xuất</span>
                <span>{results.length} kết quả</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-800/60 text-left transition cursor-pointer flex gap-3 group"
                  >
                    <img
                      src={
                        product.thumbnail_url ||
                        'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200'
                      }
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-contain bg-slate-900 border border-slate-800 p-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {product.brand || 'TechGear'}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Phù hợp
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-100 truncate mt-1 group-hover:text-sky-400 transition-colors">
                        {product.name}
                      </p>
                      <p className="text-xs font-mono font-extrabold text-amber-400 mt-1">
                        {formatVND(product.min_price || product.base_price || product.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && !aiAnalysis && (
            <div className="py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-300">
                Khám phá linh kiện công nghệ cùng AI
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Nhập câu hỏi hoặc bấm vào các nút gợi ý nhanh ở trên để AI tìm sản phẩm phù hợp ngân sách và nhu cầu của bạn.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Hệ thống phân tích tự động từ kho dữ liệu Techshop</span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            Đóng (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
