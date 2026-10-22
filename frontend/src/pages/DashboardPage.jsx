import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Package,
  ShieldCheck,
  Star,
  LifeBuoy,
  MessageCircle,
  ClipboardList,
  Truck,
  Boxes,
  TicketPercent,
  CalendarDays,
  BarChart3,
  Users,
  UserCog,
  Lock,
  ScrollText,
  CheckCircle2,
  XCircle,
  Plus,
  Power,
  Search,
  Loader2,
  TrendingUp,
  RefreshCw,
  Clock,
  DollarSign,
  AlertTriangle,
  Zap,
  Printer,
  Sparkles,
  ArrowUpRight,
  Filter,
  Check,
  LayoutGrid,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const ROLES = {
  admin: {
    label: "Quản Trị Viên Hệ Thống (Admin)",
    name: "Nguyễn Thành Nam",
    email: "admin@techshop.vn",
  },
  manager: {
    label: "Quản Lý Cửa Hàng (Manager)",
    name: "Trần Văn Hoàng",
    email: "manager@techshop.vn",
  },
  staff: {
    label: "Nhân Viên Kỹ Thuật & CSKH (Staff)",
    name: "Phạm Đức Long",
    email: "staff@techshop.vn",
  },
  customer: {
    label: "Khách Hàng VIP (Customer)",
    name: "Tú Nguyễn",
    email: "customer@gmail.com",
  },
};

const card =
  "rounded-3xl border border-slate-800 bg-slate-900 shadow-sm transition-all";
const input =
  "w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-800 bg-slate-950 text-slate-100 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors";
const btn =
  "px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";
const btnPrimary = `${btn} bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md shadow-sky-500/20 active:scale-95`;
const btnGhost = `${btn} border border-slate-800 bg-slate-950/60 text-slate-200 hover:text-white hover:bg-slate-800`;
const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n || 0,
  );

function Head({ title, desc, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
      <div>
        <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wider">
          {title}
        </h2>
        {desc && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{desc}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Pill({ tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-800 text-slate-300 border border-slate-700",
    sky: "bg-sky-500/15 text-sky-400 border border-sky-500/30",
    amber: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    red: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
    purple: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 1: TỔNG QUAN ĐIỀU HÀNH & PHÂN TÍCH DOANH THU (ANALYTICS COMMAND HUB)  */
/* -------------------------------------------------------------------------- */
function OverviewAnalyticsPanel({ orders, products }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Dữ liệu biểu đồ 7 ngày gần nhất
  const revenueChart = [
    { day: "Thứ 2", date: "14/10", rev: 45200000, orders: 11, pct: 45 },
    { day: "Thứ 3", date: "15/10", rev: 58400000, orders: 14, pct: 58 },
    { day: "Thứ 4", date: "16/10", rev: 52100000, orders: 12, pct: 52 },
    { day: "Thứ 5", date: "17/10", rev: 79800000, orders: 19, pct: 79 },
    { day: "Thứ 6", date: "18/10", rev: 94500000, orders: 23, pct: 94 },
    {
      day: "Thứ 7",
      date: "19/10",
      rev: 120500000,
      orders: 31,
      pct: 100,
      isPeak: true,
    },
    { day: "Chủ Nhật", date: "20/10", rev: 105200000, orders: 27, pct: 87 },
  ];

  return (
    <div className="space-y-6">
      <Head
        title="Bảng Điều Hành Trung Tâm & Chỉ Số KPI"
        desc="Theo dõi số liệu bán hàng, lưu lượng đơn và tình trạng xử lý trong thời gian thực."
      />

      {/* Biểu Đồ Doanh Thu 7 Ngày Trực Quan (Interactive Tech Bar Chart) */}
      <div className={`${card} p-6 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>Biểu Đồ Doanh Thu 7 Ngày Gần Nhất (Tuần 42/2026)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Đỉnh doanh thu ngày Thứ 7 đạt 120.500.000₫ nhờ siêu sale Linh kiện
              PC &amp; Laptop
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold">
              Tổng 7 ngày: {money(555700000)}
            </span>
          </div>
        </div>

        {/* Cột Biểu Đồ */}
        <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2">
          {revenueChart.map((item, idx) => (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              onMouseEnter={() => setHoveredBar(item)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* Tooltip khi rê chuột */}
              {hoveredBar === item && (
                <div className="absolute -top-12 z-20 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-sky-500/50 text-[11px] text-white shadow-xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <span className="font-extrabold text-sky-400 font-mono">
                    {money(item.rev)}
                  </span>
                  <span className="text-slate-400 ml-1.5">
                    ({item.orders} đơn)
                  </span>
                </div>
              )}

              {/* Thanh Cột Doanh Thu */}
              <div className="w-full max-w-[48px] bg-slate-800/80 rounded-xl overflow-hidden flex items-end h-full p-1 border border-slate-800 group-hover:border-sky-500/60 transition-all">
                <div
                  className={`w-full rounded-lg transition-all duration-500 ${
                    item.isPeak
                      ? "bg-gradient-to-t from-sky-500 via-blue-500 to-indigo-500 shadow-lg shadow-sky-500/30"
                      : "bg-gradient-to-t from-sky-600/70 to-blue-500/90 group-hover:from-sky-500 group-hover:to-blue-400"
                  }`}
                  style={{ height: `${item.pct}%` }}
                />
              </div>

              {/* Nhãn Ngày */}
              <div className="text-center mt-2.5 space-y-0.5">
                <span className="block text-[11px] font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                  {item.day}
                </span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  {item.date}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Cơ Cấu Ngành Hàng & Dòng Sự Kiện Live */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cơ cấu doanh số theo nhóm ngành */}
        <div className={`${card} p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Cơ Cấu Doanh Số Theo Nhóm Hàng</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Tháng 10/2026
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {[
              {
                label: "Card Màn Hình & Linh Kiện PC",
                rev: "280.000.000₫",
                pct: 48,
                color: "bg-sky-500",
              },
              {
                label: "Laptop Gaming & Đồ Họa",
                rev: "168.000.000₫",
                pct: 30,
                color: "bg-indigo-500",
              },
              {
                label: "Màn Hình Gaming OLED / 240Hz",
                rev: "68.000.000₫",
                pct: 12,
                color: "bg-rose-500",
              },
              {
                label: "Bàn Phím Cơ & Gaming Gear",
                rev: "42.000.000₫",
                pct: 10,
                color: "bg-emerald-500",
              },
            ].map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-200">{cat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sky-400 font-extrabold">
                      {cat.rev}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      ({cat.pct}%)
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${cat.color} transition-all duration-700`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dòng Sự Kiện Thời Gian Thực (Live Activity Audit Feed) */}
        <div className={`${card} p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-amber-400" />
              <span>Dòng Sự Kiện Hệ Thống Trực Tiếp</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />{" "}
              Realtime
            </span>
          </div>

          <div className="space-y-3 divide-y divide-slate-800/80">
            {[
              {
                time: "17:18",
                title: "Thanh toán VietQR thành công: Đơn ORD-2026-9812",
                sub: "Khách Tú Nguyễn thanh toán 79.990.000₫ cho ASUS ROG Zephyrus G16",
                tone: "green",
              },
              {
                time: "17:05",
                title: "Bàn giao Shipper Hỏa Tốc 2H: Đơn ORD-2026-9805",
                sub: "Xuất kho 1x Keychron Q1 Pro Wireless đến Cầu Giấy, Hà Nội",
                tone: "sky",
              },
              {
                time: "16:42",
                title: 'Áp dụng thành công Voucher "TECH10" (Giảm 10%)',
                sub: "Khách hàng áp dụng mã ưu đãi cho bộ PC Gaming Esports",
                tone: "purple",
              },
              {
                time: "16:15",
                title: "Cảnh báo mức tồn kho thấp (< 3 chiếc)",
                sub: "Sản phẩm NZXT Kraken Elite 360 chỉ còn 2 bộ trong kho",
                tone: "amber",
              },
            ].map((ev, i) => (
              <div
                key={i}
                className="pt-2.5 first:pt-0 flex items-start gap-3 text-xs"
              >
                <span className="font-mono text-[11px] font-bold text-slate-500 shrink-0 mt-0.5">
                  {ev.time}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    <span className="truncate">{ev.title}</span>
                    <Pill tone={ev.tone}>Hoàn tất</Pill>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed truncate">
                    {ev.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 2: XỬ LÝ ĐƠN HÀNG TOÀN DIỆN (ORDER FULFILLMENT HUB)                    */
/* -------------------------------------------------------------------------- */
function OrderManagementPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders();
      const list = Array.isArray(res) ? res : res.data || [];
      setOrders(
        list.map((o, idx) => ({
          ...o,
          state:
            o.payment_status === "paid"
              ? idx % 2 === 0
                ? "confirmed"
                : "ready"
              : "pending",
          order_code: o.order_code || `ORD-2026-${1042 + idx}`,
        })),
      );
    } catch (err) {
      console.warn("Lỗi tải đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateState = (code, newState, optionalReason = "") => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === code
          ? { ...o, state: newState, reason: optionalReason }
          : o,
      ),
    );
  };

  const filtered = orders.filter((o) => {
    if (activeTab === "pending" && o.state !== "pending") return false;
    if (activeTab === "confirmed" && o.state !== "confirmed") return false;
    if (activeTab === "ready" && o.state !== "ready") return false;
    if (activeTab === "cancelled" && o.state !== "cancelled") return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesCode = o.order_code?.toLowerCase().includes(q);
      const matchesName = o.recipient_name?.toLowerCase().includes(q);
      const matchesPhone = o.recipient_phone?.includes(q);
      return matchesCode || matchesName || matchesPhone;
    }
    return true;
  });

  const STATE_LABELS = {
    pending: ["Chờ xác nhận / Thanh toán", "amber"],
    confirmed: ["Đã thanh toán VietQR", "green"],
    ready: ["Đang giao Hỏa Tốc 2H", "sky"],
    delivered: ["Đã nhận hàng thành công", "green"],
    cancelled: ["Đã hủy đơn", "red"],
  };

  return (
    <div className="space-y-4">
      <Head
        title="Quản Lý Đơn Hàng & Vận Chuyển Hỏa Tốc"
        desc="Kiểm tra trạng thái thanh toán VietQR tự động, đóng gói và điều phối shipper nội thành."
        action={
          <button
            type="button"
            onClick={loadOrders}
            className={`${btnGhost} flex items-center gap-1.5`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới đơn</span>
          </button>
        }
      />

      {/* Filter Tabs + Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "all", label: "Tất cả" },
            { id: "pending", label: "Chờ duyệt" },
            { id: "confirmed", label: "Đã thanh toán" },
            { id: "ready", label: "Đang giao 2H" },
            { id: "cancelled", label: "Đã hủy" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-sky-500/15 border border-sky-500/30 text-sky-400"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, SĐT, tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${input} pl-9`}
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center flex items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
          <span>Đang tải danh sách đơn hàng...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${card} p-10 text-center space-y-2`}>
          <ClipboardList className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">
            Không tìm thấy đơn hàng nào
          </p>
          <p className="text-xs text-slate-500">
            Hãy thử xóa bộ lọc hoặc tìm kiếm theo mã đơn khác
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((o) => {
            const code = o.order_code;
            const currentState = o.state || "pending";
            const total = o.final_amount || o.total_amount || 79990000;

            return (
              <div
                key={code}
                className={`${card} p-5 space-y-3 hover:border-slate-700`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-sky-400">
                      {code}
                    </span>
                    <Pill tone={STATE_LABELS[currentState]?.[1] || "slate"}>
                      {STATE_LABELS[currentState]?.[0] || currentState}
                    </Pill>
                    <span className="text-xs text-slate-400">
                      Khách:{" "}
                      <strong className="text-slate-100">
                        {o.recipient_name || "Khách hàng VIP"}
                      </strong>
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {o.recipient_phone || "0908 123 456"}
                    </span>
                  </div>

                  <div className="font-mono text-base font-black text-sky-400">
                    {money(total)}
                  </div>
                </div>

                {/* Chi tiết đơn */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-400">
                    Địa chỉ:{" "}
                    <span className="text-slate-300 font-medium">
                      {o.shipping_address || "Số 12, Ngõ 45 Cầu Giấy, Hà Nội"}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-sky-400 font-bold">
                      [Hỏa Tốc 2H]
                    </span>
                  </div>

                  {currentState !== "cancelled" ? (
                    <div className="flex items-center gap-2">
                      {currentState === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setRejecting(code);
                              setReason("");
                            }}
                            className={`${btnGhost} text-rose-400 hover:text-rose-300 flex items-center gap-1`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Hủy Đơn
                          </button>
                          <button
                            type="button"
                            onClick={() => updateState(code, "confirmed")}
                            className={`${btnPrimary} flex items-center gap-1`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Xác Nhận
                            Thanh Toán
                          </button>
                        </>
                      )}

                      {currentState === "confirmed" && (
                        <button
                          type="button"
                          onClick={() => updateState(code, "ready")}
                          className={`${btnPrimary} flex items-center gap-1`}
                        >
                          <Truck className="w-3.5 h-3.5" /> Bàn Giao Shipper 2H
                        </button>
                      )}

                      {currentState === "ready" && (
                        <button
                          type="button"
                          onClick={() => updateState(code, "delivered")}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-500/25 transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Đánh Dấu Đã Giao
                          Xong
                        </button>
                      )}

                      {currentState === "delivered" && (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Khách đã nhận
                          &amp; ký nhận
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-400 font-medium">
                      Lý do hủy: {o.reason || "Khách yêu cầu hủy đơn"}
                    </p>
                  )}
                </div>

                {/* Input lý do hủy đơn */}
                {rejecting === code && (
                  <div className="pt-2 flex gap-2">
                    <input
                      autoFocus
                      className={input}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Nhập lý do hủy (hết hàng, khách đổi ý...)"
                    />
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                      disabled={!reason.trim()}
                      onClick={() => {
                        updateState(code, "cancelled", reason);
                        setRejecting(null);
                      }}
                    >
                      Xác Nhận Hủy
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 3: QUẢN LÝ KHO & SẢN PHẨM (INVENTORY MANAGEMENT)                       */
/* -------------------------------------------------------------------------- */
function InventoryManagementPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getProducts({ limit: 60 });
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        setProducts(
          list.map((p, idx) => ({
            ...p,
            stockCount: idx % 5 === 0 ? 2 : idx % 7 === 0 ? 0 : 15,
          })),
        );
      } catch (err) {
        console.warn("Lỗi tải sản phẩm kho:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const adjustStock = (id, delta) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stockCount: Math.max(0, (p.stockCount || 0) + delta) }
          : p,
      ),
    );
  };

  const filtered = products.filter((p) => {
    if (filterStock === "low" && (p.stockCount <= 0 || p.stockCount > 4))
      return false;
    if (filterStock === "out" && p.stockCount > 0) return false;
    if (filterStock === "in" && p.stockCount <= 0) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Head
        title="Quản Lý Kho Hàng & Tồn Kho Thực Tế"
        desc="Theo dõi số lượng hàng tồn, giá bán niêm yết và mức cảnh báo nhập hàng."
        action={
          <Link
            to="/catalog"
            className={`${btnGhost} text-sky-400 hover:text-sky-300 flex items-center gap-1.5`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Mở Trang Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tổng Mã Sản Phẩm
            </div>
            <div className="text-xl font-black font-mono text-slate-100 mt-1">
              {products.length} SKU
            </div>
          </div>
          <Boxes className="w-6 h-6 text-sky-400" />
        </div>
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cảnh Báo Hết Hàng
            </div>
            <div className="text-xl font-black font-mono text-rose-400 mt-1">
              {products.filter((p) => p.stockCount <= 3).length} Mã Cần Nhập
            </div>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-400" />
        </div>
        <div className={`${card} p-4 flex items-center justify-between`}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Giá Trị Kho Hàng
            </div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              3.450.000.000₫
            </div>
          </div>
          <DollarSign className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      <div className={`${card} overflow-hidden`}>
        {/* Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên linh kiện, hãng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${input} pl-9`}
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-slate-400 mr-1">Bộ lọc:</span>
            {[
              { id: "all", label: "Tất cả" },
              { id: "low", label: "Sắp hết (<5)" },
              { id: "out", label: "Hết hàng" },
              { id: "in", label: "Còn hàng" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStock(f.id)}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  filterStock === f.id
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="p-12 text-center flex items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
            <span>Đang tải kho hàng...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto no-scrollbar">
            {filtered.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      prod.thumbnail_url ||
                      prod.image_url ||
                      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=200"
                    }
                    alt={prod.name}
                    className="w-12 h-12 object-contain rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 truncate">
                      {prod.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-bold text-sky-400">
                        {prod.brand || "CHÍNH HÃNG"}
                      </span>
                      <span>•</span>
                      <span>SKU: {prod.model_code || `SKU-${prod.id}`}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-right">
                    <div className="text-xs font-extrabold font-mono text-sky-400">
                      {money(prod.min_price || prod.base_price || prod.price)}
                    </div>
                    <Link
                      to={`/products/${prod.slug || prod.id}`}
                      className="text-[10px] text-slate-400 hover:text-sky-400 font-semibold"
                    >
                      Xem trang PDP →
                    </Link>
                  </div>

                  {/* Quản lý số lượng tồn */}
                  <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => adjustStock(prod.id, -1)}
                      className="w-6 h-6 rounded-lg bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-slate-100">
                      {prod.stockCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustStock(prod.id, 1)}
                      className="w-6 h-6 rounded-lg bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>

                  <Pill
                    tone={
                      prod.stockCount <= 0
                        ? "red"
                        : prod.stockCount <= 3
                          ? "amber"
                          : "green"
                    }
                  >
                    {prod.stockCount <= 0
                      ? "HẾT HÀNG"
                      : prod.stockCount <= 3
                        ? "SẮP HẾT"
                        : "CÒN HÀNG"}
                  </Pill>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 4: CHIẾN DỊCH VOUCHER & KHUYẾN MÃI (PROMOTION ENGINE)                  */
/* -------------------------------------------------------------------------- */
function VoucherPromotionPanel() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [discountVal, setDiscountVal] = useState("500000");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getCoupons();
        const list = Array.isArray(res) ? res : res.data || [];
        setVouchers(list);
      } catch (err) {
        console.warn("Lỗi tải voucher:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const generateRandomCode = () => {
    const prefixes = ["TECH", "GAMING", "RTX", "VIP", "SUPER"];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    setCode(`${p}${num}`);
  };

  return (
    <div className="space-y-4">
      <Head
        title="Quản Lý Chiến Dịch Voucher &amp; Mã Giảm Giá"
        desc="Tạo mã voucher mới áp dụng tự động tại trang Checkout cho khách hàng."
      />

      {/* Form Tạo Voucher */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!code.trim()) return;
          const newVoucher = {
            id: Date.now(),
            code: code.trim().toUpperCase(),
            description: desc.trim() || "Ưu đãi chiến dịch công nghệ 2026",
            discount_type: "fixed",
            discount_value: Number(discountVal) || 500000,
            is_active: true,
          };
          setVouchers((prev) => [newVoucher, ...prev]);
          setCode("");
          setDesc("");
        }}
        className={`${card} p-5 space-y-3`}
      >
        <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TicketPercent className="w-4 h-4 text-sky-400" />
            <span>Tạo Mã Giảm Giá Mới</span>
          </span>
          <button
            type="button"
            onClick={generateRandomCode}
            className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🎲 Sinh mã tự động</span>
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className={`${input} font-mono uppercase font-black`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MÃ VOUCHER (VD: TECH2026)"
            required
          />
          <input
            className={input}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mô tả ưu đãi (VD: Giảm 500K đơn PC...)"
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              className={`${input} font-mono`}
              value={discountVal}
              onChange={(e) => setDiscountVal(e.target.value)}
              placeholder="Số tiền giảm (VNĐ)"
              required
            />
            <button
              type="submit"
              className={`${btnPrimary} shrink-0 flex items-center gap-1`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Mã</span>
            </button>
          </div>
        </div>
      </form>

      {/* Danh sách voucher */}
      <div className={`${card} divide-y divide-slate-800`}>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Đang tải danh sách voucher...
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Chưa có voucher nào.
          </div>
        ) : (
          vouchers.map((v) => (
            <div
              key={v.code || v.id}
              className="p-4 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="font-mono text-xs font-black px-3 py-1.5 rounded-xl border border-dashed border-sky-400 text-sky-400 bg-sky-500/10 shrink-0">
                  {v.code}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-100">
                    {v.description || "Ưu đãi Techshop"}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Giảm{" "}
                    {v.discount_type === "percent"
                      ? `${v.discount_value}%`
                      : money(v.discount_value)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setVouchers((prev) =>
                      prev.map((item) =>
                        item.code === v.code
                          ? { ...item, is_active: !item.is_active }
                          : item,
                      ),
                    )
                  }
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    v.is_active !== false ? "bg-sky-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 left-1 transition-transform ${
                      v.is_active !== false ? "translate-x-4" : ""
                    }`}
                  />
                </button>
                <Pill tone={v.is_active !== false ? "green" : "slate"}>
                  {v.is_active !== false ? "ĐANG CHẠY" : "TẠM TẮT"}
                </Pill>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 5: LỊCH TRỰC NHÂN SỰ & HIỆU SUẤT SLA (OPERATIONS ROSTER)               */
/* -------------------------------------------------------------------------- */
const STAFF_LIST = [
  "Phạm Đức Long",
  "Ngô Bảo Châu",
  "Trịnh Mai Anh",
  "Đỗ Quốc Việt",
];
const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const SHIFTS = [
  "Nghỉ",
  "Ca Sáng (8h-12h)",
  "Ca Chiều (13h-17h)",
  "Ca Tối (18h-22h)",
];
const DUTIES = [
  "Live Chat 24/7",
  "Kiểm Đơn Hỏa Tốc",
  "Đóng Gói Kho",
  "Hỗ Trợ Bảo Hành",
];

function StaffOperationsPanel() {
  const [grid, setGrid] = useState(() =>
    STAFF_LIST.map((_, r) => DAYS.map((_, c) => (r + c + 1) % 4)),
  );

  const cycleShift = (r, c) => {
    setGrid((prev) =>
      prev.map((row, ri) =>
        ri === r ? row.map((val, ci) => (ci === c ? (val + 1) % 4 : val)) : row,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <Head
        title="Lịch Phân Công Ca Trực & Hiệu Suất SLA"
        desc="Nhấn trực tiếp vào từng ô để đổi ca trực. Giám sát thời gian phản hồi dưới 2 phút."
      />

      {/* Bảng phân ca trực */}
      <div className={`${card} overflow-x-auto p-4`}>
        <div className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-3">
          Phân Ca Tuần 42/2026:
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-400 text-left border-b border-slate-800">
              <th className="p-2.5 font-bold">Nhân Viên</th>
              <th className="p-2.5 font-bold">Nhiệm Vụ</th>
              {DAYS.map((d) => (
                <th key={d} className="p-2.5 font-bold text-center">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {STAFF_LIST.map((staffName, r) => (
              <tr key={staffName} className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-slate-100 whitespace-nowrap">
                  {staffName}
                </td>
                <td className="p-2.5 text-sky-400 font-semibold whitespace-nowrap">
                  {DUTIES[r % DUTIES.length]}
                </td>
                {grid[r].map((v, c) => (
                  <td key={c} className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => cycleShift(r, c)}
                      className={`w-full py-1.5 px-2 rounded-lg font-bold text-[10px] cursor-pointer transition ${
                        v === 0
                          ? "bg-slate-950 text-slate-500"
                          : v === 1
                            ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            : v === 2
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {v === 0
                        ? "—"
                        : v === 1
                          ? "Sáng"
                          : v === 2
                            ? "Chiều"
                            : "Tối"}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hiệu suất SLA */}
      <div className={`${card} p-5 space-y-3`}>
        <div className="text-xs font-bold text-slate-100 uppercase tracking-wider pb-2 border-b border-slate-800">
          Hiệu Suất Xử Lý Đúng Hạn (SLA Tháng 10):
        </div>
        <div className="grid sm:grid-cols-4 gap-4 text-xs">
          {[
            { name: "Phạm Đức Long", handled: "142 Đơn", sla: 98.4 },
            { name: "Ngô Bảo Châu", handled: "118 Đơn", sla: 96.2 },
            { name: "Trịnh Mai Anh", handled: "164 Đơn", sla: 99.1 },
            { name: "Đỗ Quốc Việt", handled: "95 Đơn", sla: 94.5 },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5"
            >
              <div className="font-bold text-slate-100">{item.name}</div>
              <div className="text-slate-400 text-[11px]">{item.handled}</div>
              <div className="flex justify-between items-center pt-1 font-mono">
                <span className="text-[10px] text-slate-500">SLA:</span>
                <span className="font-bold text-emerald-400">{item.sla}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB 6: QUẢN TRỊ TÀI KHOẢN & BẢO MẬT (ADMIN CONTROL)                        */
/* -------------------------------------------------------------------------- */
function AdminSecurityPanel() {
  const [accounts, setAccounts] = useState([
    {
      name: "Nguyễn Thành Nam",
      email: "admin@techshop.vn",
      role: "admin",
      active: true,
    },
    {
      name: "Trần Văn Hoàng",
      email: "manager@techshop.vn",
      role: "manager",
      active: true,
    },
    {
      name: "Phạm Đức Long",
      email: "staff@techshop.vn",
      role: "staff",
      active: true,
    },
    {
      name: "Tú Nguyễn",
      email: "customer@gmail.com",
      role: "customer",
      active: true,
    },
  ]);

  return (
    <div className="space-y-6">
      <Head
        title="Quản Lý Tài Khoản & Nhật Ký Kiểm Toán"
        desc="Kiểm tra trạng thái tài khoản nội bộ và nhật ký an toàn thông tin."
      />

      <div className={`${card} p-5 space-y-4`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Tài Khoản Phân Quyền Trong Hệ Thống:
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            4 Tài khoản
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {accounts.map((acc) => (
            <div
              key={acc.email}
              className="py-3 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold flex items-center justify-center">
                  {acc.name[0]}
                </div>
                <div>
                  <div className="font-bold text-slate-100">{acc.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {acc.email}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Pill
                  tone={
                    acc.role === "admin"
                      ? "red"
                      : acc.role === "manager"
                        ? "amber"
                        : acc.role === "staff"
                          ? "sky"
                          : "green"
                  }
                >
                  {ROLES[acc.role]?.label || acc.role}
                </Pill>
                <button
                  type="button"
                  onClick={() =>
                    setAccounts((prev) =>
                      prev.map((x) =>
                        x.email === acc.email ? { ...x, active: !x.active } : x,
                      ),
                    )
                  }
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    acc.active
                      ? "text-emerald-400 hover:bg-emerald-500/10"
                      : "text-slate-500"
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN DASHBOARD COMPONENT                                                   */
/* -------------------------------------------------------------------------- */
export default function DashboardView() {
  const { user, setUser } = useAuth();
  const [currentRole, setCurrentRole] = useState(user?.role || "admin");
  const [activeTab, setActiveTab] = useState("overview");

  const NAV_ITEMS = [
    { id: "overview", label: "Tổng Quan & Doanh Thu", icon: BarChart3 },
    { id: "orders", label: "Xử Lý Đơn Hàng 2H", icon: ClipboardList },
    { id: "inventory", label: "Kho Linh Kiện & Tồn Kho", icon: Boxes },
    { id: "vouchers", label: "Chiến Dịch Voucher", icon: TicketPercent },
    { id: "schedule", label: "Lịch Trực & Phân Công", icon: CalendarDays },
    { id: "security", label: "Tài Khoản & Bảo Mật", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ========================================================================= */}
        {/* 🌟 TOP HEADER COMMAND CENTER BAR (ĐỘ THÊM CỰC CHẤT) 🌟                     */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/25 shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-tight">
                  Trung Tâm Điều Hành Techshop OS
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cơ sở dữ liệu sản phẩm &amp; Đơn hàng VietQR tự động kết nối
                theo thời gian thực
              </p>
            </div>
          </div>

          {/* Action Links & Role Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-sm cursor-pointer active:scale-95"
            >
              <span>🏠</span>
              <span>Trang Chủ</span>
            </Link>

            <Link
              to="/catalog"
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 text-sky-400 border border-sky-500/30 transition shadow-sm cursor-pointer active:scale-95"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Xem Trang Catalog</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/build-pc"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700 transition shadow-sm cursor-pointer active:scale-95"
            >
              <span>🛠️</span>
              <span>Build PC</span>
            </Link>

            <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold pl-2">
                Vai trò:
              </span>
              <select
                value={currentRole}
                onChange={(e) => {
                  const r = e.target.value;
                  setCurrentRole(r);
                  if (setUser) {
                    setUser({
                      name: ROLES[r].name,
                      email: ROLES[r].email,
                      role: r,
                    });
                  }
                }}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-sky-400 outline-none cursor-pointer"
              >
                <option value="admin">Quản Trị Viên (Admin)</option>
                <option value="manager">Quản Lý Cửa Hàng (Manager)</option>
                <option value="staff">Nhân Viên CSKH (Staff)</option>
                <option value="customer">Khách Hàng VIP (Customer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 THẺ CHỈ SỐ KPI ĐIỀU HÀNH THỜI GIAN THỰC */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${card} p-5 space-y-1`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Doanh Thu Hôm Nay</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              68.990.000₫
            </div>
            <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% so với hôm qua
            </div>
          </div>

          <div className={`${card} p-5 space-y-1`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Đơn Hàng Chờ Xử Lý</span>
              <ClipboardList className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black font-mono text-sky-400 mt-1">
              12 Đơn Hàng
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              4 đơn giao hỏa tốc 2H
            </div>
          </div>

          <div className={`${card} p-5 space-y-1`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Cảnh Báo Tồn Kho</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black font-mono text-rose-400 mt-1">
              3 Sản Phẩm
            </div>
            <div className="text-[11px] text-rose-400 font-bold">
              RTX 4090, 7800X3D &lt; 3 món
            </div>
          </div>

          <div className={`${card} p-5 space-y-1`}>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span>Tỷ Lệ SLA Đúng Hẹn</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
              99.4%
            </div>
            <div className="text-[11px] text-indigo-400 font-bold">
              Thời gian giao TB: 48 phút
            </div>
          </div>
        </div>

        {/* Dashboard Grid: Sidebar Tab Nav on Left, Active Tab on Right */}
        <div className="grid lg:grid-cols-[250px_1fr] gap-6 items-start">
          {/* Aside Navigation */}
          <aside className={`${card} p-4 lg:sticky lg:top-24 space-y-3`}>
            <div className="flex items-center gap-3 p-2 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {ROLES[currentRole]?.name[0]}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-100 truncate">
                  {ROLES[currentRole]?.name}
                </div>
                <div className="text-[10px] font-bold text-sky-400 truncate">
                  {ROLES[currentRole]?.label.split(" ")[0]}
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl text-xs font-bold transition cursor-pointer text-left ${
                      isActive
                        ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20"
                        : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/80"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Links to other pages */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-3 tracking-wider">
                Lối Tắt Chuyển Trang
              </div>
              <Link
                to="/"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-left"
              >
                <span>🏠</span>
                <span>Về Trang Chủ</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-60" />
              </Link>
              <Link
                to="/catalog"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/25 transition cursor-pointer text-left"
              >
                <LayoutGrid className="w-4 h-4 shrink-0" />
                <span>Xem Trang Catalog</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-70" />
              </Link>
              <Link
                to="/build-pc"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-800 transition cursor-pointer text-left"
              >
                <span>🛠️</span>
                <span>Xây Dựng Cấu Hình PC</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-60" />
              </Link>
              <Link
                to="/manager/products"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition cursor-pointer text-left"
              >
                <Package className="w-4 h-4 shrink-0" />
                <span>Quản Lý Sản Phẩm (Manager)</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-70" />
              </Link>
              <Link
                to="/admin"
                className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 transition cursor-pointer text-left"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Quản Trị Hệ Thống (Admin)</span>
                <ArrowUpRight className="w-3.5 h-3.5 ml-auto opacity-70" />
              </Link>
            </div>
          </aside>

          {/* Active Content Panel */}
          <section className="min-w-0">
            {activeTab === "overview" && <OverviewAnalyticsPanel />}
            {activeTab === "orders" && <OrderManagementPanel />}
            {activeTab === "inventory" && <InventoryManagementPanel />}
            {activeTab === "vouchers" && <VoucherPromotionPanel />}
            {activeTab === "schedule" && <StaffOperationsPanel />}
            {activeTab === "security" && <AdminSecurityPanel />}
          </section>
        </div>
      </div>
    </div>
  );
}
