import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Star, ShieldCheck, Truck, RotateCcw, 
  CheckCircle2, ChevronRight, Home 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductGallery from '../components/pdp/ProductGallery.jsx';
import VariantSelector from '../components/pdp/VariantSelector.jsx';
import ProductSpecsTable from '../components/pdp/ProductSpecsTable.jsx';
import AddToCartSection from '../components/pdp/AddToCartSection.jsx';
import SimilarProductsSlider from '../components/pdp/SimilarProductsSlider.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Support query params e.g. /products?id=1 or /products?slug=abc
  const queryParams = new URLSearchParams(location.search);
  const queryId = queryParams.get('id') || queryParams.get('slug');

  // Target identifier prioritized: ?id= query param -> :id path param -> state -> fallback
  const targetId = queryId || id || location.state?.productId || '1';

  useEffect(() => {
    if (product && !queryId && (String(product.id) === String(id) || product.slug === id)) {
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        if (targetId) {
          const res = await axios.get(`/api/products/${targetId}`);
          if (res.data.success && res.data.data) {
            const productData = res.data.data;
            setProduct(productData);
            if (productData.variants && productData.variants.length > 0) {
              setSelectedVariant(productData.variants[0]);
            }
            // Canonicalize URL to SEO slug if accessed via /products?id=... or /products/:id
            if (productData.slug && (id !== productData.slug || queryId)) {
              navigate(`/products/${productData.slug}`, {
                replace: true,
                state: { productId: productData.id }
              });
            }
          } else {
            setError('Product not found');
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product: ' + (err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [targetId, id, queryId, navigate]);

  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const variantId = selectedVariant?.id || product.variants[0].id;
      const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
      setSelectedVariant(variant);
    }
  }, [product]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B0F17] flex items-center justify-center p-4 transition-colors">
        <div className="animate-pulse bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 w-full max-w-5xl space-y-6">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
              <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0B0F17] flex items-center justify-center p-4 transition-colors">
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-500 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Không Tìm Thấy Sản Phẩm</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Mã hoặc đường dẫn sản phẩm không tồn tại hoặc đã ngừng kinh doanh.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-sky-500/25 cursor-pointer"
          >
            Quay Lại Trang Trước
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100 transition-colors pb-16">

      <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Link to="/" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
            <Link to="/products" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors">
              Sản phẩm
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
            <span className="text-slate-900 dark:text-white font-bold truncate max-w-xs sm:max-w-md">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-7 space-y-8">
            <ProductGallery
              product={product}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
            />

            <ProductSpecsTable specifications={product.specifications} />
          </div>

          <div className="lg:col-span-5 space-y-6">
            
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 dark:text-slate-500 mb-1">
                <span className="font-bold text-sky-600 dark:text-sky-400 uppercase">{product.brand}</span>
                <span>•</span>
                <span>Mã SP: {product.model_code}</span>
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">4.9</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">(128 Đánh giá)</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                {selectedVariant && selectedVariant.stock > 0 ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Còn hàng ({selectedVariant.stock} chiếc sẵn sàng)
                  </span>
                ) : (
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    ✕ Tạm hết hàng
                  </span>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 transition-colors">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider block">
                Giá Niêm Yết
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 font-mono">
                  {formatCurrency(selectedVariant?.price || product.base_price)}
                </span>
                {product.base_price && selectedVariant?.price && Number(product.base_price) > Number(selectedVariant.price) && (
                  <span className="text-sm text-slate-400 dark:text-slate-500 line-through font-mono">
                    {formatCurrency(product.base_price)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Đã bao gồm VAT & Bảo hành chính hãng {product.warranty_months || 36} tháng
              </p>
            </div>

            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
              categorySlug={product.category_slug}
              categoryName={product.category_name}
            />

            <AddToCartSection
              variant={selectedVariant}
              onAddToCart={(qty) => {
                addToCart(product, selectedVariant, qty);
                alert(`Đã thêm ${qty}x "${product.name}" vào giỏ hàng!`);
              }}
              onBuyNow={(qty) => {
                addToCart(product, selectedVariant, qty);
                setIsCartOpen(true);
                alert(`Tiến hành thanh toán VietQR cho ${qty}x "${product.name}"!`);
              }}
            />
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs shadow-sm transition-colors">
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <Truck className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                <span>Giao hàng Hỏa Tốc 2H trong nội thành Hà Nội & TP.HCM</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <span>Trả góp 0% qua thẻ tín dụng VietQR / FE Credit</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Bảo hành 1 đổi 1 trong 30 ngày nếu có lỗi NSX</span>
              </div>
            </div>

          </div>

        </div>
        <SimilarProductsSlider id={product.id} currentProductId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;