import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Truck, CreditCard, Headphones, MapPin, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 text-xs border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
      
      {/* 1. TRUST BADGES ROW */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Badge 1: Delivery */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-200/80 dark:bg-sky-950/80 dark:text-sky-400 dark:border-sky-800 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Giao Hỏa Tốc 2H</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                Giao nhanh trong 2H nội thành Hà Nội &amp; TP.HCM; hỗ trợ đóng gói chống sốc toàn quốc.
              </p>
            </div>
          </div>

          {/* Badge 2: Warranty */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/80 dark:bg-indigo-950/80 dark:text-indigo-400 dark:border-indigo-800 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Bảo Hành Chính Hãng</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                1 Đổi 1 trong 30 ngày nếu có lỗi nhà sản xuất; bảo hành chính hãng tận tâm.
              </p>
            </div>
          </div>

          {/* Badge 3: Payment */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 dark:bg-emerald-950/80 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Thanh Toán Linh Hoạt</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                VietQR tự động đối soát, Thẻ tín dụng VISA/Mastercard, hỗ trợ trả góp 0%.
              </p>
            </div>
          </div>

          {/* Badge 4: Tech Support */}
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/80 dark:bg-purple-950/80 dark:text-purple-400 dark:border-purple-800 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tư Vấn Build PC 24/7</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed text-[11px]">
                Đội ngũ kỹ thuật viên lành nghề hỗ trợ cân đối cấu hình theo đúng ngân sách.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. MAIN FOOTER CONTENT */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Col 1: Store Brand & Info */}
        <div className="space-y-3.5">
          <Link to="/" className="flex items-center gap-2.5 group cursor-pointer inline-flex">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">TECHSHOP STORE</span>
          </Link>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-xs">
            Hệ thống bán lẻ máy tính cao cấp, linh kiện PC Gaming, Laptop &amp; Gear chính hãng hàng đầu Việt Nam.
          </p>
          <div className="space-y-2 text-slate-600 dark:text-slate-400 text-xs pt-1">
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" /> Showroom 1: 123 Cầu Giấy, Hà Nội</p>
            <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" /> Showroom 2: 456 CMT8, Quận 10, TP.HCM</p>
            <p className="flex items-center gap-2"><PhoneCall className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" /> Hotline: 1900 8888 (8:00 - 21:30)</p>
          </div>
        </div>

        {/* Col 2: Categories */}
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-3.5 tracking-wider font-mono">Danh Mục Sản Phẩm</h5>
          <ul className="space-y-2.5 text-slate-500 dark:text-slate-400">
            <li><Link to="/catalog?category=gpus" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors block">Card Màn Hình RTX 40 Series</Link></li>
            <li><Link to="/catalog?category=cpus" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors block">CPU Intel Core i9 14th &amp; Ryzen 7</Link></li>
            <li><Link to="/catalog?category=monitors" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors block">Màn hình Gaming 4K OLED 240Hz</Link></li>
            <li><Link to="/catalog?category=keyboards" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors block">Chuột &amp; Bàn phím cơ Esports</Link></li>
            <li><Link to="/catalog?category=motherboards" className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors block">Bo mạch chủ ASUS ROG / MSI MEG</Link></li>
          </ul>
        </div>

        {/* Col 3: Policies & Services */}
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-3.5 tracking-wider font-mono">Chính Sách &amp; Dịch Vụ</h5>
          <ul className="space-y-2.5 text-slate-500 dark:text-slate-400">
            <li className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors">Chính sách bảo hành 1 Đổi 1</li>
            <li className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors">Hướng dẫn thanh toán VietQR</li>
            <li className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors">Giao hàng &amp; Lắp đặt tại nhà miễn phí</li>
            <li className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors">Dịch vụ Modding &amp; Tản nhiệt nước Custom</li>
            <li className="hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors">Tra cứu thông tin đơn hàng realtime</li>
          </ul>
        </div>

        {/* Col 4: Support hotline cards */}
        <div>
          <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase mb-3.5 tracking-wider font-mono">Tổng Đài Hỗ Trợ Khách Hàng</h5>
          <div className="space-y-2.5">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-sky-500/40 transition-colors">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Tư vấn mua hàng (Miễn phí):</span>
              <span className="text-base font-extrabold text-sky-600 dark:text-sky-400 font-mono tracking-wider">1900 8888</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-colors">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Hỗ trợ kỹ thuật &amp; Bảo hành:</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-wider">0908 123 456</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COPYRIGHT */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 py-4 text-center text-slate-500 dark:text-slate-400 text-[11px]">
        © 2026 TechShop Commerce. High Performance Hardware &amp; Gaming Gears Store.
      </div>
    </footer>
  );
}