import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import {
  Package,
  ShieldCheck,
  Star,
  LifeBuoy,
  MessageCircle,
  User,
  KeyRound,
  CheckCircle2,
  Truck,
  Copy,
  ChevronDown,
  ArrowRight,
  Check,
  RefreshCw,
  Loader2,
  AlertCircle,
  Plus,
  Send,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Monitor,
  Globe,
  QrCode,
  Bell,
  Trash2,
  Edit3,
  MapPin,
  Award,
  Sparkles,
  ShieldAlert,
  LogOut,
  CheckCheck,
  Heart,
  TicketPercent,
  Coins,
  Cpu,
  CreditCard,
  Share2,
  ShoppingCart,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import VietqrModal from '../../components/checkout/VietqrModal';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';
const DEFAULT_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80'
];

const ORDER_PHASES = [
  { title: 'Chờ xác nhận', desc: 'Hệ thống đã tiếp nhận đơn hàng' },
  { title: 'Đã xác nhận', desc: 'Đơn hàng & thanh toán đã được xác nhận' },
  { title: 'Đang chuẩn bị hàng', desc: 'Kiểm tra, đóng gói và dán tem bảo hành' },
  { title: 'Đã bàn giao vận chuyển', desc: 'Kiện hàng đã được giao cho đơn vị vận chuyển' },
  { title: 'Giao hàng thành công', desc: 'Khách hàng đã nhận hàng' }
];

const PHASE_BADGES = {
  0: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  1: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
  2: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
  3: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  4: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
};

const SEED_ORDERS = [
  {
    orderId: 'ORD-8917',
    date: '28/09/2026 09:42',
    phase: 3,
    statusLabel: 'Đã bàn giao vận chuyển',
    carrier: 'GIAO HÀNG NHANH (GHN)',
    trackingCode: 'GHN582019374',
    paymentMethod: 'VietQR Banking Auto',
    total: 12470000,
    recipientName: 'Đặng Minh Thuận',
    recipientPhone: '0908 123 456',
    shippingAddress: 'Số 12, Ngõ 45 Cầu Giấy, Hà Nội',
    items: [
      {
        id: 15,
        name: 'Chuột Gaming Không Dây Logitech G Pro X Superlight 2 DEX White',
        variant: 'Trắng Tuyết (White)',
        quantity: 1,
        price: 3490000,
        image:
          'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=300&auto=format&fit=crop&q=80'
      },
      {
        id: 14,
        name: 'Bàn Phím Cơ Custom Keychron Q1 Pro QMK/VIA Full Nhôm CNC',
        variant: 'Bạc Trắng (Silver)',
        quantity: 2,
        price: 4490000,
        image:
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    orderId: 'ORD-8871',
    date: '21/09/2026 20:15',
    phase: 1,
    statusLabel: 'Đã xác nhận',
    carrier: 'Hỏa Tốc 2H Nội Thành',
    trackingCode: 'HT2H-8871-TECH',
    paymentMethod: 'COD (Thanh toán khi nhận)',
    total: 14990000,
    recipientName: 'Đặng Minh Thuận',
    recipientPhone: '0908 123 456',
    shippingAddress: 'Số 12, Ngõ 45 Cầu Giấy, Hà Nội',
    items: [
      {
        id: 17,
        name: 'Màn Hình Gaming ASUS ROG Swift OLED 240Hz 0.03ms',
        variant: '27 Inch 2K OLED',
        quantity: 1,
        price: 14990000,
        image:
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    orderId: 'ORD-8702',
    date: '02/09/2026 11:03',
    phase: 4,
    statusLabel: 'Giao hàng thành công',
    carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
    trackingCode: 'S21.HN.A7.418290',
    paymentMethod: 'VietQR Banking Auto',
    total: 36680000,
    recipientName: 'Đặng Minh Thuận',
    recipientPhone: '0908 123 456',
    shippingAddress: 'Số 12, Ngõ 45 Cầu Giấy, Hà Nội',
    items: [
      {
        id: 1,
        name: 'VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB GDDR6X',
        variant: 'Bản Ép Xung OC',
        quantity: 1,
        price: 36680000,
        image:
          'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80'
      }
    ]
  }
];

const SEED_WISHLIST = [
  {
    id: 15,
    productId: 15,
    variantId: 15,
    name: 'Chuột Gaming Không Dây Logitech G Pro X Superlight 2 DEX White',
    variant: 'Trắng Tuyết (White) - 44K DPI HERO 2 Sensor',
    price: 3490000,
    originalPrice: 3890000,
    image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&auto=format&fit=crop&q=80',
    stock: 12,
    rating: 4.9
  },
  {
    id: 17,
    productId: 17,
    variantId: 17,
    name: 'Màn Hình Gaming ASUS ROG Swift OLED 240Hz 0.03ms Ultra-Low Latency',
    variant: '27 Inch 2K OLED (2560x1440) 240Hz',
    price: 14990000,
    originalPrice: 17500000,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80',
    stock: 5,
    rating: 5.0
  },
  {
    id: 14,
    productId: 14,
    variantId: 14,
    name: 'Bàn Phím Cơ Custom Keychron Q1 Pro QMK/VIA Full Nhôm CNC',
    variant: 'Bạc Trắng (Silver) - Kailh Banana Tactile Switch',
    price: 4490000,
    originalPrice: 4890000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&auto=format&fit=crop&q=80',
    stock: 8,
    rating: 4.8
  },
  {
    id: 1,
    productId: 1,
    variantId: 1,
    name: 'VGA ASUS ROG Strix GeForce RTX 4090 OC 24GB GDDR6X',
    variant: 'Bản Ép Xung OC - 3 Quạt Axial-tech',
    price: 36680000,
    originalPrice: 39990000,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&auto=format&fit=crop&q=80',
    stock: 2,
    rating: 5.0
  }
];

const SEED_PAYMENT_METHODS = [
  {
    id: 'pay-1',
    type: 'vietqr',
    bankName: 'MBBank (Ngân hàng Quân Đội)',
    accountNumber: '0358599999',
    accountName: 'CONG TY TNHH TECHSHOP VIET NAM',
    isDefault: true,
    note: 'Chuyển khoản VietQR tự động xác nhận tức thì'
  },
  {
    id: 'pay-2',
    type: 'bank',
    bankName: 'Vietcombank (VCB Digital)',
    accountNumber: '001100438912',
    accountName: 'ĐẶNG MINH THUẬN',
    isDefault: false,
    note: 'Tài khoản hoàn tiền & nhận chiết khấu'
  },
  {
    id: 'pay-3',
    type: 'card',
    cardBrand: 'Visa Infinite Gaming',
    last4: '8821',
    expiry: '08/29',
    cardHolder: 'DANG MINH THUAN',
    isDefault: false,
    note: 'Thanh toán quốc tế 1-Click'
  }
];

const SEED_PC_BUILDS = [
  {
    id: 'build-1',
    name: 'ROG Apex Ultra 4K Gaming & Render',
    description: 'Cấu hình đỉnh cao cân mọi tựa game 4K Ray Tracing và Render 3D Blender.',
    wattage: 780,
    totalPrice: 94500000,
    updatedAt: '18/10/2026',
    components: [
      { type: 'CPU', name: 'Intel Core i9-14900K 24 Nhân 32 Luồng 6.0GHz', price: 14890000 },
      { type: 'VGA', name: 'ASUS ROG Strix GeForce RTX 4090 OC 24GB GDDR6X', price: 36680000 },
      { type: 'Mainboard', name: 'ASUS ROG MAXIMUS Z790 DARK HERO DDR5', price: 17290000 },
      { type: 'RAM', name: 'Corsair Dominator Titanium RGB 64GB (2x32GB) 6400MHz', price: 7890000 },
      { type: 'SSD', name: 'Samsung 990 Pro 2TB PCIe Gen4 NVMe M.2 7450MB/s', price: 4690000 },
      { type: 'Nguồn (PSU)', name: 'ASUS ROG Thor 1000W Platinum II OLED Aura Sync', price: 8390000 },
      { type: 'Vỏ Case', name: 'Lian Li O11 Dynamic EVO RGB Modern Dual-Chamber Black', price: 4690000 }
    ]
  },
  {
    id: 'build-2',
    name: 'Compact ITX Silent Workstation & Code',
    description: 'Dàn máy nhỏ gọn đặt bàn học, tối ưu tản nhiệt êm ái cho lập trình viên.',
    wattage: 520,
    totalPrice: 48200000,
    updatedAt: '12/10/2026',
    components: [
      { type: 'CPU', name: 'AMD Ryzen 7 7800X3D 8 Nhân 16 Luồng Gaming King', price: 10490000 },
      { type: 'VGA', name: 'MSI GeForce RTX 4070 Ti SUPER 16G Ventus 3X', price: 22490000 },
      { type: 'Mainboard', name: 'ASUS ROG STRIX B650E-I GAMING WIFI Mini-ITX', price: 8190000 },
      { type: 'RAM', name: 'G.Skill Flare X5 32GB (2x16GB) DDR5 6000MHz', price: 3190000 },
      { type: 'SSD', name: 'Kingston KC3000 1TB PCIe 4.0 NVMe 7000MB/s', price: 2190000 },
      { type: 'Nguồn (PSU)', name: 'Corsair SF750 80 Plus Platinum SFX Modular', price: 3990000 }
    ]
  }
];

function loadSavedOrders() {
  try {
    const raw = localStorage.getItem('techshop_orders');
    if (!raw) return SEED_ORDERS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_ORDERS;
    return [...parsed, ...SEED_ORDERS];
  } catch {
    return SEED_ORDERS;
  }
}

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

function formatOrderDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: '', color: 'bg-slate-700', text: 'text-slate-500' };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { score: 1, label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-400' };
  if (score === 2) return { score: 2, label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-400' };
  if (score === 3) return { score: 3, label: 'Khá tốt', color: 'bg-sky-500', text: 'text-sky-400' };
  return { score: 4, label: 'Rất mạnh', color: 'bg-emerald-500', text: 'text-emerald-400' };
}

/* ---------- Shared Sub-components (Head, Pill) ---------- */

function Head({ title, desc, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{title}</h2>
        {desc && <p className="text-xs text-slate-400 mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

function Pill({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    sky: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
    amber: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
    green: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
    red: 'bg-rose-500/15 border-rose-500/30 text-rose-400'
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border ${
        tones[tone] || tones.slate
      }`}
    >
      {children}
    </span>
  );
}

/* ---------- 1. VOUCHERS PANEL ---------- */

function VouchersPanel({ onUseCoupon }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState('');
  const [savedSuccess, setSavedSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getCoupons();
        setCoupons(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('Could not load coupons:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleAddCode = async (e) => {
    e.preventDefault();
    const clean = inputCode.trim().toUpperCase();
    if (!clean) return;
    try {
      await api.saveVoucher(clean);
      const exists = coupons.some((c) => c.code.toUpperCase() === clean);
      if (!exists) {
        const newCoupon = {
          id: Date.now(),
          code: clean,
          description: 'Voucher ưu đãi độc quyền khách hàng VIP',
          discount_type: 'fixed',
          discount_value: 100000,
          min_order_value: 1000000,
          end_date: '2027-12-31T23:59:59.000Z'
        };
        setCoupons((prev) => [newCoupon, ...prev]);
      }
      setSavedSuccess(`Đã lưu mã "${clean}" thành công vào database!`);
    } catch (err) {
      setSavedSuccess(err.message || 'Lỗi lưu voucher');
    }
    setInputCode('');
    setTimeout(() => setSavedSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      <Head
        title="Kho Voucher & Ưu Đãi Của Tôi"
        desc="Thu thập và sử dụng mã giảm giá khi thanh toán linh kiện, PC & phụ kiện."
        action={savedSuccess && <Pill tone="green">{savedSuccess}</Pill>}
      />

      {/* Input add code */}
      <form
        onSubmit={handleAddCode}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex gap-2.5 shadow-xl"
      >
        <div className="relative flex-1">
          <TicketPercent className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Nhập mã voucher (vd: TECH10, SALE500, VIP15)..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 cursor-pointer shrink-0"
        >
          Lưu mã
        </button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
          <span className="text-xs">Đang tải kho voucher...</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400 space-y-2">
          <TicketPercent className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs">Kho voucher hiện đang trống. Hãy theo dõi các đợt flash sale nhé!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div
              key={c.id || c.code}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex gap-3.5 items-center justify-between shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <TicketPercent className="w-6 h-6" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-amber-400 tracking-wider">
                      {c.code}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {c.discount_type === 'percent'
                        ? `Giảm ${c.discount_value}%`
                        : `Giảm ${formatVND(c.discount_value)}`}
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium line-clamp-1">{c.description}</div>
                  <div className="text-[11px] text-slate-400">
                    Đơn tối thiểu: {formatVND(c.min_order_value || 0)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(c.code)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer flex items-center gap-1 justify-center"
                >
                  {copied === c.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
                <Link
                  to="/cart"
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold text-center transition shadow-sm"
                >
                  Dùng ngay
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 2. WISHLIST PANEL ---------- */

function WishlistPanel({ onAddToCart }) {
  const [wishlist, setWishlist] = useState(SEED_WISHLIST);
  const [toastMsg, setToastMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const flashToast = (m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 2500);
  };

  useEffect(() => {
    let active = true;
    async function loadWishlist() {
      try {
        setLoading(true);
        const data = await api.getProfile();
        if (active && Array.isArray(data?.wishlist)) {
          setWishlist(data.wishlist);
        }
      } catch (e) {
        console.warn('Could not load wishlist from BE:', e);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadWishlist();
    return () => {
      active = false;
    };
  }, []);

  const handleRemove = async (id) => {
    const updated = wishlist.filter((item) => item.id !== id);
    setWishlist(updated);
    try {
      await api.updateWishlist(updated);
      flashToast('Đã xóa sản phẩm khỏi danh sách yêu thích và cập nhật database!');
    } catch {
      flashToast('Đã xóa sản phẩm khỏi danh sách yêu thích');
    }
  };

  const handleAddAll = async () => {
    for (const item of wishlist) {
      if (onAddToCart) await onAddToCart(item);
    }
    flashToast('Đã thêm tất cả sản phẩm vào giỏ hàng!');
  };

  return (
    <div className="space-y-6">
      <Head
        title="Sản Phẩm Yêu Thích"
        desc={`Danh sách ${wishlist.length} thiết bị bạn đã lưu để theo dõi giá và đặt mua sau.`}
        action={
          wishlist.length > 0 && (
            <button
              type="button"
              onClick={handleAddAll}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Thêm tất cả vào giỏ</span>
            </button>
          )
        }
      />

      {toastMsg && <Pill tone="green">{toastMsg}</Pill>}

      {wishlist.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center space-y-4">
          <Heart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Chưa có sản phẩm yêu thích</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bấm vào biểu tượng trái tim ở từng trang sản phẩm để lưu lại vào danh sách này.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition"
          >
            Khám phá sản phẩm <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex gap-4 shadow-xl hover:border-slate-700 transition"
            >
              <img
                src={item.image || DEFAULT_PRODUCT_IMAGE}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1.5 shrink-0"
              />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/products/${item.id}`}
                    className="text-xs font-bold text-white hover:text-sky-400 line-clamp-2 leading-snug"
                  >
                    {item.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Xóa khỏi yêu thích"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-sky-400 font-semibold truncate">{item.variant}</div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-white">
                      {formatVND(item.price)}
                    </span>
                    {item.originalPrice && (
                      <span className="text-[10px] text-slate-500 line-through font-mono ml-2">
                        {formatVND(item.originalPrice)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onAddToCart) onAddToCart(item);
                      flashToast(`Đã thêm ${item.name} vào giỏ hàng`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Mua ngay</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 3. PAYMENT METHODS PANEL ---------- */

function PaymentMethodsPanel() {
  const [methods, setMethods] = useState(SEED_PAYMENT_METHODS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMethod, setNewMethod] = useState({
    type: 'bank',
    bankName: '',
    accountNumber: '',
    accountName: '',
    cardBrand: '',
    last4: '',
    expiry: ''
  });
  const [flashMsg, setFlashMsg] = useState('');

  const flash = (m) => {
    setFlashMsg(m);
    setTimeout(() => setFlashMsg(''), 2500);
  };

  useEffect(() => {
    let active = true;
    async function loadPaymentMethods() {
      try {
        const data = await api.getProfile();
        if (active && Array.isArray(data?.savedPaymentMethods)) {
          setMethods(data.savedPaymentMethods);
        }
      } catch (e) {
        console.warn('Could not load payment methods from BE:', e);
      }
    }
    loadPaymentMethods();
    return () => {
      active = false;
    };
  }, []);

  const handleSetDefault = async (id) => {
    const updated = methods.map((m) => ({ ...m, isDefault: m.id === id }));
    setMethods(updated);
    try {
      await api.updatePaymentMethods(updated);
      flash('Đã lưu phương thức mặc định vào database!');
    } catch {
      flash('Đã đặt phương thức thanh toán mặc định');
    }
  };

  const handleDelete = async (id) => {
    const updated = methods.filter((m) => m.id !== id);
    setMethods(updated);
    try {
      await api.updatePaymentMethods(updated);
      flash('Đã gỡ phương thức thanh toán khỏi database!');
    } catch {
      flash('Đã gỡ phương thức thanh toán');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const item = {
      id: `pay-${Date.now()}`,
      type: newMethod.type,
      bankName: newMethod.bankName || 'Ngân hàng nội địa',
      accountNumber: newMethod.accountNumber || '••••',
      accountName: newMethod.accountName?.toUpperCase() || 'CHỦ TÀI KHOẢN',
      cardBrand: newMethod.cardBrand || 'Visa Debit',
      last4: newMethod.accountNumber?.slice(-4) || '1234',
      expiry: newMethod.expiry || '12/28',
      isDefault: methods.length === 0,
      note: 'Tài khoản thanh toán liên kết'
    };
    const updated = [...methods, item];
    setMethods(updated);
    setShowAddModal(false);
    setNewMethod({
      type: 'bank',
      bankName: '',
      accountNumber: '',
      accountName: '',
      cardBrand: '',
      last4: '',
      expiry: ''
    });
    try {
      await api.updatePaymentMethods(updated);
      flash('Đã thêm và lưu phương thức vào database!');
    } catch {
      flash('Đã thêm phương thức thanh toán thành công');
    }
  };

  return (
    <div className="space-y-6">
      <Head
        title="Phương Thức Thanh Toán Đã Lưu"
        desc="Quản lý tài khoản ngân hàng VietQR và thẻ thanh toán liên kết để checkout 1-click."
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm phương thức</span>
          </button>
        }
      />

      {flashMsg && <Pill tone="green">{flashMsg}</Pill>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between h-48 transition shadow-xl ${
              m.isDefault
                ? 'bg-gradient-to-br from-slate-900 to-sky-950/60 border-sky-500 ring-1 ring-sky-500/30'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-sky-400" />
                  <span>{m.type === 'card' ? m.cardBrand : m.bankName}</span>
                </span>
                {m.isDefault ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/40">
                    Mặc định
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(m.id)}
                    className="text-[10px] text-slate-400 hover:text-sky-400 transition cursor-pointer"
                  >
                    Đặt mặc định
                  </button>
                )}
              </div>

              <div className="font-mono text-base font-black text-slate-100 tracking-wider pt-2">
                {m.type === 'card'
                  ? `•••• •••• •••• ${m.last4}`
                  : m.accountNumber.replace(/(\d{4})/g, '$1 ').trim()}
              </div>

              <div className="text-[11px] text-slate-400 font-medium uppercase">
                {m.accountName || m.cardHolder}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[10px] text-slate-500">
              <span>{m.note}</span>
              {methods.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDelete(m.id)}
                  className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Payment Method */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>Liên kết tài khoản thanh toán</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Loại phương thức</label>
              <div className="flex gap-2">
                {[
                  { id: 'bank', label: 'Tài khoản Ngân hàng VietQR' },
                  { id: 'card', label: 'Thẻ Quốc tế (Visa / Master)' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNewMethod((p) => ({ ...p, type: t.id }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      newMethod.type === t.id
                        ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">
                {newMethod.type === 'card' ? 'Tên ngân hàng phát hành thẻ' : 'Ngân hàng'}
              </label>
              <input
                type="text"
                required
                placeholder="VD: MBBank, Vietcombank, Techcombank..."
                value={newMethod.bankName}
                onChange={(e) => setNewMethod((p) => ({ ...p, bankName: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">
                {newMethod.type === 'card' ? 'Số thẻ' : 'Số tài khoản'}
              </label>
              <input
                type="text"
                required
                placeholder={newMethod.type === 'card' ? '4111 2222 3333 4444' : '0358599999'}
                value={newMethod.accountNumber}
                onChange={(e) => setNewMethod((p) => ({ ...p, accountNumber: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Tên chủ tài khoản / Tên in trên thẻ</label>
              <input
                type="text"
                required
                placeholder="VD: DANG MINH THUAN"
                value={newMethod.accountName}
                onChange={(e) => setNewMethod((p) => ({ ...p, accountName: e.target.value.toUpperCase() }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 uppercase"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-sky-600/20"
              >
                Lưu phương thức
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- 4. REWARDS & MEMBERSHIP PANEL ---------- */

function RewardsPanel() {
  const [points, setPoints] = useState(2450);
  const [flashMsg, setFlashMsg] = useState('');

  const flash = (m) => {
    setFlashMsg(m);
    setTimeout(() => setFlashMsg(''), 2500);
  };

  useEffect(() => {
    let active = true;
    async function loadPoints() {
      try {
        const data = await api.getProfile();
        if (active && data?.points != null) {
          setPoints(Number(data.points));
        }
      } catch (e) {
        console.warn('Could not load points from BE:', e);
      }
    }
    loadPoints();
    return () => {
      active = false;
    };
  }, []);

  const handleRedeem = async (cost, title) => {
    if (points < cost) {
      alert('Bạn không đủ điểm thưởng để đổi quà này.');
      return;
    }
    try {
      const res = await api.redeemPoints(cost, title);
      if (res?.data?.points != null) {
        setPoints(res.data.points);
      } else {
        setPoints((p) => p - cost);
      }
      flash(`Đã đổi thành công "${title}"! Điểm thưởng đã được trừ trong database.`);
    } catch (err) {
      alert(err.message || 'Lỗi đổi điểm');
    }
  };

  const REWARD_ITEMS = [
    { id: 1, title: 'Voucher giảm 50.000₫ đơn bất kỳ', cost: 500, icon: TicketPercent },
    { id: 2, title: 'Voucher giảm 120.000₫ đơn từ 1 triệu', cost: 1000, icon: TicketPercent },
    { id: 3, title: 'Bàn di chuột Techshop Speed Deskmat 900x400mm', cost: 2000, icon: Sparkles },
    { id: 4, title: 'Bộ Keycap PBT Doubleshot Gradient ROG Custom', cost: 3500, icon: Award }
  ];

  return (
    <div className="space-y-6">
      <Head
        title="Điểm Thưởng & Hạng Thành Viên"
        desc="Tích lũy TechShop Xu qua mỗi đơn hàng để đổi quà tặng độc quyền và thăng hạng VIP."
        action={flashMsg && <Pill tone="green">{flashMsg}</Pill>}
      />

      {/* Hero Loyalty Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" /> Điểm khả dụng
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                1 Xu = 100đ
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono text-white mt-1">
              {points.toLocaleString('vi-VN')} <span className="text-lg text-amber-400">Xu</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Tương đương <strong className="text-slate-200">{formatVND(points * 100)}</strong> trừ trực tiếp khi thanh toán.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-right sm:min-w-[200px]">
            <div className="text-[11px] text-slate-400 font-semibold">Cấp bậc hiện tại</div>
            <div className="text-base font-black text-amber-400 flex items-center justify-end gap-1.5 mt-0.5">
              <Award className="w-4 h-4" /> VIP Diamond
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5">Chiết khấu 5% mọi đơn hàng</div>
          </div>
        </div>

        {/* Progress Bar to next tier */}
        <div className="pt-2 space-y-1.5 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Tiến trình thăng hạng: <strong>VIP Legend Master</strong></span>
            <span className="text-amber-400 font-mono font-bold">54.140.000₫ / 100.000.000₫ (54%)</span>
          </div>
          <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full w-[54%]" />
          </div>
        </div>
      </div>

      {/* Rewards Exchange */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Cửa hàng đổi quà độc quyền</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          {REWARD_ITEMS.map((r) => {
            const Icon = r.icon;
            const canAfford = points >= r.cost;
            return (
              <div
                key={r.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex items-center justify-between gap-3.5 shadow-xl"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{r.title}</div>
                    <div className="text-xs font-extrabold font-mono text-amber-400 mt-0.5">
                      {r.cost.toLocaleString('vi-VN')} Xu
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => handleRedeem(r.cost, r.title)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  Đổi ngay
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------- 5. SAVED PC BUILDS PANEL ---------- */

function PCBuildsPanel({ onAddToCart }) {
  const [builds, setBuilds] = useState(SEED_PC_BUILDS);
  const [toastMsg, setToastMsg] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBuild, setNewBuild] = useState({
    name: '',
    description: '',
    wattage: 650,
    components: [
      { type: 'CPU', name: 'AMD Ryzen 7 7700X 8 Nhân 16 Luồng', price: 7990000 },
      { type: 'VGA', name: 'ASUS TUF Gaming GeForce RTX 4070 OC 12GB', price: 16990000 },
      { type: 'Mainboard', name: 'MSI B650 Gaming Plus WiFi DDR5', price: 4290000 },
      { type: 'RAM', name: 'Corsair Vengeance RGB 32GB (2x16GB) 6000MHz', price: 2990000 },
      { type: 'SSD', name: 'Kingston KC3000 1TB PCIe 4.0 NVMe', price: 2190000 },
      { type: 'Nguồn (PSU)', name: 'Cooler Master MWE 750W Bronze V2', price: 1890000 }
    ]
  });

  const flash = (m) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 2500);
  };

  useEffect(() => {
    let active = true;
    async function loadPCBuilds() {
      try {
        const data = await api.getProfile();
        if (active && Array.isArray(data?.pcBuilds)) {
          setBuilds(data.pcBuilds);
        }
      } catch (e) {
        console.warn('Could not load PC builds from BE:', e);
      }
    }
    loadPCBuilds();
    return () => {
      active = false;
    };
  }, []);

  const handleAddBuildToCart = async (build) => {
    if (onAddToCart) {
      for (const comp of build.components) {
        await onAddToCart({ id: 1, name: comp.name, price: comp.price, variant: comp.type });
      }
    }
    flash(`Đã thêm toàn bộ ${build.components.length} linh kiện của "${build.name}" vào giỏ hàng!`);
  };

  const handleDeleteBuild = async (id) => {
    const updated = builds.filter((b) => b.id !== id);
    setBuilds(updated);
    try {
      await api.updatePCBuilds(updated);
      flash('Đã xóa cấu hình PC khỏi database!');
    } catch {
      flash('Đã xóa cấu hình PC');
    }
  };

  const handleCreateBuild = async (e) => {
    e.preventDefault();
    if (!newBuild.name.trim()) return;
    const total = newBuild.components.reduce((acc, c) => acc + (c.price || 0), 0);
    const item = {
      id: `build-${Date.now()}`,
      name: newBuild.name.trim(),
      description: newBuild.description.trim() || 'Cấu hình custom tự thiết kế',
      wattage: Number(newBuild.wattage) || 650,
      totalPrice: total,
      updatedAt: 'Hôm nay',
      components: newBuild.components
    };
    const updated = [item, ...builds];
    setBuilds(updated);
    setShowAddModal(false);
    setNewBuild((prev) => ({ ...prev, name: '', description: '' }));
    try {
      await api.updatePCBuilds(updated);
      flash('Đã lưu cấu hình PC mới vào database!');
    } catch {
      flash('Đã tạo cấu hình PC mới');
    }
  };

  return (
    <div className="space-y-6">
      <Head
        title="Cấu Hình PC Của Tôi"
        desc="Lưu trữ và theo dõi các bộ PC custom mà bạn đã cấu hình hoặc đang sở hữu."
        action={
          <div className="flex items-center gap-2">
            {toastMsg && <Pill tone="green">{toastMsg}</Pill>}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo cấu hình mới</span>
            </button>
          </div>
        }
      />

      <div className="space-y-6">
        {builds.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-sky-400" />
                    <span>{b.name}</span>
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                    Ước tính: {b.wattage}W
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{b.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddBuildToCart(b)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Mua trọn bộ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBuild(b.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-700/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="Xóa cấu hình"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Components table */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 divide-y divide-slate-800/80 overflow-hidden text-xs">
              {b.components.map((comp, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-24 shrink-0 text-[11px] font-mono font-bold text-sky-400">
                      {comp.type}
                    </span>
                    <span className="text-slate-200 font-medium truncate">{comp.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white shrink-0">
                    {formatVND(comp.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-400">Cập nhật lần cuối: {b.updatedAt}</span>
              <div className="text-right">
                <span className="text-slate-400 mr-2">Tổng tiền cấu hình:</span>
                <span className="text-base font-black font-mono text-sky-400">
                  {formatVND(b.totalPrice)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal tạo cấu hình PC mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBuild}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400" />
                <span>Tạo cấu hình PC Custom mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Tên dàn máy</label>
              <input
                type="text"
                required
                placeholder="VD: Gaming Esports RTX 4070 Super"
                value={newBuild.name}
                onChange={(e) => setNewBuild((p) => ({ ...p, name: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Mô tả mục đích sử dụng</label>
              <input
                type="text"
                placeholder="VD: Cấu hình chiến game AAA 2K và livestream"
                value={newBuild.description}
                onChange={(e) => setNewBuild((p) => ({ ...p, description: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Công suất nguồn ước tính (W)</label>
              <input
                type="number"
                value={newBuild.wattage}
                onChange={(e) => setNewBuild((p) => ({ ...p, wattage: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-sky-600/20"
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- 6. PROFILE & SECURITY PANEL (Existing Rework) ---------- */

function ProfilePanel({ user, setUser }) {
  const [profile, setProfile] = useState({
    id: user?.id || null,
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    avatar_url: user?.avatar || DEFAULT_AVATAR,
    birth_date: '',
    gender: 'male',
    bio: '',
    role: 'customer',
    memberTier: 'Khách hàng thành viên',
    points: 0,
    totalSpent: 0,
    orderCount: 0,
    two_factor_enabled: false,
    notification_preferences: {
      orderUpdates: true,
      promotions: true,
      warrantyAlerts: true,
      smsAlerts: false
    },
    hasPassword: true,
    isGoogleAccount: false,
    savedAddresses: []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [profileLoading, setProfileLoading] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [newAddr, setNewAddr] = useState({
    title: 'Nhà riêng',
    recipientName: '',
    phone: '',
    address: '',
    isDefault: false
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const flash = (m) => {
    setFlashMsg(m);
    setTimeout(() => setFlashMsg(''), 5000);
  };

  useEffect(() => {
    let active = true;
    async function loadData() {
      try {
        const data = await api.getProfile(user?.id);
        if (active && data) {
          setProfile((prev) => ({
            ...prev,
            ...data,
            name: data.name !== undefined ? data.name : (prev.name || user?.name || ''),
            email: data.email !== undefined ? data.email : (prev.email || user?.email || ''),
            phone: data.phone !== undefined ? data.phone : prev.phone,
            address: data.address !== undefined ? data.address : prev.address,
            avatar_url: data.avatar_url || prev.avatar_url,
            birth_date: data.birth_date || '',
            gender: data.gender || prev.gender || 'male',
            bio: data.bio || '',
            role: 'customer',
            memberTier: data.memberTier || prev.memberTier || 'Khách hàng thành viên',
            points: data.points != null ? Number(data.points) : prev.points,
            totalSpent: data.totalSpent != null ? Number(data.totalSpent) : prev.totalSpent,
            orderCount: data.orderCount != null ? Number(data.orderCount) : prev.orderCount,
            hasPassword: data.hasPassword !== undefined ? Boolean(data.hasPassword) : prev.hasPassword,
            isGoogleAccount: Boolean(data.isGoogleAccount),
            savedAddresses: data.savedAddresses || []
          }));
          setTwoFactorEnabled(Boolean(data.two_factor_enabled));
        }
      } catch (e) {
        console.warn('Could not load profile from BE:', e);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [user?.id, user?.name, user?.email]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      await api.updateProfile({
        ...profile,
        id: user?.id || profile.id,
        gender: profile.gender || 'male',
        bio: profile.bio || ''
      });
      if (setUser) {
        setUser((prev) => ({
          ...(prev || {}),
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          avatar: profile.avatar_url,
          role: 'customer'
        }));
      }
      setIsEditing(false);
      flash('Đã lưu hồ sơ thành công!');
    } catch (err) {
      flash(err.message || 'Lỗi lưu thông tin');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (profile.hasPassword && !passwords.currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      const wasFirstTime = !profile.hasPassword;
      const res = await api.changePassword({
        currentPassword: profile.hasPassword ? passwords.currentPassword : '',
        newPassword: passwords.newPassword,
        id: user?.id || profile.id
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setProfile((prev) => ({ ...prev, hasPassword: true }));
      const successMsg = res?.message || (wasFirstTime
        ? 'Thiết lập mật khẩu mới thành công! Giờ đây bạn có thể dùng Email + Mật khẩu mới hoặc Google để đăng nhập.'
        : 'Đã đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
      setPasswordSuccess(successMsg);
      flash(successMsg);
    } catch (err) {
      setPasswordError(err.message || 'Không thể đổi mật khẩu.');
    }
  };

  const handleToggleNotif = async (key) => {
    const nextPrefs = {
      ...profile.notification_preferences,
      [key]: !profile.notification_preferences?.[key]
    };
    setProfile((prev) => ({ ...prev, notification_preferences: nextPrefs }));
    try {
      await api.updateProfile({ id: user?.id || profile.id, notification_preferences: nextPrefs });
      flash('Đã cập nhật cài đặt thông báo');
    } catch {
      // ignore
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setNewAddr({
      title: 'Nhà riêng',
      recipientName: profile.name || user?.name || '',
      phone: profile.phone || '',
      address: '',
      isDefault: profile.savedAddresses.length === 0
    });
    setShowAddAddressModal(true);
  };

  const handleOpenEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddr({
      title: addr.title,
      recipientName: addr.recipientName,
      phone: addr.phone,
      address: addr.address,
      isDefault: Boolean(addr.isDefault)
    });
    setShowAddAddressModal(true);
  };

  const handleSaveAddressModal = async (e) => {
    e.preventDefault();
    if (!newAddr.recipientName || !newAddr.phone || !newAddr.address) return;

    let updated = [];
    if (editingAddressId) {
      updated = profile.savedAddresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            title: newAddr.title,
            recipientName: newAddr.recipientName,
            phone: newAddr.phone,
            address: newAddr.address,
            isDefault: newAddr.isDefault
          };
        }
        return newAddr.isDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const item = {
        id: `addr-${Date.now()}`,
        title: newAddr.title,
        recipientName: newAddr.recipientName,
        phone: newAddr.phone,
        address: newAddr.address,
        isDefault: newAddr.isDefault || profile.savedAddresses.length === 0
      };
      updated = [...profile.savedAddresses];
      if (item.isDefault) {
        updated = updated.map((a) => ({ ...a, isDefault: false }));
      }
      updated.push(item);
    }

    const defaultAddr = updated.find((a) => a.isDefault) || updated[0];
    const newAddressStr = defaultAddr ? defaultAddr.address : profile.address;

    setProfile((p) => ({
      ...p,
      savedAddresses: updated,
      address: newAddressStr
    }));
    setShowAddAddressModal(false);
    setEditingAddressId(null);
    setNewAddr({ title: 'Nhà riêng', recipientName: '', phone: '', address: '', isDefault: false });

    try {
      await api.updateAddresses(updated);
      flash(editingAddressId ? 'Đã cập nhật địa chỉ giao hàng!' : 'Đã thêm địa chỉ giao hàng mới!');
    } catch {
      flash('Đã lưu địa chỉ giao hàng');
    }
  };

  const handleDeleteAddress = async (id) => {
    const updated = profile.savedAddresses.filter((a) => a.id !== id);
    const defaultAddr = updated.find((a) => a.isDefault) || updated[0];
    const newAddressStr = defaultAddr ? defaultAddr.address : '';
    setProfile((p) => ({ ...p, savedAddresses: updated, address: newAddressStr }));
    try {
      await api.updateAddresses(updated);
      flash('Đã xóa địa chỉ thành công!');
    } catch {
      flash('Đã xóa địa chỉ');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    const updated = profile.savedAddresses.map((a) => ({ ...a, isDefault: a.id === id }));
    const defaultAddr = updated.find((a) => a.id === id);
    const newAddressStr = defaultAddr ? defaultAddr.address : profile.address;
    setProfile((p) => ({ ...p, savedAddresses: updated, address: newAddressStr }));
    try {
      await api.updateAddresses(updated);
      flash('Đã đặt làm địa chỉ mặc định!');
    } catch {
      flash('Đã đặt làm địa chỉ mặc định');
    }
  };

  const pwdStrength = getPasswordStrength(passwords.newPassword);

  return (
    <div className="space-y-6">
      {/* Top Profile Hero Card */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-sky-950/40 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={profile.avatar_url || DEFAULT_AVATAR}
                alt={profile.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-sky-500/40 shadow-lg"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white">{profile.name || user?.name || 'Khách hàng'}</h1>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {profile.email || user?.email || 'Chưa cập nhật email'}
                </span>
                <span>·</span>
                <span className="font-mono text-slate-400">Mã KH: #KH-{profile.id || user?.id || '---'}</span>
                <span>·</span>
                <span>{profile.created_at ? `Tham gia từ ${new Date(profile.created_at).toLocaleDateString('vi-VN')}` : 'Tài khoản hoạt động'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {flashMsg && <Pill tone="green">{flashMsg}</Pill>}
          </div>
        </div>

        {/* Real Stats from Backend (Orders & Customers table) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-400" /> Đơn hàng đã đặt
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono text-white mt-1">
              {profile.orderCount || 0} đơn hàng
            </div>
            <div className="text-[10px] text-sky-400 font-semibold mt-0.5">Dữ liệu từ lịch sử mua sắm</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> Tổng chi tiêu tích lũy
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 mt-1">
              {Number(profile.totalSpent || 0).toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[10px] text-emerald-400/80 font-semibold mt-0.5">Tổng giá trị đơn hoàn tất</div>
          </div>
        </div>
      </div>

      {/* Profile Sub-tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        {[
          { id: 'general', label: 'Hồ sơ & Sổ địa chỉ', icon: User },
          { id: 'security', label: 'Mật khẩu & Bảo mật', icon: KeyRound },
          { id: 'notifications', label: 'Cài đặt thông báo', icon: Bell }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Thông báo thao tác chung (Lưu hồ sơ, đổi mật khẩu, v.v.) */}
      {flashMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{flashMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFlashMsg('')}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition cursor-pointer"
          >
            ✕ Đóng
          </button>
        </div>
      )}

      {/* Sub-tab 1: General Profile & Address Book */}
      {activeSubTab === 'general' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Personal Information Card */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-400" />
                  <span>{isEditing ? 'Chỉnh sửa thông tin cá nhân' : 'Thông tin cá nhân'}</span>
                </h3>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-600/20"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Update</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-slate-400 hover:text-white transition font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
              </div>

              {!isEditing ? (
                /* CHẾ ĐỘ VIEW (CHỈ HIỂN THỊ THÔNG TIN ĐÃ LƯU) */
                <div className="space-y-4 text-xs">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Họ và tên</span>
                      <span className="text-white font-bold text-sm block">
                        {profile.name || '(Chưa cập nhật)'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Email</span>
                      <span className="text-white font-bold text-sm block truncate">
                        {profile.email || '(Chưa cập nhật)'}
                      </span>
                      {profile.isGoogleAccount && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/20 text-sky-400">
                          Đăng nhập bằng Google
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Số điện thoại</span>
                      <span className="text-white font-mono font-bold text-sm block">
                        {profile.phone || '(Chưa cập nhật)'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block">Ngày sinh</span>
                      <span className="text-white font-bold text-sm block">
                        {profile.birth_date
                          ? new Date(profile.birth_date).toLocaleDateString('vi-VN')
                          : '(Chưa cập nhật)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">Giới tính</span>
                    <span className="text-white font-bold text-sm block">
                      {profile.gender === 'female' ? 'Nữ' : profile.gender === 'other' ? 'Khác' : 'Nam'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 block">Tiểu sử / Ghi chú</span>
                    <span className="text-slate-300 text-xs block italic leading-relaxed">
                      {profile.bio || '(Chưa có thông tin tiểu sử)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Chỉnh sửa thông tin (Update)</span>
                  </button>
                </div>
              ) : (
                /* CHẾ ĐỘ FORM CHỈNH SỬA KHI ẤN UPDATE */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Họ và tên</label>
                      <input
                        type="text"
                        required
                        value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        placeholder="Nhập họ và tên..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Email</label>
                      <input
                        type="email"
                        required
                        value={profile.email}
                        onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        placeholder="email@example.com"
                      />
                      {profile.isGoogleAccount && (
                        <p className="text-[10px] text-sky-400">Tài khoản Google: email được đồng bộ tự động</p>
                      )}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Số điện thoại</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        placeholder="Nhập số điện thoại..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400">Ngày sinh</label>
                      <input
                        type="date"
                        value={profile.birth_date || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, birth_date: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Giới tính</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'male', label: 'Nam' },
                        { id: 'female', label: 'Nữ' },
                        { id: 'other', label: 'Khác' }
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setProfile((p) => ({ ...p, gender: g.id }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                            profile.gender === g.id
                              ? 'bg-sky-600/20 border-sky-500 text-sky-400 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Tiểu sử / Ghi chú</label>
                    <textarea
                      rows={2}
                      value={profile.bio || ''}
                      onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                      placeholder="Mô tả ngắn về bạn..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>Lưu thay đổi</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

          {/* Right Card: Saved Address Book */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Sổ địa chỉ nhận hàng</span>
              </h3>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm mới</span>
              </button>
            </div>

            <div className="space-y-3">
              {profile.savedAddresses && profile.savedAddresses.length > 0 ? (
                profile.savedAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-3.5 rounded-xl border transition ${
                      addr.isDefault
                        ? 'bg-slate-950/80 border-sky-500/50 shadow-sm shadow-sky-500/10'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{addr.title}</span>
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-400 border border-sky-500/40">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          className="text-[10px] text-sky-400 hover:text-sky-300 font-medium transition cursor-pointer flex items-center gap-1"
                          title="Sửa địa chỉ này"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Sửa</span>
                        </button>
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[10px] text-slate-400 hover:text-sky-400 transition cursor-pointer"
                          >
                            Đặt mặc định
                          </button>
                        )}
                        {profile.savedAddresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Xóa địa chỉ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 mt-1.5 font-medium">
                      {addr.recipientName} · <span className="font-mono text-slate-400">{addr.phone}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{addr.address}</div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-slate-400 space-y-2">
                  <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-medium">Bạn chưa lưu địa chỉ giao hàng nào.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 text-xs font-semibold border border-sky-500/30 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm địa chỉ ngay</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Sub-tab 2: Password & Two-Factor Authentication */}
      {activeSubTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Card 1: Change Password */}
          <form
            onSubmit={handleSavePassword}
            className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl"
          >
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>{profile.hasPassword ? 'Đổi mật khẩu tài khoản' : 'Thiết lập mật khẩu tài khoản'}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {profile.hasPassword
                  ? 'Nên đổi mật khẩu định kỳ 90 ngày để đảm bảo an toàn tuyệt đối.'
                  : 'Tài khoản đăng nhập Google chưa có mật khẩu TechShop. Bạn có thể tạo mật khẩu để đăng nhập bằng Email.'}
              </p>
            </div>

            {!profile.hasPassword && (
              <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3 text-xs text-sky-200">
                <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Tài khoản liên kết Google</div>
                  <div className="text-[11px] text-sky-300/80 mt-0.5 leading-relaxed">
                    Bạn hiện đang đăng nhập qua Google. Bạn có thể đặt mật khẩu bên dưới để có thêm lựa chọn đăng nhập bằng Email + Mật khẩu.
                  </div>
                </div>
              </div>
            )}

            {profile.hasPassword && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Mật khẩu hiện tại</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu hiện tại"
                    required={profile.hasPassword}
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                  minLength={8}
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {passwords.newPassword && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Độ mạnh mật khẩu:</span>
                    <span className={`font-bold ${pwdStrength.text}`}>{pwdStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all ${
                          step <= pwdStrength.score ? pwdStrength.color : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Nhập lại mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 cursor-pointer"
            >
              {profile.hasPassword ? 'Cập nhật mật khẩu mới' : 'Thiết lập mật khẩu'}
            </button>
          </form>

          {/* Quick Security Tips */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-3 text-xs text-slate-400 shadow-xl">
            <div className="font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Mẹo bảo mật tài khoản TechShop</span>
            </div>
            <ul className="list-disc pl-4 space-y-2 text-xs leading-relaxed text-slate-400">
              <li>Sử dụng mật khẩu có độ dài tối thiểu 8 ký tự, kết hợp chữ hoa, chữ thường và chữ số.</li>
              <li>Không chia sẻ mật khẩu hoặc thông tin đăng nhập cho bất kỳ ai.</li>
              <li>Đổi mật khẩu định kỳ 3-6 tháng để bảo vệ tài khoản tốt nhất.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Notification Preferences (Lưu trực tiếp vào DB notification_preferences) */}
      {activeSubTab === 'notifications' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl max-w-3xl">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400" />
              <span>Cài đặt thông báo &amp; Quyền riêng tư</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tùy chỉnh các kênh bạn muốn nhận cập nhật từ Techshop. Dữ liệu được lưu trữ tự động vào tài khoản của bạn.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                id: 'orderUpdates',
                title: 'Hành trình đơn hàng & Vận chuyển',
                desc: 'Nhận thông báo khi kiện hàng được bàn giao và đang trên đường giao tới bạn.'
              },
              {
                id: 'promotions',
                title: 'Ưu đãi & Flash Sale sản phẩm',
                desc: 'Thông báo sớm khi có chương trình khuyến mãi linh kiện và thiết bị công nghệ.'
              },
              {
                id: 'warrantyAlerts',
                title: 'Cảnh báo thời hạn bảo hành',
                desc: 'Nhắc nhở về hạn bảo hành sản phẩm đã mua tại hệ thống.'
              },
              {
                id: 'smsAlerts',
                title: 'Tin nhắn thông báo quan trọng',
                desc: 'Gửi tin nhắn về trạng thái thay đổi mật khẩu hoặc hoạt động bảo mật.'
              }
            ].map((item) => {
              const isChecked = Boolean(profile.notification_preferences?.[item.id]);
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleNotif(item.id)}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                  <div
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition shrink-0 ${
                      isChecked ? 'bg-sky-600 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-md transition" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Add / Edit Address */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAddressModal}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>{editingAddressId ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ giao hàng mới'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddAddressModal(false);
                  setEditingAddressId(null);
                }}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Nhãn địa chỉ</label>
              <div className="flex gap-2">
                {['Nhà riêng', 'Văn phòng', 'Khác'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewAddr((prev) => ({ ...prev, title: t }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      newAddr.title === t
                        ? 'bg-sky-600/20 border-sky-500 text-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Người nhận</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn A"
                  value={newAddr.recipientName}
                  onChange={(e) => setNewAddr((prev) => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Số điện thoại</label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0912 345 678"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400">Địa chỉ chi tiết</label>
              <textarea
                required
                rows={2}
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                value={newAddr.address}
                onChange={(e) => setNewAddr((prev) => ({ ...prev, address: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newAddr.isDefault}
                onChange={(e) => setNewAddr((prev) => ({ ...prev, isDefault: e.target.checked }))}
                className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
              />
              <span>Đặt làm địa chỉ nhận hàng mặc định</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddAddressModal(false);
                  setEditingAddressId(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-sky-600/20"
              >
                {editingAddressId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

/* ---------- 7. WARRANTY PANEL ---------- */

function WarrantyPanel({ orders }) {
  const allItems = orders.flatMap((o) =>
    (o.items || []).map((i) => ({
      ...i,
      orderId: o.orderId,
      date: o.date || o.createdAt,
      phase: o.phase
    }))
  );

  return (
    <div className="space-y-6">
      <Head
        title="Bảo Hành Thiết Bị"
        desc="Thiết bị đã đặt mua và thời hạn bảo hành chính hãng còn lại."
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800/80 overflow-hidden shadow-xl">
        {allItems.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400">
            Chưa có thiết bị nào được kích hoạt bảo hành.
          </p>
        ) : (
          allItems.map((i, idx) => (
            <div
              key={idx}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={i.image || DEFAULT_PRODUCT_IMAGE}
                  alt={i.name}
                  className="w-12 h-12 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-white truncate">
                    {i.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                    {i.orderId} · S/N: TS{(idx + 12).toString().padStart(2, '0')}A9
                    {String(i.id || idx).slice(-2)}K
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <Pill tone="green">Bảo hành {i.warrantyMonths || 36} tháng</Pill>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ---------- 8. REVIEWS PANEL ---------- */

function ReviewsPanel({ orders }) {
  const items = orders.flatMap((o) => o.items || []);
  const [ratings, setRatings] = useState({});
  const [reviews, setReviews] = useState({});
  const [sent, setSent] = useState({});

  useEffect(() => {
    let active = true;
    async function loadReviews() {
      try {
        const data = await api.getProfile();
        if (active && data?.productReviews) {
          const revs = data.productReviews;
          const s = {};
          const r = {};
          const comments = {};
          Object.keys(revs).forEach((k) => {
            s[k] = true;
            r[k] = revs[k].rating || 5;
            comments[k] = revs[k].comment || '';
          });
          setSent((prev) => ({ ...prev, ...s }));
          setRatings((prev) => ({ ...prev, ...r }));
          setReviews((prev) => ({ ...prev, ...comments }));
        }
      } catch (e) {
        console.warn('Could not load reviews from BE:', e);
      }
    }
    loadReviews();
    return () => {
      active = false;
    };
  }, []);

  const handleSendReview = async (key) => {
    const star = ratings[key] || 5;
    const comment = reviews[key] || '';
    setSent((s) => ({ ...s, [key]: true }));
    try {
      await api.submitReview({ key, rating: star, comment });
    } catch (e) {
      console.warn('Could not save review to DB:', e);
    }
  };

  return (
    <div className="space-y-6">
      <Head
        title="Đánh Giá Sản Phẩm"
        desc="Chia sẻ trải nghiệm phần cứng và hiệu năng thực tế của thiết bị."
      />

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-xs text-slate-400">
            Bạn có thể đánh giá sản phẩm sau khi đặt mua.
          </div>
        ) : (
          items.map((i, idx) => {
            const key = `${i.id || idx}-${i.name}`;
            const isSent = sent[key];
            const currentRating = ratings[key] || 5;

            return (
              <div
                key={key}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row gap-4 shadow-xl"
              >
                <img
                  src={i.image || DEFAULT_PRODUCT_IMAGE}
                  alt={i.name}
                  className="w-16 h-16 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1.5 shrink-0"
                />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-white truncate">
                    {i.name}
                  </div>
                  {i.variant && (
                    <div className="text-[11px] text-sky-400 font-semibold">{i.variant}</div>
                  )}

                  {isSent ? (
                    <Pill tone="green">
                      Cảm ơn bạn đã đánh giá {currentRating}★ cho sản phẩm (đã lưu vào database)!
                    </Pill>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRatings((r) => ({ ...r, [key]: star }))}
                            className="cursor-pointer transition hover:scale-110"
                            aria-label={`${star} sao`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= currentRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs text-amber-400 font-bold ml-1">
                          {currentRating}/5 sao
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={reviews[key] || ''}
                          onChange={(e) =>
                            setReviews((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          placeholder="Nhận xét về hiệu năng, nhiệt độ, độ hoàn thiện..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReview(key)}
                          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer shrink-0"
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------- 9. SUPPORT TICKETS PANEL ---------- */

const SEED_TICKETS = [
  {
    id: 'TK-1042',
    subject: 'RTX 4070 Super lỗi artifact sau 2 tuần',
    customer: 'Đặng Minh Thuận',
    priority: 'Cao',
    status: 'open',
    date: '19/10/2026'
  },
  {
    id: 'TK-1038',
    subject: 'Hỏi tương thích RAM DDR5 với mainboard B650',
    customer: 'Đặng Minh Thuận',
    priority: 'Thấp',
    status: 'progress',
    date: '14/10/2026'
  },
  {
    id: 'TK-1021',
    subject: 'Đổi switch bàn phím cơ sang Kailh tactile',
    customer: 'Đặng Minh Thuận',
    priority: 'Trung bình',
    status: 'closed',
    date: '02/10/2026'
  }
];

const TICKET_STATUS = {
  open: ['Mới', 'amber'],
  progress: ['Đang xử lý', 'sky'],
  resolved: ['Đã giải quyết', 'green'],
  closed: ['Đã đóng', 'slate']
};

function TicketsPanel() {
  const [tickets, setTickets] = useState(SEED_TICKETS);
  const [subject, setSubject] = useState('');

  useEffect(() => {
    let active = true;
    async function loadTickets() {
      try {
        const data = await api.getProfile();
        if (active && Array.isArray(data?.supportTickets)) {
          setTickets(data.supportTickets);
        }
      } catch (e) {
        console.warn('Could not load tickets from BE:', e);
      }
    }
    loadTickets();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim()) return;
    const title = subject.trim();
    setSubject('');
    try {
      const res = await api.createTicket({ subject: title, priority: 'Trung bình' });
      if (res?.data) {
        setTickets((prev) => [res.data, ...prev]);
      }
    } catch (err) {
      console.warn('Could not save ticket to DB:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Head
        title="Yêu Cầu Hỗ Trợ Kỹ Thuật"
        desc="Mở ticket khi thiết bị gặp sự cố, đội ngũ kỹ sư Techshop sẽ liên hệ trong 15 phút."
      />

      <form
        onSubmit={handleCreateTicket}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex gap-2 shadow-xl"
      >
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Mô tả sự cố hoặc yêu cầu tương thích phần cứng..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Mở Ticket</span>
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800 overflow-hidden shadow-xl">
        {tickets.map((t) => {
          const [label, tone] = TICKET_STATUS[t.status] || ['Đang xử lý', 'sky'];
          return (
            <div
              key={t.id}
              className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition"
            >
              <div className="min-w-0">
                <div className="text-[11px] font-mono text-slate-400">
                  {t.id} · {t.date}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
                  {t.subject}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="hidden sm:inline text-[11px] text-slate-400 font-mono">
                  {t.priority}
                </span>
                <Pill tone={tone}>{label}</Pill>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 10. CHAT PANEL ---------- */

function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Xin chào! Techshop có thể hỗ trợ tư vấn thiết bị, kiểm tra độ tương thích hoặc tình trạng đơn hàng gì cho bạn hôm nay ạ?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const userText = inputVal.trim();
    setInputVal('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Chuyên viên kỹ thuật Techshop đã nhận được tin nhắn và đang kiểm tra cấu hình thiết bị cho bạn. Vui lòng chờ giây lát!'
        }
      ]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <Head
        title="Chat Tư Vấn Kỹ Thuật"
        desc="Trò chuyện trực tiếp cùng chuyên gia phần cứng và hỗ trợ bảo hành."
      />

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col h-[460px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md rounded-2xl p-3.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-600/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-inner'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="pt-3 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ---------- MAIN ORDERS / DASHBOARD PAGE ---------- */

export default function OrdersPage() {
  const { user, setUser } = useAuth();
  const { addToCart } = useCart();
  const { tab: tabParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const VALID_TABS = [
    'orders',
    'vouchers',
    'wishlist',
    'profile',
    'payment-methods',
    'rewards',
    'warranty',
    'reviews'
  ];
  const legacyTab = searchParams.get('tab');
  // Slug trên URL -> id tab (tab "profile" dùng slug "account": /profile/account)
  const slugToTab = (slug) => (slug === 'account' ? 'profile' : slug);
  const tabToSlug = (tab) => (tab === 'profile' ? 'account' : tab);
  const resolvedTab = slugToTab(tabParam) || legacyTab || 'orders';
  const activeTab = VALID_TABS.includes(resolvedTab) ? resolvedTab : 'orders';

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [payingOrder, setPayingOrder] = useState(null); // { orderCode, vietQR }
  const [payLoadingCode, setPayLoadingCode] = useState('');
  const [paidNotice, setPaidNotice] = useState('');
  const awaitingRef = React.useRef(new Set());

  const setActiveTab = (tab) => {
    navigate(`/profile/${tabToSlug(tab)}`);
  };

  // Chuẩn hóa URL: /profile, /orders, /orders?tab=x -> /profile/<slug>
  useEffect(() => {
    if (tabParam !== tabToSlug(activeTab)) {
      navigate(`/profile/${tabToSlug(activeTab)}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam, activeTab, navigate]);

  const fetchOrders = useCallback(async (opts) => {
    const silent = opts?.silent === true;
    if (!silent) setLoadingOrders(true);
    try {
      const dbOrders = await api.getOrders();
      if (Array.isArray(dbOrders) && dbOrders.length > 0) {
        setOrders(dbOrders);
        setSelectedOrderId((prev) => {
          const exists = dbOrders.some((o) => o.orderId === prev);
          return exists ? prev : dbOrders[0].orderId;
        });
      } else if (!silent) {
        const fallback = loadSavedOrders();
        setOrders(fallback);
        if (fallback.length > 0) {
          setSelectedOrderId(fallback[0].orderId);
        }
      }
    } catch (err) {
      if (!silent) {
        console.warn('Failed to fetch orders from backend, using saved fallback:', err);
        const fallback = loadSavedOrders();
        setOrders(fallback);
        if (fallback.length > 0) {
          setSelectedOrderId(fallback[0].orderId);
        }
      }
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Đơn VietQR chưa thanh toán: poll BE mỗi 4s. Khi tiền về (payment_status = paid)
  // BE tự chuyển đơn từ "Chờ xác nhận" sang "Đã xác nhận".
  const hasAwaitingPayment = orders.some((o) => o.awaitingPayment);
  useEffect(() => {
    if (!hasAwaitingPayment) return undefined;
    const timer = setInterval(() => fetchOrders({ silent: true }), 4000);
    return () => clearInterval(timer);
  }, [hasAwaitingPayment, fetchOrders]);

  // Phát hiện đơn vừa chuyển từ chờ thanh toán -> đã thanh toán để báo cho người dùng
  useEffect(() => {
    const nowAwaiting = new Set(orders.filter((o) => o.awaitingPayment).map((o) => o.orderId));
    const justPaid = orders.filter(
      (o) => awaitingRef.current.has(o.orderId) && !nowAwaiting.has(o.orderId) && o.paymentStatus === 'paid'
    );
    awaitingRef.current = nowAwaiting;
    if (justPaid.length > 0) {
      setPaidNotice(`Đã nhận thanh toán cho đơn ${justPaid[0].orderId}. Đơn hàng chuyển sang "Đã xác nhận".`);
      setPayingOrder(null);
      const t = setTimeout(() => setPaidNotice(''), 6000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [orders]);

  const handleOpenPayment = async (order) => {
    try {
      setPayLoadingCode(order.orderId);
      const res = await api.getOrder(order.orderCode || order.orderId);
      const vietQR = res?.data?.vietQR;
      if (vietQR) setPayingOrder({ orderCode: order.orderCode || order.orderId, vietQR });
    } catch (err) {
      console.warn('Could not load VietQR data:', err);
    } finally {
      setPayLoadingCode('');
    }
  };

  const selectedOrder = orders.find((o) => o.orderId === selectedOrderId) || orders[0];

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const navGroups = [
    {
      groupTitle: 'MUA SẮM & ĐƠN HÀNG',
      items: [
        { id: 'orders', label: 'Đơn hàng của tôi', icon: Package },
        { id: 'vouchers', label: 'Kho Voucher & Ưu đãi', icon: TicketPercent },
        { id: 'wishlist', label: 'Sản phẩm yêu thích', icon: Heart }
      ]
    },
    {
      groupTitle: 'TÀI KHOẢN & QUẢN TRỊ',
      items: [
        { id: 'profile', label: 'Hồ sơ & bảo mật', icon: User },
        { id: 'payment-methods', label: 'Phương thức thanh toán', icon: CreditCard },
        { id: 'rewards', label: 'Điểm thưởng & Hạng VIP', icon: Coins }
      ]
    },
    {
      groupTitle: 'DỊCH VỤ & HẬU MÃI',
      items: [
        { id: 'warranty', label: 'Bảo hành thiết bị', icon: ShieldCheck },
        { id: 'reviews', label: 'Đánh giá sản phẩm', icon: Star }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar (User Info & Multi-group Navigation) */}
          <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <div className="flex items-center gap-3.5 pb-4 mb-3 border-b border-slate-800">
                <img
                  src={user?.avatar || DEFAULT_AVATAR}
                  alt={user?.name || 'Đặng Minh Thuận'}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {user?.name || 'Đặng Minh Thuận'}
                  </div>
                  <div className="text-xs font-semibold text-sky-400 mt-0.5 truncate">
                    {user?.role || 'Thành viên VIP Diamond'}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                      {group.groupTitle}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            isActive
                              ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="lg:col-span-9 min-w-0">
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {paidNotice && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{paidNotice}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                      Đơn Hàng Của Tôi
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Theo dõi tiến độ xử lý và hành trình giao hàng từ hệ thống.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">
                      {orders.length} đơn hàng
                    </span>
                    <button
                      type="button"
                      onClick={fetchOrders}
                      disabled={loadingOrders}
                      title="Làm mới danh sách đơn hàng"
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin text-sky-400' : ''}`}
                      />
                    </button>
                  </div>
                </div>

                {loadingOrders && orders.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3 shadow-xl">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                    <span className="text-xs font-medium">Đang tải danh sách đơn hàng...</span>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center space-y-4 shadow-xl">
                    <Package className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-base font-bold text-white">Bạn chưa có đơn hàng nào</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Các thiết bị công nghệ bạn đặt mua sẽ hiển thị lộ trình vận chuyển chi tiết tại đây.
                    </p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md shadow-sky-600/20"
                    >
                      Khám phá sản phẩm <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column (Orders List + Active Timeline) */}
                    <div className="lg:col-span-7 space-y-4">
                      {orders.map((order) => {
                        const isOpen = order.orderId === selectedOrderId;
                        const phase = order.phase ?? 0;
                        const orderItems = order.items || [];
                        const totalItemCount = orderItems.reduce(
                          (s, i) => s + (i.quantity || 1),
                          0
                        );

                        return (
                          <div
                            key={order.orderId}
                            className={`rounded-2xl border transition-all overflow-hidden ${
                              isOpen
                                ? 'bg-slate-900 border-sky-500 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/30'
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedOrderId(order.orderId)}
                              className="w-full flex items-center justify-between p-4 text-left cursor-pointer gap-3.5"
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="flex -space-x-3 shrink-0">
                                  {orderItems.slice(0, 2).map((item, idx) => (
                                    <img
                                      key={idx}
                                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                                      alt={item.name}
                                      className="w-11 h-11 rounded-xl object-contain bg-slate-950 border-2 border-slate-900 p-1 shrink-0"
                                    />
                                  ))}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-sm font-bold text-white">
                                      {order.orderId}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                        PHASE_BADGES[phase] || 'bg-slate-800 text-slate-300'
                                      }`}
                                    >
                                      {order.statusLabel || ORDER_PHASES[phase]?.title}
                                    </span>
                                    {order.awaitingPayment && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-rose-500/15 border-rose-500/30 text-rose-400 flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Chưa thanh toán
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    {formatOrderDate(order.date || order.createdAt)} ·{' '}
                                    {totalItemCount} sản phẩm
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0 flex items-center gap-2.5">
                                <div>
                                  <span className="text-xs text-slate-400 block font-mono">
                                    Tổng tiền
                                  </span>
                                  <span className="font-mono text-sm font-extrabold text-sky-400">
                                    {formatVND(order.total)}
                                  </span>
                                </div>
                                <div
                                  className={`p-1 rounded-lg transition-transform ${
                                    isOpen ? 'rotate-180 text-sky-400' : 'text-slate-500'
                                  }`}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </div>
                              </div>
                            </button>

                            {/* Expanded Timeline */}
                            {isOpen && (
                              <div className="px-5 pb-6 pt-2 border-t border-slate-800/80 space-y-4">
                                <ol className="relative ml-2 sm:ml-4 pl-6 border-l-2 border-slate-800 space-y-6">
                                  {ORDER_PHASES.map((step, idx) => {
                                    const done = idx < phase;
                                    const isCurrent = idx === phase;

                                    return (
                                      <li key={step.title} className="relative">
                                        <span
                                          className={`absolute -left-[37px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                            done
                                              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                                              : isCurrent
                                              ? 'bg-slate-900 border-2 border-sky-400 text-sky-400 ring-4 ring-sky-500/20'
                                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                                          }`}
                                        >
                                          {done ? (
                                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          ) : (
                                            idx + 1
                                          )}
                                        </span>

                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`text-xs font-bold ${
                                                done || isCurrent ? 'text-white' : 'text-slate-500'
                                              }`}
                                            >
                                              {step.title}
                                            </span>
                                            {isCurrent && (
                                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-sky-500/20 border border-sky-500/40 text-sky-400 tracking-wider">
                                                Hiện tại
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-slate-400">
                                            {idx === 0 && order.awaitingPayment
                                              ? 'Đơn hàng đã được tạo, đang chờ nhận tiền chuyển khoản VietQR'
                                              : step.desc}
                                          </p>

                                          {idx === 0 && isCurrent && order.awaitingPayment && (
                                            <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                                              <div className="flex items-start gap-2 text-[11px] text-amber-300 leading-relaxed">
                                                <Loader2 className="w-3.5 h-3.5 mt-0.5 animate-spin shrink-0" />
                                                <span>
                                                  Hệ thống sẽ tự động chuyển sang <strong>Đã xác nhận</strong> ngay khi ngân hàng báo nhận đủ{' '}
                                                  <strong>{formatVND(order.total)}</strong>. Không cần bấm xác nhận thủ công.
                                                </span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleOpenPayment(order)}
                                                disabled={payLoadingCode === order.orderId}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer disabled:opacity-60"
                                              >
                                                {payLoadingCode === order.orderId ? (
                                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                  <QrCode className="w-3.5 h-3.5" />
                                                )}
                                                <span>Mở mã QR để thanh toán</span>
                                              </button>
                                            </div>
                                          )}

                                          {isCurrent && order.trackingCode && !order.awaitingPayment && (
                                            <div className="mt-3 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
                                              <div className="min-w-0">
                                                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                                                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                                                  <span>{order.carrier}</span>
                                                </div>
                                                <div className="font-mono text-xs font-extrabold text-sky-400 mt-0.5 truncate">
                                                  {order.trackingCode}
                                                </div>
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() => handleCopy(order.trackingCode)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 cursor-pointer shrink-0"
                                              >
                                                {copiedCode === order.trackingCode ? (
                                                  <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span className="text-emerald-400">Đã chép</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Copy className="w-3.5 h-3.5" />
                                                    <span>Sao chép</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ol>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column (Ordered Items Details Box) */}
                    <aside className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-5 lg:sticky lg:top-24 shadow-xl">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Sản Phẩm Đã Đặt
                        </h3>
                        <span className="font-mono text-xs font-bold text-sky-400">
                          {selectedOrder?.orderId}
                        </span>
                      </div>

                      <ul className="divide-y divide-slate-800/80 space-y-3">
                        {selectedOrder?.items?.map((item, idx) => (
                          <li key={idx} className="flex gap-3 pt-3 first:pt-0">
                            <img
                              src={item.image || DEFAULT_PRODUCT_IMAGE}
                              alt={item.name}
                              className="w-16 h-16 rounded-xl object-contain bg-slate-950 border border-slate-800 p-1.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="text-xs font-bold text-white line-clamp-2 leading-tight">
                                {item.name}
                              </div>
                              {item.variant && (
                                <div className="text-[11px] text-sky-400 font-semibold truncate">
                                  {item.variant}
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-slate-400 font-mono">x{item.quantity}</span>
                                <span className="font-mono font-bold text-slate-100">
                                  {formatVND((item.price || 0) * (item.quantity || 1))}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>

                      {(selectedOrder?.recipientName || selectedOrder?.customer?.fullName) && (
                        <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Thông tin nhận hàng
                          </span>
                          <div className="text-white font-semibold flex items-center justify-between">
                            <span>
                              {selectedOrder.recipientName || selectedOrder.customer?.fullName}
                            </span>
                            <span className="font-mono text-slate-300">
                              {selectedOrder.recipientPhone || selectedOrder.customer?.phone}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] leading-relaxed">
                            {selectedOrder.shippingAddress || selectedOrder.customer?.address}
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Thanh toán:</span>
                          <span className="text-slate-200 font-semibold">
                            {selectedOrder?.paymentMethod || 'VietQR Banking Auto'}
                          </span>
                        </div>
                        {selectedOrder?.paymentStatus && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Trạng thái thanh toán:</span>
                            {selectedOrder.paymentStatus === 'paid' ? (
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã thanh toán
                              </span>
                            ) : (
                              <span className="text-amber-400 font-semibold">Chưa thanh toán</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                          <span className="text-sm font-bold text-white">Tổng cộng:</span>
                          <span className="text-base font-extrabold font-mono text-sky-400">
                            {formatVND(selectedOrder?.total)}
                          </span>
                        </div>
                      </div>
                    </aside>
                  </div>
                )}
              </div>
            )}

            {/* Shopping & Profile Sub-pages */}
            {activeTab === 'vouchers' && <VouchersPanel />}

            {activeTab === 'wishlist' && (
              <WishlistPanel
                onAddToCart={(item) =>
                  addToCart(item.variantId || item.id, 1, item.productId || item.id)
                }
              />
            )}

            {activeTab === 'payment-methods' && <PaymentMethodsPanel />}

            {activeTab === 'rewards' && <RewardsPanel />}

            {/* Customer Care Sub-pages */}
            {activeTab === 'warranty' && <WarrantyPanel orders={orders} />}

            {activeTab === 'reviews' && <ReviewsPanel orders={orders} />}

            {/* Profile & Security */}
            {activeTab === 'profile' && <ProfilePanel user={user} setUser={setUser} />}
          </main>
        </div>
      </div>

      <VietqrModal
        isOpen={Boolean(payingOrder)}
        onClose={() => setPayingOrder(null)}
        vietQRData={payingOrder?.vietQR}
        orderCode={payingOrder?.orderCode}
        onPaymentSuccess={() => {
          setPayingOrder(null);
          fetchOrders({ silent: true });
        }}
      />
    </div>
  );
}
