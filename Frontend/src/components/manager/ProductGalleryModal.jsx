import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  UploadCloud,
  Image as ImageIcon,
  Star,
  Trash2,
  Maximize2,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  Sparkles
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

function ProductGalleryModal({
  isOpen,
  onClose,
  product = null,
  onGalleryUpdated
}) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [angleLabel, setAngleLabel] = useState('Góc nhìn thực tế');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const fileInputRef = useRef(null);

  const productId = product?.id;
  const productName = product?.name || 'Sản phẩm';

  // Fetch product images when modal opens
  useEffect(() => {
    if (isOpen && productId) {
      fetchImages();
      setErrorMsg('');
      setSuccessMsg('');
    } else {
      setImages([]);
      setPreviewImage(null);
    }
  }, [isOpen, productId]);

  const fetchImages = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/products/${productId}/images`);
      if (res.data?.success) {
        setImages(res.data.data || []);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải bộ sưu tập ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chỉ tải lên tệp định dạng hình ảnh (JPG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa cho phép là 10MB.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      // 1. Tải ảnh lên Cloudinary qua POST /api/products/upload-image
      const uploadRes = await axiosInstance.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (!uploadRes.data?.success) {
        throw new Error(uploadRes.data?.message || 'Lỗi khi tải ảnh lên Cloud');
      }

      const imageUrl = uploadRes.data.url;
      const publicId = uploadRes.data.public_id || null;

      // 2. Lưu liên kết ảnh vào CSDL qua POST /api/products/:id/images
      const addRes = await axiosInstance.post(`/products/${productId}/images`, {
        image_url: imageUrl,
        public_id: publicId,
        angle_label: angleLabel.trim() || 'Góc nhìn thực tế',
        is_primary: images.length === 0 ? 1 : 0
      });

      if (!addRes.data?.success) {
        throw new Error(addRes.data?.message || 'Lỗi khi lưu ảnh vào cơ sở dữ liệu');
      }

      setSuccessMsg('Tải ảnh lên Cloudinary và lưu vào bộ sưu tập thành công!');
      fetchImages();
      onGalleryUpdated?.();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải ảnh lên');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSetPrimary = async (imageId) => {
    setActionLoadingId(imageId);
    setErrorMsg('');
    try {
      const res = await axiosInstance.patch(`/products/${productId}/images/${imageId}/primary`);
      if (res.data?.success) {
        setSuccessMsg('Đã đặt làm ảnh đại diện chính của thiết bị!');
        fetchImages();
        onGalleryUpdated?.();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi cập nhật ảnh chính');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi bộ sưu tập và Cloud?')) {
      return;
    }

    setActionLoadingId(imageId);
    setErrorMsg('');
    try {
      const res = await axiosInstance.delete(`/products/${productId}/images/${imageId}`);
      if (res.data?.success) {
        setSuccessMsg('Đã xóa hình ảnh khỏi hệ thống!');
        fetchImages();
        onGalleryUpdated?.();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi xóa ảnh');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Bộ Sưu Tập Hình Ảnh
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  ID #{productId}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                {productName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Upload Control Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nhãn góc chụp / Mô tả góc ảnh:</span>
              </label>
              <input
                type="text"
                value={angleLabel}
                onChange={(e) => setAngleLabel(e.target.value)}
                placeholder="VD: Mặt trước, Cổng kết nối Type-C, Hộp và phụ kiện..."
                className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div className="flex items-end">
              <label
                className={`w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <UploadCloud className="w-4 h-4 text-slate-950" />
                )}
                <span>{uploading ? 'Đang tải lên Cloud...' : 'Tải Ảnh Lên Cloud'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ảnh được tải lên máy chủ Cloudinary lưu trữ đám mây tự động tối ưu hóa tốc độ CDN.</span>
          </div>
        </div>

        {/* Gallery Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs">Đang tải danh sách ảnh từ máy chủ...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                <ImageIcon className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-300">
                Chưa có ảnh nào trong bộ sưu tập
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                Hãy nhấn nút "Tải Ảnh Lên Cloud" ở thanh công cụ bên trên để thêm hình ảnh góc chụp chi tiết cho sản phẩm này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {images.map((img) => {
                const isPrimary = Boolean(img.is_primary);
                const isOperating = actionLoadingId === img.id;

                return (
                  <div
                    key={img.id}
                    className="group relative bg-slate-800/80 rounded-xl border border-slate-700/80 overflow-hidden flex flex-col hover:border-cyan-500/50 transition-all shadow-md"
                  >
                    {/* Image Box */}
                    <div
                      className="relative aspect-video w-full bg-slate-950 cursor-pointer overflow-hidden flex items-center justify-center"
                      onClick={() => setPreviewImage(img.image_url)}
                      title="Nhấn để xem ảnh phóng to"
                    >
                      <img
                        src={img.image_url}
                        alt={img.angle_label || 'Ảnh thiết bị'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />

                      {/* Primary Badge */}
                      {isPrimary && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500 text-slate-950 flex items-center gap-1 shadow-md">
                          <Star className="w-3 h-3 fill-slate-950" />
                          <span>Ảnh chính</span>
                        </span>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-3 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between gap-1 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="text-slate-200 font-medium truncate text-xs" title={img.angle_label}>
                          {img.angle_label || 'Góc nhìn thực tế'}
                        </p>
                        {img.public_id && (
                          <span className="text-[10px] text-cyan-400/80 font-mono block truncate" title={img.public_id}>
                            Cloud
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isPrimary && (
                          <button
                            type="button"
                            disabled={isOperating}
                            onClick={() => handleSetPrimary(img.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-400 border border-slate-700/60 transition-colors cursor-pointer"
                            title="Đặt làm ảnh đại diện chính"
                          >
                            {isOperating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Star className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isOperating}
                          onClick={() => handleDeleteImage(img.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors cursor-pointer"
                          title="Xóa ảnh khỏi bộ sưu tập và Cloud"
                        >
                          {isOperating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Tổng số: <strong className="text-white font-mono">{images.length}</strong> hình ảnh</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Lightbox / Zoom View */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-300">
              <span className="font-medium truncate">{productName} - Xem ảnh chi tiết</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-rose-500 text-white transition-colors ml-4 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductGalleryModal;
