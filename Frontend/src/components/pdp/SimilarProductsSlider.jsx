import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import { api } from '../../services/api';

const SimilarProductsSlider = ({ id, currentProductId, categoryId = null, brand = null }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetLookup = currentProductId || id;

  useEffect(() => {
    if (!targetLookup) return;

    let isMounted = true;

    const fetchSimilar = async () => {
      try {
        setLoading(true);
        // Call similar products API with targetLookup and categoryId
        const list = await api.getSimilarProducts(targetLookup, 8, categoryId);
        if (!isMounted) return;

        if (Array.isArray(list) && list.length > 0) {
          setProducts(list);
          return;
        }

        // Fallback: If similar products is empty (e.g. initial seed or solitary category),
        // fetch top catalog items so this section NEVER disappears on production!
        try {
          const fallbackRes = await api.getCatalog({ limit: 8 });
          if (!isMounted) return;
          const fallbackList = Array.isArray(fallbackRes?.products)
            ? fallbackRes.products.filter((p) => String(p.id) !== String(targetLookup))
            : [];
          setProducts(fallbackList.slice(0, 8));
        } catch {
          if (isMounted) setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching similar products:', err);
        // Secondary fallback
        try {
          const fallbackRes = await api.getCatalog({ limit: 8 });
          if (!isMounted) return;
          const fallbackList = Array.isArray(fallbackRes?.products)
            ? fallbackRes.products.filter((p) => String(p.id) !== String(targetLookup))
            : [];
          setProducts(fallbackList.slice(0, 8));
        } catch {
          if (isMounted) setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSimilar();

    return () => {
      isMounted = false;
    };
  }, [targetLookup, categoryId, brand]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getRating = (product) => {
    const rating = Number(product.average_rating);
    return Number.isFinite(rating) ? rating.toFixed(1) : '5.0';
  };

  if (loading) {
    return (
      <div className="pt-10 border-t border-slate-800 space-y-4">
        <div className="h-6 bg-slate-800 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-72 bg-slate-800/60 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="pt-10 border-t border-slate-800 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl font-extrabold text-slate-100">Sản Phẩm Tương Tự &amp; Gợi Ý</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gợi ý các thiết bị tương thích và cùng hệ sinh thái công nghệ
          </p>
        </div>
        <Link
          to={`/catalog${categoryId ? `?category=${categoryId}` : ''}`}
          className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
        >
          <span>Khám phá thêm</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Grid sản phẩm tương tự */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.slug || p.id}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/80 transition-all cursor-pointer space-y-3 group shadow-sm hover:shadow-xl hover:shadow-sky-500/5 flex flex-col justify-between"
          >
            <div className="h-44 sm:h-48 bg-slate-950 rounded-xl overflow-hidden p-3 flex items-center justify-center relative border border-slate-800/80">
              <img
                src={
                  p.thumbnail_url ||
                  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
                }
                alt={p.name}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {p.match_type === 'same_category' && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/20 border border-sky-500/30 text-sky-300">
                  Cùng danh mục
                </span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold tracking-wider">
                {p.brand}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2 group-hover:text-sky-400 transition-colors">
                {p.name}
              </h4>
              <div className="flex items-center gap-1.5 text-xs">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span className="font-extrabold text-slate-200">{getRating(p)}</span>
                {Number(p.total_reviews) > 0 ? (
                  <span className="text-[10px] text-slate-500">
                    ({Number(p.total_reviews)} đánh giá)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500">Chưa có đánh giá</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-mono">Giá niêm yết:</span>
                <p className="text-sm sm:text-base font-mono font-bold text-sky-400">
                  {formatCurrency(p.min_price || p.base_price)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-sky-500 text-slate-300 group-hover:text-white transition-colors shadow-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SimilarProductsSlider;
