import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';

const SimilarProductsSlider = ({ id, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const targetLookup = currentProductId || id;

  useEffect(() => {
    if (!targetLookup) return;

    const fetchSimilar = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/products/${targetLookup}/similar?limit=8`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching similar products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [targetLookup]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="mt-12 space-y-4">
        <div className="h-6 bg-slate-800 rounded w-48 animate-pulse"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-64 h-72 bg-slate-800/60 rounded-2xl animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-14 space-y-5">
      {/* Slider Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
              Sản Phẩm Tương Tự & Gợi Ý Phù Hợp
            </h3>
            <p className="text-xs text-slate-400">
              Linh kiện cùng hệ sinh thái hoặc gợi ý cấu hình tương thích
            </p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Cuộn sang trái"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Cuộn sang phải"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track (Con lăn ngang đã được ẩn) */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.slug}`}
            state={{ productId: p.id }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-64 sm:w-72 flex-shrink-0 group rounded-2xl bg-gradient-to-b from-slate-800/60 via-slate-900/80 to-slate-950 border border-slate-800 hover:border-cyan-500/60 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col overflow-hidden"
          >
            {/* Image Preview Container */}
            <div className="h-44 p-4 flex items-center justify-center bg-slate-950/60 relative overflow-hidden">
              <img
                src={p.thumbnail_url || '/placeholder.jpg'}
                alt={p.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />

              {/* Tag / Category Badge */}
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-900/80 text-cyan-300 border border-slate-700/60 backdrop-blur-sm">
                  {p.match_type === 'same_category' ? p.category_name || 'Cùng dòng' : 'Gợi ý hot'}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {p.brand}
                </span>
                <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-cyan-300 line-clamp-2 transition-colors mt-0.5">
                  {p.name}
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Giá từ:</span>
                  <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {formatCurrency(p.min_price || p.base_price)}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-500 text-slate-400 group-hover:text-slate-950 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarProductsSlider;
