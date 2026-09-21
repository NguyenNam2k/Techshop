import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Truck, CreditCard, Headphones, MapPin, Mail, PhoneCall } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 text-xs border-t border-slate-800">
      
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-950 text-sky-400 border border-sky-800">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Giao Hàng Hỏa Tốc 2H</h4>
              <p className="text-slate-400 mt-0.5">Nhận hàng tận tay trong 2 giờ tại Hà Nội & TP.HCM</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Bảo Hành Chính Hãng</h4>
              <p className="text-slate-400 mt-0.5">1 Đổi 1 trong 30 ngày nếu có lỗi nhà sản xuất</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Thanh Toán VietQR & 0%</h4>
              <p className="text-slate-400 mt-0.5">Thanh toán tự động bằng VietQR / Thẻ tín dụng</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Tư Vấn Cấu Hình 24/7</h4>
              <p className="text-slate-400 mt-0.5">Đội ngũ kỹ thuật viên tư vấn build PC theo ngân sách</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer inline-flex">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white font-bold group-hover:bg-sky-400 transition-colors">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-lg font-extrabold text-white font-mono">TECHSHOP STORE</span>
          </Link>
          <p className="text-slate-400 leading-relaxed">
            Hệ thống bán lẻ máy tính cao cấp, linh kiện PC Gaming, Laptop & Gear chính hàng đầu Việt Nam. Tích hợp thanh toán VietQR tự động.
          </p>
          <div className="space-y-1 text-slate-400">
            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-sky-400" /> Showroom 1: 123 Cầu Giấy, Hà Nội</p>
            <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-sky-400" /> Showroom 2: 456 CMT8, Quận 10, TP.HCM</p>
            <p className="flex items-center gap-2"><PhoneCall className="w-3.5 h-3.5 text-sky-400" /> Hotline: 1900 8888 (8:00 - 21:30)</p>
          </div>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm uppercase mb-3 font-mono">Danh Mục Sản Phẩm</h5>
          <ul className="space-y-2 text-slate-400">
            <li><Link to="/products" className="hover:text-sky-400 cursor-pointer transition-colors block">Card Màn Hình RTX 40 Series</Link></li>
            <li><Link to="/products" className="hover:text-sky-400 cursor-pointer transition-colors block">CPU Intel Core i9 14th & Ryzen 7</Link></li>
            <li><Link to="/products" className="hover:text-sky-400 cursor-pointer transition-colors block">Màn hình Gaming 4K OLED 240Hz</Link></li>
            <li><Link to="/products" className="hover:text-sky-400 cursor-pointer transition-colors block">Chuột & Bàn phím cơ Esports</Link></li>
            <li><Link to="/products" className="hover:text-sky-400 cursor-pointer transition-colors block">Bo mạch chủ ASUS ROG / MSI MEG</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm uppercase mb-3 font-mono">Chính Sách & Dịch Vụ</h5>
          <ul className="space-y-2 text-slate-400">
            <li className="hover:text-sky-400 cursor-pointer transition-colors">Chính sách bảo hành 1 Đổi 1</li>
            <li className="hover:text-sky-400 cursor-pointer transition-colors">Hướng dẫn thanh toán VietQR</li>
            <li className="hover:text-sky-400 cursor-pointer transition-colors">Giao hàng & Lắp đặt tại nhà miễn phí</li>
            <li className="hover:text-sky-400 cursor-pointer transition-colors">Dịch vụ Modding & Tản nhiệt nước Custom</li>
            <li className="hover:text-sky-400 cursor-pointer transition-colors">Tra cứu thông tin đơn hàng realtime</li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-white text-sm uppercase mb-3 font-mono">Tổng Đài Hỗ Trợ Khách Hàng</h5>
          <div className="space-y-2 text-slate-300">
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-[11px] text-slate-400 block">Tư vấn mua hàng (Miễn phí):</span>
              <span className="text-base font-extrabold text-sky-400 font-mono">1900 8888</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
              <span className="text-[11px] text-slate-400 block">Hỗ trợ kỹ thuật & Bảo hành:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">0908 123 456</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800 py-4 text-center text-slate-500">
        © 2026 TechShop Commerce. High Performance Hardware & Gaming Gears Store.
      </div>
    </footer>
  );
}
