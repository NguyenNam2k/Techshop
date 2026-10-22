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
  ArrowLeft,
  X,
  Layers,
  Info
} from 'lucide-react';
import { showToast } from '../components/Toast';

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

export default function CreateProductView({
  categories = [],
  editingProduct = null,
  onSave,
  onCancel,
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

      const imgUrl = data.url || data.data?.image_url;
      setFormData((prev) => ({ ...prev, thumbnail_url: imgUrl }));
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Catalog</span>
          </button>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isEditing ? (
                <Edit className="w-6 h-6 text-amber-400" />
              ) : (
                <PlusCircle className="w-6 h-6 text-cyan-400" />
              )}
              <span>{isEditing ? 'Chỉnh Sửa Thiết Bị Công Nghệ' : 'Thêm Mới Thiết Bị Công Nghệ'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEditing
                ? `Cập nhật thông số và giá niêm yết cho thiết bị ID #${formData.id}`
                : 'Khởi tạo thông tin phần cứng, mã quản lý kho và tồn kho ban đầu'}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-mono px-3 py-1 rounded-full border ${
            isEditing
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
          }`}
        >
          {isEditing ? 'CHẾ ĐỘ CHỈNH SỬA' : 'TẠO MỚI THIẾT BỊ'}
        </span>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: General Information */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>1. Thông Tin Cơ Bản Thiết Bị</span>
              </h3>

              {/* Field 1: name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên Thiết Bị Công Nghệ <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="VD: Bàn phím cơ AKKO 3087, Laptop Dell XPS 13 OLED"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>

              {/* 2-Column: Category & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 2: category_id */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Danh Mục Phần Cứng <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Thương Hiệu Sản Xuất <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    placeholder="VD: Logitech, Apple, Asus, Razer..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              {/* Field 7: description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mô Tả Chi Tiết & Thông Số Kỹ Thuật
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Mô tả thông số switch, layout bàn phím, cổng Thunderbolt 4, tần số quét màn hình 240Hz, dung lượng pin..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-y"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Inventory & Image */}
          <div className="lg:col-span-5 space-y-6">
            {/* Price & Stock Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>2. Giá Bán & Mã Quản Trị Kho</span>
              </h3>

              {/* Field 6: sku_code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Mã SKU Quản Lý Kho <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tự sinh mã</span>
                  </button>
                </div>
                <input
                  type="text"
                  name="sku_code"
                  value={formData.sku_code}
                  onChange={handleChange}
                  required
                  placeholder="VD: KB-AKKO-01, ROG-G14-WHT"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>

              {/* Price & Stock inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Giá Niêm Yết (VNĐ) <span className="text-rose-400">*</span>
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
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tồn Kho Ban Đầu <span className="text-rose-400">*</span>
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
                    className={`w-full px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all ${
                      isEditing ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  {isEditing && (
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Tồn kho cập nhật qua mục 'Điều chỉnh tồn kho'
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload / URL Card */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>3. Hình Ảnh Đại Diện (Thumbnail)</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setImageInputMode('url')}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                      imageInputMode === 'url'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    Link URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMode('upload')}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded transition-all ${
                      imageInputMode === 'upload'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                    }`}
                  >
                    Tải Tệp Lên
                  </button>
                </div>
              </div>

              {/* Mode 1: URL Input */}
              {imageInputMode === 'url' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="url"
                      name="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/... hoặc /uploads/products/..."
                      className="w-full pl-3.5 pr-8 py-2.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                    />
                    {formData.thumbnail_url && (
                      <button
                        type="button"
                        onClick={handleClearThumbnail}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sample presets */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 pt-0.5">
                    <span className="text-slate-500 font-mono">Gợi ý mẫu:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('keyboard')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all"
                    >
                      Bàn phím
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('mouse')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all"
                    >
                      Chuột
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('laptop')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all"
                    >
                      Laptop
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('monitor')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all"
                    >
                      Màn hình
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('gpu')}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-all"
                    >
                      Card GPU
                    </button>
                  </div>
                </div>
              ) : (
                /* Mode 2: Local File Upload */
                <label className="relative block border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-800/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {!isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-400">
                      <UploadCloud className="w-8 h-8 text-cyan-400 mb-0.5" />
                      <span className="text-xs font-medium text-slate-200">
                        Nhấn để chọn ảnh từ máy tính
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Tự động lưu vào /public/uploads/products/ (Max: 10MB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs py-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang tải ảnh lên hệ thống...</span>
                    </div>
                  )}
                </label>
              )}

              {/* Live Preview */}
              {formData.thumbnail_url && (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 flex items-center gap-3">
                  <div
                    className="relative w-16 h-16 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 shadow-md cursor-pointer"
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
                      <span>Ảnh hiển thị hợp lệ</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      {formData.thumbnail_url}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenImageViewer(formData.thumbnail_url, formData.name)}
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>Phóng to</span>
                      </button>
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
              )}
            </div>
          </div>
        </div>

        {/* Bottom Save & Cancel Bar */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center justify-end gap-3 sticky bottom-4 z-20">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? 'Đang lưu vào hệ thống...'
                : isEditing
                ? 'Lưu Thay Đổi Thiết Bị'
                : 'Khởi Tạo Thiết Bị Mới'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
