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
      showToast(
        data.storage === 'cloudinary'
          ? 'Đã tải ảnh lên Cloudinary CDN thành công!'
          : 'Đã tải ảnh và lưu vào máy cục bộ thành công!',
        'success'
      );
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

            {/* Image Upload Card (Lưu máy / Cloud) */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>3. Hình Ảnh Đại Diện (Thumbnail)</span>
                </h3>
                <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  Lưu máy / Cloudinary
                </span>
              </div>

              {/* Upload file từ máy tính */}
              <div className="space-y-2">
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
                        Hỗ trợ JPEG, PNG, WEBP, SVG (Max: 10MB) · Tự động lưu trữ cục bộ hoặc Cloud CDN
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-cyan-400 text-xs py-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Đang tải ảnh lên hệ thống...</span>
                    </div>
                  )}
                </label>
              </div>

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
                      <span>{formData.thumbnail_url.startsWith('http') ? 'Ảnh đã lưu trên Cloud CDN' : 'Ảnh đã lưu vào máy cục bộ'}</span>
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
