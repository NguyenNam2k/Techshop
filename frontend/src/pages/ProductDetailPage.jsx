import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, ChevronRight, Truck, Percent, Wrench, ShieldCheck, Sparkles } from 'lucide-react';
import ProductGallery from '../components/pdp/ProductGallery.jsx';
import VariantSelector from '../components/pdp/VariantSelector.jsx';
import ProductSpecsTable from '../components/pdp/ProductSpecsTable.jsx';
import AddToCartSection from '../components/pdp/AddToCartSection.jsx';
import SimilarProductsSlider from '../components/pdp/SimilarProductsSlider.jsx';

const ProductDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const targetId = location.state?.productId || id || '1';

  useEffect(() => {
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
  }, [targetId]);

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-4xl space-y-6">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-80 bg-slate-800 rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-8 bg-slate-800 rounded w-3/4"></div>
              <div className="h-10 bg-slate-800 rounded w-1/2"></div>
              <div className="h-24 bg-slate-800 rounded-xl"></div>
              <div className="h-12 bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-10 text-center max-w-lg shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-950/60 border border-red-600/50 flex items-center justify-center text-red-400 text-2xl font-bold">
            !
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Không Tìm Thấy Sản Phẩm</h1>
          <p className="text-slate-400 text-sm mb-6">
            Mã hoặc đường dẫn sản phẩm không tồn tại hoặc đã ngừng kinh doanh.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-cyan-500/25"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-xs md:text-sm text-slate-400">
            <Link to="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Trang chủ</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link to="/products" className="hover:text-cyan-400 transition-colors">
              Linh kiện & Gear
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-slate-200 font-medium truncate max-w-[200px] sm:max-w-md">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-8 xl:gap-10 items-start">

          <div className="space-y-8">
            <ProductGallery
              product={product}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
            />

            <ProductSpecsTable specifications={product.specifications} />
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 border border-cyan-700/60 px-2.5 py-1 rounded-lg shadow-sm">
                  {product.brand}
                </span>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                  Model: {product.model_code}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {product.name}
              </h1>
            </div>

            {selectedVariant && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5">
                    Giá bán TechGear:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                      {formatCurrency(selectedVariant.price)}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    SKU: {selectedVariant.sku}
                  </span>
                </div>

                <div>
                  {selectedVariant.stock > 5 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 px-3 py-1.5 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Còn hàng ({selectedVariant.stock})
                    </span>
                  )}
                  {selectedVariant.stock > 0 && selectedVariant.stock <= 5 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-950/80 border border-amber-600/60 text-amber-300 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                      ▲ Sắp hết ({selectedVariant.stock})
                    </span>
                  )}
                  {selectedVariant.stock === 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold bg-rose-950/80 border border-rose-600/60 text-rose-300 px-3 py-1.5 rounded-full shadow-sm">
                      ✕ Tạm hết hàng
                    </span>
                  )}
                </div>
              </div>
            )}

            <VariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantSelect={setSelectedVariant}
            />

            <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/90 border border-cyan-500/20 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <div className="p-1 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>Ưu Đãi & Đặc Quyền Khách Hàng TechGear</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <Truck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Giao tốc hành 2 giờ</strong> nội thành, Freeship đơn từ 2.000.000₫.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <Percent className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Hỗ trợ <strong>trả góp 0% lãi suất</strong> qua thẻ tín dụng và PayLater.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <Wrench className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Hỗ trợ <strong>lắp ráp, update BIOS & tra keo tản nhiệt</strong> trọn đời máy.</span>
                </div>
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/40">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Cam kết chính hãng 100%, <strong>1 đổi 1 trong 30 ngày</strong> nếu phát sinh lỗi NSX.</span>
                </div>
              </div>
            </div>

            <AddToCartSection
              variant={selectedVariant}
              onAddToCart={(qty) => console.log('Add to cart clicked, qty:', qty)}
              onBuyNow={(qty) => console.log('Buy now clicked, qty:', qty)}
            />
          </div>

        </div>

        <SimilarProductsSlider id={product.id} currentProductId={product.id} />
      </div>
    </div>
  );
};

export default ProductDetailPage;