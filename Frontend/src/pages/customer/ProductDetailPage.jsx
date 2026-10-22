import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  ChevronRight,
  Star,
  CheckCircle2,
  Truck,
  RotateCcw,
  ShieldCheck
} from 'lucide-react';
import ProductGallery from '../../components/pdp/ProductGallery';
import VariantSelector from '../../components/pdp/VariantSelector';
import AddToCartSection from '../../components/pdp/AddToCartSection';
import ProductSpecsTable from '../../components/pdp/ProductSpecsTable';
import SimilarProductsSlider from '../../components/pdp/SimilarProductsSlider';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import AuthRequiredModal from '../../components/common/AuthRequiredModal';
import { api, withTransientRetry } from '../../services/api';

const DEFAULT_PRODUCT_SLUG = 'asus-rog-zephyrus-g16-2024-oled-intel-core-ultra-9-rtx-4080-17';

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const queryId = queryParams.get('id') || queryParams.get('slug');
  const targetId = queryId || id || '17';

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const loadedProductRef = React.useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  useEffect(() => {
    const currentLoaded = loadedProductRef.current;
    // Skip re-fetching when replacing URL from /products/<id> to /products/<slug>
    if (
      currentLoaded &&
      (String(currentLoaded.id) === String(targetId) || currentLoaded.slug === targetId)
    ) {
      const canonicalPath = `/products/${currentLoaded.slug}`;
      if (currentLoaded.slug && (location.pathname !== canonicalPath || location.search)) {
        navigate(canonicalPath, { replace: true });
      }
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(false);

        const data = await withTransientRetry(() => api.getProductById(targetId));
        loadedProductRef.current = data;
        setProduct(data);

        if (data.variants && data.variants.length > 0) {
          const defaultVar =
            data.variants.find((v) => Number(v.stock) > 0) || data.variants[0];
          setSelectedVariant(defaultVar);
        } else {
          setSelectedVariant({
            id: data.default_variant_id || data.id,
            sku: data.sku_code || data.model_code || `SKU-${data.id}`,
            color: 'Tiêu chuẩn',
            spec_version: 'Bản tiêu chuẩn',
            price: Number(data.base_price || 0),
            stock: Number(data.total_stock ?? 10),
            status: 'available'
          });
        }

        // Redirect URL from numeric ID (/products/14, /14, /products?id=14) straight to /products/<slug>
        if (data.slug) {
          const canonicalPath = `/products/${data.slug}`;
          if (location.pathname !== canonicalPath || location.search) {
            navigate(canonicalPath, { replace: true });
          }
        }
      } catch (err) {
        console.error('Error fetching product detail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, location.pathname, location.search]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-10 animate-pulse space-y-8">
          <div className="h-4 bg-slate-800 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 h-96 bg-slate-800 rounded-3xl"></div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-slate-800 rounded w-3/4"></div>
              <div className="h-6 bg-slate-800 rounded w-1/3"></div>
              <div className="h-10 bg-slate-800 rounded w-1/2"></div>
              <div className="h-24 bg-slate-800 rounded-2xl"></div>
              <div className="h-12 bg-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-3xl font-bold">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Không Tìm Thấy Sản Phẩm</h1>
            <p className="text-slate-400 text-sm mb-6">
              Mã hoặc thông tin sản phẩm không tồn tại hoặc đã ngừng kinh doanh.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/products/${DEFAULT_PRODUCT_SLUG}`)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              Xem Sản Phẩm Mặc Định
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-emerald-600 border border-emerald-400/40 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          <Link
            to="/cart"
            className="ml-2 px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition whitespace-nowrap"
          >
            Xem giỏ hàng →
          </Link>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link
              to={`/products/${DEFAULT_PRODUCT_SLUG}`}
              className="cursor-pointer flex items-center gap-1 transition-colors text-slate-300 hover:text-sky-500 font-medium"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Cửa hàng</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">
              {product.category_name || 'Linh kiện & Thiết bị'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-100 font-bold truncate max-w-xs sm:max-w-md">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Cột trái: Thư viện ảnh + Thông số kỹ thuật */}
          <div className="lg:col-span-7 space-y-8">
            <ProductGallery
              product={product}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
            />

            <ProductSpecsTable specifications={product.specifications} />
          </div>

          {/* Cột phải: Thông tin giá, Chọn biến thể, Nút mua */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
                <span className="font-bold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                  {product.brand}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-400 font-medium">Model: {product.model_code || 'Chính hãng'}</span>
              </div>

              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-100 leading-snug tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="font-extrabold text-slate-100">4.9</span>
                  <span className="text-slate-400 text-xs">(128 Đánh giá)</span>
                </div>
                <span className="text-slate-700">|</span>
                {selectedVariant && Number(selectedVariant.stock) > 0 ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Còn hàng
                  </span>
                ) : (
                  <span className="text-xs text-rose-400 font-bold flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md">
                    ✕ Tạm hết hàng
                  </span>
                )}
              </div>
            </div>

            {/* Khung Giá niêm yết */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-slate-900 border border-sky-500/25 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
                  Giá Niêm Yết Chính Hãng
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  ✓ Đã gồm VAT 10%
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-sky-600 dark:text-sky-400 font-mono tracking-tight">
                  {formatCurrency(selectedVariant?.price || product.base_price)}
                </span>
                {product.base_price &&
                  selectedVariant?.price &&
                  Number(product.base_price) > Number(selectedVariant.price) && (
                    <span className="text-sm text-slate-400 line-through font-mono">
                      {formatCurrency(product.base_price)}
                    </span>
                  )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Bảo hành chính hãng {product.warranty_months || 24} tháng · 1 đổi 1 trong 30 ngày nếu lỗi NSX
              </p>
            </div>

            {/* Chọn Biến Thể (ẩn với linh kiện máy tính & laptop, hiện với Gaming Gears & phụ kiện) */}
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
              categorySlug={product.category_slug}
              categoryId={product.category_id}
              categoryName={product.category_name}
            />

            {/* Số lượng + Nút Thêm Giỏ Hàng & Mua Ngay */}
            <AddToCartSection
              product={product}
              variant={selectedVariant}
              onAddToCart={(qty) => {
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                showToast(`Đã thêm ${qty}x "${product.name}" vào giỏ hàng!`);
                addToCart(product, selectedVariant, qty);
              }}
              onBuyNow={(qty) => {
                if (!user) {
                  setShowAuthModal(true);
                  return;
                }
                addToCart(product, selectedVariant, qty);
                navigate('/checkout');
              }}
              onToast={showToast}
            />

            {/* Chính sách cam kết */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs shadow-sm">
              <div className="flex items-center gap-3 text-slate-200">
                <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 shrink-0">
                  <Truck className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Giao hàng Hỏa Tốc 2H trong nội thành Hà Nội &amp; TP.HCM</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Trả góp 0% qua thẻ tín dụng VietQR / FE Credit</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium">Bảo hành chính hãng 1 đổi 1 trong 30 ngày nếu có lỗi NSX</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sản phẩm cùng danh mục */}
        <SimilarProductsSlider id={product.id} currentProductId={product.id} />
      </div>

      {/* Modal yêu cầu đăng nhập khi khách bấm mua hàng */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        productName={product?.name}
      />
    </div>
  );
};

export default ProductDetailPage;
