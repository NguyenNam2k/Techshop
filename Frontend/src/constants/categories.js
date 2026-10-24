export const CATEGORY_MAP = {
  gpus: {
    id: 1,
    slug: 'gpus',
    name: 'Card Màn Hình (VGA / GPU)',
    shortName: 'Card Màn Hình',
    icon: '🎮',
    desc: 'Card đồ họa chuyên dụng Gaming, Đồ họa 3D & Xử lý AI'
  },
  cpus: {
    id: 2,
    slug: 'cpus',
    name: 'Bộ Vi Xử Lý (CPU)',
    shortName: 'Bộ Vi Xử Lý',
    icon: '⚡',
    desc: 'CPU Intel Core Gen 14 & AMD Ryzen 7000 Series đỉnh cao'
  },
  motherboards: {
    id: 3,
    slug: 'motherboards',
    name: 'Bo Mạch Chủ (Mainboard)',
    shortName: 'Bo Mạch Chủ',
    icon: '🔌',
    desc: 'Mainboard chuẩn ATX, mATX cao cấp cho Intel & AMD'
  },
  ram: {
    id: 4,
    slug: 'ram',
    name: 'Bộ Nhớ Trong (RAM)',
    shortName: 'RAM',
    icon: '💾',
    desc: 'RAM DDR4, DDR5 tốc độ cao với tản nhiệt LED RGB'
  },
  storage: {
    id: 5,
    slug: 'storage',
    name: 'Ổ Cứng SSD / NVMe / HDD',
    shortName: 'Ổ Cứng SSD/HDD',
    icon: '💽',
    desc: 'Ổ cứng SSD PCIe Gen 4/5 siêu tốc và ổ cứng lưu trữ dung lượng cao'
  },
  'power-supplies': {
    id: 6,
    slug: 'power-supplies',
    name: 'Nguồn Máy Tính (PSU)',
    shortName: 'Nguồn Máy Tính',
    icon: '🔋',
    desc: 'Nguồn máy tính chuẩn ATX 3.0, chứng nhận 80 Plus Gold/Platinum'
  },
  cooling: {
    id: 7,
    slug: 'cooling',
    name: 'Tản Nhiệt CPU (Cooling)',
    shortName: 'Tản Nhiệt PC',
    icon: '❄️',
    desc: 'Tản nhiệt nước AIO 240/360mm màn hình LCD và tản khí tháp đôi'
  },
  cases: {
    id: 8,
    slug: 'cases',
    name: 'Vỏ Case Máy Tính',
    shortName: 'Vỏ Case',
    icon: '🖥️',
    desc: 'Vỏ case bể cá Panorama, Mid Tower Airflow tối ưu luồng gió'
  },
  keyboards: {
    id: 9,
    slug: 'keyboards',
    name: 'Bàn Phím Cơ (Keyboard)',
    shortName: 'Bàn Phím Cơ',
    icon: '⌨️',
    desc: 'Bàn phím cơ Custom nhôm CNC, switch cơ học & Rapid Trigger'
  },
  mice: {
    id: 10,
    slug: 'mice',
    name: 'Chuột Gaming (Mouse)',
    shortName: 'Chuột Gaming',
    icon: '🖱️',
    desc: 'Chuột Esports siêu nhẹ, cảm biến DPI cao, polling rate 4000Hz'
  },
  monitors: {
    id: 11,
    slug: 'monitors',
    name: 'Màn Hình Máy Tính (Monitor)',
    shortName: 'Màn Hình',
    icon: '🖥️',
    desc: 'Màn hình Gaming OLED, 2K, 4K với tần số quét 144Hz - 360Hz'
  },
  laptops: {
    id: 12,
    slug: 'laptops',
    name: 'Laptop Gaming & Đồ Họa',
    shortName: 'Laptop Gaming',
    icon: '💻',
    desc: 'Laptop cấu hình mạnh RTX 40 Series, màn hình OLED cao cấp'
  },
  headsets: {
    id: 25,
    slug: 'headsets',
    name: 'Tai Nghe Gaming (Headset)',
    shortName: 'Tai Nghe',
    icon: '🎧',
    desc: 'Tai nghe âm thanh vòm 7.1, mic lọc ồn AI, chuẩn Hi-Res'
  },
  mousepads: {
    id: 26,
    slug: 'mousepads',
    name: 'Lót Chuột & Phụ Kiện Bàn (Deskmat)',
    shortName: 'Lót Chuột',
    icon: '⬛',
    desc: 'Bàn di chuột cỡ lớn deskmat, bề mặt Speed/Control cao cấp'
  },
  chairs: {
    id: 27,
    slug: 'chairs',
    name: 'Ghế Gaming & Công Thái Học',
    shortName: 'Ghế Công Thái Học',
    icon: '🪑',
    desc: 'Ghế công thái học lưới thoáng khí, hỗ trợ cột sống làm việc lâu dài'
  },
  webcams: {
    id: 28,
    slug: 'webcams',
    name: 'Webcam & Mic Streaming',
    shortName: 'Webcam & Mic',
    icon: '📷',
    desc: 'Thiết bị livestream chuyên nghiệp, webcam 4K 60fps, mic thu âm condenser'
  },
  speakers: {
    id: 29,
    slug: 'speakers',
    name: 'Loa & Âm Thanh PC (Speaker)',
    shortName: 'Loa Máy Tính',
    icon: '🔊',
    desc: 'Hệ thống loa 2.1 siêu trầm, soundbar RGB sống động'
  },
  network: {
    id: 30,
    slug: 'network',
    name: 'Thiết Bị Mạng & Router Wi-Fi',
    shortName: 'Thiết Bị Mạng',
    icon: '📶',
    desc: 'Router Wi-Fi 7 Gaming, hệ thống Mesh phủ sóng toàn bộ không gian'
  }
};

const SLUG_ALIASES = {
  cpu: 'cpus',
  vga: 'gpus',
  gpu: 'gpus',
  mainboard: 'motherboards',
  main: 'motherboards',
  psu: 'power-supplies',
  ssd: 'storage',
  hdd: 'storage',
  case: 'cases',
  keyboard: 'keyboards',
  mouse: 'mice',
  monitor: 'monitors',
  laptop: 'laptops',
  headset: 'headsets',
  mousepad: 'mousepads',
  chair: 'chairs',
  webcam: 'webcams',
  speaker: 'speakers'
};

/**
 * Trả về tên hiển thị tiếng Việt cụ thể, chuẩn xác của danh mục
 * Không bao giờ trả về chữ slug tiếng Anh cộc lốc như cpus, gpus
 */
export const getCategoryDisplayName = (slugOrId, categoriesList = []) => {
  if (!slugOrId) return 'Tất Cả Sản Phẩm';
  const raw = String(slugOrId).toLowerCase().trim();
  const canonicalSlug = SLUG_ALIASES[raw] || raw;

  // 1. Kiểm tra trong danh sách categories từ server metadata
  if (Array.isArray(categoriesList) && categoriesList.length > 0) {
    const found = categoriesList.find(
      c => c.slug?.toLowerCase() === canonicalSlug || 
           c.slug?.toLowerCase() === raw || 
           String(c.id) === raw
    );
    if (found && found.name) return found.name;
  }

  // 2. Tra cứu trong bảng danh mục chuẩn
  if (CATEGORY_MAP[canonicalSlug]) {
    return CATEGORY_MAP[canonicalSlug].name;
  }

  // 3. Fallback chữ hoa có nghĩa thay vì slug cộc lốc
  return `Thiết Bị ${raw.toUpperCase()}`;
};

/**
 * Lấy thông tin chi tiết danh mục (icon, mô tả, tên đầy đủ)
 */
export const getCategoryInfo = (slugOrId) => {
  if (!slugOrId) return null;
  const raw = String(slugOrId).toLowerCase().trim();
  const canonicalSlug = SLUG_ALIASES[raw] || raw;
  return CATEGORY_MAP[canonicalSlug] || null;
};
