import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Edit,
  Sparkles,
  Check,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

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
    description: ''
  });

  const [errorMsg, setErrorMsg] = useState('');

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
        description: initialData.description || ''
      });
    } else {
      setFormData({
        name: '',
        category_id: categories[0]?.id || '',
        brand: '',
        base_price: '',
        initial_stock: '10',
        sku_code: '',
        description: ''
      });
    }
    setErrorMsg('');
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
      description: ''
    });
    setErrorMsg('');
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
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

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
              placeholder="VD: Bàn phím cơ không dây Akko Mod007v2, Laptop Dell XPS 13..."
              className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            />
          </div>

          {/* 2-Column Row: Category & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Field 2: category_id */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                2. Danh Mục Phần Cứng <span className="text-rose-400">*</span>
              </label>
              <select
                name="category_id"
                required
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
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
                placeholder="VD: ASUS, Logitech, Corsair, Apple..."
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* 2-Column Row: Base Price & Initial Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Field 4: base_price */}
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                4. Giá Niêm Yết (VNĐ) <span className="text-rose-400">*</span>
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

          {/* Field 7: description */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              7. Mô Tả Chi Tiết & Tính Năng
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
              disabled={loading}
              className={`flex-1 py-2.5 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isEditing
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 shadow-cyan-500/20'
              } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
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

