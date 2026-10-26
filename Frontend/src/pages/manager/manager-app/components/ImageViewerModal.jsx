import React from 'react';
import { X } from 'lucide-react';

export default function ImageViewerModal({ isOpen, imageUrl, caption, onClose }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full flex items-center justify-between pb-3">
          <span className="text-xs text-slate-300 font-medium truncate max-w-lg">
            {caption || 'Xem chi tiết hình ảnh'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800/80 hover:bg-rose-500/80 text-white transition-all ml-4"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <img
          src={imageUrl}
          alt={caption || 'Preview'}
          className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-700/60"
        />
      </div>
    </div>
  );
}
