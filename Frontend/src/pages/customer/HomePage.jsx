import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  Wrench,
  ArrowRight,
  Star,
  ShoppingCart,
  CheckCircle2,
  ChevronRight,
  Laptop,
  Monitor,
  Cpu,
  HardDrive,
  Keyboard,
  Mouse,
  Headphones,
  Box,
  Zap,
  Tag,
  Loader2,
  CircuitBoard,
  Fan,
  Square,
  Armchair,
  Mic,
  Volume2,
  Wifi,
  Sparkles,
  X,
  SlidersHorizontal,
  Gpu,
  MemoryStick
} from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

// Danh sách 18 danh mục chuẩn xác 100% kèm thông tin Mega Menu khi hover
const FULL_CATEGORIES = [
  {
    id: 1,
    slug: 'gpus',
    name: 'VGA - Card Màn Hình',
    icon: Gpu,
    color: 'text-cyan-500',
    brands: ['ASUS ROG', 'MSI', 'Gigabyte', 'ZOTAC', 'Sapphire'],
    series: ['NVIDIA RTX 4090', 'RTX 4080 Super', 'RTX 4070 Super', 'RTX 4060 Ti', 'AMD Radeon RX 7000'],
    priceRanges: ['Dưới 10 Triệu', '10 - 20 Triệu', '20 - 40 Triệu', 'Trên 40 Triệu']
  },
  {
    id: 2,
    slug: 'cpus',
    name: 'CPU - Vi Xử Lý',
    icon: Cpu,
    color: 'text-indigo-500',
    brands: ['Intel', 'AMD'],
    series: ['Intel Core i9 14900K', 'Core i7 14700K', 'Core i5 14600K', 'Ryzen 7 7800X3D', 'Ryzen 9 7950X3D'],
    priceRanges: ['Dưới 5 Triệu', '5 - 8 Triệu', '8 - 15 Triệu', 'Trên 15 Triệu']
  },
  {
    id: 3,
    slug: 'motherboards',
    name: 'Bo Mạch Chủ (Mainboard)',
    icon: CircuitBoard,
    color: 'text-blue-500',
    brands: ['ASUS', 'MSI', 'Gigabyte', 'ASRock'],
    series: ['Intel Z790 Flagship', 'Intel B760 Tầm Trung', 'AMD X670E / X670', 'AMD B650E / B650', 'Chuẩn ATX / mATX'],
    priceRanges: ['Dưới 3 Triệu', '3 - 6 Triệu', '6 - 12 Triệu', 'Trên 12 Triệu']
  },
  {
    id: 4,
    slug: 'ram',
    name: 'RAM - Bộ Nhớ Trong',
    icon: MemoryStick,
    color: 'text-teal-500',
    brands: ['Corsair', 'Kingston', 'G.Skill', 'TeamGroup'],
    series: ['RAM DDR5 6000MHz+', 'RAM DDR4 3600MHz', 'Kit 32GB (2x16GB)', 'Kit 64GB (2x32GB)', 'LED RGB Tản Nhiệt'],
    priceRanges: ['Dưới 1.5 Triệu', '1.5 - 3 Triệu', '3 - 6 Triệu', 'Trên 6 Triệu']
  },
  {
    id: 5,
    slug: 'storage',
    name: 'Ổ Cứng SSD / NVMe',
    icon: HardDrive,
    color: 'text-emerald-500',
    brands: ['Samsung', 'WD', 'Kingston', 'Crucial'],
    series: ['PCIe Gen 5.0 Siêu Tốc', 'PCIe Gen 4.0 NVMe', 'Dung lượng 1TB / 2TB', 'Dung lượng 4TB Khổng Lồ', 'Kèm Heatsink Tản Nhiệt'],
    priceRanges: ['Dưới 2 Triệu', '2 - 4 Triệu', '4 - 8 Triệu', 'Trên 8 Triệu']
  },
  {
    id: 6,
    slug: 'cases',
    name: 'Vỏ Case Máy Tính',
    icon: Box,
    color: 'text-purple-500',
    brands: ['Lian Li', 'NZXT', 'Corsair', 'Cooler Master'],
    series: ['Bể Cá Panorama (O11 / H9)', 'Mid Tower Airflow', 'Case White Edition', 'Mini-ITX / SFF Nhỏ Gọn'],
    priceRanges: ['Dưới 1.5 Triệu', '1.5 - 3 Triệu', '3 - 6 Triệu', 'Trên 6 Triệu']
  },
  {
    id: 7,
    slug: 'power-supplies',
    name: 'Nguồn Máy Tính (PSU)',
    icon: Zap,
    color: 'text-amber-500',
    brands: ['Corsair', 'Seasonic', 'Cooler Master', 'be quiet!'],
    series: ['Chuẩn ATX 3.0 / PCIe 5.0', 'Công suất 750W - 850W', 'Công suất 1000W - 1200W', 'Chứng nhận 80 Plus Gold / Platinum'],
    priceRanges: ['Dưới 2 Triệu', '2 - 4 Triệu', '4 - 7 Triệu', 'Trên 7 Triệu']
  },
  {
    id: 8,
    slug: 'cooling',
    name: 'Tản Nhiệt CPU / Water',
    icon: Fan,
    color: 'text-teal-600',
    brands: ['NZXT', 'DeepCool', 'Corsair', 'Thermalright'],
    series: ['Tản Nước AIO 360mm', 'Tản Nước AIO 240mm', 'Màn Hình LCD / ARGB', 'Tản Khí Tháp Đôi 120mm'],
    priceRanges: ['Dưới 1 Triệu', '1 - 3 Triệu', '3 - 6 Triệu', 'Trên 6 Triệu']
  },
  {
    id: 9,
    slug: 'monitors',
    name: 'Màn Hình Gaming',
    icon: Monitor,
    color: 'text-rose-500',
    brands: ['ASUS ROG', 'LG UltraGear', 'Samsung Odyssey', 'AOC', 'Gigabyte'],
    series: ['Màn Hình OLED 240Hz', 'Độ Phân Giải 4K UHD', 'Độ Phân Giải 2K QHD', 'Màn Hình Cong Ultrawide 34 inch', 'Esports 360Hz - 390Hz'],
    priceRanges: ['Dưới 5 Triệu', '5 - 10 Triệu', '10 - 20 Triệu', 'Trên 20 Triệu']
  },
  {
    id: 10,
    slug: 'mice',
    name: 'Chuột Gaming Esports',
    icon: Mouse,
    color: 'text-sky-500',
    brands: ['Logitech G', 'Razer', 'SteelSeries', 'Glorious'],
    series: ['Chuột Không Dây Siêu Nhẹ', 'Cảm biến 32.000 DPI', 'Form Công Thái Học', 'Tần số Polling Rate 4000Hz'],
    priceRanges: ['Dưới 1 Triệu', '1 - 2.5 Triệu', '2.5 - 4 Triệu', 'Trên 4 Triệu']
  },
  {
    id: 11,
    slug: 'keyboards',
    name: 'Bàn Phím Cơ Custom',
    icon: Keyboard,
    color: 'text-indigo-600',
    brands: ['Keychron', 'Akko', 'Leopold', 'Logitech'],
    series: ['Nhôm Nguyên Khối CNC', 'Layout 75% / TKL', 'Rapid Trigger Magnetic', 'Kết Nối 3 Mode Không Dây'],
    priceRanges: ['Dưới 1.5 Triệu', '1.5 - 3 Triệu', '3 - 6 Triệu', 'Trên 6 Triệu']
  },
  {
    id: 12,
    slug: 'headsets',
    name: 'Tai Nghe Gaming',
    icon: Headphones,
    color: 'text-pink-500',
    brands: ['HyperX', 'Logitech G', 'Razer', 'SteelSeries', 'Corsair'],
    series: ['Âm Thanh Vòm 7.1', 'Không Dây Độ Trễ Thấp', 'Micro Lọc Ồn AI', 'Hi-Res Audio Gaming'],
    priceRanges: ['Dưới 1.5 Triệu', '1.5 - 3 Triệu', '3 - 6 Triệu', 'Trên 6 Triệu']
  },
  {
    id: 13,
    slug: 'mousepads',
    name: 'Lót Chuột & Phụ Kiện',
    icon: Square,
    color: 'text-orange-500',
    brands: ['SteelSeries', 'Razer', 'Logitech', 'Artisan'],
    series: ['Bàn Di Cỡ Lớn Deskmat', 'Bề Mặt Speed Cực Mượt', 'Bề Mặt Control Chuẩn Xác', 'Chống Nước Chống Bụi'],
    priceRanges: ['Dưới 300K', '300K - 700K', 'Trên 700K']
  },
  {
    id: 14,
    slug: 'laptops',
    name: 'Laptop Gaming & Đồ Họa',
    icon: Laptop,
    color: 'text-purple-500',
    brands: ['ASUS ROG', 'Lenovo Legion', 'Acer Predator', 'Dell Alienware', 'MSI'],
    series: ['RTX 4080 / 4090 Flagship', 'Màn Hình OLED 240Hz', 'Core Ultra & Ryzen AI', 'Mỏng Nhẹ Cao Cấp'],
    priceRanges: ['Dưới 25 Triệu', '25 - 40 Triệu', '40 - 65 Triệu', 'Trên 65 Triệu']
  },
  {
    id: 15,
    slug: 'chairs',
    name: 'Ghế Gaming & Công Thái Học',
    icon: Armchair,
    color: 'text-red-500',
    brands: ['Secretlab', 'Anda Seat', 'Sihoo', 'Corsair'],
    series: ['Công Thái Học Lưới Thoáng', 'Ghế Da PU Gaming Cao Cấp', 'Piston Class 4 Siêu Bền', 'Kê Tay 4D Đa Hướng'],
    priceRanges: ['Dưới 3 Triệu', '3 - 6 Triệu', '6 - 12 Triệu', 'Trên 12 Triệu']
  },
  {
    id: 16,
    slug: 'webcams',
    name: 'Webcam & Micro Stream',
    icon: Mic,
    color: 'text-violet-500',
    brands: ['Elgato', 'Logitech', 'Rode', 'HyperX'],
    series: ['Webcam 4K 60fps Stream', 'Micro Thu Âm Condenser', 'Đèn Key Light Studio', 'Bàn Trộn Stream Deck'],
    priceRanges: ['Dưới 1.5 Triệu', '1.5 - 4 Triệu', 'Trên 4 Triệu']
  },
  {
    id: 17,
    slug: 'speakers',
    name: 'Loa & Âm Thanh PC',
    icon: Volume2,
    color: 'text-lime-600',
    brands: ['Edifier', 'Razer', 'Logitech', 'Creative'],
    series: ['Loa 2.1 Siêu Trầm', 'Soundbar Gaming RGB', 'Loa Monitor Phòng Thu', 'Kết Nối Bluetooth 5.3'],
    priceRanges: ['Dưới 1 Triệu', '1 - 3 Triệu', 'Trên 3 Triệu']
  },
  {
    id: 18,
    slug: 'network',
    name: 'Thiết Bị Mạng & Router',
    icon: Wifi,
    color: 'text-sky-500',
    brands: ['ASUS Gaming', 'TP-Link', 'Ruijie', 'Linksys'],
    series: ['Router Wi-Fi 7 Gaming', 'Hệ Thống Mesh Phủ Rộng', 'Card Mạng PCIe 2.5GbE', 'Switch Chia Mạng Gigabit'],
    priceRanges: ['Dưới 1 Triệu', '1 - 3 Triệu', 'Trên 3 Triệu']
  }
];

// Danh sách đối tác thương hiệu chính hãng
const FEATURED_BRANDS = [
  { name: 'ASUS ROG', tag: 'ASUS', desc: 'Bo mạch chủ & Card RTX 40' },
  { name: 'Intel', tag: 'Intel', desc: 'Vi xử lý Core Gen 14' },
  { name: 'AMD', tag: 'AMD', desc: 'Ryzen 7000 & 3D V-Cache' },
  { name: 'Corsair', tag: 'Corsair', desc: 'RAM DDR5 & Nguồn Shift' },
  { name: 'MSI', tag: 'MSI', desc: 'Card đồ họa & Mainboard' },
  { name: 'Gigabyte', tag: 'Gigabyte', desc: 'AORUS Gaming Series' },
  { name: 'Kingston', tag: 'Kingston', desc: 'FURY Beast DDR5 & SSD' },
  { name: 'Samsung', tag: 'Samsung', desc: 'SSD 990 PRO & Màn OLED' },
  { name: 'NZXT', tag: 'NZXT', desc: 'Tản nước Kraken & Vỏ H9' },
  { name: 'Logitech G', tag: 'Logitech', desc: 'Chuột Superlight & Phím' },
  { name: 'Razer', tag: 'Razer', desc: 'Gear Esports Đỉnh Cao' },
  { name: 'Keychron', tag: 'Keychron', desc: 'Bàn phím cơ Custom QMK' }
];

// Component Card Sản Phẩm Reusable
function ProductCard({ product, onAddToCart, onNavigate }) {
  const price = Number(product.min_price || product.base_price || product.price || 0);
  const oldPrice = product.base_price && Number(product.base_price) > price
    ? Number(product.base_price)
    : Math.round(price * 1.12);

  const discountPercent = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const inStock = Boolean(product.in_stock ?? product.inStock ?? (product.total_stock > 0));

  return (
    <div
      onClick={() => onNavigate(product)}
      className="bg-slate-950 rounded-2xl border border-slate-800 hover:border-sky-500/60 p-3 sm:p-4 transition-all duration-300 flex flex-col justify-between group cursor-pointer shadow-sm hover:shadow-xl hover:shadow-sky-500/10 motion-card glow-card-hover relative active:scale-[0.98]"
    >
      <div className="space-y-3">
        <div className="relative h-36 sm:h-44 rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center p-2.5 sm:p-3">
          <img
            src={
              product.thumbnail_url ||
              product.image_url ||
              product.images?.[0]?.image_url ||
              'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400'
            }
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          {discountPercent > 0 && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-extrabold rounded-lg bg-rose-600 text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {inStock ? (
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 backdrop-blur-sm">
              Sẵn hàng
            </span>
          ) : (
            <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[9px] font-bold rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 backdrop-blur-sm">
              Tạm hết
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold text-sky-400 uppercase tracking-wider">
              {product.brand || 'CHÍNH HÃNG'}
            </span>
            <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">
              {product.model_code || 'NEW SEAL'}
            </span>
          </div>

          <h3 className="text-xs font-bold text-slate-100 line-clamp-2 group-hover:text-sky-400 transition min-h-[34px] leading-snug">
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
            <span className="font-extrabold text-slate-200">4.9</span>
            <span className="text-slate-500 text-[10px]">(96+ đánh giá)</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-extrabold text-sky-400 font-mono">
            {formatVND(price)}
          </div>
          {oldPrice > price && (
            <div className="text-[11px] text-slate-500 line-through font-mono">
              {formatVND(oldPrice)}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => onAddToCart(e, product)}
          title="Thêm vào giỏ hàng"
          className="p-2 sm:p-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center active:scale-90 hover:scale-105 hover:shadow-sky-500/25"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Helper: Phân tích khoảng giá thành query params minPrice & maxPrice
const parsePriceRangeParams = (pr) => {
  const text = pr.toLowerCase();
  const mult = text.includes('k') ? 1000 : 1000000;
  if (text.startsWith('dưới')) {
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    return `maxPrice=${num * mult}`;
  }
  if (text.startsWith('trên')) {
    const num = parseFloat(text.replace(/[^0-9.]/g, ''));
    return `minPrice=${num * mult}`;
  }
  if (text.includes('-')) {
    const parts = text.split('-');
    const min = parseFloat(parts[0].replace(/[^0-9.]/g, '')) * mult;
    const max = parseFloat(parts[1].replace(/[^0-9.]/g, '')) * mult;
    return `minPrice=${min}&maxPrice=${max}`;
  }
  return '';
};

// Helper: Chuẩn hóa tên thương hiệu (VD: 'ASUS ROG' -> 'ASUS')
const cleanBrandName = (brandStr) => {
  return brandStr
    .replace(/ (ROG|UltraGear|Odyssey|Alienware|Gaming|G|Legion|Predator)$/i, '')
    .trim();
};

export default function HomePage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [allProducts, setAllProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const hoverTimeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Active tab cho Siêu Thị Linh Kiện
  const [activePartTab, setActivePartTab] = useState('gpus');
  // Active tab cho PC Lắp Sẵn
  const [activePcTab, setActivePcTab] = useState('all');
  // Active brand filter cho Laptop
  const [selectedLaptopBrand, setSelectedLaptopBrand] = useState('all');
  // Active tab cho Gaming Gear
  const [activeGearTab, setActiveGearTab] = useState('all');

  // Flash Sale countdown timer
  const [timeLeft, setTimeLeft] = useState(15502);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 15502));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Tải dữ liệu thực tế từ backend database
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const prodsRes = await api.getProducts({ limit: 120 }).catch(() => ({ data: [] }));
        if (!isMounted) return;

        const list = Array.isArray(prodsRes.data)
          ? prodsRes.data
          : Array.isArray(prodsRes)
          ? prodsRes
          : [];
        setAllProducts(list);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu trang chủ:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleQuickAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product, null, 1);
    showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
  };

  const handleNavigate = (product) => {
    navigate(`/products/${product.slug || product.id}`);
  };

  // Xử lý hover vào mục danh mục
  const handleCategoryMouseEnter = (cat) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHoveredCategory(cat);
  };

  const handleCategoryMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 140);
  };

  // Lọc sản phẩm thực tế hiển thị trong Mega Menu flyout
  const hoveredProducts = useMemo(() => {
    if (!hoveredCategory) return [];
    const catSlug = hoveredCategory.slug.toLowerCase();
    return allProducts.filter((p) => {
      const slug = String(p.category_slug || '').toLowerCase();
      if (slug) return slug === catSlug || slug.includes(catSlug);
      const name = String(p.name || '').toLowerCase();
      if (catSlug === 'gpus' && /vga|rtx|geforce|card/i.test(name)) return true;
      if (catSlug === 'cpus' && /cpu|core i|ryzen/i.test(name) && slug !== 'laptops') return true;
      if (catSlug === 'ram' && /ram|ddr5|ddr4/i.test(name)) return true;
      if (catSlug === 'laptops' && /laptop/i.test(name)) return true;
      return false;
    }).slice(0, 3);
  }, [hoveredCategory, allProducts]);

  // Lọc sản phẩm theo danh mục đang chọn trên sidebar
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return allProducts;
    const catSlug = selectedCategory.slug.toLowerCase();
    return allProducts.filter((p) => {
      const slug = String(p.category_slug || '').toLowerCase();
      if (slug) {
        return slug === catSlug || slug.includes(catSlug);
      }
      const name = String(p.name || '').toLowerCase();
      if (catSlug === 'gpus' && /vga|rtx|geforce|card|radeon/i.test(name)) return true;
      if (catSlug === 'cpus' && /cpu|core i|ryzen|core ultra/i.test(name) && slug !== 'laptops') return true;
      if (catSlug === 'motherboards' && /mainboard|bo mạch|z790|b760|b650/i.test(name)) return true;
      if (catSlug === 'ram' && /ram|ddr4|ddr5/i.test(name)) return true;
      if (catSlug === 'storage' && /ssd|nvme|ổ cứng/i.test(name)) return true;
      if (catSlug === 'cases' && /case|vỏ case|thùng máy/i.test(name)) return true;
      if (catSlug === 'power-supplies' && /nguồn|psu|gold|shift/i.test(name)) return true;
      if (catSlug === 'cooling' && /tản nhiệt|cooler|kraken|aio/i.test(name)) return true;
      if (catSlug === 'monitors' && /màn hình|monitor|oled/i.test(name)) return true;
      if (catSlug === 'mice' && /chuột|mouse/i.test(name)) return true;
      if (catSlug === 'keyboards' && /bàn phím|keyboard|keychron/i.test(name)) return true;
      if (catSlug === 'headsets' && /tai nghe|headset/i.test(name)) return true;
      if (catSlug === 'laptops' && /laptop|zephyrus|legion|predator/i.test(name)) return true;
      return false;
    });
  }, [selectedCategory, allProducts]);

  // Flash Sale (4 sản phẩm)
  const flashSaleProducts = useMemo(() => allProducts.slice(0, 4), [allProducts]);

  // Kệ Laptop Gaming có bộ lọc hãng
  const laptopProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const isLaptop = p.category_slug === 'laptops' || /laptop|zephyrus|legion/i.test(p.name);
      if (!isLaptop) return false;
      if (selectedLaptopBrand !== 'all') {
        return String(p.brand || '').toLowerCase().includes(selectedLaptopBrand.toLowerCase());
      }
      return true;
    }).slice(0, 4);
  }, [allProducts, selectedLaptopBrand]);

  // Kệ Siêu Thị Linh Kiện Máy Tính theo tab
  const partProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const slug = String(p.category_slug || '').toLowerCase();
      if (activePartTab === 'gpus') {
        return slug === 'gpus' || /rtx|vga|geforce|gpu/i.test(p.name);
      }
      if (activePartTab === 'cpus') {
        return slug === 'cpus' || (/cpu|core i|ryzen/i.test(p.name) && slug !== 'laptops');
      }
      if (activePartTab === 'motherboards') {
        return slug === 'motherboards' || /mainboard|bo mạch|z790|b760/i.test(p.name);
      }
      if (activePartTab === 'ram_storage') {
        return ['ram', 'storage'].includes(slug) || /ram|ddr5|ssd|nvme/i.test(p.name);
      }
      if (activePartTab === 'psu_cooling') {
        return ['power-supplies', 'cooling'].includes(slug) || /psu|nguồn|tản nhiệt|kraken/i.test(p.name);
      }
      return true;
    }).slice(0, 4);
  }, [allProducts, activePartTab]);

  // Kệ Màn Hình Gaming
  const monitorProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.category_slug === 'monitors' || /màn hình|monitor|oled/i.test(p.name))
      .slice(0, 4);
  }, [allProducts]);

  // Kệ Gaming Gear & Phụ Kiện theo tab
  const gearProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const slug = String(p.category_slug || '').toLowerCase();
      if (activeGearTab === 'keyboards') return slug === 'keyboards' || /bàn phím|keyboard/i.test(p.name);
      if (activeGearTab === 'mice') return slug === 'mice' || /chuột|mouse/i.test(p.name);
      if (activeGearTab === 'headsets') return slug === 'headsets' || /tai nghe|headset/i.test(p.name);
      return ['keyboards', 'mice', 'headsets'].includes(slug) || /bàn phím|chuột|tai nghe/i.test(p.name);
    }).slice(0, 4);
  }, [allProducts, activeGearTab]);

  // Danh mục Cấu Hình PC Gaming lắp sẵn
  const pcBuilds = useMemo(() => {
    const builds = [
      {
        id: 'build-esports',
        category: 'esports',
        title: 'PC Esports Champion Ryzen 7 7800X3D',
        specs: 'AMD Ryzen 7 7800X3D · RTX 4070 Super 12GB · 32GB DDR5 6000MHz · 1TB NVMe · Tản AIO 360',
        price: 45990000,
        oldPrice: 51990000,
        image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&auto=format&fit=crop&q=80',
        tags: ['7800X3D', 'RTX 4070S', '500+ FPS CS2'],
        save: 'Tiết kiệm 6 Triệu'
      },
      {
        id: 'build-ultra',
        category: 'white',
        title: 'PC Gaming Ultra White Edition 2026',
        specs: 'Intel Core Ultra 9 285K · RTX 4090 24GB · 64GB DDR5 · 2TB NVMe Gen5 · Nguồn 1000W Shift',
        price: 89990000,
        oldPrice: 99990000,
        image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
        tags: ['RTX 4090', 'Core Ultra 9', 'White Edition'],
        save: 'Tiết kiệm 10 Triệu'
      },
      {
        id: 'build-creator',
        category: 'creator',
        title: 'PC Workstation & AI Deep Learning Studio',
        specs: 'Intel Core i9 14900K · RTX 4080 Super 16GB · 64GB DDR5 · 4TB SSD · Case Bể Cá Panorama',
        price: 68990000,
        oldPrice: 75990000,
        image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
        tags: ['Render 3D', 'AI Training', 'Stream 4K'],
        save: 'Tiết kiệm 7 Triệu'
      }
    ];

    if (activePcTab === 'all') return builds;
    return builds.filter((b) => b.category === activePcTab);
  }, [activePcTab]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 bg-emerald-600 border border-emerald-400/40 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-medium text-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
          <Link
            to="/cart"
            className="ml-2 px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition whitespace-nowrap"
          >
            Xem giỏ hàng →
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: SIDEBAR 18 DANH MỤC + HOVER MEGA MENU + BANNER BUILD PC   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-[18.5rem_minmax(0,1fr)] gap-5 items-start relative">
        {/* DANH MỤC LINH KIỆN & GEAR (18 HÀNG ĐẦY ĐỦ ICON MÀU THEO HÌNH 2) */}
        <aside
          onMouseLeave={handleCategoryMouseLeave}
          className="bg-slate-900 rounded-3xl border border-slate-800 p-4 shadow-sm space-y-2 hidden lg:block relative"
        >
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold uppercase tracking-wider text-xs text-slate-100 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span>DANH MỤC LINH KIỆN &amp; GEAR</span>
            </h3>
          </div>

          <div className="space-y-0.5 max-h-[580px] overflow-y-auto no-scrollbar pr-0.5">
            {FULL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory?.slug === cat.slug;
              const isHovered = hoveredCategory?.slug === cat.slug;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => handleCategoryMouseEnter(cat)}
                  onClick={() => {
                    setHoveredCategory(null);
                    navigate(`/catalog?category=${cat.slug}`);
                  }}
                  className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition cursor-pointer text-left group ${
                    isSelected
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold'
                      : isHovered
                      ? 'bg-slate-800 text-sky-400 font-semibold'
                      : 'text-slate-200 hover:text-slate-100 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 ${cat.color} shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200`} />
                    <span className="text-xs font-semibold truncate group-hover:text-sky-400 transition-colors">
                      {cat.name}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-all ${
                      isHovered
                        ? 'text-sky-400 translate-x-1'
                        : 'text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </aside>

        {/* 🌟 MEGA MENU FLYOUT KHI HOVER VÀO DANH MỤC TRÊN SIDEBAR 🌟 */}
        {hoveredCategory && (
          <div
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={handleCategoryMouseLeave}
            className="hidden lg:block absolute top-0 left-[19.75rem] w-[620px] bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-3xl p-6 z-50 animate-in fade-in slide-in-from-left-2 duration-150 text-slate-100"
          >
            {/* Mega Menu Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <hoveredCategory.icon className={`w-5 h-5 ${hoveredCategory.color}`} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                    <span>{hoveredCategory.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Phân phối chính hãng 100% · Bảo hành 1 đổi 1 tận nơi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const slug = hoveredCategory.slug;
                  setHoveredCategory(null);
                  navigate(`/catalog?category=${slug}`);
                }}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 group/btn cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Mega Menu Body */}
            <div className="grid grid-cols-12 gap-5 pt-4">
              {/* Cột trái: Thương hiệu, Dòng hot & Khoảng giá */}
              <div className="col-span-7 space-y-4">
                {hoveredCategory.brands?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Thương Hiệu Nổi Bật
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hoveredCategory.brands.map((b) => {
                        const cleanBrand = cleanBrandName(b);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              const slug = hoveredCategory.slug;
                              setHoveredCategory(null);
                              navigate(`/catalog?category=${slug}&brands=${encodeURIComponent(cleanBrand)}`);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-950 hover:bg-sky-500/15 hover:text-sky-400 hover:border-sky-500/30 text-slate-300 border border-slate-800 transition cursor-pointer"
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hoveredCategory.series?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Dòng Sản Phẩm &amp; Phân Khúc
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hoveredCategory.series.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const slug = hoveredCategory.slug;
                            setHoveredCategory(null);
                            navigate(`/catalog?category=${slug}&q=${encodeURIComponent(s)}`);
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800/80 transition cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hoveredCategory.priceRanges?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Khoảng Giá Tham Khảo
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {hoveredCategory.priceRanges.map((pr) => {
                        const priceQuery = parsePriceRangeParams(pr);
                        return (
                          <button
                            key={pr}
                            type="button"
                            onClick={() => {
                              const slug = hoveredCategory.slug;
                              setHoveredCategory(null);
                              navigate(`/catalog?category=${slug}${priceQuery ? `&${priceQuery}` : ''}`);
                            }}
                            className="px-2 py-0.5 text-[11px] font-mono rounded-md bg-slate-950 hover:bg-sky-500/15 hover:text-sky-400 text-slate-400 border border-slate-800 transition cursor-pointer"
                          >
                            {pr}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Cột phải: Sản phẩm thực tế có sẵn trong kho */}
              <div className="col-span-5 space-y-2.5 border-l border-slate-800/80 pl-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sản Phẩm Đề Xuất</span>
                </div>

                {hoveredProducts.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center">
                    Đang nạp sản phẩm...
                  </div>
                ) : (
                  hoveredProducts.slice(0, 2).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setHoveredCategory(null);
                        handleNavigate(prod);
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/50 hover:bg-slate-900 transition cursor-pointer group/mini flex items-center gap-2.5"
                    >
                      <img
                        src={
                          prod.thumbnail_url ||
                          'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200'
                        }
                        alt={prod.name}
                        className="w-12 h-12 object-contain rounded-lg bg-slate-900 p-1 border border-slate-800 shrink-0 group-hover/mini:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate group-hover/mini:text-sky-400 transition">
                          {prod.name}
                        </h4>
                        <div className="text-xs font-mono font-extrabold text-sky-400 mt-0.5">
                          {formatVND(prod.min_price || prod.base_price || prod.price)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile: Horizontal scrollable categories */}
        <div className="lg:hidden flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
          {FULL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory?.slug === cat.slug;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  navigate(`/catalog?category=${cat.slug}`);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer shadow-sm active:scale-95 transition-all ${
                  isSelected
                    ? 'border-sky-500/60 bg-sky-500/15 text-sky-400'
                    : 'border-slate-800 bg-slate-900/90 text-slate-200 hover:border-sky-500/40 hover:text-sky-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                <span>{cat.name.split(' - ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Cột Phải: Poster Siêu Sale (2nd image) + 3 Banners Tiện Ích (1st image) */}
        <div className="space-y-4 min-w-0">
          {/* Poster Siêu Sale Build PC (Ảnh 2) */}
          <section className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl p-6 sm:p-8 md:p-10 flex items-center min-h-[430px] group">
            {/* Ambient Animated Cyber Glow Lights */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none animate-pulse-aura" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-aura" style={{ animationDelay: '2.5s' }} />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/15 text-sky-400 text-xs font-bold border border-sky-500/30 w-fit glow-badge">
                  <span className="relative flex h-2 w-2 mr-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                  <span>Chương Trình Ưu Đãi Công Nghệ 2026</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-normal sm:tracking-tight leading-tight">
                  SIÊU SALE BUILD PC <br />
                  <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent animate-gradient-text inline-block">GIẢM ĐẾN 20%</span>
                </h1>

                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-lg font-medium">
                  Sắm bộ PC Gaming White Edition, Card RTX 40 Series, Màn hình OLED 240Hz và Gaming Gear chính hãng với voucher quà tặng lên đến 1.500.000₫!
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to="/build-pc"
                    className="btn-shimmer animate-btn-pulse px-5 py-3 bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-sky-500/25 hover:shadow-sky-400/40 hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer active:scale-95 group/btn"
                  >
                    <Wrench className="w-4 h-4 group-hover/btn:rotate-45 transition-transform duration-300" />
                    <span>Xây Dựng Cấu Hình PC Ngay</span>
                  </Link>

                  <Link
                    to="/products/14"
                    className="px-5 py-3 bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700 hover:border-slate-600 active:scale-95 flex items-center gap-1.5 hover:shadow-md group/link"
                  >
                    <span>Xem Chi Tiết Sản Phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="pt-4 grid grid-cols-3 gap-2 border-t border-slate-800 text-[11px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">100% Chính Hãng</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">Tương Thích Tuyệt Đối</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="truncate">Quà Tặng 1.5 Triệu</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative hidden lg:flex items-center justify-center">
                <div className="relative w-full flex items-center justify-center">
                  <div className="absolute w-64 h-64 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />
                  <img
                    src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80"
                    alt="PC Gaming High End"
                    className="relative z-10 max-h-[310px] w-auto object-contain animate-float-pc hover:scale-105 transition-transform duration-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 🌟 3 BANNERS TIỆN ÍCH DƯỚI POSTER (CHUẨN HÌNH 1) 🌟 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Banner 1: Build PC Trả Góp 0% */}
            <Link
              to="/build-pc"
              className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white shadow-md hover:shadow-xl hover:shadow-blue-600/25 transition-all duration-300 group flex flex-col justify-between min-h-[120px] active:scale-[0.99] border border-blue-400/25 hover:border-blue-400/50 glow-card-blue hover:-translate-y-1.5 btn-shimmer"
            >
              <div className="relative z-10 space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white drop-shadow-sm">
                  Build PC Trả Góp 0%
                </h4>
                <p className="text-[11px] text-blue-100 font-medium leading-relaxed">
                  Duyệt nhanh 15 phút, không cần thẻ
                </p>
              </div>

              <div className="relative z-10 pt-2 flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                <span>Xem ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              {/* Watermark Icon */}
              <Wrench className="absolute -right-3 -bottom-3 w-20 h-20 text-white/15 pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 ease-out" />
            </Link>

            {/* Banner 2: Laptop Gaming Giảm Đến 7 Triệu */}
            <div
              onClick={() => {
                navigate('/catalog?category=laptops');
              }}
              className="relative overflow-hidden rounded-2xl p-4 bg-slate-900 hover:bg-slate-850 text-white shadow-md hover:shadow-xl hover:shadow-sky-500/10 transition-all duration-300 group flex flex-col justify-between min-h-[120px] active:scale-[0.99] border border-slate-800 hover:border-sky-500/40 glow-card-hover hover:-translate-y-1.5 cursor-pointer btn-shimmer"
            >
              <div className="relative z-10 space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-slate-100 group-hover:text-sky-400 transition-colors">
                  Laptop Gaming Giảm Đến 7 Triệu
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                  ROG, MSI, Apple — bảo hành chính hãng
                </p>
              </div>

              <div className="relative z-10 pt-2 flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-sky-400 group-hover:translate-x-1 transition-all">
                <span>Xem ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              {/* Watermark Icon */}
              <Laptop className="absolute -right-3 -bottom-3 w-20 h-20 text-slate-700/25 pointer-events-none group-hover:scale-125 group-hover:-rotate-12 transition-transform duration-500 ease-out" />
            </div>

            {/* Banner 3: Gear Esports Chính Hãng */}
            <div
              onClick={() => {
                navigate('/catalog?category=keyboards');
              }}
              className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-red-600 via-rose-600 to-orange-500 text-white shadow-md hover:shadow-xl hover:shadow-rose-600/25 transition-all duration-300 group flex flex-col justify-between min-h-[120px] active:scale-[0.99] border border-rose-400/30 hover:border-rose-400/60 glow-card-rose hover:-translate-y-1.5 cursor-pointer btn-shimmer"
            >
              <div className="relative z-10 space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight text-white drop-shadow-sm">
                  Gear Esports Chính Hãng
                </h4>
                <p className="text-[11px] text-rose-100 font-medium leading-relaxed">
                  Chuột, phím, tai nghe giá tốt tuần này
                </p>
              </div>

              <div className="relative z-10 pt-2 flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                <span>Xem ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              {/* Watermark Icon */}
              <Mouse className="absolute -right-3 -bottom-3 w-20 h-20 text-white/15 pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 ease-out" />
            </div>
          </div>
        </div>
      </div>

      {/* Thông Báo Nếu Đang Lọc Theo Danh Mục Từ Sidebar */}
      {selectedCategory && (
        <section className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Tag className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                <span>Đang lọc theo danh mục:</span>
                <strong className="text-sky-400 uppercase">{selectedCategory.name}</strong>
                <span className="text-slate-400 font-mono">({filteredProducts.length} sản phẩm)</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Xóa bộ lọc</span>
          </button>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. FLASH SALE GIỜ VÀNG (ĐẾM NGƯỢC THỜI GIAN THỰC)                         */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-2xl">
              <Flame className="w-6 h-6 fill-rose-500 animate-flame-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
                <span>FLASH SALE GIỜ VÀNG</span>
                <span className="px-2.5 py-0.5 text-xs bg-rose-600 text-white font-extrabold rounded-full">
                  GIẢM SỐC
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Linh kiện &amp; Gaming Gear giảm giá trực tiếp giới hạn số lượng trong ngày
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950 px-4 py-2 rounded-2xl text-xs font-bold font-mono border border-slate-800 shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="text-slate-400">Kết thúc sau:</span>
            <span className="text-sky-400 text-sm tracking-wider font-extrabold">
              {formatCountdown(timeLeft)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 rounded-2xl bg-slate-950 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {flashSaleProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onAddToCart={handleQuickAddToCart}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. CẤU HÌNH PC GAMING & WORKSTATION LẮP SẴN (PRE-BUILT PC HUB)            */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
              <Wrench className="w-5 h-5 text-sky-400" />
              <span>Cấu Hình PC Gaming Lắp Sẵn Tiêu Chuẩn</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Tối ưu tương thích 100%, kiểm thử benchmark nhiệt độ và bảo hành 36 tháng tận nơi
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất Cả Cấu Hình' },
              { id: 'esports', label: 'PC Esports 500+ FPS' },
              { id: 'white', label: 'PC White Edition 4K' },
              { id: 'creator', label: 'PC Đồ Họa & AI' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePcTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                  activePcTab === tab.id
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <Link
              to="/build-pc"
              className="px-4 py-2 bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 border border-sky-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5 ml-1"
            >
              <span>Tự Build PC</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {pcBuilds.map((build) => (
            <div
              key={build.id}
              className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="h-44 bg-slate-900 rounded-xl overflow-hidden p-2 relative flex items-center justify-center">
                  <img src={build.image} alt={build.title} className="w-full h-full object-cover rounded-lg" />
                  <span className="absolute top-3 left-3 px-2 py-0.5 bg-rose-600 text-white font-extrabold text-[10px] rounded-md shadow">
                    {build.save}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {build.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[10px] font-bold rounded-md border border-sky-500/20"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <h3 className="font-bold text-slate-100 text-sm line-clamp-1">{build.title}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 line-clamp-2">
                  {build.specs}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-base font-extrabold text-sky-400 font-mono">
                    {formatVND(build.price)}
                  </span>
                  <span className="text-[11px] text-slate-500 line-through font-mono block">
                    {formatVND(build.oldPrice)}
                  </span>
                </div>

                <Link
                  to="/build-pc"
                  className="px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Tùy Biến Cấu Hình
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. KỆ HÀNG: LAPTOP GAMING & ĐỒ HỌA CHUYÊN NGHIỆP                         */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
                Laptop Gaming &amp; Đồ Họa Cao Cấp
              </h2>
              <p className="text-xs text-slate-400">
                Màn hình OLED 240Hz, Card RTX 40 Series, tặng kèm Balo công nghệ và Chuột Gaming
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'asus', label: 'ASUS ROG' },
              { id: 'lenovo', label: 'Lenovo Legion' },
              { id: 'acer', label: 'Acer Nitro' },
              { id: 'msi', label: 'MSI Gaming' },
              { id: 'dell', label: 'Alienware' }
            ].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedLaptopBrand(b.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                  selectedLaptopBrand === b.id
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {b.label}
              </button>
            ))}

            <Link
              to="/products"
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 ml-2"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {laptopProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={handleQuickAddToCart}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. KỆ HÀNG: SIÊU THỊ LINH KIỆN MÁY TÍNH (PC PARTS HUB)                   */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Gpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
                Linh Kiện Máy Tính Nổi Bật
              </h2>
              <p className="text-xs text-slate-400">
                Card màn hình RTX 40 Series, CPU Gen 14, Mainboard Z790/B760, RAM DDR5 chính hãng
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'gpus', label: 'Card Màn Hình (VGA)' },
              { id: 'cpus', label: 'Vi Xử Lý (CPU)' },
              { id: 'motherboards', label: 'Bo Mạch Chủ (Main)' },
              { id: 'ram_storage', label: 'RAM & SSD NVMe' },
              { id: 'psu_cooling', label: 'Nguồn & Tản Nhiệt' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePartTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                  activePartTab === tab.id
                    ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {partProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={handleQuickAddToCart}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. KỆ HÀNG: MÀN HÌNH GAMING & ĐỒ HỌA CHUYÊN NGHIỆP                        */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
                Màn Hình Gaming &amp; Đồ Họa 4K OLED
              </h2>
              <p className="text-xs text-slate-400">
                Tần số quét 240Hz, phản hồi 0.03ms, chuẩn màu 99% DCI-P3 cho đồ họa chuyên nghiệp
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {monitorProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={handleQuickAddToCart}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. KỆ HÀNG: GAMING GEAR & GÓC MÁY ESPORTS                                 */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 uppercase tracking-tight">
                Gaming Gear &amp; Thiết Bị Ngoại Vi
              </h2>
              <p className="text-xs text-slate-400">
                Bàn phím cơ Custom nhôm CNC, chuột siêu nhẹ không dây và tai nghe chuẩn thi đấu
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất Cả Gear' },
              { id: 'keyboards', label: 'Bàn Phím Cơ' },
              { id: 'mice', label: 'Chuột Gaming' },
              { id: 'headsets', label: 'Tai Nghe 7.1' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveGearTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                  activeGearTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {gearProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onAddToCart={handleQuickAddToCart}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HỆ SINH THÁI THƯƠNG HIỆU ĐỐI TÁC CHÍNH HÃNG                            */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-100">
              Hệ Sinh Thái Thương Hiệu Hàng Đầu
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            100% Phân phối ủy quyền chính hãng tại Việt Nam
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {FEATURED_BRANDS.map((brand, idx) => (
            <div
              key={idx}
              onClick={() => {
                navigate(`/catalog?brands=${encodeURIComponent(brand.tag)}`);
              }}
              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/60 hover:bg-slate-900/60 transition cursor-pointer text-center group"
            >
              <h4 className="font-extrabold text-sm text-slate-200 group-hover:text-sky-400 transition">
                {brand.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{brand.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BANNER CALL TO ACTION: XÂY DỰNG CẤU HÌNH PC CHUYÊN NGHIỆP               */}
      {/* ========================================================================= */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-sky-500/20">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md border border-white/20">
            <Wrench className="w-3.5 h-3.5 text-sky-300" />
            <span>Công Cụ Tương Thích 100%</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Tự Tay Xây Dựng Cấu Hình PC Trong Mơ
          </h2>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl font-medium">
            Tự do chọn linh kiện, tự động kiểm tra tương thích phần cứng qua Socket, dự toán chi phí chính xác và nhận quà tặng gaming trị giá 1.500.000₫!
          </p>
        </div>

        <Link
          to="/build-pc"
          className="px-6 py-3.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-900 font-black text-xs uppercase tracking-wider shadow-2xl transition active:scale-95 shrink-0 flex items-center gap-2"
        >
          <Wrench className="w-4 h-4 text-sky-600" />
          <span>Bắt Đầu Xây Dựng PC →</span>
        </Link>
      </section>
    </div>
  );
}
