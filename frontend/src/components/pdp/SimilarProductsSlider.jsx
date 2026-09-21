import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

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
      <div className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-48 animate-pulse"></div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="w-64 h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="pt-10 border-t border-slate-200 dark:border-slate-800 space-y-6 transition-colors">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sản Phẩm Cùng Danh Mục</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gợi ý sản phẩm tương thích hoặc cùng dòng sản phẩm</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            aria-label="Cuộn sang trái"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Cuộn sang phải"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-3 pt-1 scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.slug}`}
            state={{ productId: p.id }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-64 sm:w-72 flex-shrink-0 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition cursor-pointer space-y-3 group shadow-sm flex flex-col justify-between"
          >
            <div className="h-40 bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden p-3 flex items-center justify-center relative">
              <img
                src={p.thumbnail_url || '/placeholder.jpg'}
                alt={p.name}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute top-2 left-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shadow-xs">
                  {p.match_type === 'same_category' ? p.category_name || 'Cùng dòng' : 'Gợi ý hot'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block uppercase">
                {p.brand}
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                {p.name}
              </h4>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Giá niêm yết:</span>
                <p className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400">
                  {formatCurrency(p.min_price || p.base_price)}
                </p>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 group-hover:bg-sky-600 text-slate-400 dark:text-slate-400 group-hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarProductsSlider;
