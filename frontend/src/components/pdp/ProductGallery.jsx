import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Zap, RotateCcw } from 'lucide-react';

const ProductGallery = ({ product, selectedVariant, onVariantSelect }) => {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lensData, setLensData] = useState({
    lensX: 0,
    lensY: 0,
    bgX: 0,
    bgY: 0,
    containerW: 0,
    containerH: 0
  });
  const containerRef = useRef(null);

  const LENS_WIDTH = 220;
  const LENS_HEIGHT = 145;
  const SCALE = 2.5;

  const variantImages = selectedVariant?.image_url
    ? [{ image_url: selectedVariant.image_url, angle_label: selectedVariant.color ? `Bản ${selectedVariant.color}` : 'Góc chính', is_primary: true, sort_order: 0 }]
    : [];

  const productImages = product?.images || [];
  const allImages = [...variantImages, ...productImages]
    .filter((img, index, self) =>
      index === self.findIndex(t => t.image_url === img.image_url)
    )
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const imagesToShow = allImages.length > 0 ? allImages :
    [{ image_url: product?.thumbnail_url || '/placeholder.jpg', angle_label: 'Ảnh sản phẩm', is_primary: true, sort_order: 0 }];

  useEffect(() => {
    if (selectedVariant?.image_url) {
      const idx = imagesToShow.findIndex(img => img.image_url === selectedVariant.image_url);
      if (idx !== -1) {
        setMainImageIndex(idx);
      }
    }
  }, [selectedVariant]);

  useEffect(() => {
    if (imagesToShow.length <= 1 || isPaused || isHovering) return;

    const interval = setInterval(() => {
      setMainImageIndex((prevIndex) => (prevIndex + 1) % imagesToShow.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [imagesToShow.length, isPaused, isHovering]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setMainImageIndex((prevIndex) => (prevIndex - 1 + imagesToShow.length) % imagesToShow.length);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setMainImageIndex((prevIndex) => (prevIndex + 1) % imagesToShow.length);
  };

  const handleMouseMove = (e) => {
    if (e.target.closest('button') || e.target.closest('.no-magnify')) {
      if (isHovering) setIsHovering(false);
      return;
    }

    if (!isHovering) {
      setIsHovering(true);
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left;
    const pixelY = e.clientY - rect.top;
    const halfW = LENS_WIDTH / 2;
    const halfH = LENS_HEIGHT / 2;
    const clampedLensX = Math.max(halfW, Math.min(rect.width - halfW, pixelX));
    const clampedLensY = Math.max(halfH, Math.min(rect.height - halfH, pixelY));
    const bgX = halfW - pixelX * SCALE;
    const bgY = halfH - pixelY * SCALE;

    setLensData({
      lensX: clampedLensX,
      lensY: clampedLensY,
      bgX,
      bgY,
      containerW: rect.width,
      containerH: rect.height
    });
  };

  const handleMouseEnter = (e) => {
    setIsPaused(true);
    if (!e.target.closest('button')) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsPaused(false);
  };

  const currentImageUrl = imagesToShow[mainImageIndex]?.image_url;

  return (
    <div className="space-y-4 select-none">
  
      <div 
        ref={containerRef}
        className="relative group rounded-3xl border border-slate-200 dark:border-slate-800 bg-[#F1F5F9] dark:bg-slate-900 shadow-inner overflow-hidden flex items-center justify-center p-6 cursor-crosshair h-96 sm:h-[420px] transition-colors"
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
        {isHovering && currentImageUrl && lensData.containerW > 0 && (
          <div
            className="pointer-events-none absolute z-30 w-[220px] h-[145px] rounded-2xl border-2 border-sky-500 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden hidden md:block"
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

        <div className="no-magnify absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full text-xs font-mono text-slate-700 dark:text-slate-300 shadow-sm pointer-events-none">
          <span>{mainImageIndex + 1} / {imagesToShow.length}</span>
        </div>

        {imagesToShow.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              onMouseEnter={() => setIsHovering(false)}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              onMouseEnter={() => setIsHovering(false)}
              aria-label="Ảnh kế tiếp"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-40 p-2.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 transform hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {imagesToShow.length > 1 && (
          <div 
            onMouseEnter={() => setIsHovering(false)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
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
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {imagesToShow.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {imagesToShow.map((image, index) => (
            <button
              key={`${image.image_url}-${index}`}
              onClick={() => setMainImageIndex(index)}
              className={`group relative flex-shrink-0 w-20 h-20 rounded-2xl border-2 overflow-hidden bg-[#F1F5F9] dark:bg-slate-900 p-1.5 transition-all duration-200 cursor-pointer ${
                index === mainImageIndex
                  ? 'border-sky-500 ring-2 ring-sky-500/30'
                  : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100 hover:border-slate-400 dark:hover:border-slate-600'
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
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">100% Chính Hãng</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Nguyên seal NSX</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-100 dark:border-sky-900/60">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Giao Hỏa Tốc 2H</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Nội thành an toàn</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Đổi Mới 30 Ngày</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">1 đổi 1 do lỗi NSX</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;