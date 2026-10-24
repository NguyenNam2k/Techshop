import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  PlusCircle,
  Edit,
  Sparkles,
  Check,
  RotateCcw,
  AlertCircle,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Cloud,
  Link as LinkIcon
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

function ProductFormModal({
  isOpen,
  onClose,
  initialData = null,
  categories = [],
  onSubmit,
  loading = false
}) {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    brand: '',
    base_price: '',
    initial_stock: '',
    sku_code: '',
    description: '',
    thumbnail_url: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  // Populate or reset form whenever initialData changes or modal opens
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        category_id: initialData.category_id || (categories[0]?.id || ''),
        brand: initialData.brand || '',
        base_price: initialData.base_price ? Math.round(initialData.base_price) : '',
        initial_stock: initialData.total_stock ?? 0,
        sku_code: initialData.sku_code || (initialData.default_variant?.sku || ''),
        description: initialData.description || '',
        thumbnail_url: initialData.thumbnail_url || initialData.thumbnail || initialData.image_url || ''
      });
    } else {
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        brand: '',
        base_price: '',
        initial_stock: '10',
        sku_code: '',
        description: '',
        thumbnail_url: ''
      });
    }
    setErrorMsg('');
    setShowUrlInput(false);
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Generate quick SKU code based on brand
  const handleGenerateSku = () => {
    const brand = formData.brand.trim() || 'TECH';
    const prefix = brand.substring(0, 4).toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const generatedSku = `${prefix}-${rand}`;
    setFormData((prev) => ({ ...prev, sku_code: generatedSku }));
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      brand: '',
      base_price: '',
      initial_stock: '10',
      sku_code: '',
      description: '',
      thumbnail_url: ''
    });
    setErrorMsg('');
    setShowUrlInput(false);
  };

  // Upload image directly to Cloudinary
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Vui lòng chọn đúng tệp hình ảnh (JPG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Kích thước ảnh tối đa cho phép là 10MB.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');

    const uploadPayload = new FormData();
    uploadPayload.append('image', file);

    try {
      const res = await axiosInstance.post('/products/upload-image', uploadPayload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        const uploadedUrl = res.data.url || res.data.data?.image_url;
        setFormData((prev) => ({
          ...prev,
          thumbnail_url: uploadedUrl
        }));
      } else {
        throw new Error(res.data?.message || 'Lỗi khi tải ảnh lên Cloud');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Không thể tải ảnh lên');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, thumbnail_url: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Tên thiết bị không được để trống.');
      return;
    }
    if (!formData.category_id) {
      setErrorMsg('Vui lòng chọn danh mục thiết bị.');
      return;
    }
    if (!formData.brand.trim()) {
      setErrorMsg('Thương hiệu không được để trống.');
      return;
    }
    if (formData.base_price === '' || Number(formData.base_price) < 0) {
      setErrorMsg('Giá niêm yết cơ sở phải là số >= 0.');
      return;
    }
    if (!isEditing && (formData.initial_stock === '' || Number(formData.initial_stock) < 0)) {
      setErrorMsg('Số lượng tồn kho ban đầu phải là số nguyên >= 0.');
      return;
    }
    if (!formData.sku_code.trim()) {
      setErrorMsg('Mã SKU quản lý kho không được để trống.');
      return;
    }

    onSubmit({
      ...formData,
      base_price: Number(formData.base_price),
      initial_stock: isEditing ? undefined : parseInt(formData.initial_stock, 10),
      category_id: parseInt(formData.category_id, 10),
      thumbnail_url: formData.thumbnail_url?.trim() || null,
      id: initialData?.id
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isEditing
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                  : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
              }`}
            >
              {isEditing ? <Edit className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isEditing ? `Chỉnh Sửa Thiết Bị #${initialData?.id}` : 'Thêm Thiết Bị Công Nghệ'}
                </h3>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isEditing
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  {isEditing ? 'CHẾ ĐỘ SỬA' : 'TẠO MỚI'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditing
                  ? 'Cập nhật thông tin cơ bản & đồng bộ giá biến thể trên hệ thống'
                  : 'Khởi tạo thiết bị mới và thiết lập số lượng tồn kho ban đầu'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Field 1: name */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              1. Tên Thiết Bị Công Nghệ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="VD: Bàn phím cơ AKKO 3087, Chuột Gaming Logitech G502..."
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Grid 2 Columns: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 2: category_id */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                2. Danh Mục Thiết Bị <span className="text-rose-400">*</span>
              </label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-all cursor-pointer"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 3: brand */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                3. Thương Hiệu Sản Xuất <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="brand"
                required
                value={formData.brand}
                onChange={handleChange}
                placeholder="VD: Logitech, Asus, Apple, Corsair..."
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Grid 2 Columns: Base Price & Initial Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Field 4: base_price */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                4. Giá Niêm Yết Cơ Sở (VNĐ) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="base_price"
                min="0"
                step="1000"
                required
                value={formData.base_price}
                onChange={handleChange}
                placeholder="VD: 1500000"
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            {/* Field 5: initial_stock */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                5. Tồn Kho Ban Đầu {isEditing ? '(Khóa)' : <span className="text-rose-400">*</span>}
              </label>
              <input
                type="number"
                name="initial_stock"
                min="0"
                step="1"
                required={!isEditing}
                disabled={isEditing}
                value={formData.initial_stock}
                onChange={handleChange}
                placeholder="VD: 50"
                className={`w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 transition-all ${
                  isEditing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              {isEditing && (
                <p className="text-[10px] text-amber-400/90 mt-1">
                  * Tồn kho trong chế độ sửa được cập nhật qua nút "Điều chỉnh kho".
                </p>
              )}
            </div>
          </div>

          {/* Field 6: sku_code with Auto-Generate Helper */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300">
                6. Mã SKU Quản Lý Kho <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Tự sinh mã</span>
              </button>
            </div>
            <input
              type="text"
              name="sku_code"
              required
              value={formData.sku_code}
              onChange={handleChange}
              placeholder="VD: KB-AKKO-01, LAPTOP-DELL-XPS13"
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Field 7: thumbnail_url - Direct Cloud Upload */}
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span>7. Hình Ảnh Đại Diện (Cloud Storage)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                <span>{showUrlInput ? 'Thu gọn link URL' : 'Nhập URL trực tiếp'}</span>
              </button>
            </div>

            {/* Image Preview or Upload Zone */}
            {formData.thumbnail_url ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={formData.thumbnail_url}
                    alt="Product Thumbnail Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/50 mb-1">
                    <Cloud className="w-3 h-3" />
                    <span>Lưu trữ Cloudinary</span>
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono truncate" title={formData.thumbnail_url}>
                    {formData.thumbnail_url}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium cursor-pointer transition-colors"
                    title="Tải ảnh khác thay thế"
                  >
                    <span>Thay ảnh</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 transition-all text-center bg-slate-900/40">
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                    <p className="text-xs text-cyan-300 font-medium">Đang tải ảnh lên Cloudinary...</p>
                    <p className="text-[10px] text-slate-400">Vui lòng chờ trong giây lát</p>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200">
                      Chọn hình ảnh thiết bị từ máy tính của bạn
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                      Hỗ trợ JPG, PNG, WebP (Tối đa 10MB) - Tự động tải lên Cloud
                    </p>
                    <label className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center gap-2 cursor-pointer">
                      <UploadCloud className="w-4 h-4" />
                      <span>Chọn Tệp Hình Ảnh</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {/* Manual URL Input Fallback */}
            {showUrlInput && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  placeholder="https://... (Dán link URL ảnh nếu không muốn tải tệp)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            )}
          </div>

          {/* Field 8: description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              8. Mô Tả Chi Tiết & Tính Năng
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả thông số switch cơ, layout bàn phím, cổng kết nối, màn hình OLED 120Hz..."
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all resize-y"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center gap-2 border-t border-slate-800">
            <button
              type="submit"
              disabled={loading || isUploading}
              className={`flex-1 py-2.5 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isEditing
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 shadow-cyan-500/20'
              } ${loading || isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Lưu Thay Đổi' : 'Thêm Mới Thiết Bị'}</span>
            </button>

            {!isEditing && (
              <button
                type="button"
                onClick={handleResetForm}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all flex items-center justify-center cursor-pointer"
                title="Làm mới form"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
