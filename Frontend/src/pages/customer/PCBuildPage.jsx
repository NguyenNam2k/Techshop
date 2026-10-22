import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  ShoppingCart,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  X,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Check,
  ArrowUpRight,
  Pencil
} from 'lucide-react';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';

const formatVND = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n || 0);

// Helper trích xuất map key-value từ specifications trong DB
const extractSpecsMap = (p) => {
  if (!p) return {};
  if (p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs)) return p.specs;
  const map = {};
  if (Array.isArray(p.specifications)) {
    p.specifications.forEach((group) => {
      if (Array.isArray(group.specs)) {
        group.specs.forEach((s) => {
          if (s.name) map[s.name] = s.value;
        });
      }
    });
  }
  return map;
};

const socketOf = (p) => {
  if (!p) return null;
  const specs = extractSpecsMap(p);
  const str = [
    specs['Socket'],
    specs['Socket bo mạch chủ'],
    specs['Socket CPU'],
    specs['Socket / chipset'],
    specs['Socket hỗ trợ'],
    p?.name
  ]
    .filter(Boolean)
    .join(' ');

  const explicit = str.match(/LGA\s?1851|LGA\s?1700|LGA\s?1200|AM5|AM4/i)?.[0];
  if (explicit) return explicit.replace(/\s+/g, '').toUpperCase();

  const name = String(p?.name || '');
  if (/Core Ultra\s+[579]\s+2\d\d|Z890|B860/i.test(name)) return 'LGA1851';
  if (/Core\s+i[3579]-1[234]\d{3}|Z790|B760|H610|Z690|B660/i.test(name)) return 'LGA1700';
  if (/Ryzen\s+[3579]\s+[789]\d{3}|X870|X670E?|B650E?|A620/i.test(name)) return 'AM5';
  if (/Ryzen\s+[3579]\s+[35]\d{3}|X570|B550|B450/i.test(name)) return 'AM4';
  return null;
};

const socketsSupportedOf = (p) => {
  if (!p) return [];
  const specs = extractSpecsMap(p);
  const str = [
    specs['Tương thích Socket'],
    specs['Kích thước / socket hỗ trợ'],
    specs['Socket hỗ trợ'],
    p?.name
  ]
    .filter(Boolean)
    .join(' ');
  const matches = str.match(/LGA\s?\d+|AM\d/gi) || [];
  const unique = Array.from(new Set(matches.map((m) => m.replace(/\s+/g, '').toUpperCase())));
  return unique.length ? unique : ['LGA1700', 'AM5'];
};

const ramTypesOf = (p) => {
  if (!p) return [];
  const specs = extractSpecsMap(p);
  const str = [
    specs['Chuẩn RAM'],
    specs['Chuẩn RAM hỗ trợ'],
    specs['Chuẩn bộ nhớ'],
    specs['Bộ nhớ RAM'],
    specs['Dung lượng / tốc độ'],
    specs['Hỗ trợ RAM'],
    p?.name
  ]
    .filter(Boolean)
    .join(' ');
  const matches = str.match(/DDR[45]/gi) || [];
  const unique = Array.from(new Set(matches.map((m) => m.toUpperCase())));
  if (unique.length) return unique;
  const sock = socketOf(p);
  if (sock === 'AM5') return ['DDR5'];
  if (sock === 'LGA1700') return ['DDR5', 'DDR4'];
  return [];
};

const ramTypeOf = (p) => ramTypesOf(p)[0] || null;

const watts = (v) => Number((String(v || '')).match(/(\d{3,4})\s*W/i)?.[1]) || null;

const first = (v, re) => (String(v || '').match(re) || [])[0] || null;

const cpuCoresOf = (p) => {
  const specs = extractSpecsMap(p);
  const str = `${specs['Số nhân / luồng'] || specs['Số nhân & Số luồng'] || ''} ${p?.name || ''}`;
  const m = str.match(/(\d+)\s*nhân/i);
  if (m) return `${m[1]} Nhân`;
  const name = String(p?.name || '');
  if (/14900/i.test(name)) return '24 Nhân';
  if (/14700/i.test(name)) return '20 Nhân';
  if (/7950/i.test(name)) return '16 Nhân';
  if (/14600/i.test(name)) return '14 Nhân';
  if (/14400/i.test(name)) return '10 Nhân';
  if (/7800|7700/i.test(name)) return '8 Nhân';
  if (/7600/i.test(name)) return '6 Nhân';
  return null;
};

const cpuThreadsOf = (p) => {
  const specs = extractSpecsMap(p);
  const str = `${specs['Số nhân / luồng'] || specs['Số nhân & Số luồng'] || ''}`;
  const m = str.match(/(\d+)\s*luồng/i);
  if (m) return `${m[1]} Luồng`;
  const name = String(p?.name || '');
  if (/14900|7950/i.test(name)) return '32 Luồng';
  if (/14700/i.test(name)) return '28 Luồng';
  if (/14600/i.test(name)) return '20 Luồng';
  if (/14400|7800|7700/i.test(name)) return '16 Luồng';
  if (/7600/i.test(name)) return '12 Luồng';
  return null;
};

const cpuArchOf = (p) => {
  const name = String(p?.name || '');
  if (/X3D/i.test(name)) return 'AMD Ryzen X3D (3D V-Cache)';
  if (/Ryzen\s+[3579]\s+7\d{3}/i.test(name)) return 'AMD Ryzen 7000 (Zen 4)';
  if (/14\d{3}/i.test(name)) return 'Intel Core Gen 14';
  if (/13\d{3}/i.test(name)) return 'Intel Core Gen 13';
  if (/Core Ultra/i.test(name)) return 'Intel Core Ultra';
  return null;
};

const cpuIgpuOf = (p) => {
  const specs = extractSpecsMap(p);
  const igpuSpec = String(specs['Đồ họa tích hợp'] || '');
  const name = String(p?.name || '');
  if (/không có/i.test(igpuSpec) || /\b\d{4,5}K?F\b/i.test(name)) {
    return 'Không có iGPU (Cần VGA rời)';
  }
  return 'Có đồ họa tích hợp (iGPU)';
};

const cpuTdpOf = (p) => {
  const specs = extractSpecsMap(p);
  const tdpStr = String(specs['Công suất tiêu thụ (TDP)'] || '');
  const w = watts(tdpStr);
  if (w) {
    if (w <= 65) return '65W (Mát mẻ / Tiết kiệm)';
    if (w <= 120) return `${w}W (Hiệu năng cao)`;
    return `${w}W+ (Ép xung K-Series)`;
  }
  const name = String(p?.name || '');
  if (/14400|7700\b/i.test(name)) return '65W (Mát mẻ / Tiết kiệm)';
  if (/X3D|7600X/i.test(name)) return '105W - 120W (Hiệu năng cao)';
  if (/14[679]00K/i.test(name)) return '125W+ (Ép xung K-Series)';
  return null;
};

const FACETS = {
  cpu: [
    { key: 'socket', label: 'Socket (Đồng bộ Mainboard)', get: socketOf },
    { key: 'series', label: 'Dòng CPU', get: (p) => first(p.name, /Core i\d|Core Ultra \d|Ryzen \d/i) },
    { key: 'arch', label: 'Thế hệ / Kiến trúc', get: cpuArchOf },
    { key: 'cores', label: 'Số nhân xử lý (Cores)', get: cpuCoresOf },
    { key: 'threads', label: 'Số luồng (Threads)', get: cpuThreadsOf },
    { key: 'ram_support', label: 'Chuẩn RAM hỗ trợ', get: ramTypesOf },
    { key: 'igpu', label: 'Đồ họa tích hợp (iGPU)', get: cpuIgpuOf },
    { key: 'tdp', label: 'Công suất tiêu thụ (TDP)', get: cpuTdpOf }
  ],
  motherboard: [
    { key: 'socket', label: 'Socket CPU (Đồng bộ CPU)', get: socketOf },
    {
      key: 'chipset',
      label: 'Chipset Bo Mạch Chủ',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Chipset'] || specs['Chipset điều khiển'] || specs['Socket / chipset'] || ''} ${p?.name || ''}`;
        return first(str, /Z790|B760|X670E|X670|B650E|B650|H610/i)?.toUpperCase() || null;
      }
    },
    {
      key: 'form',
      label: 'Kích thước (Form Factor)',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Form factor'] || specs['Kích thước chuẩn'] || ''} ${p?.name || ''}`;
        if (/Micro-ATX|mATX|B760M|B650M/i.test(str)) return 'Micro-ATX (mATX)';
        if (/Mini-ITX|ITX/i.test(str)) return 'Mini-ITX';
        if (/E-ATX/i.test(str)) return 'E-ATX';
        return 'ATX Tiêu chuẩn';
      }
    },
    { key: 'ram', label: 'Chuẩn RAM hỗ trợ', get: ramTypesOf },
    {
      key: 'wifi',
      label: 'Kết nối không dây',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Kết nối không dây'] || ''} ${p?.name || ''}`;
        if (/Wi-?Fi\s*7|DARK HERO|FORMULA|WIFI II|MASTER/i.test(str)) return 'Wi-Fi 7 + Bluetooth 5.4';
        if (/WIFI|AX/i.test(str)) return 'Wi-Fi 6E + Bluetooth 5.3';
        return 'LAN 2.5GbE tốc độ cao';
      }
    }
  ],
  ram: [
    { key: 'type', label: 'Chuẩn bộ nhớ RAM', get: ramTypesOf },
    {
      key: 'cap',
      label: 'Tổng dung lượng',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Dung lượng Kit'] || specs['Dung lượng / tốc độ'] || ''} ${p?.name || ''}`;
        return first(str, /128GB|64GB|32GB|16GB/i)?.toUpperCase() || null;
      }
    },
    {
      key: 'bus',
      label: 'Tốc độ Bus (MHz)',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Tốc độ Bus RAM'] || specs['Dung lượng / tốc độ'] || ''} ${p?.name || ''}`;
        return first(str, /\d{4}MHz/i) || null;
      }
    },
    {
      key: 'kit',
      label: 'Cấu hình thanh RAM',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Dung lượng Kit'] || specs['Dung lượng / tốc độ'] || ''} ${p?.name || ''}`;
        const m = str.match(/(\d)\s*x\s*(\d+GB)/i);
        return m ? `${m[1]}x ${m[2].toUpperCase()}` : '2x Dual Channel';
      }
    },
    {
      key: 'rgb',
      label: 'Tản nhiệt & Đèn LED',
      get: (p) => (/RGB/i.test(`${p?.name || ''} ${extractSpecsMap(p)['Tản nhiệt & Đèn LED'] || ''}`) ? 'Có đèn LED RGB' : 'Tản nhiệt Non-RGB')
    }
  ],
  gpu: [
    {
      key: 'chip',
      label: 'Hãng Chipset Đồ Họa',
      get: (p) =>
        /RTX|GeForce/i.test(p.name) ? 'NVIDIA GeForce' : /Radeon|RX/i.test(p.name) ? 'AMD Radeon' : null
    },
    {
      key: 'series',
      label: 'Dòng GPU (Series)',
      get: (p) =>
        first(
          p.name,
          /RTX 4090|RTX 4080 Super|RTX 4070 Ti Super|RTX 4070 Super|RTX 4060 Ti|RTX 4060|RX 7900 GRE|RX 7800 XT|RX 7700 XT/i
        )
    },
    {
      key: 'vram',
      label: 'Dung lượng VRAM',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Dung lượng VRAM'] || specs['Bộ nhớ đồ họa'] || ''} ${p?.name || ''}`;
        return first(str, /24GB|16GB|12GB|8GB/i)?.toUpperCase() || null;
      }
    },
    {
      key: 'vram_type',
      label: 'Chuẩn bộ nhớ đồ họa',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Dung lượng VRAM'] || specs['Bộ nhớ đồ họa'] || ''} ${p?.name || ''}`;
        return /GDDR6X|4090|4080|4070/i.test(str) ? 'GDDR6X' : 'GDDR6';
      }
    },
    {
      key: 'psu_req',
      label: 'Nguồn khuyến nghị',
      get: (p) => {
        const n = p?.name || '';
        if (/4090/i.test(n)) return 'Từ 1000W trở lên';
        if (/4080|7900/i.test(n)) return 'Từ 850W trở lên';
        if (/4070|7800|7700/i.test(n)) return 'Từ 750W trở lên';
        return 'Từ 650W trở lên';
      }
    }
  ],
  ssd: [
    {
      key: 'cap',
      label: 'Dung lượng lưu trữ',
      get: (p) => first(`${extractSpecsMap(p)['Dung lượng ổ cứng'] || ''} ${p.name}`, /4TB|2TB|1TB|512GB/i)?.toUpperCase()
    },
    {
      key: 'interface',
      label: 'Chuẩn giao tiếp',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Chuẩn giao tiếp'] || extractSpecsMap(p)['Dung lượng / chuẩn giao tiếp'] || ''} ${p?.name || ''}`;
        if (/PCIe\s*(Gen\s*)?5\.0/i.test(str)) return 'PCIe Gen 5.0 x4 NVMe';
        if (/SATA/i.test(str)) return 'SATA III 2.5 inch';
        return 'PCIe Gen 4.0 x4 NVMe';
      }
    },
    {
      key: 'heatsink',
      label: 'Tản nhiệt SSD',
      get: (p) => (/Heatsink/i.test(p?.name || '') ? 'Kèm Heatsink tản nhiệt' : 'M.2 Tiêu chuẩn')
    }
  ],
  case: [
    {
      key: 'tower',
      label: 'Kiểu dáng Thùng máy',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Kích thước / mainboard hỗ trợ'] || ''} ${p?.name || ''}`;
        if (/Full Tower|5000D/i.test(str)) return 'Full Tower';
        if (/Mini-ITX|NR200/i.test(str)) return 'Mini-ITX / SFF';
        if (/Dual[-\s]?Chamber|O11|H9/i.test(str)) return 'Dual-Chamber (Bể cá)';
        return 'Mid Tower Airflow';
      }
    },
    {
      key: 'form',
      label: 'Mainboard hỗ trợ',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Chuẩn Mainboard hỗ trợ'] || extractSpecsMap(p)['Kích thước / mainboard hỗ trợ'] || ''} ${p?.name || ''}`;
        if (/Mini-ITX/i.test(str) && !/ATX\s*\/|E-ATX/i.test(str)) return ['Mini-ITX'];
        if (/E-ATX/i.test(str)) return ['E-ATX', 'ATX', 'Micro-ATX', 'Mini-ITX'];
        return ['ATX', 'Micro-ATX', 'Mini-ITX'];
      }
    },
    {
      key: 'color',
      label: 'Màu sắc Vỏ Case',
      get: (p) => {
        if (/White|Trắng/i.test(p?.name || '')) return 'Trắng (White Edition)';
        if (/Chrome/i.test(p?.name || '')) return 'Kính Chrome';
        return 'Đen (Black)';
      }
    }
  ],
  psu: [
    {
      key: 'watt',
      label: 'Công suất thực',
      get: (p) => {
        const specs = extractSpecsMap(p);
        const str = `${specs['Công suất'] || specs['Công suất định mức'] || specs['Công suất / chứng nhận'] || ''} ${p?.name || ''}`;
        const w = watts(str) || Number(str.match(/\b(650|750|850|1000|1200)\b/)?.[1]);
        return w ? `${w}W` : null;
      }
    },
    {
      key: 'cert',
      label: 'Chứng nhận hiệu suất',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Chứng nhận hiệu suất'] || extractSpecsMap(p)['Công suất / chứng nhận'] || ''} ${p?.name || ''}`;
        if (/Platinum|TX-1200|Straight Power 12/i.test(str)) return '80 Plus Platinum';
        if (/Bronze|System Power/i.test(str)) return '80 Plus Bronze';
        return '80 Plus Gold';
      }
    },
    {
      key: 'atx',
      label: 'Chuẩn nguồn & Cáp VGA',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Chuẩn thiết kế nguồn'] || extractSpecsMap(p)['Công suất / chứng nhận'] || ''} ${p?.name || ''}`;
        return /ATX\s*3\.0|PCIe\s*5\.0|Shift|12VHPWR/i.test(str)
          ? 'ATX 3.0 / PCIe 5.0 (12VHPWR)'
          : 'ATX Tiêu chuẩn';
      }
    }
  ],
  cooling: [
    {
      key: 'type',
      label: 'Loại tản nhiệt',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Loại tản nhiệt'] || extractSpecsMap(p)['Kích thước / socket hỗ trợ'] || ''} ${p?.name || ''}`;
        return /Air cooler|Peerless|Phantom Spirit/i.test(str)
          ? 'Tản nhiệt khí (Air Cooler)'
          : 'Tản nhiệt nước AIO';
      }
    },
    {
      key: 'rad',
      label: 'Kích thước Radiator / Tháp',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Kích thước / socket hỗ trợ'] || ''} ${p?.name || ''}`;
        if (/360|LS720|H150i/i.test(str)) return 'Radiator 360mm (3 Fan)';
        if (/280/i.test(str)) return 'Radiator 280mm (2 Fan 140mm)';
        if (/240/i.test(str)) return 'Radiator 240mm (2 Fan)';
        return 'Tháp đôi (Dual Tower 120mm)';
      }
    },
    {
      key: 'lcd',
      label: 'Màn hình & LED',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Màn hình hiển thị LCD'] || extractSpecsMap(p)['Kích thước / socket hỗ trợ'] || ''} ${p?.name || ''}`;
        if (/LCD|Digital/i.test(str)) return 'Có màn hình LCD / Digital';
        if (/RGB|ARGB/i.test(str)) return 'Đèn LED ARGB Sync';
        return 'Tiêu chuẩn Non-RGB';
      }
    },
    { key: 'socket', label: 'Socket hỗ trợ', get: socketsSupportedOf }
  ],
  monitor: [
    {
      key: 'size',
      label: 'Kích thước màn hình',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Kích thước màn hình'] || extractSpecsMap(p)['Kích thước / độ phân giải'] || ''} ${p?.name || ''}`;
        if (/34\s*inch|M34/i.test(str)) return '34 inch Ultrawide';
        if (/32\s*inch|32G/i.test(str)) return '32 inch';
        if (/24\s*inch|25\s*inch|24G|254/i.test(str)) return '24 - 25 inch Esports';
        return '27 inch Tiêu chuẩn';
      }
    },
    {
      key: 'res',
      label: 'Độ phân giải',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Độ phân giải tối đa'] || extractSpecsMap(p)['Kích thước / độ phân giải'] || ''} ${p?.name || ''}`;
        if (/4K|UHD|GP950|M27U/i.test(str)) return '4K UHD (3840x2160)';
        if (/UWQHD|Ultrawide/i.test(str)) return 'UWQHD (3440x1440)';
        if (/Full HD|1080p|24G4|AG254/i.test(str)) return 'Full HD (1920x1080)';
        return '2K QHD (2560x1440)';
      }
    },
    {
      key: 'hz',
      label: 'Tần số quét',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Tần số quét (Refresh Rate)'] || extractSpecsMap(p)['Kích thước / độ phân giải'] || ''} ${p?.name || ''}`;
        return first(str, /390Hz|240Hz|180Hz|165Hz|160Hz|144Hz/i) || '180Hz';
      }
    },
    {
      key: 'panel',
      label: 'Công nghệ tấm nền',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Công nghệ tấm nền'] || extractSpecsMap(p)['Kích thước / độ phân giải'] || ''} ${p?.name || ''}`;
        if (/OLED/i.test(str)) return 'OLED Cao cấp';
        if (/VA|Curved/i.test(str)) return 'VA Cong (Curved)';
        return 'Fast IPS / Nano IPS';
      }
    }
  ],
  keyboard: [
    {
      key: 'layout',
      label: 'Layout bàn phím',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Layout kích thước'] || extractSpecsMap(p)['Layout / kết nối'] || ''} ${p?.name || ''}`;
        if (/Full-size|96%/i.test(str)) return 'Full-size / 96%';
        if (/TKL|80%|FC750|G915|Q3/i.test(str)) return 'TKL (80%)';
        if (/65%/i.test(str)) return '65% Nhỏ gọn';
        return '75% (Có núm xoay Knob)';
      }
    },
    {
      key: 'conn',
      label: 'Chuẩn kết nối',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Kết nối Tri-Mode'] || extractSpecsMap(p)['Layout / kết nối'] || ''} ${p?.name || ''}`;
        if (/Tri-mode/i.test(str)) return '3 Mode (2.4G + Bluetooth + Type-C)';
        if (/Wireless|Bluetooth/i.test(str)) return 'Không dây (Wireless / Bluetooth)';
        return 'Có dây USB Type-C';
      }
    }
  ],
  mouse: [
    {
      key: 'conn',
      label: 'Chuẩn kết nối',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Cảm biến / kết nối'] || ''} ${p?.name || ''}`;
        return /Wired/i.test(str) ? 'Có dây (Wired USB)' : 'Không dây (Wireless Lightspeed / 2.4GHz)';
      }
    },
    {
      key: 'dpi',
      label: 'Độ nhạy cảm biến (DPI)',
      get: (p) => {
        const str = `${extractSpecsMap(p)['Độ phân giải (DPI)'] || extractSpecsMap(p)['Cảm biến / kết nối'] || ''}`;
        if (/32\.000|30\.000/i.test(str)) return '30.000 - 32.000 DPI (Flagship)';
        if (/25\.600|26\.000/i.test(str)) return '25.600 - 26.000 DPI';
        return '18.000 DPI';
      }
    }
  ]
};

const facetValues = (f, p) => {
  const v = f.get(p);
  return v == null ? [] : Array.isArray(v) ? v : [v];
};

const PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'under_3m', label: 'Dưới 3 triệu' },
  { id: '3m_7m', label: '3 - 7 triệu' },
  { id: '7m_15m', label: '7 - 15 triệu' },
  { id: 'above_15m', label: 'Trên 15 triệu' }
];

// Trả về { level: 'error' | 'warn', text } hoặc null
const checkCompat = (key, prod, sel) => {
  const cpu = key === 'cpu' ? prod : sel.cpu;
  const mb = key === 'motherboard' ? prod : sel.motherboard;
  const ram = key === 'ram' ? prod : sel.ram;
  const gpu = key === 'gpu' ? prod : sel.gpu;
  const psu = key === 'psu' ? prod : sel.psu;

  if ((key === 'cpu' || key === 'motherboard') && cpu && mb) {
    const a = socketOf(cpu);
    const b = socketOf(mb);
    if (a && b && a !== b) return { level: 'error', text: `Socket CPU (${a}) không khớp Mainboard (${b})` };
  }
  if ((key === 'ram' || key === 'motherboard') && ram && mb) {
    const t = ramTypeOf(ram);
    const mbRam = ramTypeOf(mb);
    if (t && mbRam && t !== mbRam) {
      return { level: 'error', text: `RAM ${t} không khớp chuẩn ${mbRam} của Mainboard` };
    }
  }
  if ((key === 'gpu' || key === 'psu') && gpu && psu) {
    const need = watts(extractSpecsMap(gpu)['Nguồn khuyến nghị'] || gpu.name);
    const have = watts(extractSpecsMap(psu)['Công suất'] || psu.name);
    if (need && have && have < need) {
      return { level: 'warn', text: `Nguồn ${have}W thấp hơn mức khuyến nghị ${need}W của VGA` };
    }
  }
  return null;
};

function FilterGroup({ title, selected = 0, children }) {
  return (
    <div className="space-y-2 pt-4 border-t border-slate-800">
      <h5 className="font-extrabold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
        {title}
        {selected > 0 && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
      </h5>
      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1 no-scrollbar">{children}</div>
    </div>
  );
}

function FilterOption({ type = 'checkbox', name, checked, onChange, label, count }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-sky-400">
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-sky-600 w-3.5 h-3.5 cursor-pointer"
      />
      <span className="flex-1 truncate text-xs">{label}</span>
      {count != null && <span className="text-[10px] text-slate-500 font-mono">{count}</span>}
    </label>
  );
}

export default function PCBuilderView() {
  const { addToCart } = useCart();

  const [dbProducts, setDbProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Danh mục linh kiện chuẩn build PC
  const partCategories = [
    { key: 'cpu', name: '1. Vi Xử Lý (CPU)', cat: 'cpus', slugFilter: 'cpus' },
    { key: 'motherboard', name: '2. Bo Mạch Chủ (Mainboard)', cat: 'motherboards', slugFilter: 'motherboards' },
    { key: 'ram', name: '3. Bộ Nhớ Trong (RAM)', cat: 'ram', slugFilter: 'ram' },
    { key: 'gpu', name: '4. Card Màn Hình (VGA)', cat: 'gpus', slugFilter: 'gpus' },
    { key: 'ssd', name: '5. Ổ Cứng (SSD / NVMe)', cat: 'storage', slugFilter: 'storage' },
    { key: 'case', name: '6. Vỏ Case Máy Tính', cat: 'cases', slugFilter: 'cases' },
    { key: 'psu', name: '7. Nguồn Máy Tính (PSU)', cat: 'power-supplies', slugFilter: 'power-supplies' },
    { key: 'cooling', name: '8. Tản Nhiệt CPU / Nước', cat: 'cooling', slugFilter: 'cooling' },
    { key: 'monitor', name: '9. Màn Hình Gaming (Monitor)', cat: 'monitors', slugFilter: 'monitors' },
    { key: 'keyboard', name: '10. Bàn Phím Cơ (Keyboard)', cat: 'keyboards', slugFilter: 'keyboards' },
    { key: 'mouse', name: '11. Chuột Gaming (Mouse)', cat: 'mice', slugFilter: 'mice' },
    { key: 'headset', name: '12. Tai Nghe Gaming (Headset)', cat: 'headsets', slugFilter: 'headsets' }
  ];

  // State cấu hình đã chọn (lưu localStorage để khi bấm vào xem chi tiết SP quay lại không mất cấu hình)
  const [selectedParts, setSelectedParts] = useState(() => {
    const fallback = {
      cpu: null,
      motherboard: null,
      ram: null,
      gpu: null,
      ssd: null,
      case: null,
      psu: null,
      cooling: null,
      monitor: null,
      keyboard: null,
      mouse: null,
      headset: null
    };
    try {
      const saved = localStorage.getItem('techgear_pc_build_v1');
      return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('techgear_pc_build_v1', JSON.stringify(selectedParts));
    } catch {
      // ignore storage errors
    }
  }, [selectedParts]);

  // Modal selector states
  const [activeModalPart, setActiveModalPart] = useState(null);
  const [modalSearch, setModalSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState([]);
  const [facetSel, setFacetSel] = useState({});
  const [compatOnly, setCompatOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Tải danh sách sản phẩm từ backend DB
  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        setLoading(true);
        const res = await api.getProducts({ limit: 120 });
        if (!isMounted) return;
        const items = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];

        // Chuẩn hóa sản phẩm
        const normalized = items.map((p) => ({
          ...p,
          price: Number(p.min_price || p.base_price || p.price || 0),
          inStock: Number(p.stock ?? p.total_stock ?? 15) > 0,
          specs: extractSpecsMap(p),
          thumbnail_url:
            p.thumbnail_url ||
            p.image_url ||
            p.images?.[0]?.image_url ||
            p.images?.[0] ||
            'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400'
        }));

        setDbProducts(normalized);
      } catch (err) {
        console.error('Lỗi khi tải linh kiện từ BE:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (part) => {
    setActiveModalPart(part);
    setModalSearch('');
    setPriceFilter('all');
    setBrandFilter([]);

    // Tự động lọc chéo Socket giữa CPU và Mainboard (và chuẩn RAM với Mainboard)
    const initialFacets = {};
    if (part.key === 'motherboard' && selectedParts.cpu) {
      const cpuSock = socketOf(selectedParts.cpu);
      if (cpuSock) initialFacets.socket = [cpuSock];
    } else if (part.key === 'cpu' && selectedParts.motherboard) {
      const mbSock = socketOf(selectedParts.motherboard);
      if (mbSock) initialFacets.socket = [mbSock];
    } else if (part.key === 'ram' && selectedParts.motherboard) {
      const mbRams = ramTypesOf(selectedParts.motherboard);
      if (mbRams.length === 1) initialFacets.type = mbRams;
    }

    setFacetSel(initialFacets);
    setCompatOnly(false);
    setSortOrder('default');
  };

  const handleCloseModal = () => {
    setActiveModalPart(null);
  };

  const handleSelectPart = (key, product) => {
    setSelectedParts((prev) => ({ ...prev, [key]: product }));
    handleCloseModal();
  };

  const handleRemovePart = (key) => {
    setSelectedParts((prev) => ({ ...prev, [key]: null }));
  };

  const handleResetAll = () => {
    const empty = {};
    partCategories.forEach((p) => {
      empty[p.key] = null;
    });
    setSelectedParts(empty);
  };

  // Tổng tiền cấu hình
  const totalPrice = Object.values(selectedParts).reduce(
    (sum, item) => sum + (item ? item.price || 0 : 0),
    0
  );
  const selectedCount = Object.values(selectedParts).filter(Boolean).length;

  // Kiểm tra tương thích
  const compatIssues = useMemo(() => {
    const out = [];
    const seen = new Set();
    Object.entries(selectedParts).forEach(([key, prod]) => {
      if (!prod) return;
      const issue = checkCompat(key, prod, selectedParts);
      if (issue && !seen.has(issue.text)) {
        seen.add(issue.text);
        out.push(issue);
      }
    });
    return out;
  }, [selectedParts]);

  const rowIssue = (key) => {
    const prod = selectedParts[key];
    return prod ? checkCompat(key, prod, selectedParts) : null;
  };

  const toggleIn = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const toggleFacet = (key, v) =>
    setFacetSel((prev) => ({ ...prev, [key]: toggleIn(prev[key] || [], v) }));
  const resetFilters = () => {
    setPriceFilter('all');
    setBrandFilter([]);
    setFacetSel({});
    setCompatOnly(false);
    setModalSearch('');
  };

  const activeFilterCount =
    (priceFilter !== 'all' ? 1 : 0) +
    brandFilter.length +
    (compatOnly ? 1 : 0) +
    Object.values(facetSel).reduce((n, a) => n + a.length, 0);

  // Lọc sản phẩm theo danh mục đang chọn trong Modal
  const categoryProducts = useMemo(() => {
    if (!activeModalPart) return [];
    return dbProducts.filter((p) => {
      const slug = String(p.category_slug || '').toLowerCase();
      const catFilter = activeModalPart.cat.toLowerCase();
      if (slug) {
        return slug === catFilter || slug.includes(catFilter);
      }
      const name = String(p.name || '').toLowerCase();
      if (activeModalPart.key === 'cpu' && /cpu|ryzen|core i|core ultra/i.test(name)) return true;
      if (activeModalPart.key === 'gpu' && /vga|rtx|geforce|radeon/i.test(name)) return true;
      if (activeModalPart.key === 'motherboard' && /mainboard|bo mạch|z790|b760|b650|x670/i.test(name)) return true;
      if (activeModalPart.key === 'ram' && /ram|ddr4|ddr5/i.test(name)) return true;
      if (activeModalPart.key === 'ssd' && /ssd|nvme|ổ cứng/i.test(name)) return true;
      if (activeModalPart.key === 'case' && /case|vỏ máy/i.test(name)) return true;
      if (activeModalPart.key === 'psu' && /nguồn|psu|gold|shift/i.test(name)) return true;
      if (activeModalPart.key === 'cooling' && /tản nhiệt|cooler|kraken/i.test(name)) return true;
      if (activeModalPart.key === 'monitor' && /màn hình|monitor/i.test(name)) return true;
      if (activeModalPart.key === 'keyboard' && /bàn phím|keyboard/i.test(name)) return true;
      if (activeModalPart.key === 'mouse' && /chuột|mouse/i.test(name)) return true;
      if (activeModalPart.key === 'headset' && /tai nghe|headset/i.test(name)) return true;
      return false;
    });
  }, [activeModalPart, dbProducts]);

  // Facet groups cho modal
  const facetGroups = useMemo(() => {
    if (!activeModalPart) return [];
    const defs = FACETS[activeModalPart.key] || [];
    const groups = defs.map((f) => {
      const counts = new Map();
      categoryProducts.forEach((p) =>
        facetValues(f, p).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1))
      );
      const options = Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) =>
        a.value.localeCompare(b.value, 'vi', { numeric: true })
      );
      return { ...f, options };
    });
    return groups.filter((g) => g.options.length >= 1);
  }, [activeModalPart, categoryProducts]);

  const modalBrands = useMemo(() => {
    const counts = new Map();
    categoryProducts.forEach(
      (p) => p.brand && counts.set(p.brand, (counts.get(p.brand) || 0) + 1)
    );
    return Array.from(counts, ([value, count]) => ({ value, count })).sort((a, b) =>
      a.value.localeCompare(b.value)
    );
  }, [categoryProducts]);

  // Bộ lọc sản phẩm modal
  const modalAvailableProducts = useMemo(() => {
    if (!activeModalPart) return [];
    let list = categoryProducts.filter((p) => {
      if (modalSearch.trim()) {
        const q = modalSearch.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !(p.model_code && p.model_code.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (brandFilter.length && !brandFilter.includes(p.brand)) return false;
      if (priceFilter === 'under_3m' && !(p.price < 3000000)) return false;
      if (priceFilter === '3m_7m' && !(p.price >= 3000000 && p.price <= 7000000)) return false;
      if (priceFilter === '7m_15m' && !(p.price > 7000000 && p.price <= 15000000)) return false;
      if (priceFilter === 'above_15m' && !(p.price > 15000000)) return false;
      for (const g of facetGroups) {
        const sel = facetSel[g.key];
        if (sel?.length && !facetValues(g, p).some((v) => sel.includes(v))) return false;
      }
      if (compatOnly && checkCompat(activeModalPart.key, p, selectedParts)?.level === 'error') {
        return false;
      }
      return true;
    });

    if (sortOrder === 'price_asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (sortOrder === 'stock_desc') {
      list = [...list].sort((a, b) => {
        if (Boolean(a.inStock) !== Boolean(b.inStock)) {
          return a.inStock ? -1 : 1;
        }
        return (Number(b.stock ?? b.total_stock ?? 0)) - (Number(a.stock ?? a.total_stock ?? 0));
      });
    } else if (sortOrder === 'newest') {
      list = [...list].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    } else if (sortOrder === 'name_asc') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    } else if (sortOrder === 'name_desc') {
      list = [...list].sort((a, b) => (b.name || '').localeCompare(a.name || '', 'vi'));
    } else if (sortOrder === 'warranty_desc') {
      list = [...list].sort((a, b) => (Number(b.warranty_months) || 0) - (Number(a.warranty_months) || 0));
    }
    return list;
  }, [
    activeModalPart,
    categoryProducts,
    facetGroups,
    modalSearch,
    priceFilter,
    brandFilter,
    facetSel,
    compatOnly,
    sortOrder,
    selectedParts
  ]);

  const handleAddFullPCToCart = () => {
    let addedCount = 0;
    Object.values(selectedParts).forEach((part) => {
      if (part) {
        addToCart(part, null, 1);
        addedCount += 1;
      }
    });
    showToast(`Đã thêm toàn bộ (${addedCount} linh kiện cấu hình) vào giỏ hàng!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Hero Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-sky-500/20">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-md border border-white/20">
              <Wrench className="w-3.5 h-3.5 text-sky-300" />
              <span>Công Cụ Xây Dựng Cấu Hình PC Chuyên Nghiệp</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black">
              Tự Build Cấu Hình Máy Tính Theo Nhu Cầu
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-xl font-medium">
              Chọn linh kiện chuẩn xác, tự động kiểm tra tương thích phần cứng, tối ưu chi phí và nhận combo quà tặng 1.500.000₫!
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/20 text-right min-w-[220px]">
            <span className="text-xs font-bold text-sky-200 block uppercase tracking-wider">
              Dự toán cấu hình:
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono text-white">
              {formatVND(totalPrice)}
            </span>
          </div>
        </div>

        {/* Main Grid: Builder Rows on Left, Summary on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột Trái: Bảng danh sách linh kiện */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2 uppercase tracking-wider">
                <Cpu className="w-5 h-5 text-sky-400" />
                <span>Danh Mục Linh Kiện Cần Lắp Ráp</span>
              </h2>
              <button
                type="button"
                onClick={handleResetAll}
                className="text-xs text-slate-400 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Làm mới cấu hình</span>
              </button>
            </div>

            {loading ? (
              <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 flex items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                <span>Đang nạp danh mục linh kiện từ hệ thống...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {partCategories.map((part) => {
                  const selectedItem = selectedParts[part.key];

                  return (
                    <div
                      key={part.key}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors"
                    >
                      {/* Tên nhóm linh kiện */}
                      <div className="font-bold text-slate-200 text-xs w-full sm:w-48 flex-shrink-0">
                        {part.name}
                      </div>

                      {/* Vùng trạng thái */}
                      {selectedItem ? (
                        <div className="flex-1 flex items-center justify-between gap-3 w-full bg-slate-950 p-3 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-3 min-w-0">
                            <Link
                              to={`/products/${selectedItem.slug || selectedItem.id}`}
                              title="Xem chi tiết sản phẩm"
                              className="flex-shrink-0 group/img"
                            >
                              <img
                                src={selectedItem.thumbnail_url}
                                alt={selectedItem.name}
                                className="w-12 h-12 object-contain rounded-lg bg-slate-900 p-1 border border-slate-800 group-hover/img:border-sky-500/60 transition-colors"
                              />
                            </Link>
                            <div className="min-w-0">
                              <Link
                                to={`/products/${selectedItem.slug || selectedItem.id}`}
                                title="Xem chi tiết sản phẩm"
                                className="group/title inline-flex items-center gap-1 max-w-full text-xs font-bold text-slate-100 hover:text-sky-400 transition-colors"
                              >
                                <span className="truncate group-hover/title:underline">
                                  {selectedItem.name}
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-sky-400 opacity-0 -translate-y-0.5 group-hover/title:opacity-100 group-hover/title:translate-y-0 transition-all shrink-0" />
                              </Link>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="text-xs font-mono font-extrabold text-sky-400">
                                  {formatVND(selectedItem.price)}
                                </span>
                                {(part.key === 'cpu' || part.key === 'motherboard') &&
                                  socketOf(selectedItem) && (
                                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-400 font-mono">
                                      Socket {socketOf(selectedItem)}
                                    </span>
                                  )}
                              </div>
                              {rowIssue(part.key) && (
                                <div
                                  className={`mt-1 flex items-center gap-1 text-[11px] font-bold ${
                                    rowIssue(part.key).level === 'error'
                                      ? 'text-rose-400'
                                      : 'text-amber-400'
                                  }`}
                                >
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{rowIssue(part.key).text}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(part)}
                              className="p-2 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-xl border border-transparent hover:border-sky-500/30 transition cursor-pointer active:scale-95 shadow-sm"
                              title="Thay đổi linh kiện này"
                              aria-label="Thay đổi linh kiện này"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePart(part.key)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/30 transition cursor-pointer active:scale-95 shadow-sm"
                              title="Xóa linh kiện này"
                              aria-label="Xóa linh kiện này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 w-full">
                          <button
                            type="button"
                            onClick={() => handleOpenModal(part)}
                            className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-sky-500/30 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 text-sky-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer group"
                          >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span>Chọn {part.name.replace(/^\d+\.\s*/, '')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cột Phải: Bảng tóm tắt cấu hình & nút đặt mua */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl space-y-5">
              <h3 className="font-extrabold text-slate-100 text-base border-b border-slate-800 pb-3 uppercase tracking-wider">
                Tóm Tắt Cấu Hình PC
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tiến độ linh kiện:</span>
                  <span className="font-bold text-slate-100">
                    {selectedCount} / {partCategories.length} Món
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Công lắp ráp &amp; đi dây:</span>
                  <span className="text-emerald-400 font-bold">Miễn phí 100%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vận chuyển hỏa tốc 2H:</span>
                  <span className="text-emerald-400 font-bold">Miễn phí</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bảo hành tận nơi:</span>
                  <span className="text-sky-400 font-bold">1 đổi 1 trong 30 ngày</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  Kiểm tra tương thích:
                </div>
                {compatIssues.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {selectedCount < 2 ? 'Chọn thêm linh kiện để kiểm tra' : 'Không phát hiện xung đột phần cứng'}
                    </span>
                  </div>
                ) : (
                  compatIssues.map((i) => (
                    <div
                      key={i.text}
                      className={`flex items-start gap-1.5 text-xs font-semibold ${
                        i.level === 'error' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{i.text}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-400 uppercase">Tổng Tạm Tính:</span>
                <span className="text-2xl font-black font-mono text-sky-400">
                  {formatVND(totalPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddFullPCToCart}
                disabled={selectedCount === 0}
                className={`w-full py-3.5 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedCount === 0
                    ? 'bg-slate-800 cursor-not-allowed opacity-50 text-slate-500'
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-sky-500/25 active:scale-[0.98]'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm Toàn Bộ Cấu Hình Vào Giỏ</span>
              </button>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <span className="font-bold text-sky-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Quà tặng kèm dàn PC:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  🎁 Tặng combo Bàn phím cơ Esports + Chuột không dây Gaming + Bàn di chuột cỡ lớn Speed khi build trọn bộ từ 5 món trở lên.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chọn Linh Kiện (Hacom style) */}
      {activeModalPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-5xl max-h-[85vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                  <Cpu className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100">
                    Chọn Linh Kiện: {activeModalPart.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lựa chọn sản phẩm chính hãng, bảo hành 1 đổi 1 tận nơi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Filters + Right Product List */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Cột trái: Bộ lọc */}
              <div className="w-full md:w-72 p-5 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/60 overflow-y-auto space-y-5 flex-shrink-0 text-xs max-h-56 md:max-h-none no-scrollbar">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-200 uppercase tracking-wider text-[11px]">
                    Bộ lọc {activeFilterCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-md bg-sky-600 text-white text-[10px]">
                        {activeFilterCount}
                      </span>
                    )}
                  </h4>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-[11px] font-semibold text-sky-400 hover:underline cursor-pointer"
                    >
                      Xóa tất cả
                    </button>
                  )}
                </div>

                <label className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={compatOnly}
                    onChange={(e) => setCompatOnly(e.target.checked)}
                    className="accent-sky-600 w-3.5 h-3.5 mt-0.5 cursor-pointer"
                  />
                  <span>
                    <strong className="block text-slate-100">Chỉ hiện hàng tương thích</strong>
                    <span className="text-[11px] text-slate-500">Ẩn linh kiện xung đột với cấu hình đang chọn</span>
                  </span>
                </label>

                <FilterGroup title="Khoảng giá">
                  {PRICE_RANGES.map((r) => (
                    <FilterOption
                      key={r.id}
                      type="radio"
                      name="price_filter"
                      checked={priceFilter === r.id}
                      onChange={() => setPriceFilter(r.id)}
                      label={r.label}
                    />
                  ))}
                </FilterGroup>

                {facetGroups.map((g) => (
                  <FilterGroup key={g.key} title={g.label} selected={(facetSel[g.key] || []).length}>
                    {g.options.map((o) => (
                      <FilterOption
                        key={o.value}
                        checked={(facetSel[g.key] || []).includes(o.value)}
                        onChange={() => toggleFacet(g.key, o.value)}
                        label={o.value}
                        count={o.count}
                      />
                    ))}
                  </FilterGroup>
                ))}

                {modalBrands.length > 1 && (
                  <FilterGroup title="Hãng sản xuất" selected={brandFilter.length}>
                    {modalBrands.map((b) => (
                      <FilterOption
                        key={b.value}
                        checked={brandFilter.includes(b.value)}
                        onChange={() => setBrandFilter((prev) => toggleIn(prev, b.value))}
                        label={b.value}
                        count={b.count}
                      />
                    ))}
                  </FilterGroup>
                )}
              </div>

              {/* Cột phải: Tìm kiếm & Danh sách linh kiện */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên sản phẩm, mã SP..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between text-xs">
                    <span className="text-slate-400">
                      Tìm thấy <strong className="text-sky-400">{modalAvailableProducts.length}</strong> sản phẩm
                    </span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="p-2 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-200 font-medium cursor-pointer focus:outline-none focus:border-sky-500 hover:border-slate-700 transition"
                    >
                      <option value="default">Sắp xếp: Mặc định (Gợi ý)</option>
                      <option value="price_asc">Giá: Thấp đến Cao</option>
                      <option value="price_desc">Giá: Cao đến Thấp</option>
                      <option value="stock_desc">Ưu tiên còn hàng sẵn</option>
                      <option value="newest">Mới nhất (Hàng mới về)</option>
                      <option value="name_asc">Tên sản phẩm: A → Z</option>
                      <option value="name_desc">Tên sản phẩm: Z → A</option>
                      <option value="warranty_desc">Bảo hành dài nhất</option>
                    </select>
                  </div>
                </div>

                {/* Banner thông báo lọc chéo Socket giữa CPU và Mainboard */}
                {((activeModalPart.key === 'motherboard' && selectedParts.cpu && socketOf(selectedParts.cpu)) ||
                  (activeModalPart.key === 'cpu' && selectedParts.motherboard && socketOf(selectedParts.motherboard))) && (() => {
                  const counterpart =
                    activeModalPart.key === 'motherboard' ? selectedParts.cpu : selectedParts.motherboard;
                  const targetSocket = socketOf(counterpart);
                  const isSocketFiltered = (facetSel.socket || []).includes(targetSocket);

                  return (
                    <div className="px-3.5 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>
                          Đồng bộ Socket <strong className="text-sky-400 font-mono">{targetSocket}</strong> theo{' '}
                          <strong className="text-slate-100">{counterpart.name}</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFacetSel((prev) => ({
                            ...prev,
                            socket: isSocketFiltered ? [] : [targetSocket]
                          }))
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 font-bold text-[11px] transition cursor-pointer"
                      >
                        {isSocketFiltered ? 'Xem tất cả Socket' : `Chỉ lọc Socket ${targetSocket}`}
                      </button>
                    </div>
                  );
                })()}

                {modalAvailableProducts.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <p className="text-sm font-bold text-slate-400">Không tìm thấy linh kiện phù hợp</p>
                    <p className="text-xs text-slate-500">Hãy thử xóa từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {modalAvailableProducts.map((prod) => {
                      const issue = checkCompat(activeModalPart.key, prod, selectedParts);
                      const blocked = issue?.level === 'error';

                      return (
                        <div
                          key={prod.id}
                          className={`p-3.5 rounded-2xl bg-slate-950 border transition flex items-start justify-between gap-4 group ${
                            blocked
                              ? 'border-rose-500/30 opacity-70'
                              : 'border-slate-800 hover:border-sky-500/60 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <Link
                              to={`/products/${prod.slug || prod.id}`}
                              title="Xem chi tiết sản phẩm"
                              className="flex-shrink-0 group/img"
                            >
                              <img
                                src={prod.thumbnail_url}
                                alt={prod.name}
                                className="w-16 h-16 object-contain rounded-xl bg-slate-900 p-1 border border-slate-800 group-hover/img:border-sky-500/60 transition-colors"
                              />
                            </Link>
                            <div className="space-y-1.5 min-w-0">
                              <Link
                                to={`/products/${prod.slug || prod.id}`}
                                title="Xem chi tiết sản phẩm"
                                className="group/title inline-flex items-start gap-1 text-xs font-bold text-slate-100 hover:text-sky-400 transition-colors"
                              >
                                <span className="line-clamp-2 group-hover/title:underline">
                                  {prod.name}
                                </span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-sky-400 opacity-0 -translate-y-0.5 group-hover/title:opacity-100 group-hover/title:translate-y-0 transition-all shrink-0 mt-0.5" />
                              </Link>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
                                <span>
                                  Hãng: <strong className="text-sky-400">{prod.brand || 'CHÍNH HÃNG'}</strong>
                                </span>
                                <span>•</span>
                                <span>Bảo hành: <strong>{prod.warranty_months || 24} Tháng</strong></span>
                                {(activeModalPart.key === 'cpu' || activeModalPart.key === 'motherboard') &&
                                  socketOf(prod) && (
                                    <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-[10px] font-bold text-sky-400 font-mono">
                                      Socket {socketOf(prod)}
                                    </span>
                                  )}
                                {activeModalPart.key === 'cpu' && cpuCoresOf(prod) && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                                    {cpuCoresOf(prod)} / {cpuThreadsOf(prod)}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-extrabold font-mono text-sky-400">
                                  {formatVND(prod.price)}
                                </span>
                                {prod.inStock ? (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    Còn hàng
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                    Tạm hết hàng
                                  </span>
                                )}
                              </div>

                              {issue && (
                                <div
                                  className={`flex items-center gap-1 text-[11px] font-bold ${
                                    blocked ? 'text-rose-400' : 'text-amber-400'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>{issue.text}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectPart(activeModalPart.key, prod)}
                            disabled={blocked || !prod.inStock}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{blocked ? 'Không khớp' : 'Chọn'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
