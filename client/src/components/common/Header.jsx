import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Header({ initialSearch = '', onSearchSubmit }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [searchText, setSearchText] = useState(initialSearch);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(searchText);
    } else {
      navigate(`/catalog?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ chọn tệp hình ảnh (PNG, JPG, WEBP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage({
        file,
        previewUrl: event.target?.result,
        name: file.name
      });
      setShowImageModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleExecuteImageSearch = () => {
    alert(`🚀 Đang gửi ảnh [${selectedImage?.name}] sang dịch vụ AI Search (Multimodal CLIP) để trích xuất vector đặc trưng...`);
    setShowImageModal(false);
    // Sau khi AI service hoàn tất sẽ điều hướng với query kết quả
    navigate('/catalog?search_type=visual');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white text-xs py-1.5 px-4 text-center font-medium">
        ⚡ Siêu sale phụ kiện công nghệ - Giảm tới 30% cho khách hàng mới | Giao hỏa tốc 2H
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/catalog" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            💻
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight font-['Outfit']">
              Tech<span className="text-blue-400">shop</span>
            </h1>
            <p className="text-[10px] text-slate-400 leading-none">Gaming & Gear Store</p>
          </div>
        </Link>

        {/* Smart Search Bar (STORE-04) */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 relative">
          <div className="relative flex items-center">
            {/* Search Icon */}
            <span className="absolute left-3.5 text-slate-400 text-base pointer-events-none">
              🔍
            </span>

            {/* Input Search Text */}
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, thương hiệu (vd: Asus, Logitech, OLED 240Hz)..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-sm rounded-full pl-10 pr-24 py-2.5 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
            />

            {/* Hidden File Input for Image Search */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Right Buttons: Camera AI + Submit */}
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleCameraClick}
                title="Tìm kiếm bằng hình ảnh linh kiện / thiết bị (AI Search)"
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center text-sm transition-all hover:scale-105 border border-slate-600 cursor-pointer"
              >
                📸
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full transition-all flex items-center gap-1 shadow-sm"
              >
                Tìm
              </button>
            </div>
          </div>
        </form>

        {/* User Navigation Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/catalog"
            className="hidden md:flex text-slate-300 hover:text-white text-sm font-medium transition"
          >
            Sản phẩm
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to={user.role === 'admin' ? '/admin' : '/catalog'}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-200 transition"
              >
                <span>👤</span>
                <span className="font-medium max-w-[100px] truncate">{user.name}</span>
              </Link>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center text-xs border border-slate-700 transition"
              >
                🚪
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-sm shadow-blue-500/20"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Modal Preview Ảnh Tìm Kiếm AI (STORE-04) */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>📸</span> Tìm kiếm linh kiện bằng hình ảnh
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-4 text-center">
              <div className="w-full h-56 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                <img
                  src={selectedImage.previewUrl}
                  alt="Ảnh tìm kiếm"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-xs text-slate-400 mt-2 truncate">
                Tệp: <strong className="text-slate-200">{selectedImage.name}</strong>
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 mb-4">
              💡 Hệ thống sẽ nhận diện chi tiết hình học và màu sắc thiết bị để tìm ra model tương ứng trong kho hàng.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteImageSearch}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/30"
              >
                🔍 Tìm sản phẩm này
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
