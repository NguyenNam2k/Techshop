import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Loader2,
  Link as LinkIcon,
  Camera,
  UploadCloud
} from 'lucide-react';
import { api } from '../../services/api';

export default function ReverseImageSearchDropdown({ onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [urlInputValue, setUrlInputValue] = useState('');
  const [isUrlInputMode, setIsUrlInputMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  // Support pasting image directly from clipboard (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            handleProcessFile(blob, 'pasted_screenshot.png');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleProcessFile = (file, customName) => {
    if (!file || !file.type.startsWith('image/')) return;
    const name = customName || file.name || 'uploaded_image.png';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      executeReverseSearchAndRedirect({
        imageName: name
      });
    };
    reader.readAsDataURL(file);
  };

  const executeReverseSearchAndRedirect = async ({
    imageUrl = '',
    imageName = ''
  }) => {
    setLoading(true);
    setLoadingStep('AI đang đối soát hình ảnh với kho dữ liệu...');

    try {
      const response = await api.reverseImageSearch({
        imageUrl,
        imageName,
        limit: 4
      });

      setLoadingStep('Đang chuyển hướng sang trang danh mục sản phẩm...');

      const best = response?.bestMatch;
      const targetCat = best?.category_slug || '';
      let targetSearch = '';

      if (best?.name) {
        targetSearch = best.name;
      } else if (imageName) {
        targetSearch = imageName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }

      const params = new URLSearchParams();
      if (targetCat) params.set('category', targetCat);
      if (targetSearch) params.set('search', targetSearch);
      params.set('source', 'image_search');

      setTimeout(() => {
        onClose();
        navigate(`/catalog?${params.toString()}`);
      }, 350);
    } catch (err) {
      console.error('Reverse image search error:', err);
      // Fallback: navigate to catalog with raw name
      const cleanName = imageName ? imageName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
      const params = new URLSearchParams();
      if (cleanName) params.set('search', cleanName);
      params.set('source', 'image_search');
      onClose();
      navigate(`/catalog?${params.toString()}`);
    }
  };

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!urlInputValue.trim()) return;

    const url = urlInputValue.trim();
    setImagePreview(url);
    setIsUrlInputMode(false);

    executeReverseSearchAndRedirect({
      imageUrl: url,
      imageName: 'image_url.jpg'
    });
  };

  return (
    <div
      className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Dropdown Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm shadow-amber-400/20">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>Tìm Kiếm Bằng Hình Ảnh (AI Lens)</span>
                {/* <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-amber-400/10 text-amber-400 border border-amber-400/30">
                  Visual Search
                </span> */}
            </h4>
            <p className="text-[10px] text-slate-400">
              Tải ảnh để AI đối soát và tự động mở danh mục linh kiện tương ứng
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Đóng (ESC)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Body */}
      <div className="p-4 space-y-3">
        {loading ? (
          /* TRẠNG THÁI ĐANG QUÉT & CHUYỂN HƯỚNG */
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="relative">
              {imagePreview ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden border border-amber-400/60 p-0.5 bg-slate-900 shadow-lg">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-amber-400/15 animate-pulse rounded-xl" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 shadow">
                  <Camera className="w-6 h-6 animate-pulse" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-200">
                <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>{loadingStep || 'AI đang xử lý hình ảnh...'}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Chuẩn bị hiển thị danh mục sản phẩm theo kết quả thị giác
              </p>
            </div>
          </div>
        ) : (
          /* TRẠNG THÁI CHỌN ẢNH (GỌN GÀNG, KHÔNG CÓ PRESET MẪU) */
          <div className="space-y-3">
            {/* Vùng Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleProcessFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-6 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-slate-700 bg-slate-950/40 hover:border-amber-400/50 hover:bg-slate-850/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                }}
              />
              <div className="w-11 h-11 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center mb-2 shadow">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-100">
                Kéo thả ảnh vào đây, hoặc <span className="text-sky-400 underline underline-offset-2">chọn tệp từ máy</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ JPG, PNG, WEBP hoặc bấm <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] border border-slate-700">Ctrl + V</kbd> để dán ảnh chụp màn hình
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUrlInputMode(!isUrlInputMode);
                }}
                className="mt-3 text-[11px] font-semibold text-slate-300 hover:text-sky-400 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 transition flex items-center gap-1.5"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Dán liên kết ảnh (URL)</span>
              </button>
            </div>

            {/* Ô nhập link URL */}
            {isUrlInputMode && (
              <form
                onSubmit={handleUrlSubmit}
                className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 animate-in fade-in"
              >
                <LinkIcon className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder="https://example.com/anh-san-pham.jpg"
                  className="flex-1 bg-transparent border-none text-xs text-slate-100 placeholder-slate-500 outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer transition"
                >
                  Tìm
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="shrink-0 px-4 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Tự động chuyển đến trang Catalog theo kết quả AI</span>
        </div>
        <span>Bấm ESC hoặc click ra ngoài để đóng</span>
      </div>
    </div>
  );
}
