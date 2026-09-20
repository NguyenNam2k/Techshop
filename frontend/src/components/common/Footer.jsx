import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCcw, CreditCard, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-20 bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-100 font-semibold text-sm">100% Chính Hãng</div>
              <div className="text-[11px] text-slate-400">Bảo hành NSX tiêu chuẩn</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/50">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-100 font-semibold text-sm">Giao Hỏa Tốc 2H</div>
              <div className="text-[11px] text-slate-400">Nội thành hỏa tốc an toàn</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/50">
              <RefreshCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-100 font-semibold text-sm">Đổi Mới 30 Ngày</div>
              <div className="text-[11px] text-slate-400">1 đổi 1 tận nơi nếu lỗi NSX</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-slate-100 font-semibold text-sm">Trả Góp 0% Lãi Suất</div>
              <div className="text-[11px] text-slate-400">Thủ tục nhanh qua thẻ tín dụng</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          <Link to="/" className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-cyan-400">TECH</span>GEAR
          </Link>
          <p className="text-slate-400 text-xs leading-relaxed">
            Hệ sinh thái phần cứng máy tính cao cấp, phân phối card đồ họa, linh kiện PC và phụ kiện gaming gear chính hãng hàng đầu.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Hotline tư vấn: <strong className="text-slate-200">1900 8888</strong> (8h00 - 21h30)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Email: <span className="text-slate-200">support@techgear.vn</span></span>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>Trụ sở: Khu Công Nghệ Cao, P. Thạch Thất, TP. Hà Nội</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Chính Sách & Dịch Vụ
          </h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Chính sách bảo hành & bảo trì</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Chính sách đổi trả 1 đổi 1 trong 30 ngày</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Chính sách vận chuyển & giao hàng hỏa tốc</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Hướng dẫn mua hàng trả góp 0%</a></li>
            <li><a href="#" className="hover:text-cyan-400 transition-colors">Chính sách bảo mật thông tin</a></li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Linh Kiện & Gaming Gear
          </h4>
          <ul className="space-y-2">
            <li><Link to="/products" className="hover:text-cyan-400 transition-colors">Card màn hình (VGA RTX 4090 / 4080)</Link></li>
            <li><Link to="/products" className="hover:text-cyan-400 transition-colors">Bo mạch chủ (Mainboard Z790 / B760)</Link></li>
            <li><Link to="/products" className="hover:text-cyan-400 transition-colors">Chuột Gaming siêu nhẹ không dây</Link></li>
            <li><Link to="/products" className="hover:text-cyan-400 transition-colors">Bàn phím cơ Custom & Switch cao cấp</Link></li>
            <li><Link to="/products" className="hover:text-cyan-400 transition-colors">Vỏ Case Bể cá & Tản nhiệt nước AIO RGB</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Phương Thức Thanh Toán
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-300">
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">VietQR</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">Visa / Master</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">MoMo</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">VNPAY</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">Trả Góp 0%</div>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">COD</div>
          </div>

          {/* <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1">
            <div className="text-slate-200 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
              Đã thông báo Bộ Công Thương
            </div>
            <p className="text-slate-500">Mã số chứng nhận an toàn thương mại điện tử.</p>
          </div> */}
        </div>
      </div>

      <div className="border-t border-slate-900 bg-slate-950 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            © 2026 <strong>TechGear Store</strong>. All Rights Reserved.
          </div>
          <div className="flex items-center gap-1">
            Thiết kế & phát triển cho cộng đồng công nghệ Việt Nam
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
