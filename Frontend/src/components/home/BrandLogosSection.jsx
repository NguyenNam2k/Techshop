import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// Import bộ ảnh SVG thương hiệu từ frontend/src/images/
import asusLogo from '../../images/asus-logo.svg';
import intelLogo from '../../images/Intel-logo.svg';
import amdLogo from '../../images/amd-logo.svg';
import corsairLogo from '../../images/Corsair_Gaming.svg';
import msiLogo from '../../images/msi-logo.svg';
import gigabyteLogo from '../../images/gigabyte_logo.svg';
import aorusLogo from '../../images/aorus-logo.svg';
import kingstonLogo from '../../images/kingston-technology-logo.svg';
import hyperxLogo from '../../images/hyperx-logo.svg';
import samsungLogo from '../../images/samsung.svg';
import nzxtLogo from '../../images/nzxt.svg';
import logitechLogo from '../../images/logitech.svg';
import razerLogo from '../../images/Razer.svg';

// Danh sách cấu hình các thương hiệu hàng đầu
const FEATURED_BRANDS_CONFIG = [
  { id: 'asus', name: 'ASUS', tag: 'ASUS', logo: asusLogo, invertOnDark: true },
  { id: 'intel', name: 'Intel', tag: 'Intel', logo: intelLogo, invertOnDark: true },
  { id: 'amd', name: 'AMD', tag: 'AMD', logo: amdLogo, invertOnDark: true },
  { id: 'corsair', name: 'Corsair', tag: 'Corsair', logo: corsairLogo, invertOnDark: true },
  { id: 'msi', name: 'MSI', tag: 'MSI', logo: msiLogo, invertOnDark: true },
  { id: 'gigabyte', name: 'Gigabyte', tag: 'Gigabyte', logo: gigabyteLogo, invertOnDark: true },
  { id: 'aorus', name: 'AORUS', tag: 'Gigabyte', logo: aorusLogo, invertOnDark: true },
  { id: 'kingston', name: 'Kingston', tag: 'Kingston', logo: kingstonLogo, invertOnDark: true },
  { id: 'hyperx', name: 'HyperX', tag: 'HyperX', logo: hyperxLogo, invertOnDark: false },
  { id: 'samsung', name: 'Samsung', tag: 'Samsung', logo: samsungLogo, invertOnDark: true },
  { id: 'nzxt', name: 'NZXT', tag: 'NZXT', logo: nzxtLogo, invertOnDark: true },
  { id: 'logitech', name: 'Logitech G', tag: 'Logitech', logo: logitechLogo, invertOnDark: true },
  { id: 'razer', name: 'Razer', tag: 'Razer', logo: razerLogo, invertOnDark: false }
];

const BrandLogosSection = () => {
  const navigate = useNavigate();

  // Render từng badge hình chữ nhật (Rectangle Icon)
  const renderBrandItem = (brand, indexKey) => (
    <div
      key={`${brand.id}-${indexKey}`}
      onClick={() => navigate(`/catalog?brands=${encodeURIComponent(brand.tag)}`)}
      title={brand.name}
      className="w-36 sm:w-44 h-14 sm:h-16 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-xs hover:shadow-md hover:-translate-y-0.5 shrink-0"
    >
      <div className="w-full h-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
        <img
          src={brand.logo}
          alt={brand.name}
          className={`max-h-7 max-w-[105px] sm:max-w-[125px] w-auto h-auto object-contain transition-all duration-200 ${
            brand.invertOnDark ? 'dark:brightness-0 dark:invert' : ''
          }`}
          loading="lazy"
        />
      </div>
    </div>
  );

  return (
    <section className="p-5 md:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <h3 className="text-base font-extrabold uppercase tracking-wider text-slate-100">
            Hệ Sinh Thái Thương Hiệu Hàng Đầu
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          100% Phân phối ủy quyền chính hãng tại Việt Nam
        </span>
      </div>

      {/* Auto slide marquee liền mạch với bộ SVG logos */}
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_3%,black_97%,transparent)]">
        <div className="brand-logo-track flex w-max hover:[animation-play-state:paused]">
          {/* Cụm 1 */}
          <div className="flex items-center gap-3 sm:gap-4 pr-3 sm:pr-4 shrink-0">
            {FEATURED_BRANDS_CONFIG.map((brand) => renderBrandItem(brand, 'primary'))}
          </div>

          {/* Cụm 2 (Nhân bản để tạo hiệu ứng vòng lặp vô tận liền mạch) */}
          <div className="flex items-center gap-3 sm:gap-4 pr-3 sm:pr-4 shrink-0" aria-hidden="true">
            {FEATURED_BRANDS_CONFIG.map((brand) => renderBrandItem(brand, 'clone'))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandLogosSection;
