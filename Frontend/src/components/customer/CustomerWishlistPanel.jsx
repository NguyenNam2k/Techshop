import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  PackageCheck
} from 'lucide-react';
import { api } from '../../services/api';

const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price) || 0);

export default function CustomerWishlistPanel({ onAddToCart }) {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingProductId, setRemovingProductId] = useState(null);
  const [addingKey, setAddingKey] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const flashFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 3500);
  };

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const items = await api.getWishlist();
      setWishlist(Array.isArray(items) ? items : []);
    } catch (err) {
      flashFeedback('error', err.message || 'Không thể tải danh sách yêu thích từ cơ sở dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleRemove = async (item) => {
    setRemovingProductId(item.productId);
    try {
      const res = await api.removeWishlistItem(item.productId);
      setWishlist(Array.isArray(res?.data) ? res.data : wishlist.filter((w) => w.productId !== item.productId));
      flashFeedback('success', `Đã bỏ "${item.name}" khỏi danh sách yêu thích.`);
    } catch (err) {
      flashFeedback('error', err.response?.data?.message || err.message || 'Không thể xóa sản phẩm khỏi danh sách yêu thích.');
    } finally {
      setRemovingProductId(null);
    }
  };

  const buildCartPayload = (item) => ({
    product: {
      id: item.productId,
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      slug: item.slug,
      base_price: item.price,
      thumbnail_url: item.image
    },
    variant: {
      id: item.variantId || item.productId,
      sku: item.sku,
      color: item.color,
      spec_version: item.specVersion,
      price: item.price,
      stock: item.stock,
      image_url: item.image
    }
  });

  const handleAddSingle = async (item, { goToCart = false } = {}) => {
    if (!item.isAvailable || Number(item.stock) <= 0) {
      flashFeedback('error', `"${item.name}" hiện đã hết hàng hoặc ngừng kinh doanh.`);
      return;
    }
    setAddingKey(item.productId);
    try {
      const { product, variant } = buildCartPayload(item);
      await onAddToCart(product, variant, 1);
      if (goToCart) {
        navigate('/cart');
      } else {
        flashFeedback('success', `Đã thêm "${item.name}" vào giỏ hàng!`);
      }
    } catch (err) {
      flashFeedback('error', err.message || 'Không thể thêm sản phẩm vào giỏ hàng.');
    } finally {
      setAddingKey(null);
    }
  };

  const handleAddAll = async () => {
    const availableItems = wishlist.filter((i) => i.isAvailable && Number(i.stock) > 0);
    if (availableItems.length === 0) {
      flashFeedback('error', 'Không có sản phẩm nào còn hàng để thêm vào giỏ.');
      return;
    }

    setAddingKey('all');
    try {
      for (const item of availableItems) {
        const { product, variant } = buildCartPayload(item);
        await onAddToCart(product, variant, 1);
      }
      const skipped = wishlist.length - availableItems.length;
      flashFeedback(
        'success',
        skipped > 0
          ? `Đã thêm ${availableItems.length} sản phẩm còn hàng vào giỏ (bỏ qua ${skipped} sản phẩm hết hàng).`
          : `Đã thêm tất cả ${availableItems.length} sản phẩm vào giỏ hàng!`
      );
    } catch (err) {
      flashFeedback('error', err.message || 'Có lỗi khi thêm sản phẩm vào giỏ hàng.');
    } finally {
      setAddingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">Sản Phẩm Yêu Thích</h1>
          <p className="text-xs text-slate-400 mt-1">
            Danh sách {wishlist.length} thiết bị bạn đã lưu theo dõi tồn kho và đặt mua sau.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadWishlist}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Làm mới</span>
          </button>

          {wishlist.length > 0 && (
            <button
              type="button"
              onClick={handleAddAll}
              disabled={addingKey === 'all'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs font-bold transition shadow-md cursor-pointer"
            >
              {addingKey === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              <span>Thêm tất cả vào giỏ</span>
            </button>
          )}
        </div>
      </div>

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

      {loading ? (
        <div className="p-12 rounded-2xl border border-slate-800 bg-slate-900 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span>Đang đồng bộ danh sách yêu thích từ cơ sở dữ liệu...</span>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center space-y-4">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Danh sách yêu thích đang trống</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Hãy thả tim những sản phẩm công nghệ bạn quan tâm tại trang cửa hàng để tiện theo dõi giá và tồn kho.
          </p>
          <Link
            to="/catalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md"
          >
            <span>Khám phá sản phẩm ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlist.map((item) => {
            const productUrl = `/products/${item.productId}`;
            const hasDiscount =
              Number(item.originalPrice) > Number(item.price) && Number(item.price) > 0;
            const outOfStock = !item.isAvailable || Number(item.stock) <= 0;

            return (
              <div
                key={item.productId}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex gap-4 hover:border-slate-700 transition shadow-sm"
              >
                <Link
                  to={productUrl}
                  className="w-24 h-24 rounded-xl object-contain bg-slate-950 border border-slate-800 p-2 shrink-0 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src={item.image || DEFAULT_PRODUCT_IMAGE}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                            {item.brand}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-flex items-center gap-1 ${
                              outOfStock
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : item.stock <= 5
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <PackageCheck className="w-3 h-3" />
                            {outOfStock
                              ? item.productStatus !== 'active'
                                ? 'Ngừng bán'
                                : 'Hết hàng'
                              : `Còn ${item.stock}`}
                          </span>
                        </div>

                        <Link
                          to={productUrl}
                          className="text-xs font-bold text-white hover:text-sky-400 transition line-clamp-2 leading-snug block"
                        >
                          {item.name}
                        </Link>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={removingProductId === item.productId}
                        title="Xóa khỏi yêu thích"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {removingProductId === item.productId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-sky-400 mt-0.5 truncate">{item.variant}</p>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                    <div>
                      <span className="font-mono text-sm font-extrabold text-white">
                        {formatVND(item.price)}
                      </span>
                      {hasDiscount && (
                        <span className="font-mono text-[10px] text-slate-500 line-through ml-1.5">
                          {formatVND(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddSingle(item, { goToCart: false })}
                        disabled={outOfStock || addingKey === item.productId}
                        title="Thêm vào giỏ hàng"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        {addingKey === item.productId ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSingle(item, { goToCart: true })}
                        disabled={outOfStock || addingKey === item.productId}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
                      >
                        <span>{outOfStock ? 'Hết hàng' : 'Mua ngay'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

