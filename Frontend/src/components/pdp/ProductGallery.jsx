import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, RotateCcw } from 'lucide-react';

const ProductGallery = ({ product, selectedVariant, onVariantSelect }) => {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [lensData, setLensData] = useState({ lensX: 0, lensY: 0, bgX: 0, bgY: 0, containerW: 0, containerH: 0 });
  const containerRef = useRef(null);

  const imagesToShow = (product?.images && product.images.length > 0)
    ? product.images
    : [{ id: 0, image_url: product?.thumbnail_url || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80', angle_label: 'Chính diện' }];

  const currentImageUrl = imagesToShow[mainImageIndex]?.image_url;

  const handlePrev = (e) => {
    e.stopPropagation();
    setMainImageIndex((prev) => (prev === 0 ? imagesToShow.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setMainImageIndex((prev) => (prev === imagesToShow.length - 1 ? 0 : prev + 1));
  };

  const SCALE = 2.5;

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setIsHovering(false);
      return;
    }

    const bgX = -(x * SCALE - 110);
    const bgY = -(y * SCALE - 72);

    setLensData({
      lensX: x,
      lensY: y,
      bgX,
      bgY,
      containerW: rect.width,
      containerH: rect.height
    });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div className="space-y-4">
      {/* Khung ảnh chính */}
      <div
        ref={containerRef}
        className="group relative w-full h-80 sm:h-96 md:h-[460px] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden select-none flex items-center justify-center cursor-crosshair shadow-lg"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <div
          className="flex transition-transform duration-500 ease-out h-full w-full"
          style={{ transform: `translateX(-${mainImageIndex * 100}%)` }}
        >
          {imagesToShow.map((image, index) => (
            <div
              key={`${image.image_url}-${index}`}
              className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 md:p-6"
            >
              <img
                src={image.image_url}
                alt={`${product?.name} - ${image.angle_label || `Góc ${index + 1}`}`}
                className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-200"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

        {/* Zoom Lens */}
        {isHovering && currentImageUrl && lensData.containerW > 0 && (
          <div
            className="pointer-events-none absolute z-30 w-[220px] h-[145px] rounded-2xl border-2 border-sky-500 bg-slate-950 shadow-2xl overflow-hidden hidden md:block"
            style={{
              left: `${lensData.lensX}px`,
              top: `${lensData.lensY}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-full h-full bg-no-repeat"
              style={{
                backgroundImage: `url(${currentImageUrl})`,
                backgroundSize: `${lensData.containerW * SCALE}px ${lensData.containerH * SCALE}px`,
                backgroundPosition: `${lensData.bgX}px ${lensData.bgY}px`,
                backgroundColor: 'transparent'
              }}
            />
          </div>
        )}

        {/* Chỉ số ảnh */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-800/90 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-full text-xs font-mono text-slate-300 shadow-sm pointer-events-none">
          <span>{mainImageIndex + 1} / {imagesToShow.length}</span>
        </div>

        {/* Nút Prev / Next */}
        {imagesToShow.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              onMouseEnter={() => setIsHovering(false)}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              onMouseEnter={() => setIsHovering(false)}
              aria-label="Ảnh kế tiếp"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dấu chấm chỉ báo trang ảnh */}
        {imagesToShow.length > 1 && (
          <div
            onMouseEnter={() => setIsHovering(false)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-sm"
          >
            {imagesToShow.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setMainImageIndex(idx);
                }}
                onMouseEnter={() => setIsHovering(false)}
                aria-label={`Đi tới ảnh ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === mainImageIndex
                    ? 'w-6 bg-sky-500 shadow-sm'
                    : 'w-1.5 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Danh sách Thumbnails */}
      {imagesToShow.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1">
          {imagesToShow.map((image, index) => (
            <button
              key={`${image.image_url}-${index}`}
              onClick={() => setMainImageIndex(index)}
              className={`group relative flex-shrink-0 w-20 h-20 rounded-2xl border-2 overflow-hidden bg-slate-800 p-1.5 transition-all duration-200 cursor-pointer ${
                index === mainImageIndex
                  ? 'border-sky-500 ring-2 ring-sky-500/30'
                  : 'border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-500'
              }`}
            >
              <img
                src={image.image_url}
                alt={`${product?.name} thumbnail ${index + 1}`}
                className="w-full h-full object-contain"
              />
              {image.angle_label && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700 text-[10px] font-medium text-white rounded shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-20">
                  {image.angle_label}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tiêu chuẩn dịch vụ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">100% Chính Hãng</div>
            <div className="text-[11px] text-slate-400">Nguyên seal NSX</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Giao Hỏa Tốc 2H</div>
            <div className="text-[11px] text-slate-400">Nội thành an toàn</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Đổi Mới 30 Ngày</div>
            <div className="text-[11px] text-slate-400">1 đổi 1 do lỗi NSX</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
