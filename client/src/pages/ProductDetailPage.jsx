import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
  Star, ShieldCheck, Truck, RotateCcw, 
  CheckCircle2, ChevronRight, Home 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import ProductGallery from '../components/pdp/ProductGallery';
import VariantSelector from '../components/pdp/VariantSelector';
import ProductSpecsTable from '../components/pdp/ProductSpecsTable';
import AddToCartSection from '../components/pdp/AddToCartSection';
import SimilarProductsSlider from '../components/pdp/SimilarProductsSlider';
import AuthRequiredModal from '../components/common/AuthRequiredModal';
import CartDrawer from '../components/common/CartDrawer';

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const queryId = queryParams.get('id') || queryParams.get('slug');
  const targetId = queryId || id || location.state?.productId || '1';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axiosInstance.get(`/products/${targetId}`);
        if (res.data.success && res.data.data) {
          const productData = res.data.data;
          setProduct(productData);
          if (productData.variants && productData.variants.length > 0) {
            setSelectedVariant(productData.variants[0]);
          }
        } else {
          setError('Không tìm thấy sản phẩm yêu cầu');
        }
      } catch (err) {
        console.error('Lỗi khi tải chi tiết sản phẩm:', err);
        setError(err.response?.data?.message || 'Không thể tải thông tin sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    if (targetId) {
      fetchProduct();
    }
  }, [targetId]);

  const formatCurrency = (amount) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full animate-pulse space-y-8">
          <div className="h-6 bg-slate-800 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 h-96 bg-slate-800 rounded-3xl"></div>
            <div className="lg:col-span-5 space-y-4">
              <div className="h-8 bg-slate-800 rounded w-3/4"></div>
              <div className="h-6 bg-slate-800 rounded w-1/3"></div>
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
        <Header />
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
              onClick={() => navigate('/catalog')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-500/25 cursor-pointer"
            >
              Quay Về Trang Mua Sắm
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <Header />

      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-medium text-sm animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="bg-slate-900/90 border-b border-slate-800 sticky top-16 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link to="/catalog" className="hover:text-blue-400 cursor-pointer flex items-center gap-1 transition-colors">
              <Home className="w-3.5 h-3.5" />
              <span>Cửa hàng</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link to={`/catalog?category=${product.category_slug || ''}`} className="hover:text-blue-400 cursor-pointer transition-colors">
              {product.category_name || 'Linh kiện & Thiết bị'}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-bold truncate max-w-xs sm:max-w-md">
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
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
                <span className="font-bold text-sky-400 uppercase">{product.brand}</span>
                <span>•</span>
                <span>Model: {product.model_code || 'Chính hãng'}</span>
              </div>

              <h1 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 text-xs">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-200">4.9</span>
                  <span className="text-slate-400 text-xs">(128 Đánh giá)</span>
                </div>
                <span className="text-slate-700">|</span>
                {selectedVariant && selectedVariant.stock > 0 ? (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 Còn hàng ({selectedVariant.stock} sản phẩm sẵn có)
                  </span>
                ) : (
                  <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                    ✕ Tạm hết hàng
                  </span>
                )}
              </div>
            </div>

            {/* Khung Giá niêm yết */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Giá Niêm Yết
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-sky-400 font-mono">
                  {formatCurrency(selectedVariant?.price || product.base_price)}
                </span>
                {product.base_price && selectedVariant?.price && Number(product.base_price) > Number(selectedVariant.price) && (
                  <span className="text-sm text-slate-500 line-through font-mono">
                    {formatCurrency(product.base_price)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Đã bao gồm VAT & Bảo hành chính hãng {product.warranty_months || 36} tháng
              </p>
            </div>

            {/* Chọn Biến Thể */}
            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
              categorySlug={product.category_slug}
              categoryName={product.category_name}
            />

            {/* Số lượng + Nút Thêm Giỏ Hàng & Mua Ngay */}
            <AddToCartSection
              variant={selectedVariant}
              user={user}
              onRequireLogin={() => setShowAuthModal(true)}
              onAddToCart={(qty) => {
                addToCart(product, selectedVariant, qty);
                showToast(`Đã thêm ${qty}x "${product.name}" vào giỏ hàng!`);
              }}
              onBuyNow={(qty) => {
                addToCart(product, selectedVariant, qty);
                setIsCartOpen(true);
                showToast(`Đang chuyển tới giỏ hàng cho ${qty}x "${product.name}"!`);
              }}
            />

            {/* Chính sách cam kết */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs shadow-sm">
              <div className="flex items-center gap-3 text-slate-300">
                <Truck className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Giao hàng Hỏa Tốc 2H trong nội thành Hà Nội & TP.HCM</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <RotateCcw className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Trả góp 0% qua thẻ tín dụng VietQR / FE Credit</span>
              </div>
              <div className="flex items-center gap-3 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Bảo hành 1 đổi 1 trong 30 ngày nếu có lỗi NSX</span>
              </div>
            </div>

          </div>

        </div>

        {/* Sản phẩm cùng danh mục */}
        <SimilarProductsSlider id={product.id} currentProductId={product.id} />
      </div>

      {/* Modal yêu cầu đăng nhập khi khách click mua hàng */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        productName={product?.name}
      />
    </div>
  );
};

export default ProductDetailPage;
