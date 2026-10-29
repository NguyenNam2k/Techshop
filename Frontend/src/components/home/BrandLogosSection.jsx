import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Authentic SVG Vector Logos for Top Tech Brands (High Contrast & Adaptive for Light & Dark)
const BRAND_SVG_LOGOS = {
  asus: (
    <svg viewBox="0 0 100 40" className="w-auto h-7 max-w-[110px] mx-auto">
      {/* ROG Eye Emblem */}
      <path
        d="M28 6 C33 6, 38 9, 41 14 C36 12, 30 13, 26 16 C22 19, 20 24, 21 29 C17 26, 15 20, 17 14 C19 9, 23 6, 28 6 Z"
        fill="#FF0033"
      />
      <path
        d="M31 16 C35 15, 39 17, 40 21 C36 21, 33 23, 31 26 C30 22, 30 18, 31 16 Z"
        fill="#FF0033"
      />
      {/* ROG Text */}
      <text
        x="45"
        y="25"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="16"
        letterSpacing="2"
        className="fill-slate-900 dark:fill-white group-hover:fill-red-600 dark:group-hover:fill-red-500 transition-colors"
      >
        ROG
      </text>
    </svg>
  ),
  intel: (
    <svg viewBox="0 0 100 40" className="w-auto h-7 max-w-[100px] mx-auto">
      <text
        x="50"
        y="26"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="-1"
        className="fill-sky-600 dark:fill-sky-400 group-hover:fill-sky-700 dark:group-hover:fill-sky-300 transition-colors"
      >
        intel.
      </text>
      {/* Intel arc swoosh */}
      <path
        d="M20 10 C45 3, 75 3, 85 11"
        className="stroke-sky-600 dark:stroke-sky-400"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  ),
  amd: (
    <svg viewBox="0 0 100 40" className="w-auto h-7 max-w-[100px] mx-auto">
      {/* AMD Arrow Chevron */}
      <polygon points="12,10 24,10 24,22 18,16 18,28 12,28" fill="#ED1C24" />
      <polygon points="26,12 26,24 20,24 20,18 14,18 20,12" fill="#ED1C24" />
      <text
        x="34"
        y="27"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="20"
        letterSpacing="1"
        className="fill-slate-900 dark:fill-white group-hover:fill-emerald-600 dark:group-hover:fill-emerald-400 transition-colors"
      >
        AMD
      </text>
    </svg>
  ),
  corsair: (
    <svg viewBox="0 0 110 40" className="w-auto h-7 max-w-[110px] mx-auto">
      {/* Corsair 3 billowing sails */}
      <path
        d="M12 27 C15 22, 19 16, 22 10 C21 16, 20 23, 19 28 Z"
        className="fill-amber-500 dark:fill-yellow-400"
      />
      <path
        d="M20 28 C24 20, 29 13, 33 7 C31 15, 29 23, 27 28 Z"
        className="fill-amber-500 dark:fill-yellow-400"
      />
      <path
        d="M28 28 C31 22, 35 16, 38 12 C36 18, 34 24, 33 28 Z"
        className="fill-amber-500 dark:fill-yellow-400"
      />
      <text
        x="42"
        y="24"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="13"
        letterSpacing="1.5"
        className="fill-slate-900 dark:fill-white group-hover:fill-amber-600 dark:group-hover:fill-yellow-400 transition-colors"
      >
        CORSAIR
      </text>
    </svg>
  ),
  msi: (
    <svg viewBox="0 0 100 40" className="w-auto h-7 max-w-[95px] mx-auto">
      {/* MSI iconic dragon-cut font */}
      <text
        x="50"
        y="27"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="22"
        fontStyle="italic"
        letterSpacing="2"
        className="fill-red-600 dark:fill-red-500 group-hover:fill-red-700 dark:group-hover:fill-red-400 transition-colors"
      >
        msi
      </text>
    </svg>
  ),
  gigabyte: (
    <svg viewBox="0 0 110 40" className="w-auto h-7 max-w-[110px] mx-auto">
      {/* AORUS Falcon wing */}
      <path
        d="M14 26 L18 10 L28 14 L24 22 L20 20 L20 26 Z"
        fill="#EA580C"
      />
      <text
        x="32"
        y="24"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="13"
        letterSpacing="1.5"
        className="fill-slate-900 dark:fill-white group-hover:fill-orange-600 dark:group-hover:fill-orange-400 transition-colors"
      >
        AORUS
      </text>
    </svg>
  ),
  kingston: (
    <svg viewBox="0 0 110 40" className="w-auto h-7 max-w-[110px] mx-auto">
      {/* Kingston Red Head profile silhouette */}
      <path
        d="M12 18 C12 13, 16 9, 21 9 C26 9, 29 13, 28 18 C28 22, 25 24, 25 27 L15 27 C15 24, 12 22, 12 18 Z"
        fill="#E11D48"
      />
      <text
        x="33"
        y="24"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="12.5"
        letterSpacing="1"
        className="fill-slate-900 dark:fill-white group-hover:fill-rose-600 dark:group-hover:fill-rose-400 transition-colors"
      >
        Kingston
      </text>
    </svg>
  ),
  samsung: (
    <svg viewBox="0 0 110 40" className="w-auto h-7 max-w-[110px] mx-auto">
      {/* Official Samsung royal blue oval badge */}
      <ellipse
        cx="55"
        cy="20"
        rx="48"
        ry="13"
        transform="rotate(-5 55 20)"
        fill="#034EA2"
      />
      <text
        x="55"
        y="24.5"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="12"
        letterSpacing="1.5"
        fill="#FFFFFF"
      >
        SAMSUNG
      </text>
    </svg>
  ),
  nzxt: (
    <svg viewBox="0 0 100 40" className="w-auto h-7 max-w-[95px] mx-auto">
      <text
        x="50"
        y="27"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="21"
        letterSpacing="3"
        className="fill-purple-600 dark:fill-purple-400 group-hover:fill-purple-700 dark:group-hover:fill-purple-300 transition-colors"
      >
        NZXT.
      </text>
    </svg>
  ),
  logitech: (
    <svg viewBox="0 0 110 40" className="w-auto h-7 max-w-[105px] mx-auto">
      {/* Logitech G symbol */}
      <path
        d="M20 12 A10 10 0 1 0 26 25 L26 20 L18 20"
        fill="none"
        stroke="#00A8E8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="36"
        y="25"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="17"
        className="fill-slate-900 dark:fill-white group-hover:fill-sky-600 dark:group-hover:fill-sky-400 transition-colors"
      >
        logi
      </text>
    </svg>
  ),
  razer: (
    <svg viewBox="0 0 100 40" className="w-auto h-7 max-w-[95px] mx-auto">
      {/* Razer triple-snake icon */}
      <circle cx="20" cy="20" r="8" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeDasharray="3 3" />
      <text
        x="36"
        y="25"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="14"
        letterSpacing="3"
        className="fill-emerald-600 dark:fill-emerald-400 group-hover:fill-emerald-700 dark:group-hover:fill-emerald-300 transition-colors"
      >
        RAZER
      </text>
    </svg>
  ),
  keychron: (
    <svg viewBox="0 0 110 40" className="w-auto h-7 max-w-[110px] mx-auto">
      {/* Keychron mechanical switch badge */}
      <rect x="12" y="12" width="16" height="16" rx="4" fill="none" className="stroke-sky-600 dark:stroke-sky-400" strokeWidth="2" />
      <circle cx="20" cy="20" r="3" className="fill-sky-600 dark:fill-sky-400" />
      <text
        x="36"
        y="24"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="12.5"
        letterSpacing="1"
        className="fill-slate-900 dark:fill-white group-hover:fill-cyan-600 dark:group-hover:fill-cyan-400 transition-colors"
      >
        Keychron
      </text>
    </svg>
  )
};

const FEATURED_BRANDS_CONFIG = [
  { id: 'asus', name: 'ASUS ROG', tag: 'ASUS', desc: 'Bo mạch chủ & Card RTX 40', color: 'hover:border-red-500/50 hover:shadow-red-500/10' },
  { id: 'intel', name: 'Intel', tag: 'Intel', desc: 'Vi xử lý Core Gen 14', color: 'hover:border-sky-500/50 hover:shadow-sky-500/10' },
  { id: 'amd', name: 'AMD', tag: 'AMD', desc: 'Ryzen 7000 & 3D V-Cache', color: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10' },
  { id: 'corsair', name: 'Corsair', tag: 'Corsair', desc: 'RAM DDR5 & Nguồn Shift', color: 'hover:border-amber-500/50 hover:shadow-amber-500/10' },
  { id: 'msi', name: 'MSI', tag: 'MSI', desc: 'Card đồ họa & Mainboard', color: 'hover:border-red-600/50 hover:shadow-red-600/10' },
  { id: 'gigabyte', name: 'Gigabyte', tag: 'Gigabyte', desc: 'AORUS Gaming Series', color: 'hover:border-orange-500/50 hover:shadow-orange-500/10' },
  { id: 'kingston', name: 'Kingston', tag: 'Kingston', desc: 'FURY Beast DDR5 & SSD', color: 'hover:border-rose-500/50 hover:shadow-rose-500/10' },
  { id: 'samsung', name: 'Samsung', tag: 'Samsung', desc: 'SSD 990 PRO & Màn OLED', color: 'hover:border-blue-500/50 hover:shadow-blue-500/10' },
  { id: 'nzxt', name: 'NZXT', tag: 'NZXT', desc: 'Tản nước Kraken & Vỏ H9', color: 'hover:border-purple-500/50 hover:shadow-purple-500/10' },
  { id: 'logitech', name: 'Logitech G', tag: 'Logitech', desc: 'Chuột Superlight & Phím', color: 'hover:border-cyan-500/50 hover:shadow-cyan-500/10' },
  { id: 'razer', name: 'Razer', tag: 'Razer', desc: 'Gear Esports Đỉnh Cao', color: 'hover:border-green-500/50 hover:shadow-green-500/10' },
  { id: 'keychron', name: 'Keychron', tag: 'Keychron', desc: 'Bàn phím cơ Custom QMK', color: 'hover:border-sky-400/50 hover:shadow-sky-400/10' }
];

const BrandLogosSection = () => {
  const navigate = useNavigate();

  return (
    <section className="p-6 md:p-7 rounded-3xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Hệ Sinh Thái Thương Hiệu Hàng Đầu
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
          100% Phân phối ủy quyền chính hãng tại Việt Nam
        </span>
      </div>

      {/* Grid Thương Hiệu dạng SVG Logo cao cấp */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {FEATURED_BRANDS_CONFIG.map((brand) => (
          <div
            key={brand.id}
            onClick={() => {
              navigate(`/catalog?brands=${encodeURIComponent(brand.tag)}`);
            }}
            className={`p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 ${brand.color} hover:bg-slate-50/90 dark:hover:bg-slate-900 transition-all duration-300 cursor-pointer text-center group flex flex-col justify-between items-center shadow-xs hover:shadow-xl hover:-translate-y-1`}
          >
            {/* Logo SVG Vector */}
            <div className="h-10 flex items-center justify-center w-full transition-transform duration-300 group-hover:scale-110">
              {BRAND_SVG_LOGOS[brand.id]}
            </div>

            {/* Thông tin & Subtext */}
            <div className="mt-3 w-full border-t border-slate-100 dark:border-slate-800/70 pt-2.5">
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                {brand.name}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                {brand.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BrandLogosSection;