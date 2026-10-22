import React, { useState, useEffect } from 'react';
import {
  Images,
  X,
  Plus,
  Upload,
  Star,
  Trash2,
  Maximize2,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { showToast } from './Toast';

export default function GalleryModal({
  isOpen,
  productId,
  productName,
  onClose,
  onOpenImageViewer,
  onImagesUpdated
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAngleLabel, setNewAngleLabel] = useState('Góc nhìn chi tiết');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchImages = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/images`);
      const data = await res.json();
      if (data.success) {
        setImages(data.data || []);
      }
    } catch (err) {
      showToast('Không thể tải bộ sưu tập ảnh', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && productId) {
      fetchImages();
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  const handleAddImage = async (e) => {
    e?.preventDefault();
    if (!newImageUrl.trim()) {
      showToast('Vui lòng nhập link ảnh hoặc tải tệp lên!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: newImageUrl.trim(),
          angle_label: newAngleLabel.trim() || 'Góc nhìn chi tiết',
          is_primary: images.length === 0 ? 1 : 0
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi thêm ảnh');

      showToast('Đã thêm ảnh vào bộ sưu tập!', 'success');
      setNewImageUrl('');
      fetchImages();
      onImagesUpdated?.();
    } catch (err) {
      showToast(err.message || 'Lỗi thêm ảnh', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      showToast('Đang tải ảnh lên...', 'info');
      const upRes = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: uploadData
      });
      const upData = await upRes.json();
      if (!upData.success) throw new Error(upData.message || 'Lỗi tải ảnh');

      // Add to gallery directly
      const addRes = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: upData.url || upData.data?.image_url,
          angle_label: newAngleLabel.trim() || 'Ảnh chụp thực tế',
          is_primary: images.length === 0 ? 1 : 0
        })
      });
      const addJson = await addRes.json();
      if (!addJson.success) throw new Error(addJson.message || 'Lỗi lưu ảnh');

      showToast('Tải ảnh và lưu vào bộ sưu tập thành công!', 'success');
      fetchImages();
      onImagesUpdated?.();
    } catch (err) {
      showToast(err.message || 'Không thể tải ảnh', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      const res = await fetch(`/api/products/${productId}/images/${imageId}/primary`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi đặt ảnh chính');

      showToast('Đã đặt làm ảnh đại diện chính!', 'success');
      fetchImages();
      onImagesUpdated?.();
    } catch (err) {
      showToast(err.message || 'Lỗi cập nhật ảnh chính', 'error');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Bạn có chắc muốn xóa ảnh này khỏi bộ sưu tập?')) return;

    try {
      const res = await fetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi xóa ảnh');

      showToast('Đã xóa ảnh thành công!', 'success');
      fetchImages();
      onImagesUpdated?.();
    } catch (err) {
      showToast(err.message || 'Lỗi xóa ảnh', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-4xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col max-h-[92vh] animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Bộ Sưu Tập Hình Ảnh Thiết Bị</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-normal border border-cyan-800/50">
                  ID #{productId}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {productName || 'Quản lý góc chụp, ảnh chính & tải thêm hình ảnh chi tiết'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Image Form Section */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
          <form onSubmit={handleAddImage} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Link URL ảnh mới
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... hoặc dùng nút tải tệp bên cạnh"
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nhãn góc chụp / Mô tả ảnh
                </label>
                <input
                  type="text"
                  value={newAngleLabel}
                  onChange={(e) => setNewAngleLabel(e.target.value)}
                  placeholder="VD: Góc nghiêng 45°, Cổng kết nối..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-3 flex items-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-1.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Thêm Ảnh</span>
                </button>

                <label
                  className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs cursor-pointer flex items-center justify-center"
                  title="Tải ảnh từ máy tính"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Gallery Grid Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {loading ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Đang tải bộ sưu tập ảnh...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="w-10 h-10 text-slate-600" />
              <p>Chưa có hình ảnh nào trong bộ sưu tập.</p>
              <span className="text-xs text-slate-500">
                Hãy dán link ảnh hoặc tải tệp lên từ máy tính ở thanh công cụ phía trên.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden flex flex-col hover:border-cyan-400/50 transition-all shadow-md"
                >
                  {/* Image container */}
                  <div
                    className="relative aspect-video w-full bg-slate-900 cursor-pointer overflow-hidden"
                    onClick={() =>
                      onOpenImageViewer(img.image_url, `${productName} - ${img.angle_label}`)
                    }
                  >
                    <img
                      src={img.image_url}
                      alt={img.angle_label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Primary Badge */}
                    {img.is_primary ? (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500 text-slate-950 flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-slate-950" />
                        <span>Ảnh chính</span>
                      </span>
                    ) : null}

                    {/* Zoom Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-6 h-6 text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Info & action bar */}
                  <div className="p-2.5 flex items-center justify-between gap-1 text-xs bg-slate-900/60">
                    <span className="text-slate-300 font-medium truncate" title={img.angle_label}>
                      {img.angle_label || 'Góc chụp'}
                    </span>

                    <div className="flex items-center gap-1">
                      {!img.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img.id)}
                          className="p-1 rounded hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="Đặt làm ảnh chính"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
