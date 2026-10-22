import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

const SimilarProductsSlider = ({ id, currentProductId }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const targetLookup = currentProductId || id;

  useEffect(() => {
    if (!targetLookup) return;

    const fetchSimilar = async () => {
      try {
        setLoading(true);
        const list = await api.getSimilarProducts(targetLookup, 8);
        setProducts(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error fetching similar products:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [targetLookup]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
      <div>
        <h2 className="text-xl font-bold text-slate-100">Sản Phẩm Tương Tự</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Gợi ý sản phẩm tương thích hoặc cùng dòng sản phẩm
        </p>
      </div>

      {/* Traditional Responsive Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => (
          <Link
            key={p.id}
            to={`/products/${p.slug || p.id}`}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500 transition cursor-pointer space-y-3 group shadow-sm hover:shadow-md flex flex-col justify-between"
          >
            <div className="h-44 sm:h-48 bg-slate-950 rounded-xl overflow-hidden p-3 flex items-center justify-center relative border border-slate-800/80">
              <img
                src={
                  p.thumbnail_url ||
                  'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
                }
                alt={p.name}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">
                {p.brand}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2 group-hover:text-sky-400 transition-colors">
                {p.name}
              </h4>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Giá niêm yết:</span>
                <p className="text-sm sm:text-base font-mono font-bold text-sky-400">
                  {formatCurrency(p.min_price || p.base_price)}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-sky-600 text-slate-300 group-hover:text-white transition-colors shadow-xs">
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
