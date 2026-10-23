import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Edit,
  Sparkles,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  CheckCircle,
  Maximize2,
  Trash2,
  Check,
  RotateCcw,
  X
} from 'lucide-react';
import { showToast } from './Toast';

const IMAGE_PRESETS = {
  keyboard: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
  mouse: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
  laptop: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
  monitor: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  gpu: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=600&q=80'
};

const initialFormData = {
  id: '',
  name: '',
  category_id: '',
  brand: '',
  base_price: '',
  initial_stock: '',
  sku_code: '',
  description: '',
  thumbnail_url: ''
};

export default function ProductForm({
  categories = [],
  editingProduct = null,
  onSave,
  onReset,
  onOpenImageViewer
}) {
  const [formData, setFormData] = useState(initialFormData);
  const [imageInputMode, setImageInputMode] = useState('url'); // 'url' | 'upload'
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        id: editingProduct.id || '',
        name: editingProduct.name || '',
        category_id: editingProduct.category_id || '',
        brand: editingProduct.brand || '',
        base_price: editingProduct.base_price ?? '',
        initial_stock: editingProduct.total_stock ?? '',
        sku_code: editingProduct.sku_code || '',
        description: editingProduct.description || '',
        thumbnail_url: editingProduct.thumbnail_url || ''
      });
    } else {
      setFormData(initialFormData);
    }
  }, [editingProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateSku = () => {
    const brand = formData.brand.trim() || 'TECH';
    const prefix = brand.substring(0, 4).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const sku = `${prefix}-${rand}`;
    setFormData((prev) => ({ ...prev, sku_code: sku }));
    showToast(`Đã tự tạo SKU: ${sku}`, 'success');
  };

  const handleApplyPreset = (type) => {
    if (IMAGE_PRESETS[type]) {
      setFormData((prev) => ({ ...prev, thumbnail_url: IMAGE_PRESETS[type] }));
      showToast(`Đã áp dụng mẫu ảnh ${type}`, 'info');
    }
  };

  const handleClearThumbnail = () => {
    setFormData((prev) => ({ ...prev, thumbnail_url: '' }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chỉ tải lên tệp hình ảnh!', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 10MB!', 'error');
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const res = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: uploadData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi tải ảnh');

      setFormData((prev) => ({ ...prev, thumbnail_url: data.data.image_url }));
      showToast('Tải ảnh lên thành công!', 'success');
    } catch (err) {
      showToast(err.message || 'Không thể tải ảnh lên', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Vui lòng nhập tên thiết bị', 'warning');
      return;
    }
    if (!formData.category_id) {
      showToast('Vui lòng chọn danh mục thiết bị', 'warning');
      return;
    }
    if (!formData.brand.trim()) {
      showToast('Vui lòng nhập thương hiệu', 'warning');
      return;
    }
    if (!formData.sku_code.trim()) {
      showToast('Vui lòng nhập mã SKU', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(formData.id);

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 glow-cyan">
      {/* Form Header */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-slate-900/90 to-slate-900/40 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {isEditing ? (
              <Edit className="w-5 h-5 text-amber-400" />
            ) : (
              <PlusCircle className="w-5 h-5 text-cyan-400" />
            )}
            <span>{isEditing ? 'Cập Nhật Thiết Bị' : 'Thêm Thiết Bị Công Nghệ'}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isEditing
              ? `Chỉnh sửa thông tin thiết bị ID #${formData.id}`
              : 'Khởi tạo thiết bị mới và thiết lập tồn kho ban đầu'}
          </p>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            isEditing
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
          }`}
        >
          {isEditing ? 'CHỈNH SỬA' : 'TẠO MỚI'}
        </span>
      </div>

      {/* THE 8-FIELD FORM */}
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Field 1: name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            1. Tên Thiết Bị Công Nghệ <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="VD: Bàn phím cơ AKKO 3087, Laptop Dell XPS 13"
            className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* Field 2: category_id */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            2. Danh Mục Thiết Bị <span className="text-rose-400">*</span>
          </label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
          >
            <option value="">-- Chọn danh mục thiết bị --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Field 3: brand */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            3. Thương Hiệu Sản Xuất <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            required
            placeholder="VD: Logitech, Apple, Asus, Razer, Corsair"
            className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* 2-Column Row: Base Price & Initial Stock */}
        <div className="grid grid-cols-2 gap-3">
          {/* Field 4: base_price */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              4. Giá Niêm Yết (VNĐ) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              name="base_price"
              value={formData.base_price}
              onChange={handleChange}
              min="0"
              step="1000"
              required
              placeholder="VD: 1500000"
              className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          {/* Field 5: initial_stock */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              5. Tồn Kho Ban Đầu <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              name="initial_stock"
              value={formData.initial_stock}
              onChange={handleChange}
              min="0"
              step="1"
              required
              disabled={isEditing}
              placeholder="VD: 50"
              className={`w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all ${
                isEditing ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            />
          </div>
        </div>

        {/* Field 6: sku_code */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">
              6. Mã SKU Quản Lý Kho <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleGenerateSku}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>Tự sinh mã</span>
            </button>
          </div>
          <input
            type="text"
            name="sku_code"
            value={formData.sku_code}
            onChange={handleChange}
            required
            placeholder="VD: KB-AKKO-01, LAPTOP-DELL-XPS13"
            className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
          />
        </div>

        {/* Field 7: description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            7. Mô Tả Chi Tiết & Tính Năng
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Mô tả thông số switch, layout bàn phím, cổng Thunderbolt 4, màn OLED 120Hz..."
            className="w-full px-3.5 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-y"
          ></textarea>
        </div>

        {/* Field 8: Hình ảnh thiết bị (Chỉ tải tệp từ máy - Lưu máy / Cloud) */}
        <div className="border-t border-slate-800/80 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>8. Hình Ảnh Đại Diện (Thumbnail)</span>
            </label>
            <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              Lưu máy / Cloudinary
            </span>
          </div>

          {/* Upload từ máy tính */}
          <div className="space-y-1.5">
            <label className="relative block border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-3.5 text-center cursor-pointer transition-all bg-slate-800/40">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {!isUploading ? (
                <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                  <UploadCloud className="w-6 h-6 text-cyan-400 mb-0.5" />
                  <span className="text-xs font-medium text-slate-200">
                    Nhấn để chọn ảnh từ máy tính
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Hỗ trợ JPEG, PNG, WEBP, SVG (Max: 10MB) · Tự động lưu trữ cục bộ hoặc Cloud CDN
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải ảnh lên hệ thống...</span>
                </div>
              )}
            </label>
          </div>

          {/* Live Image Preview Box */}
          {formData.thumbnail_url && (
            <div className="mt-2.5">
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-700/80 flex items-center gap-3">
                <div
                  className="relative w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-md cursor-pointer"
                  onClick={() => onOpenImageViewer(formData.thumbnail_url, formData.name)}
                >
                  <img
                    src={formData.thumbnail_url}
                    alt="Xem trước ảnh"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{formData.thumbnail_url.startsWith('http') ? 'Ảnh đã lưu trên Cloud CDN' : 'Ảnh đã lưu vào máy cục bộ'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {formData.thumbnail_url}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => onOpenImageViewer(formData.thumbnail_url, formData.name)}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Phóng to</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleClearThumbnail}
                      className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Gỡ bỏ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'Đang xử lý...'
                : isEditing
                ? 'Cập Nhật Thiết Bị'
                : 'Thêm Mới Thiết Bị'}
            </span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center"
            title="Làm mới form"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
