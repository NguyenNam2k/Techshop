import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, RotateCcw } from 'lucide-react';

const ProductGallery = ({ product, selectedVariant }) => {
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const imagesToShow =
    product?.images && product.images.length > 0
      ? product.images
      : [
          {
            id: 0,
            image_url:
              product?.thumbnail_url ||
              'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
            angle_label: 'Chính diện'
          }
        ];

  useEffect(() => {
    setMainImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (selectedVariant?.image_url) {
      const idx = imagesToShow.findIndex((img) => img.image_url === selectedVariant.image_url);
      if (idx !== -1) {
        setMainImageIndex(idx);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariant?.id, selectedVariant?.image_url]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setMainImageIndex((prev) => (prev === 0 ? imagesToShow.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setMainImageIndex((prev) => (prev === imagesToShow.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Khung ảnh chính */}
      <div className="group relative w-full h-80 sm:h-96 md:h-[460px] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden select-none flex items-center justify-center shadow-lg">
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

        {/* Chỉ số ảnh */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700 px-2.5 py-1 rounded-full text-xs font-mono text-slate-200 shadow-sm pointer-events-none">
          <span>
            {mainImageIndex + 1} / {imagesToShow.length}
          </span>
        </div>

        {/* Nút Prev / Next */}
        {imagesToShow.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Ảnh kế tiếp"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dấu chấm chỉ báo trang ảnh */}
        {imagesToShow.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 shadow-sm">
            {imagesToShow.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMainImageIndex(idx);
                }}
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

      {/* Danh sách Thumbnails truyền thống (flex-wrap, không thanh cuộn ngang) */}
      {imagesToShow.length > 1 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {imagesToShow.map((image, index) => (
            <button
              key={`${image.image_url}-${index}`}
              type="button"
              onClick={() => setMainImageIndex(index)}
              className={`group relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 overflow-hidden bg-slate-900 p-1.5 transition-all duration-200 cursor-pointer ${
                index === mainImageIndex
                  ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                  : 'border-slate-800 hover:border-sky-400/60 opacity-80 hover:opacity-100 shadow-sm'
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
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate">100% Chính Hãng</div>
            <div className="text-[11px] text-slate-400 font-medium truncate">Nguyên seal NSX</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate">Giao Hỏa Tốc 2H</div>
            <div className="text-[11px] text-slate-400 font-medium truncate">Nội thành an toàn</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-100 truncate">Đổi Mới 30 Ngày</div>
            <div className="text-[11px] text-slate-400 font-medium truncate">1 đổi 1 lỗi NSX</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
