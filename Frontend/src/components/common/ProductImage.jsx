import React, { useState, useEffect } from 'react';
import { Laptop } from 'lucide-react';

const CLOUDINARY_CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'zrnhpe6p';
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=80';

/**
 * Chuẩn hóa URL ảnh:
 * - Nếu là URL tuyệt đối (http/https/data:/...) -> giữ nguyên
 * - Nếu là đường dẫn tương đối nội bộ (/...) -> giữ nguyên
 * - Nếu là Cloudinary public_id hoặc tên ảnh trong kho (ví dụ: 'products/xyz' hoặc 'products/laptop.jpg')
 *   -> Tự động gắn tiền tố CDN Cloudinary của nhóm: https://res.cloudinary.com/zrnhpe6p/image/upload/...
 */
export function resolveImageUrl(path, cloudName = CLOUDINARY_CLOUD_NAME) {
  if (!path || typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  if (/^(https?:|data:|\/\/)/i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${trimmed}`;
}

/**
 * Component ProductImage thông minh:
 * - Tự động trích xuất ảnh chuẩn từ `product.thumbnail_url`, `product.image_url`, `product.image`, hoặc `product.images[0]`.
 * - Tự động nhận diện và ghép URL Cloudinary nhóm (`zrnhpe6p`) nếu dữ liệu truyền vào là public_id / tên ảnh.
 * - Tự động chuyển sang ảnh dự phòng (Fallback) nếu ảnh Cloud hoặc mạng bị lỗi tải.
 * - Hiển thị icon placeholder công nghệ nếu hoàn toàn không có ảnh.
 * 
 * Cách dùng:
 *   <ProductImage product={product} className="..." />
 *   <ProductImage src="https://..." alt="iPhone 18" />
 *   <ProductImage src="products/macbook-pro" alt="MacBook" />
 */
function ProductImage({
  product = null,
  src = null,
  alt = '',
  className = '',
  fallbackSrc = DEFAULT_FALLBACK_IMAGE,
  loading = 'lazy',
  onLoad,
  onError,
  ...props
}) {
  // 1. Tự động tìm nguồn ảnh tốt nhất từ object product hoặc src truyền vào
  const rawSrc =
    src ||
    product?.thumbnail_url ||
    product?.image_url ||
    product?.thumbnail ||
    product?.image ||
    product?.images?.[0]?.image_url ||
    null;

  const resolvedSrc = resolveImageUrl(rawSrc);
  const resolvedAlt = alt || product?.name || 'Sản phẩm TechShop';

  const [currentSrc, setCurrentSrc] = useState(resolvedSrc || fallbackSrc);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cập nhật lại nguồn ảnh khi product hoặc src thay đổi
  useEffect(() => {
    const nextSrc = resolvedSrc || fallbackSrc;
    setCurrentSrc(nextSrc);
    setHasError(!resolvedSrc && !fallbackSrc);
    setIsLoaded(false);
  }, [resolvedSrc, fallbackSrc]);

  const handleImageError = (e) => {
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      // Thử đổi sang ảnh dự phòng nếu nguồn ảnh ban đầu bị lỗi
      setCurrentSrc(fallbackSrc);
    } else {
      // Nếu ngay cả ảnh dự phòng cũng lỗi -> chuyển sang chế độ hiển thị icon Placeholder
      setHasError(true);
    }
    onError?.(e);
  };

  const handleImageLoad = (e) => {
    setIsLoaded(true);
    onLoad?.(e);
  };

  // Nếu hoàn toàn không thể tải ảnh -> hiển thị khung placeholder công nghệ sang trọng
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-600 rounded-xl ${className}`}
        title={resolvedAlt}
      >
        <Laptop className="w-8 h-8 opacity-60 text-slate-500" />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={resolvedAlt}
      loading={loading}
      onLoad={handleImageLoad}
      onError={handleImageError}
      className={`${className} ${!isLoaded ? 'opacity-80 transition-opacity duration-300' : 'opacity-100 transition-opacity duration-300'}`}
      {...props}
    />
  );
}

export default ProductImage;
