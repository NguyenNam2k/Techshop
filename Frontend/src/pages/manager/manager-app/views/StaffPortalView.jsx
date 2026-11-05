import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Cpu, Sun, Moon, LogOut, Search, Bell, CheckCircle2, Truck, FileText,
  Package, RotateCcw, Star, CalendarCheck, ClipboardList, Printer,
  MapPin, Phone, User, ShieldCheck, AlertTriangle, Clock, ChevronRight,
  X, Check, QrCode, CreditCard, Eye, RefreshCw, MoreVertical, Ban, Menu,
  ArrowRight, MessageSquare, Send, Sparkles, CheckCheck, Trash2, Edit3, CornerDownRight,
  Headphones, MessageCircle, Paperclip, Smile, Info, ExternalLink, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  fetchStaffPortalData,
  updateOrderStatus,
  updateReturnStatus,
  replyToReview,
  deleteReviewReply,
  updateReviewStatus,
  updateStaffTask,
  subscribeStaffEvents
} from '../../../../services/staffPortalApi';

const formatVND = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`;

/* ============================================================================
   SEMANTIC BADGES & HELPERS (DARK & LIGHT THEME)
   ============================================================================ */
export function StatusBadge({ variant = 'amber', children, isDark, className = '' }) {
  const styles = {
    amber: isDark
      ? 'bg-[#451a03] text-[#fbbf24] border border-[#fbbf24]/30'
      : 'bg-[#fffbeb] text-[#d97706] border border-[#d97706]/25',
    cyan: isDark
      ? 'bg-[#083344] text-[#22d3ee] border border-[#06b6d4]/30'
      : 'bg-[#ecfeff] text-[#0891b2] border border-[#0891b2]/25',
    sky: isDark
      ? 'bg-[#082f49] text-[#38bdf8] border border-[#38bdf8]/30'
      : 'bg-[#f0f9ff] text-[#0284c7] border border-[#0284c7]/25',
    emerald: isDark
      ? 'bg-[#064e3b] text-[#34d399] border border-[#34d399]/30'
      : 'bg-[#ecfdf5] text-[#059669] border border-[#059669]/25',
    rose: isDark
      ? 'bg-[#4c0519] text-[#fb7185] border border-[#fb7185]/30'
      : 'bg-[#fff1f2] text-[#e11d48] border border-[#e11d48]/25',
    violet: isDark
      ? 'bg-[#2e1065] text-[#c4b5fd] border border-[#8b5cf6]/30'
      : 'bg-[#f5f3ff] text-[#7c3aed] border border-[#7c3aed]/25',
    slate: isDark
      ? 'bg-[#1e293b] text-[#94a3b8] border border-[#475569]/40'
      : 'bg-[#f1f5f9] text-[#475569] border border-[#cbd5e1]'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tracking-tight whitespace-nowrap transition-colors duration-200 ${
        styles[variant] || styles.amber
      } ${className}`}
    >
      {children}
    </span>
  );
}

const SHIPPING_STATUS_META = {
  pending: {
    label: 'Chờ xác nhận',
    shortLabel: 'Chờ tiếp nhận',
    variant: 'amber',
    stepIndex: 0
  },
  processing: {
    label: 'Đang đóng gói',
    shortLabel: 'Đang đóng gói',
    variant: 'cyan',
    stepIndex: 1
  },
  shipping: {
    label: 'Đang giao hàng',
    shortLabel: 'Đang giao hàng',
    variant: 'sky',
    stepIndex: 2
  },
  delivered: {
    label: 'Hoàn tất',
    shortLabel: 'Giao thành công',
    variant: 'emerald',
    stepIndex: 3
  },
  cancelled: {
    label: 'Đã hủy',
    shortLabel: 'Đã hủy đơn',
    variant: 'slate',
    stepIndex: -1
  }
};

const PRIORITY_META = {
  low: { label: 'Tiêu chuẩn', variant: 'slate' },
  medium: { label: 'Bình thường', variant: 'sky' },
  high: { label: 'Ưu tiên cao', variant: 'amber' },
  urgent: { label: 'Khẩn cấp', variant: 'rose' }
};

const TASK_STATUS_META = {
  todo: { label: 'Cần làm', variant: 'slate' },
  in_progress: { label: 'Đang xử lý', variant: 'cyan' },
  completed: { label: 'Đã hoàn thành', variant: 'emerald' }
};

const RETURN_STATUS_META = {
  pending: { label: 'pending · Chờ duyệt', variant: 'amber' },
  approved: { label: 'approved · Đã duyệt đổi', variant: 'cyan' },
  rejected: { label: 'rejected · Từ chối', variant: 'rose' },
  refunded: { label: 'refunded · Đã hoàn tiền', variant: 'emerald' }
};

const REVIEW_STATUS_META = {
  pending: { label: 'pending · Chờ duyệt', variant: 'amber' },
  approved: { label: 'approved · Hiển thị', variant: 'emerald' },
  hidden: { label: 'hidden · Đã ẩn', variant: 'slate' }
};

const CANNED_REPLIES = [
  'Dạ Techshop xin chào anh/chị! Em là nhân viên CSKH, em có thể hỗ trợ gì cho mình ạ?',
  'Anh/chị vui lòng chụp hình rõ tem bảo hành hoặc số Serial (S/N) trên linh kiện giúp em nhé.',
  'Đơn hàng của anh/chị đang được chuẩn bị và dự kiến xuất kho trong chiều nay ạ.',
  'Bên em hỗ trợ chính sách 1 đổi 1 trong 30 ngày đầu tiên nếu sản phẩm phát sinh lỗi kỹ thuật.',
  'Em đã chuyển thông tin cho chuyên viên kỹ sư phần cứng để liên hệ hỗ trợ trực tiếp ngay ạ.'
];

const INITIAL_SUPPORT_TICKETS = [
  {
    ticket_id: 'TK-4821',
    customer_id: 9,
    customer_name: 'Nam Nguyen',
    customer_phone: '0988 123 456',
    customer_email: 'nguyenhuumanhnam2003@gmail.com',
    customer_address: 'Tòa Landmark 81, Vinhomes Central Park, Q.Bình Thạnh, TP.HCM',
    order_code: 'ORD-1793699444834-2452',
    order_amount: 22660000,
    category: 'tech_support',
    category_label: 'Hỗ trợ kỹ thuật & Lỗi linh kiện',
    priority: 'urgent',
    priority_label: 'Khẩn cấp',
    status: 'in_progress',
    assigned_staff: 'STF001 - Lê Văn Tú',
    created_at: '2026-11-05 14:15',
    internal_notes: 'Khách báo dàn máy không boot được nguồn sau khi lắp VGA RTX 4090. Đã hướng dẫn kiểm tra cáp nguồn 12VHPWR.',
    unread: 0,
    messages: [
      {
        id: 'msg-1',
        sender: 'customer',
        sender_name: 'Nam Nguyen',
        text: 'Chào Techshop, mình vừa nhận đơn hàng ORD-1793699444834-2452 hôm nay nhưng cắm nguồn thì quạt quay 2s rồi tắt ngúm, nhờ shop hỗ trợ kỹ thuật giúp mình với!',
        time: '14:15',
        date: 'Hôm nay'
      },
      {
        id: 'msg-2',
        sender: 'system',
        text: 'Hệ thống: Phiếu hỗ trợ #TK-4821 đã được ghi nhận tự động từ Techshop Support Bubble.',
        time: '14:15',
        date: 'Hôm nay'
      },
      {
        id: 'msg-3',
        sender: 'staff',
        sender_name: 'STF001 - Lê Văn Tú',
        text: 'Dạ chào anh Nam! Em là Tú bên bộ phận kỹ thuật Techshop. Anh cho em hỏi cấu hình hiện tại của anh đang dùng bo mạch chủ gì và nguồn bao nhiêu Watt ạ?',
        time: '14:18',
        date: 'Hôm nay'
      },
      {
        id: 'msg-4',
        sender: 'customer',
        sender_name: 'Nam Nguyen',
        text: 'Mình đang cắm trên bo mạch Asus ROG Strix Z790 và nguồn Corsair RM1000x vừa mua bên bạn đó ạ.',
        time: '14:20',
        date: 'Hôm nay'
      },
      {
        id: 'msg-5',
        sender: 'staff',
        sender_name: 'STF001 - Lê Văn Tú',
        text: 'Dạ anh kiểm tra giúp em cáp nguồn 12VHPWR cắm vào card VGA đã nghe tiếng "click" khớp hoàn toàn chưa ạ? Ngoài ra anh kiểm tra mã lỗi đèn LED Q-LED trên mainboard đang sáng ở đèn màu gì giúp em nhé!',
        time: '14:23',
        date: 'Hôm nay'
      }
    ]
  },
  {
    ticket_id: 'TK-3904',
    customer_id: 1,
    customer_name: 'Đặng Minh Thuận',
    customer_phone: '0908 123 456',
    customer_email: 'thuan.dang@techshop.vn',
    customer_address: '45 Nguyễn Thị Minh Khai, Phường Bến Nghé, Quận 1, TP.HCM',
    order_code: 'ORD-1792486301674-9946',
    order_amount: 79990000,
    category: 'warranty',
    category_label: 'Bảo hành & Đổi trả linh kiện',
    priority: 'high',
    priority_label: 'Ưu tiên cao',
    status: 'open',
    assigned_staff: null,
    created_at: '2026-11-05 13:40',
    internal_notes: 'Đơn hàng giá trị cao (>79tr). Cần tiếp nhận và kiểm tra kỹ tình trạng tem bảo hành.',
    unread: 1,
    messages: [
      {
        id: 'msg-201',
        sender: 'customer',
        sender_name: 'Đặng Minh Thuận',
        text: 'Em ơi cho anh hỏi thanh RAM Corsair Dominator Titanium DDR5 mua trong đơn này bị lỗi màn hình xanh dump liên tục, anh muốn gửi bảo hành đổi mới 1-1 thì mang ra chi nhánh nào gần Quận 1 nhất?',
        time: '13:40',
        date: 'Hôm nay'
      },
      {
        id: 'msg-202',
        sender: 'system',
        text: 'Hệ thống: Khách hàng gửi yêu cầu hỗ trợ bảo hành sản phẩm qua Support Bubble.',
        time: '13:40',
        date: 'Hôm nay'
      }
    ]
  },
  {
    ticket_id: 'TK-2815',
    customer_id: 2,
    customer_name: 'Hoàng Trung Kiên',
    customer_phone: '0987 654 321',
    customer_email: 'kien.hoang@gmail.com',
    customer_address: '128 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
    order_code: 'ORD-1792316522993-7427',
    order_amount: 23990000,
    category: 'pc_build',
    category_label: 'Tư vấn cấu hình PC Gaming',
    priority: 'medium',
    priority_label: 'Bình thường',
    status: 'closed',
    assigned_staff: 'STF001 - Lê Văn Tú',
    created_at: '2026-11-04 16:30',
    internal_notes: 'Đã tư vấn đổi nguồn từ 750W lên 850W để cân RTX 4070 Ti Super, khách rất hài lòng và đã chốt đơn.',
    unread: 0,
    messages: [
      {
        id: 'msg-301',
        sender: 'customer',
        sender_name: 'Hoàng Trung Kiên',
        text: 'Shop tư vấn giúp mình tản nhiệt nước AIO 360mm nào lắp vừa case Corsair 4000D Airflow mà không bị cấn RAM nhé.',
        time: '16:30',
        date: '04/11/2026'
      },
      {
        id: 'msg-302',
        sender: 'staff',
        sender_name: 'STF001 - Lê Văn Tú',
        text: 'Dạ chào anh Kiên! Với case Corsair 4000D Airflow, tản 360mm mình sẽ gắn ở mặt trước (Front intake). Khi gắn mặt trước thì hoàn toàn không lo bị cấn chiều cao tản nhiệt của RAM anh nhé!',
        time: '16:35',
        date: '04/11/2026'
      },
      {
        id: 'msg-303',
        sender: 'customer',
        sender_name: 'Hoàng Trung Kiên',
        text: 'Tuyệt vời, cảm ơn shop nhiều nhé! Mình sẽ đặt hàng theo hướng dẫn.',
        time: '16:42',
        date: '04/11/2026'
      },
      {
        id: 'msg-304',
        sender: 'system',
        text: 'Nhân viên STF001 đã đóng ticket #TK-2815 (Đã giải quyết tư vấn thành công).',
        time: '16:45',
        date: '04/11/2026'
      }
    ]
  },
  {
    ticket_id: 'TK-1740',
    customer_id: 3,
    customer_name: 'Ngô Đức Huy',
    customer_phone: '0905 123 987',
    customer_email: 'huy.ngo@gmail.com',
    customer_address: '72 Lê Duẩn, Quận Hải Châu, TP. Đà Nẵng',
    order_code: 'ORD-1792486283432-6029',
    order_amount: 20490000,
    category: 'order_consult',
    category_label: 'Tra cứu tiến độ & Giao hàng',
    priority: 'medium',
    priority_label: 'Bình thường',
    status: 'in_progress',
    assigned_staff: 'STF001 - Lê Văn Tú',
    created_at: '2026-11-05 11:10',
    internal_notes: 'Khách tại Đà Nẵng cần nhận hàng trước chiều thứ 6 để đi công tác.',
    unread: 0,
    messages: [
      {
        id: 'msg-401',
        sender: 'customer',
        sender_name: 'Ngô Đức Huy',
        text: 'Đơn hàng ORD-1792486283432-6029 của mình gửi đi Đà Nẵng đã bàn giao shipper chưa shop? Mình đang cần gấp để kịp lắp máy cho công ty.',
        time: '11:10',
        date: 'Hôm nay'
      },
      {
        id: 'msg-402',
        sender: 'staff',
        sender_name: 'STF001 - Lê Văn Tú',
        text: 'Dạ chào anh Huy! Đơn hàng của anh đã được bộ phận kho đóng gói và in phiếu xuất kho lúc 10:30 sáng nay. Shipper GHN Express đã nhận kiện và dự kiến phát hàng tới Đà Nẵng vào trưa mai ạ.',
        time: '11:15',
        date: 'Hôm nay'
      }
    ]
  }
];

/* ============================================================================
   MAIN EXPORT: TECHSHOP STAFF OPERATIONS PORTAL (1440PX HIGH-DENSITY DESKTOP)
   ============================================================================ */
export default function StaffPortalView({ embedded = false }) {
  const { user: authUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Active Sidebar Navigation Section ('orders' | 'returns' | 'reviews' | 'tasks')
  const [activeMenu, setActiveMenu] = useState('orders');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const handleSelectMenu = (m) => {
    setActiveMenu(m);
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Current Staff Profile & Schedule (Directly synced from Auth & Database)
  const [staffProfile, setStaffProfile] = useState(() => ({
    staff_id: authUser?.staff_id || authUser?.id || null,
    staff_code: authUser?.staff_code || '',
    full_name: authUser?.full_name || authUser?.name || '',
    avatar: authUser?.avatar || '',
    department: authUser?.department || '',
    role: authUser?.role || 'staff',
    schedule: {
      work_date: '',
      shift: '',
      shift_hours: ''
    }
  }));

  useEffect(() => {
    if (authUser) {
      setStaffProfile((prev) => ({
        ...prev,
        staff_id: authUser.staff_id || authUser.id || prev.staff_id,
        staff_code: authUser.staff_code || prev.staff_code,
        full_name: authUser.full_name || authUser.name || prev.full_name,
        avatar: authUser.avatar || prev.avatar,
        department: authUser.department || prev.department,
        role: authUser.role || prev.role
      }));
    }
  }, [authUser]);

  // Relational Entities State (Dynamically linked to MySQL Database)
  const [orders, setOrders] = useState([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const drawerRef = useRef(null);

  const handleOrderRowClick = (orderCode) => {
    setSelectedOrderCode(orderCode);
    setDrawerOpen(true);
    setTimeout(() => {
      if (drawerRef.current) {
        drawerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checkedOrderCodes, setCheckedOrderCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  const [returnRequests, setReturnRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [staffTasks, setStaffTasks] = useState([]);

  // Support Tickets & Live Customer Chat (Use Case: Manage Support Ticket, Handle Ticket, Close Ticket, Chat with Customer)
  const [supportTickets, setSupportTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('techshop_support_tickets');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse techshop_support_tickets', e);
    }
    return INITIAL_SUPPORT_TICKETS;
  });
  const [selectedTicketId, setSelectedTicketId] = useState('TK-4821');
  const [chatInputText, setChatInputText] = useState('');
  const [ticketFilter, setTicketFilter] = useState('all'); // 'all' | 'open' | 'in_progress' | 'closed'
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [isTicketDrawerOpen, setIsTicketDrawerOpen] = useState(true);
  const [internalNoteDraft, setInternalNoteDraft] = useState('');
  const chatFeedBottomRef = useRef(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('techshop_support_tickets', JSON.stringify(supportTickets));
    } catch (e) {
      console.warn('Failed to store techshop_support_tickets', e);
    }
  }, [supportTickets]);

  // Listen for storage events (e.g. from customer SupportBubble)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'techshop_support_tickets' && e.newValue) {
        try {
          setSupportTickets(JSON.parse(e.newValue));
        } catch (err) {
          console.warn('Error reading updated storage tickets', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const selectedTicket = useMemo(() => {
    return supportTickets.find((t) => t.ticket_id === selectedTicketId) || supportTickets[0] || null;
  }, [supportTickets, selectedTicketId]);

  useEffect(() => {
    if (selectedTicket) {
      setInternalNoteDraft(selectedTicket.internal_notes || '');
    }
  }, [selectedTicket?.ticket_id]);

  useEffect(() => {
    if (activeMenu === 'tickets' && chatFeedBottomRef.current) {
      chatFeedBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMenu, selectedTicketId, selectedTicket?.messages?.length]);

  const filteredTicketList = useMemo(() => {
    return supportTickets.filter((tk) => {
      if (ticketFilter !== 'all' && tk.status !== ticketFilter) return false;
      if (ticketSearchQuery.trim()) {
        const q = ticketSearchQuery.toLowerCase();
        const matchCode = tk.ticket_id.toLowerCase().includes(q);
        const matchName = tk.customer_name.toLowerCase().includes(q);
        const matchPhone = tk.customer_phone.toLowerCase().includes(q);
        const matchOrder = (tk.order_code || '').toLowerCase().includes(q);
        const matchMsg = tk.messages.some((m) => (m.text || '').toLowerCase().includes(q));
        return matchCode || matchName || matchPhone || matchOrder || matchMsg;
      }
      return true;
    });
  }, [supportTickets, ticketFilter, ticketSearchQuery]);

  // Ticket Operations (Manage Support Ticket, Handle Ticket, Close Ticket, Chat with Customer)
  const handleAssignTicket = (ticketId) => {
    const staffName = staffProfile.full_name || staffProfile.staff_code || 'STF001 - Lê Văn Tú';
    setSupportTickets((prev) =>
      prev.map((tk) => {
        if (tk.ticket_id !== ticketId) return tk;
        return {
          ...tk,
          status: 'in_progress',
          assigned_staff: staffName,
          messages: [
            ...tk.messages,
            {
              id: `sys-${Date.now()}`,
              sender: 'system',
              text: `${staffName} đã tiếp nhận phiên hỗ trợ này.`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              date: 'Hôm nay'
            }
          ]
        };
      })
    );
    triggerToast(`Đã tiếp nhận xử lý ticket #${ticketId}`);
  };

  const handleCloseTicket = (ticketId) => {
    const staffName = staffProfile.full_name || staffProfile.staff_code || 'STF001 - Lê Văn Tú';
    setSupportTickets((prev) =>
      prev.map((tk) => {
        if (tk.ticket_id !== ticketId) return tk;
        return {
          ...tk,
          status: 'closed',
          messages: [
            ...tk.messages,
            {
              id: `sys-${Date.now()}`,
              sender: 'system',
              text: `Nhân viên ${staffName} đã đóng ticket #${ticketId} (Đã giải quyết xong).`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              date: 'Hôm nay'
            }
          ]
        };
      })
    );
    triggerToast(`Đã đóng và lưu trữ ticket #${ticketId}`);
  };

  const handleReopenTicket = (ticketId) => {
    setSupportTickets((prev) =>
      prev.map((tk) => {
        if (tk.ticket_id !== ticketId) return tk;
        return {
          ...tk,
          status: 'in_progress',
          messages: [
            ...tk.messages,
            {
              id: `sys-${Date.now()}`,
              sender: 'system',
              text: `Ticket #${ticketId} đã được mở lại để tiếp tục hỗ trợ.`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              date: 'Hôm nay'
            }
          ]
        };
      })
    );
    triggerToast(`Đã mở lại ticket #${ticketId}`);
  };

  const handleEscalateTicket = (ticketId) => {
    setSupportTickets((prev) =>
      prev.map((tk) => {
        if (tk.ticket_id !== ticketId) return tk;
        return {
          ...tk,
          priority: 'urgent',
          priority_label: 'Khẩn cấp',
          category: 'tech_support',
          category_label: 'Hỗ trợ kỹ thuật & Lỗi linh kiện',
          internal_notes: (tk.internal_notes ? tk.internal_notes + '\n' : '') + '[CHUYỂN TIẾP KỸ THUẬT PHẦN CỨNG]: Yêu cầu kỹ sư phần cứng hỗ trợ kiểm tra thiết bị.',
          messages: [
            ...tk.messages,
            {
              id: `sys-${Date.now()}`,
              sender: 'system',
              text: `Đã chuyển tiếp ticket #${ticketId} tới Phòng Kỹ Thuật Phần Cứng Techshop.`,
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              date: 'Hôm nay'
            }
          ]
        };
      })
    );
    triggerToast(`Đã chuyển tiếp ticket #${ticketId} sang Phòng Kỹ Thuật!`);
  };

  const handleSaveInternalNotes = (ticketId) => {
    setSupportTickets((prev) =>
      prev.map((tk) => (tk.ticket_id === ticketId ? { ...tk, internal_notes: internalNoteDraft } : tk))
    );
    triggerToast('Đã lưu ghi chú nội bộ thành công.');
  };

  const handleSendChatMessage = (msgText) => {
    const text = (msgText || chatInputText).trim();
    if (!text || !selectedTicket) return;
    setChatInputText('');

    const staffName = staffProfile.full_name || staffProfile.staff_code || 'STF001 (Bạn)';
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'staff',
      sender_name: staffName,
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      date: 'Hôm nay'
    };

    setSupportTickets((prev) =>
      prev.map((tk) => {
        if (tk.ticket_id !== selectedTicket.ticket_id) return tk;
        return {
          ...tk,
          status: tk.status === 'open' ? 'in_progress' : tk.status,
          messages: [...tk.messages, newMsg]
        };
      })
    );
  };

  const handleJumpToOrder = (orderCode) => {
    if (!orderCode) return;
    setActiveMenu('orders');
    setSelectedOrderCode(orderCode);
    setDrawerOpen(true);
    setStatusFilter('all');
    triggerToast(`Đang mở chi tiết đơn hàng ${orderCode}...`);
  };


  // Topbar UI state
  const [notifOpen, setNotifOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [pickSlipModalOrder, setPickSlipModalOrder] = useState(null);

  // Staff Cancel / Reject Order Modal (`Cancel Order <<include>> Reject Reason`)
  const [cancelOrderModal, setCancelOrderModal] = useState(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState('');
  const [rejectReasonCustom, setRejectReasonCustom] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  const REJECT_REASONS = [
    { id: 'out_of_stock', label: 'Hết hàng trong kho (Out of stock)' },
    { id: 'discontinued', label: 'Sản phẩm đã ngừng kinh doanh (Discontinued)' },
    { id: 'unreachable', label: 'Không thể liên lạc khách hàng để xác nhận đơn COD' },
    { id: 'customer_request', label: 'Khách hàng liên hệ qua Chat / Hotline nhờ hủy đơn' },
    { id: 'pricing_error', label: 'Lỗi thông tin giá hoặc cấu hình kỹ thuật sản phẩm' }
  ];

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  const fetchDatabaseData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchStaffPortalData();
      if (data.orders) {
        setOrders(data.orders);
        setSelectedOrderCode((current) => current && data.orders.some((order) => order.order_code === current)
          ? current
          : data.orders[0]?.order_code || null);
        setDrawerOpen(Boolean(data.orders.length));
      }
      if (data.returnRequests) setReturnRequests(data.returnRequests);
      if (data.reviews) setReviews(data.reviews);
      if (data.staffTasks) setStaffTasks(data.staffTasks);
      if (data.staffProfile) setStaffProfile((prev) => ({ ...prev, ...data.staffProfile }));
    } catch (err) {
      console.error('Staff Portal data API failed:', err);
      triggerToast('Không thể đồng bộ dữ liệu Staff Portal.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeStaffEvents((type, payload) => {
      const code = payload.orderCode || 'Đơn hàng';
      let status = 'Đơn hàng mới';
      let variant = 'emerald';
      let text = `Có cập nhật mới cho ${code}.`;

      if (type === 'order.cancelled') {
        status = 'Khách đã hủy đơn';
        variant = 'rose';
        text = `Khách vừa hủy ${code}: ${payload.reason || 'Không còn nhu cầu'}.`;
      } else if (type === 'order.customer_decision') {
        status = 'Khách đã phản hồi';
        variant = payload.decision === 'received' ? 'emerald' : 'amber';
        text = `Khách đã chọn ${payload.decision === 'received' ? 'đã nhận hàng' : 'yêu cầu trả hàng'} cho ${code}.`;
      }

      setLiveNotifications((prev) => [
        {
          id: `${type}-${code}-${Date.now()}`,
          code,
          variant,
          status,
          text
        },
        ...prev
      ].slice(0, 5));
      triggerToast(
        type === 'order.cancelled'
          ? `⚠️ Khách hàng vừa hủy đơn ${code}!`
          : `Realtime: đã nhận cập nhật ${code}`
      );
      fetchDatabaseData();
    });
    return unsubscribe;
  }, []);

  const handleRefresh = () => {
    fetchDatabaseData();
    triggerToast('Đang đồng bộ dữ liệu thực tế từ MySQL Database...');
  };

  // Strict Dual-Theme Palette Tokens from Specification:
  // Dark Mode: #0b0f19 background, #1e293b card surfaces, #334155 borders, #f8fafc text
  // Light Mode: #f8fafc background, #ffffff pure white card surfaces, #e2e8f0 borders, #0f172a text
  const t = {
    canvasBg: isDark ? 'bg-[#0b0f19]' : 'bg-[#f8fafc]',
    surfaceCard: isDark
      ? 'bg-[#131b2e] border border-[#1e293b] text-[#f1f5f9]'
      : 'bg-[#ffffff] border border-[#e2e8f0] text-[#0f172a] shadow-xs',
    sidebarBg: isDark ? 'bg-[#0b0f19]' : 'bg-[#ffffff]',
    headerBg: isDark
      ? 'bg-[#0b0f19]/95 border-b border-[#1e293b]'
      : 'bg-[#ffffff]/95 border-b border-[#e2e8f0]',
    subtleSurface: isDark ? 'bg-[#0b0f19] border-[#1e293b]' : 'bg-[#f8fafc] border-[#e2e8f0]',
    tableHeaderBg: isDark ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]',
    textPrimary: isDark ? 'text-[#f1f5f9]' : 'text-[#0f172a]',
    textMuted: isDark ? 'text-[#94a3b8]' : 'text-[#64748b]',
    borderColor: isDark ? 'border-[#1e293b]' : 'border-[#e2e8f0]',
    divideColor: isDark ? 'divide-[#1e293b]' : 'divide-[#e2e8f0]',
    inputStyle: isDark
      ? 'bg-[#131b2e] border-[#1e293b] text-[#f1f5f9] placeholder-[#64748b] focus:border-[#06b6d4]'
      : 'bg-[#ffffff] border-[#e2e8f0] text-[#0f172a] placeholder-[#94a3b8] focus:border-[#0891b2]',
    brandGradient: isDark
      ? 'bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]'
      : 'bg-gradient-to-r from-[#0891b2] to-[#7c3aed]',
    brandAccentText: isDark ? 'text-[#22d3ee]' : 'text-[#0891b2]',
    rowHover: isDark ? 'hover:bg-[#1a243b]' : 'hover:bg-[#f8fafc]',
    rowActive: isDark ? 'bg-[#083344] ring-1 ring-[#06b6d4]/50' : 'bg-[#ecfeff] ring-1 ring-[#0891b2]/40'
  };

  // Live KPI Metric Calculations (Direct from dynamic database entities)
  const kpiPendingOrders = orders.filter((o) => o.shipping_status === 'pending').length;
  const kpiProcessingOrders = orders.filter((o) => o.shipping_status === 'processing').length;
  const kpiShippingOrders = orders.filter((o) => o.shipping_status === 'shipping').length;
  const kpiDeliveredOrders = orders.filter((o) => o.shipping_status === 'delivered').length;
  const kpiPendingReturns = returnRequests.filter((r) => r.status === 'pending').length;
  const kpiCompletedTasks = staffTasks.filter((tsk) => tsk.status === 'completed').length;
  const kpiTotalTasks = staffTasks.length;

  // Filtered orders for Main Data Table
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter !== 'all' && ord.shipping_status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = ord.order_code.toLowerCase().includes(q);
        const matchName = String(ord.recipient_name || '').toLowerCase().includes(q);
        const matchPhone = String(ord.recipient_phone || '').toLowerCase().includes(q);
        const matchSku = ord.order_items.some(
          (it) =>
            String(it.sku || '').toLowerCase().includes(q) ||
            String(it.product_name || '').toLowerCase().includes(q)
        );
        return matchCode || matchName || matchPhone || matchSku;
      }
      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.order_code === selectedOrderCode) || orders[0],
    [orders, selectedOrderCode]
  );
  const notifications = useMemo(
    () => [
      ...liveNotifications,
      ...orders
        .filter((order) => order.shipping_status === 'pending' && order.payment_status !== 'refunded')
        .map((order) => ({
          id: `order-${order.order_code}`,
          code: order.order_code,
          variant: 'emerald',
          status: 'Đã thanh toán',
          text: `${order.recipient_name} đã thanh toán ${formatVND(order.final_amount)}. Cần tiếp nhận và đóng gói.`
        })),
      ...returnRequests
        .filter((request) => request.status === 'pending')
        .map((request) => ({
          id: `return-${request.return_id}`,
          code: request.return_id,
          variant: 'rose',
          status: 'Đổi trả chờ duyệt',
          text: `Yêu cầu đổi trả mới cho đơn ${request.order_id}.`
        }))
    ].slice(0, 3),
    [orders, returnRequests, liveNotifications]
  );
  const taskManager = staffTasks.find((task) => task.manager_name || task.manager_code) || {};

  // Dynamic filtered return requests
  const filteredReturns = useMemo(() => {
    return returnRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(r.return_id || '').toLowerCase().includes(q) ||
          String(r.order_id || '').toLowerCase().includes(q) ||
          String(r.customer_name || '').toLowerCase().includes(q) ||
          String(r.customer_phone || '').toLowerCase().includes(q) ||
          String(r.product_name || '').toLowerCase().includes(q) ||
          String(r.reason || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [returnRequests, statusFilter, searchQuery]);

  // Dynamic filtered reviews (Customer Service Replies & Feedback)
  const filteredReviews = useMemo(() => {
    return reviews.filter((rv) => {
      if (statusFilter === 'unreplied' && (rv.staff_reply || rv.status === 'hidden')) return false;
      if (statusFilter === 'replied' && !rv.staff_reply) return false;
      if (statusFilter === 'needs_attention' && Number(rv.rating) > 3) return false;
      if (statusFilter === 'hidden' && rv.status !== 'hidden') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rv.review_id.toLowerCase().includes(q) ||
          rv.customer_name.toLowerCase().includes(q) ||
          rv.product_name.toLowerCase().includes(q) ||
          (rv.sku && rv.sku.toLowerCase().includes(q)) ||
          (rv.comment && rv.comment.toLowerCase().includes(q)) ||
          (rv.staff_reply && rv.staff_reply.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [reviews, statusFilter, searchQuery]);

  // Dynamic filtered tasks
  const filteredTasks = useMemo(() => {
    return staffTasks.filter((tsk) => {
      if (statusFilter === 'todo' && tsk.status === 'completed') return false;
      if (statusFilter === 'completed' && tsk.status !== 'completed') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tsk.task_id.toLowerCase().includes(q) ||
          tsk.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [staffTasks, statusFilter, searchQuery]);

  // Operational Fulfillment Workflow Handlers (`orders`)
  // 1. pending -> processing (assigns processed_by_staff_id = staffProfile.staff_code)
  const handleAcceptAndPack = async (orderCode) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === orderCode
          ? {
              ...o,
              shipping_status: 'processing',
              processed_by_staff_id: staffProfile.staff_code
            }
          : o
      )
    );
    try {
      await updateOrderStatus(orderCode, 'processing');
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    triggerToast(
      `Đã tiếp nhận đơn ${orderCode} · Gán nhân viên ${staffProfile.staff_code} -> Đang đóng gói (processing)`
    );
  };

  // 2. processing -> shipping (prints waybill & hands over to shipper)
  const handlePrintAndShip = async (orderCode) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === orderCode
          ? {
              ...o,
              shipping_status: 'shipping',
              pick_slip_printed: true,
              processed_by_staff_id: o.processed_by_staff_id || staffProfile.staff_code
            }
          : o
      )
    );
    try {
      await updateOrderStatus(orderCode, 'shipping');
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    triggerToast(`Đã xuất kho & bàn giao Shipper cho đơn ${orderCode} -> Đang giao (shipping)`);
  };

  // 3. shipping -> delivered (confirms delivery & marks COD as paid)
  const handleConfirmDelivered = async (orderCode) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === orderCode
          ? {
              ...o,
              shipping_status: 'delivered',
              payment_status: o.payment_method === 'cod' ? 'paid' : o.payment_status,
              processed_by_staff_id: o.processed_by_staff_id || staffProfile.staff_code
            }
          : o
      )
    );
    try {
      await updateOrderStatus(orderCode, 'delivered');
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    triggerToast(`Đã xác nhận giao thành công đơn ${orderCode} -> Hoàn tất (delivered)`);
  };

  // Open Reject / Cancel Order Modal
  const handleOpenCancelModal = (order) => {
    setCancelOrderModal(order);
    setRejectReasonPreset(REJECT_REASONS[0].label);
    setRejectReasonCustom('');
    setOpenActionDropdown(null);
  };

  // Confirm Reject / Cancel Order with Reject Reason
  const handleConfirmRejectOrder = async () => {
    if (!cancelOrderModal) return;
    const finalReason = (rejectReasonCustom.trim() || rejectReasonPreset).trim();
    if (!finalReason) {
      triggerToast('Vui lòng chọn hoặc nhập lý do từ chối đơn hàng');
      return;
    }
    setIsSubmittingReject(true);
    const orderCode = cancelOrderModal.order_code;
    const isPaid = cancelOrderModal.payment_status === 'paid';

    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === orderCode
          ? {
              ...o,
              shipping_status: 'cancelled',
              payment_status: isPaid ? 'refunded' : o.payment_status,
              cancel_request_reason: finalReason,
              cancel_requested_at: new Date().toISOString(),
              processed_by_staff_id: o.processed_by_staff_id || staffProfile.staff_code
            }
          : o
      )
    );

    try {
      await updateOrderStatus(orderCode, 'cancelled', finalReason);
      triggerToast(`Đã từ chối đơn hàng ${orderCode}. Lý do: ${finalReason}`);
    } catch (e) {
      console.warn('API sync warning:', e);
      triggerToast(`Lỗi đồng bộ API: ${e.message || 'Không thể hủy'}`);
    } finally {
      setIsSubmittingReject(false);
      setCancelOrderModal(null);
    }
  };

  // Advance status from Slide-over Right Drawer [Cập nhật trạng thái]
  const handleAdvanceOrderStatus = (order) => {
    if (!order) return;
    if (order.shipping_status === 'pending') {
      handleAcceptAndPack(order.order_code);
    } else if (order.shipping_status === 'processing') {
      handlePrintAndShip(order.order_code);
    } else if (order.shipping_status === 'shipping') {
      handleConfirmDelivered(order.order_code);
    } else {
      triggerToast(`Đơn hàng ${order.order_code} đang ở trạng thái ${order.shipping_status}`);
    }
  };

  // Print Warehouse Pick Slip (`[In phiếu xuất kho]`)
  const handlePrintWarehouseSlip = (order) => {
    if (!order) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === order.order_code ? { ...o, pick_slip_printed: true } : o
      )
    );
    setPickSlipModalOrder(order);
    triggerToast(`Đã tạo phiếu xuất kho cho đơn ${order.order_code}`);
  };

  // Kích hoạt in Phiếu Xuất Kho chuẩn xác 1 trang A4 duy nhất (loại bỏ hiện tượng nhảy 8 trang)
  const handlePrintPickSlip = () => {
    const slipEl = document.getElementById('printable-pick-slip');
    if (!slipEl || !pickSlipModalOrder) {
      window.print();
      return;
    }

    let iframe = document.getElementById('techgear-pick-slip-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'techgear-pick-slip-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    doc.write(`
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Phiếu Xuất Kho - ${pickSlipModalOrder.order_code}</title>
          ${styles}
          <style>
            @page {
              size: A4 portrait;
              margin: 5mm 8mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
            }
            #printable-pick-slip {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 4mm 6mm !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: avoid !important;
              break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div id="printable-pick-slip" class="${slipEl.className}">
            ${slipEl.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  // Checkbox selection handlers
  const handleToggleCheckOrder = (orderCode) => {
    setCheckedOrderCodes((prev) =>
      prev.includes(orderCode) ? prev.filter((c) => c !== orderCode) : [...prev, orderCode]
    );
  };

  const allVisibleChecked =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => checkedOrderCodes.includes(o.order_code));

  const handleToggleCheckAll = () => {
    const visibleCodes = filteredOrders.map((o) => o.order_code);
    if (allVisibleChecked) {
      setCheckedOrderCodes((prev) => prev.filter((c) => !visibleCodes.includes(c)));
    } else {
      setCheckedOrderCodes((prev) => Array.from(new Set([...prev, ...visibleCodes])));
    }
  };

  const handleBulkProcessSelected = () => {
    setOrders((prev) =>
      prev.map((o) => {
        if (!checkedOrderCodes.includes(o.order_code)) return o;
        if (o.shipping_status === 'pending') {
          return {
            ...o,
            shipping_status: 'processing',
            processed_by_staff_id: staffProfile.staff_code
          };
        }
        if (o.shipping_status === 'processing') {
          return {
            ...o,
            shipping_status: 'shipping',
            pick_slip_printed: true
          };
        }
        return o;
      })
    );
    triggerToast(`Đã xử lý hàng loạt ${checkedOrderCodes.length} đơn hàng đã chọn`);
    setCheckedOrderCodes([]);
  };

  // Return Requests handler (`return_requests`)
  const handleUpdateReturnStatus = async (returnId, nextStatus) => {
    setReturnRequests((prev) =>
      prev.map((r) => (r.return_id === returnId ? { ...r, status: nextStatus } : r))
    );
    const cleanId = String(returnId).replace(/[^0-9]/g, '');
    if (cleanId) {
      try {
        await updateReturnStatus(cleanId, nextStatus);
      } catch (e) {
        console.warn('Return API sync warning:', e);
      }
    }
    triggerToast(`Đã cập nhật yêu cầu ${returnId} -> ${nextStatus}`);
  };

  // Reviews CS Reply & Feedback Handlers (`reviews`)
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const QUICK_TEMPLATES = [
    {
      label: '5★ Cảm ơn & tri ân',
      text: 'Dạ TechShop chân thành cảm ơn bạn đã tin tưởng và ủng hộ sản phẩm chính hãng bên shop ạ! Chúc bạn có trải nghiệm tuyệt vời cùng sản phẩm!'
    },
    {
      label: '1-3★ Hỗ trợ bảo hành kỹ thuật',
      text: 'Dạ TechShop rất tiếc về trải nghiệm chưa trọn vẹn này. Bộ phận CSKH & Kỹ thuật sẽ liên hệ qua SĐT để hỗ trợ kiểm tra và hướng dẫn bảo hành ngay cho bạn ạ!'
    },
    {
      label: 'Đổi mới 1-đổi-1 30 ngày',
      text: 'Dạ sản phẩm được áp dụng chính sách 1 đổi 1 trong 30 ngày nếu phát sinh lỗi phần cứng từ nhà sản xuất. Bạn vui lòng liên hệ hotline/zalo CSKH để shop hỗ trợ đổi mới ngay nhé!'
    }
  ];

  const handleOpenReplyBox = (rv) => {
    setReplyingReviewId(rv.review_id);
    setReplyInputText(rv.staff_reply || '');
  };

  const handleCancelReply = () => {
    setReplyingReviewId(null);
    setReplyInputText('');
  };

  const handleSendReply = async (review) => {
    const trimmed = replyInputText.trim();
    if (!trimmed) {
      triggerToast('Vui lòng nhập nội dung phản hồi');
      return;
    }
    setIsSubmittingReply(true);
    const cleanId = String(review.review_id).replace(/[^0-9]/g, '');
    try {
      if (cleanId) {
        await replyToReview(cleanId, trimmed);
      }
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === review.review_id
            ? { ...r, staff_reply: trimmed, staff_replied_at: nowStr }
            : r
        )
      );
      setReplyingReviewId(null);
      setReplyInputText('');
      triggerToast(`Đã gửi phản hồi CSKH cho đánh giá ${review.review_id}`);
    } catch (err) {
      console.error('Error submitting staff reply:', err);
      triggerToast(err.message || 'Không thể gửi phản hồi lúc này');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (review) => {
    const cleanId = String(review.review_id).replace(/[^0-9]/g, '');
    try {
      if (cleanId) {
        await deleteReviewReply(cleanId);
      }
      setReviews((prev) =>
        prev.map((r) =>
          r.review_id === review.review_id
            ? { ...r, staff_reply: null, staff_replied_at: null }
            : r
        )
      );
      if (replyingReviewId === review.review_id) {
        setReplyingReviewId(null);
        setReplyInputText('');
      }
      triggerToast(`Đã thu hồi phản hồi cho đánh giá ${review.review_id}`);
    } catch (err) {
      console.error('Error deleting staff reply:', err);
      triggerToast('Không thể thu hồi phản hồi');
    }
  };

  const handleUpdateReviewStatus = async (reviewId, nextStatus) => {
    setReviews((prev) =>
      prev.map((rv) => (rv.review_id === reviewId ? { ...rv, status: nextStatus } : rv))
    );
    const cleanId = String(reviewId).replace(/[^0-9]/g, '');
    if (cleanId) {
      try {
        await updateReviewStatus(cleanId, nextStatus);
      } catch (e) {
        console.warn('Review API sync warning:', e);
      }
    }
    triggerToast(`Đã cập nhật đánh giá ${reviewId} -> ${nextStatus}`);
  };

  const handleToggleHideReview = async (review) => {
    const nextStatus = review.status === 'hidden' ? 'approved' : 'hidden';
    await handleUpdateReviewStatus(review.review_id, nextStatus);
  };

  // Staff Tasks handler (`staff_tasks`)
  const handleSetTaskStatus = async (taskId, nextStatus) => {
    const normalizedTaskId = String(taskId);
    setStaffTasks((prev) =>
      prev.map((tsk) => {
        return (String(tsk.task_id) === normalizedTaskId || String(tsk.id) === normalizedTaskId)
          ? { ...tsk, status: nextStatus }
          : tsk;
      })
    );
    const cleanId = normalizedTaskId.replace(/[^0-9]/g, '') || normalizedTaskId;
    if (cleanId) {
      try {
        await updateStaffTask(cleanId, nextStatus);
        triggerToast(`Đã cập nhật trạng thái nhiệm vụ #${cleanId}`);
      } catch (e) {
        console.warn('Task API sync warning:', e);
      }
    }
  };

  // Review counts for Customer Service Badges
  const unrepliedCount = useMemo(
    () => reviews.filter((r) => !r.staff_reply && r.status !== 'hidden').length,
    [reviews]
  );
  const repliedCount = useMemo(
    () => reviews.filter((r) => Boolean(r.staff_reply)).length,
    [reviews]
  );
  const attentionCount = useMemo(
    () => reviews.filter((r) => Number(r.rating) <= 3).length,
    [reviews]
  );
  const hiddenCount = useMemo(
    () => reviews.filter((r) => r.status === 'hidden').length,
    [reviews]
  );

  // Unhandled ticket counter for Support Ticket badge
  const unhandledTicketsCount = useMemo(
    () => supportTickets.filter((tk) => tk.status === 'open').length,
    [supportTickets]
  );

  // Navigation Links Configuration (Sidebar)
  const NAV_LINKS = [
    {
      key: 'orders',
      label: 'Xử lý đơn hàng',
      icon: ClipboardList,
      badge: kpiPendingOrders,
      badgeVariant: 'amber'
    },
    {
      key: 'returns',
      label: 'Yêu cầu đổi trả',
      icon: RotateCcw,
      badge: kpiPendingReturns,
      badgeVariant: 'rose'
    },
    {
      key: 'tickets',
      label: 'Ticket & Chat CSKH',
      icon: Headphones,
      badge: unhandledTicketsCount,
      badgeVariant: 'sky'
    },
    {
      key: 'reviews',
      label: 'Phản hồi đánh giá',
      icon: MessageSquare,
      badge: unrepliedCount,
      badgeVariant: 'violet'
    },
    {
      key: 'tasks',
      label: 'Nhiệm vụ & Ca trực',
      icon: CalendarCheck,
      badge: `${kpiCompletedTasks}/${kpiTotalTasks}`,
      badgeVariant: 'slate'
    }
  ];

  // Dynamic Status Filter Tabs Configuration per Active Section
  const ORDER_FILTER_TABS = [
    { key: 'all', label: 'Tất cả đơn', pillVariant: 'slate', count: orders.length },
    { key: 'pending', label: 'Chờ tiếp nhận', pillVariant: 'amber', count: kpiPendingOrders },
    { key: 'processing', label: 'Đang đóng gói', pillVariant: 'cyan', count: kpiProcessingOrders },
    { key: 'shipping', label: 'Đang giao hàng', pillVariant: 'sky', count: kpiShippingOrders },
    { key: 'delivered', label: 'Hoàn tất', pillVariant: 'emerald', count: kpiDeliveredOrders },
    { key: 'cancelled', label: 'Đã hủy', pillVariant: 'slate', count: orders.filter((o) => o.shipping_status === 'cancelled').length }
  ];

  const RETURN_FILTER_TABS = [
    { key: 'all', label: 'Tất cả yêu cầu', pillVariant: 'slate', count: returnRequests.length },
    { key: 'pending', label: 'Chờ xử lý', pillVariant: 'amber', count: returnRequests.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Đã duyệt đổi', pillVariant: 'cyan', count: returnRequests.filter((r) => r.status === 'approved').length },
    { key: 'refunded', label: 'Đã hoàn tiền', pillVariant: 'emerald', count: returnRequests.filter((r) => r.status === 'refunded').length },
    { key: 'rejected', label: 'Từ chối', pillVariant: 'rose', count: returnRequests.filter((r) => r.status === 'rejected').length }
  ];

  const TICKET_FILTER_TABS = [
    { key: 'all', label: 'Tất cả ticket', pillVariant: 'slate', count: supportTickets.length },
    { key: 'open', label: 'Chờ tiếp nhận', pillVariant: 'amber', count: supportTickets.filter((t) => t.status === 'open').length },
    { key: 'in_progress', label: 'Đang xử lý', pillVariant: 'cyan', count: supportTickets.filter((t) => t.status === 'in_progress').length },
    { key: 'closed', label: 'Đã giải quyết', pillVariant: 'emerald', count: supportTickets.filter((t) => t.status === 'closed').length }
  ];

  const REVIEW_FILTER_TABS = [
    { key: 'all', label: 'Tất cả đánh giá', pillVariant: 'slate', count: reviews.length },
    { key: 'unreplied', label: 'Chưa phản hồi', pillVariant: 'amber', count: unrepliedCount },
    { key: 'replied', label: 'Đã phản hồi', pillVariant: 'emerald', count: repliedCount },
    { key: 'needs_attention', label: 'Cần chú ý (1-3★)', pillVariant: 'rose', count: attentionCount },
    { key: 'hidden', label: 'Đã ẩn (vi phạm)', pillVariant: 'slate', count: hiddenCount }
  ];

  const TASK_FILTER_TABS = [
    { key: 'all', label: 'Tất cả nhiệm vụ', pillVariant: 'slate', count: staffTasks.length },
    { key: 'todo', label: 'Cần làm', pillVariant: 'amber', count: staffTasks.filter((t) => t.status !== 'completed').length },
    { key: 'completed', label: 'Đã hoàn thành', pillVariant: 'emerald', count: staffTasks.filter((t) => t.status === 'completed').length }
  ];

  const currentTabs = useMemo(() => {
    switch (activeMenu) {
      case 'returns':
        return RETURN_FILTER_TABS;
      case 'tickets':
        return TICKET_FILTER_TABS;
      case 'reviews':
        return REVIEW_FILTER_TABS;
      case 'tasks':
        return TASK_FILTER_TABS;
      case 'orders':
      default:
        return ORDER_FILTER_TABS;
    }
  }, [
    activeMenu,
    orders,
    returnRequests,
    supportTickets,
    reviews,
    staffTasks,
    kpiPendingOrders,
    kpiProcessingOrders,
    kpiShippingOrders,
    kpiDeliveredOrders,
    unrepliedCount,
    repliedCount,
    attentionCount,
    hiddenCount
  ]);

  const BREADCRUMB_MAP = {
    orders: 'Xử lý đơn hàng',
    returns: 'Yêu cầu đổi trả & Hoàn tiền',
    tickets: 'Quản lý Support Ticket & Chat CSKH',
    reviews: 'Phản hồi đánh giá khách hàng',
    tasks: 'Nhiệm vụ & Ca trực'
  };

  return (
    <div
      className={`${embedded ? "w-full rounded-2xl overflow-hidden" : "min-h-screen w-full"} flex flex-col lg:flex-row transition-colors duration-200 ${t.canvasBg} ${t.textPrimary}`}
      onClick={() => {
        if (openActionDropdown) setOpenActionDropdown(null);
      }}
    >
      {/* ======================================================================
          1. LEFT NAVIGATION SIDEBAR (240px Desktop Width)
         ====================================================================== */}
      <aside
        onMouseEnter={() => setIsSidebarOpen(true)}
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`shrink-0 flex flex-col select-none lg:h-[calc(100vh-53px)] lg:sticky lg:top-[53px] transition-all duration-300 ease-in-out overflow-hidden z-30 ${
          isSidebarOpen
            ? 'w-full lg:w-[250px] p-3 opacity-100 shadow-2xl'
            : 'w-0 min-w-0 max-w-0 p-0 opacity-0 pointer-events-none'
        } ${t.sidebarBg}`}
      >
        <div className="w-[226px] space-y-3 overflow-y-auto no-scrollbar flex-1">
          {/* Brand Logo: TechShop glowing CPU cyan-violet badge */}
          <div className="flex items-center gap-2 px-1 pt-0.5">
            <div
              className={`w-8 h-8 rounded-lg ${t.brandGradient} flex items-center justify-center text-white shrink-0 ${
                isDark
                  ? 'shadow-[0_0_12px_rgba(6,182,212,0.35)] ring-1 ring-[#06b6d4]/40'
                  : 'shadow-sm shadow-cyan-600/20'
              }`}
            >
              <Cpu className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight font-mono">
                  TECH<span className={t.brandAccentText}>SHOP</span>
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                    isDark
                      ? 'bg-[#1e293b] text-[#22d3ee] border border-[#334155]'
                      : 'bg-[#ecfeff] text-[#0891b2] border border-[#0891b2]/20'
                  }`}
                >
                  STAFF
                </span>
              </div>
              <p className={`text-[11px] font-medium truncate ${t.textMuted}`}>
                Staff Operations Portal
              </p>
            </div>
          </div>

          {/* Sidebar Navigation Links */}
          <div className="space-y-1">
            <div className={`px-2 text-[10px] font-mono font-bold uppercase tracking-wider ${t.textMuted}`}>
              Danh mục vận hành
            </div>
            <nav className="space-y-1">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleSelectMenu(item.key)}
                    className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg text-left transition-all cursor-pointer ${
                      isActive
                        ? `${t.brandGradient} text-white shadow-md`
                        : `${t.textPrimary} ${
                            isDark ? 'hover:bg-[#1e293b]' : 'hover:bg-[#f1f5f9]'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : t.brandAccentText
                        }`}
                      />
                      <span className="text-xs font-bold leading-snug whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                    <StatusBadge
                      variant={item.badgeVariant}
                      isDark={isDark}
                      className={
                        isActive ? '!bg-white/20 !text-white !border-white/30' : ''
                      }
                    >
                      {item.badge}
                    </StatusBadge>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Bar: Logout button (pinned at bottom of visible sidebar) */}
        <div className="pt-2.5 mt-auto shrink-0">
          <button
            type="button"
            onClick={logout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isDark
                ? 'bg-[#4c0519]/70 text-[#fb7185] border border-[#fb7185]/30 hover:bg-[#4c0519]'
                : 'bg-[#fff1f2] text-[#e11d48] border border-[#e11d48]/25 hover:bg-rose-100'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* ======================================================================
          2. MAIN WORKSPACE (TOP BAR HEADER + KPI CARDS + DATA TABLE + DRAWER)
         ====================================================================== */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* TOP BAR HEADER */}
        <header className={`sticky top-0 z-20 px-5 py-3 space-y-3 backdrop-blur-md ${t.headerBg}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Breadcrumb: Staff Portal > Fulfillment Center */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              {/* 3-Stripes Hamburger Menu Trigger (Hover to auto slide sidebar) */}
              <button
                type="button"
                onMouseEnter={() => setIsSidebarOpen(true)}
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className={`p-1.5 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'text-cyan-400 hover:text-white hover:bg-slate-800/80 active:bg-slate-800'
                    : 'text-cyan-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
                }`}
                title="Rê chuột hoặc nhấp để mở Danh mục vận hành"
              >
                <Menu className="w-5 h-5 stroke-[2.2]" />
              </button>
              <span className={t.textMuted}>Staff Portal</span>
              <ChevronRight className={`w-3.5 h-3.5 ${t.textMuted}`} />
              <span className="font-extrabold tracking-tight text-sm">
                {BREADCRUMB_MAP[activeMenu]}
              </span>
              
            </div>

            {/* Search Bar + Actions (Refresh button, Notifications bell — NO theme switch next to notification btn) */}
            <div className="flex items-center gap-2.5 flex-1 sm:flex-initial justify-end">
              {/* Quick search by order_code, recipient_phone, or customer name */}
              <div className="relative w-full sm:w-80 lg:w-96">
                <Search
                  className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${t.textMuted}`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeMenu === 'orders'
                      ? 'Tìm theo mã đơn (ORD-...), SĐT hoặc tên khách hàng...'
                      : activeMenu === 'returns'
                        ? 'Tìm theo mã RMA (RMA-...), mã đơn hàng, tên khách hàng, lý do...'
                        : activeMenu === 'reviews'
                          ? 'Tìm theo sản phẩm, tên khách, nội dung đánh giá hoặc phản hồi CSKH...'
                          : activeMenu === 'tickets'
                            ? 'Tìm theo mã ticket (#TK-...), tên khách, SĐT hoặc nội dung chat...'
                            : 'Tìm theo tiêu đề hoặc mã nhiệm vụ (TSK-...)...'
                  }
                  className={`w-full pl-8 pr-7 py-1.5 rounded-xl text-xs border outline-none transition ${t.inputStyle}`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t.textMuted} hover:opacity-80 cursor-pointer`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                title="Làm mới dữ liệu (Refresh)"
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isDark
                    ? 'bg-[#1e293b] border-[#334155] text-[#f8fafc] hover:border-[#06b6d4]'
                    : 'bg-[#ffffff] border-[#e2e8f0] text-[#0f172a] hover:border-[#0891b2]'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  title="Thông báo vận hành"
                  className={`relative p-2 rounded-xl border transition cursor-pointer ${
                    isDark
                      ? 'bg-[#1e293b] border-[#334155] text-[#f8fafc] hover:border-[#06b6d4]'
                      : 'bg-[#ffffff] border-[#e2e8f0] text-[#0f172a] hover:border-[#0891b2]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-80 rounded-xl p-3 z-40 shadow-2xl ${t.surfaceCard}`}
                  >
                    <div className={`flex items-center justify-between pb-2 mb-2 border-b ${t.borderColor}`}>
                      <span className="text-xs font-extrabold">Thông báo hệ thống ({notifications.length})</span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className={`text-[10px] ${t.textMuted} cursor-pointer`}
                      >
                        Đóng
                      </button>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={`p-2 rounded-lg border ${t.subtleSurface} ${t.borderColor}`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-mono font-bold ${t.brandAccentText}`}>{notification.code}</span>
                            <StatusBadge variant={notification.variant} isDark={isDark}>
                              {notification.status}
                            </StatusBadge>
                          </div>
                          <p className="mt-1">{notification.text}</p>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className={`p-2 ${t.textMuted}`}>Không có thông báo mới.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Filter Tabs Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {currentTabs.map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 border ${
                    active
                      ? `${t.brandGradient} text-white border-transparent shadow-xs`
                      : isDark
                        ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:text-[#f8fafc]'
                        : 'bg-[#ffffff] border-[#e2e8f0] text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <StatusBadge
                    variant={tab.pillVariant}
                    isDark={isDark}
                    className={
                      active ? '!bg-white/20 !text-white !border-white/30' : '!px-1.5 !py-0'
                    }
                  >
                    {tab.count}
                  </StatusBadge>
                </button>
              );
            })}
          </div>

          {/* Real-time Action Feedback Toast */}
          {toastMsg && (
            <div
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in ${
                isDark
                  ? 'bg-[#064e3b] text-[#34d399] border border-[#34d399]/30'
                  : 'bg-[#ecfdf5] text-[#059669] border border-[#059669]/30'
              }`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{toastMsg}</span>
              </span>
              <span className="text-[10px] font-mono opacity-80">MySQL Committed</span>
            </div>
          )}
        </header>

        {/* MAIN CONTENT BODY */}
        <main className="p-5 space-y-4 flex-1 flex flex-col">
          {/* ==================================================================
              3. KPI METRIC CARDS (GRID OF 4)
             ================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {/* Card 1: Chờ xác nhận */}
            <div
              onClick={() => {
                setActiveMenu('orders');
                setStatusFilter('pending');
              }}
              className={`${t.surfaceCard} rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] hover:border-amber-500/50 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-semibold ${t.textMuted}`}>
                  Đơn chờ tiếp nhận
                </span>
              </div>
              <div className="my-2 flex items-baseline justify-between gap-1">
                <span className="text-2xl font-black font-mono text-amber-500">
                  {kpiPendingOrders} <span className="text-xs font-normal text-amber-500/80">đơn</span>
                </span>
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Cần xử lý
                </span>
              </div>
              <div className={`pt-2 border-t ${t.borderColor} flex items-center justify-between text-[10px] ${t.textMuted}`}>
                <span>Chờ duyệt & in phiếu</span>              
              </div>
            </div>
            {/* Card 2: Đang đóng gói */}
            <div
              onClick={() => {
                setActiveMenu('orders');
                setStatusFilter('processing');
              }}
              className={`${t.surfaceCard} rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] hover:border-cyan-500/50 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-semibold ${t.textMuted}`}>
                  Đang đóng gói
                </span>               
              </div>
              <div className="my-2 flex items-baseline justify-between gap-1">
                <span className={`text-2xl font-black font-mono ${t.brandAccentText}`}>
                  {kpiProcessingOrders} <span className="text-xs font-normal opacity-80">đơn</span>
                </span>
                <span className={`text-[10px] font-bold ${t.brandAccentText} bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20`}>
                  Kho chuẩn bị
                </span>
              </div>
              <div className={`pt-2 border-t ${t.borderColor} flex items-center justify-between text-[10px] ${t.textMuted}`}>
                <span>Kho & In phiếu xuất</span>
              </div>
            </div>

            {/* Card 3: Yêu cầu đổi trả */}
            <div
              onClick={() => handleSelectMenu('returns')}
              className={`${t.surfaceCard} rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] hover:border-rose-500/50 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-semibold ${t.textMuted}`}>
                  Yêu cầu đổi trả
                </span>              
              </div>
              <div className="my-2 flex items-baseline justify-between gap-1">
                <span className="text-2xl font-black font-mono text-rose-500">
                  {kpiPendingReturns} <span className="text-xs font-normal text-rose-500/80">yêu cầu</span>
                </span>
                <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                  Chờ thẩm định
                </span>
              </div>
              <div className={`pt-2 border-t ${t.borderColor} flex items-center justify-between text-[10px] ${t.textMuted}`}>
                <span>Hoàn tiền & Hoàn kho</span>
              </div>
            </div>

            {/* Card 4: Nhiệm vụ trong ca */}
            <div
              onClick={() => handleSelectMenu('tasks')}
              className={`${t.surfaceCard} rounded-xl p-3.5 cursor-pointer transition-all hover:scale-[1.01] hover:border-violet-500/50 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={`text-xs font-semibold ${t.textMuted}`}>
                  Nhiệm vụ trong ca
                </span>
              </div>
              <div className="my-2 flex items-baseline justify-between gap-1">
                <span className={`text-2xl font-black font-mono ${isDark ? 'text-violet-300' : 'text-violet-600'}`}>
                  {kpiCompletedTasks}/{kpiTotalTasks || 1} <span className="text-xs font-normal opacity-80">xong</span>
                </span>
                <span className={`text-[10px] font-bold ${isDark ? 'text-violet-300 bg-violet-500/10 border-violet-500/20' : 'text-violet-600 bg-violet-50 border-violet-200'} px-1.5 py-0.5 rounded border`}>
                  {Math.round((kpiCompletedTasks / (kpiTotalTasks || 1)) * 100)}%
                </span>
              </div>
              <div className="pt-2 border-t border-transparent">
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${t.brandGradient}`}
                    style={{ width: `${Math.round((kpiCompletedTasks / (kpiTotalTasks || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================================
              4. MAIN DATA TABLE: ORDER FULFILLMENT CENTER + 5. SLIDE-OVER DRAWER
             ================================================================== */}
          {activeMenu === 'orders' && (
            <div className="flex-1 flex flex-col xl:flex-row gap-4 items-start relative">
              {/* MAIN DATA TABLE (`orders`) */}
              <div className={`${t.surfaceCard} rounded-xl overflow-hidden flex-1 min-w-0 w-full`}>
                {/* Table Header Bar */}
                <div
                  className={`px-4 py-3 border-b ${t.borderColor} flex flex-wrap items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2.5">
                    <h2 className={`text-sm font-extrabold ${t.textPrimary}`}>
                      Order Fulfillment Center 
                    </h2>
                    <span className={`text-xs font-mono ${t.textMuted}`}>
                      ({filteredOrders.length} đơn hàng)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {checkedOrderCodes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${t.brandAccentText}`}>
                          Đã chọn {checkedOrderCodes.length} đơn:
                        </span>
                        <button
                          type="button"
                          onClick={handleBulkProcessSelected}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white cursor-pointer ${t.brandGradient}`}
                        >
                          Xử lý hàng loạt ({checkedOrderCodes.length})
                        </button>
                      </div>
                    )}
                    {!drawerOpen && selectedOrder && (
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer flex items-center gap-1.5 ${
                          isDark
                            ? 'bg-[#0b0f19] border-[#334155] text-[#22d3ee]'
                            : 'bg-[#f8fafc] border-[#e2e8f0] text-[#0891b2]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mở Drawer ({selectedOrder.order_code})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* High-Density Relational Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr
                        className={`${t.tableHeaderBg} ${t.textMuted} text-[10px] font-mono uppercase border-b ${t.borderColor}`}
                      >
                        <th className="py-2.5 pl-3.5 pr-2 w-8">
                          <input
                            type="checkbox"
                            checked={allVisibleChecked}
                            onChange={handleToggleCheckAll}
                            className="w-3.5 h-3.5 rounded accent-[#06b6d4] cursor-pointer"
                            aria-label="Chọn tất cả đơn hàng"
                          />
                        </th>
                        <th className="py-2.5 px-2.5">Mã đơn</th>
                        <th className="py-2.5 px-2.5">Người nhận</th>
                        <th className="py-2.5 px-2.5">Thanh toán</th>
                        <th className="py-2.5 px-2.5 text-right">Tổng tiền</th>
                        <th className="py-2.5 px-2.5">Tiến độ vận chuyển</th>
                        <th className="py-2.5 pl-2.5 pr-3.5 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${t.divideColor} text-xs`}>
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={7} className={`py-10 text-center ${t.textMuted}`}>
                            Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại.
                          </td>
                        </tr>
                      )}
                      {filteredOrders.map((ord) => {
                        const isSelected =
                          selectedOrder?.order_code === ord.order_code && drawerOpen;
                        const isChecked = checkedOrderCodes.includes(ord.order_code);
                        const shipMeta =
                          SHIPPING_STATUS_META[ord.shipping_status] ||
                          SHIPPING_STATUS_META.pending;
                        const isVietQRPaid =
                          ord.payment_method === 'vietqr_banking' &&
                          ord.payment_status === 'paid';
                        const isRefunded = ord.payment_status === 'refunded';

                        return (
                          <tr
                            key={ord.order_code}
                            onClick={() => handleOrderRowClick(ord.order_code)}
                            className={`transition cursor-pointer ${isDark ? (isSelected ? "!bg-[#083344] ring-1 ring-[#06b6d4]/50" : "!bg-[#131b2e] hover:!bg-[#1a243b]") : (isSelected ? "!bg-[#ecfeff] ring-1 ring-[#0891b2]/40" : "!bg-[#ffffff] hover:!bg-slate-50")}`}
                          >
                            {/* 1. Checkbox */}
                            <td
                              className="py-3 pl-3.5 pr-2 align-middle"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCheckOrder(ord.order_code)}
                                className="w-3.5 h-3.5 rounded accent-[#06b6d4] cursor-pointer"
                                aria-label={`Chọn ${ord.order_code}`}
                              />
                            </td>

                            {/* 2. Mã đơn (order_code in monospace font) */}
                            <td className="py-3 px-2.5 align-middle whitespace-nowrap">
                              <div className={`font-mono font-extrabold text-xs ${t.brandAccentText}`}>
                                {ord.order_code}
                              </div>
                              <div className={`text-[10px] font-mono mt-0.5 flex items-center gap-1.5 ${t.textMuted}`}>
                                <span>{ord.created_at}</span>
                                {ord.processed_by_staff_id && (
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                      isDark
                                        ? 'bg-[#0b0f19] text-[#94a3b8] border border-[#334155]'
                                        : 'bg-[#f1f5f9] text-[#475569]'
                                    }`}
                                  >
                                    {ord.processed_by_staff_id}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* 3. Người nhận (recipient_name + recipient_phone) */}
                            <td className="py-3 px-2.5 align-middle">
                              <div className="font-bold text-xs leading-snug">
                                {ord.recipient_name}
                              </div>
                              <div className={`text-[11px] font-mono ${t.textMuted}`}>
                                {ord.recipient_phone}
                              </div>
                            </td>

                            {/* 4. Thanh toán (payment_method badge + payment_status: VietQR Paid [Xanh lá] vs COD Unpaid [Vàng]) */}
                            <td className="py-3 px-2.5 align-middle whitespace-nowrap">
                              <div className="flex flex-col items-start gap-1">
                                {isRefunded ? (
                                  <StatusBadge variant="rose" isDark={isDark}>
                                    <RotateCcw className="w-3 h-3" />
                                    <span>VietQR Refunded</span>
                                  </StatusBadge>
                                ) : isVietQRPaid ? (
                                  <StatusBadge variant="emerald" isDark={isDark}>
                                    <QrCode className="w-3 h-3" />
                                    <span>VietQR Paid</span>
                                  </StatusBadge>
                                ) : ord.payment_status === 'paid' ? (
                                  <StatusBadge variant="emerald" isDark={isDark}>
                                    <CreditCard className="w-3 h-3" />
                                    <span>COD Paid</span>
                                  </StatusBadge>
                                ) : (
                                  <StatusBadge variant="amber" isDark={isDark}>
                                    <CreditCard className="w-3 h-3" />
                                    <span>COD Unpaid</span>
                                  </StatusBadge>
                                )}
                                <span className={`text-[10px] font-mono ${t.textMuted}`}>
                                  {ord.payment_method} · {ord.payment_status}
                                </span>
                              </div>
                            </td>

                            {/* 5. Tổng tiền (final_amount bold) */}
                            <td className="py-3 px-2.5 align-middle text-right whitespace-nowrap">
                              <div className="font-mono font-extrabold text-xs">
                                {formatVND(ord.final_amount)}
                              </div>
                              <div className={`text-[10px] ${t.textMuted}`}>
                                {ord.order_items.length} mặt hàng
                              </div>
                            </td>

                            {/* 6. Trạng thái vận chuyển (shipping_status badge) */}
                            <td className="py-3 px-2.5 align-middle whitespace-nowrap">
                              <StatusBadge variant={shipMeta.variant} isDark={isDark}>
                                {shipMeta.shortLabel}
                              </StatusBadge>
                            </td>

                            {/* 7. Thao tác (Operational Action Workflow + Dropdown) */}
                            <td
                              className="py-3 pl-2.5 pr-3.5 align-middle text-right whitespace-nowrap relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {/* Primary Workflow Button by shipping_status */}
                                {ord.shipping_status === 'pending' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAcceptAndPack(ord.order_code)}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer shadow-xs"
                                  >
                                    Tiếp nhận &amp; Đóng gói
                                  </button>
                                )}

                                {ord.shipping_status === 'processing' && (
                                  <button
                                    type="button"
                                    onClick={() => handlePrintAndShip(ord.order_code)}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition cursor-pointer shadow-xs"
                                  >
                                    Xuất kho &amp; Giao Shipper
                                  </button>
                                )}

                                {ord.shipping_status === 'shipping' && (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelivered(ord.order_code)}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-xs"
                                  >
                                    Xác nhận đã giao
                                  </button>
                                )}

                                {(ord.shipping_status === 'delivered' ||
                                  ord.shipping_status === 'cancelled') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOrderRowClick(ord.order_code)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                      isDark
                                        ? 'bg-[#0b0f19] border-[#334155] text-[#94a3b8] hover:text-white'
                                        : 'bg-[#f8fafc] border-[#e2e8f0] text-[#475569] hover:text-slate-950'
                                    }`}
                                  >
                                    Xem chi tiết
                                  </button>
                                )}

                                {/* Dropdown Trigger: [Xem chi tiết], [Hủy đơn] */}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionDropdown((prev) =>
                                        prev === ord.order_code ? null : ord.order_code
                                      )
                                    }
                                    aria-label="Thêm thao tác"
                                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                      isDark
                                        ? 'bg-[#0b0f19] border-[#334155] text-[#94a3b8] hover:text-white'
                                        : 'bg-[#f8fafc] border-[#e2e8f0] text-[#475569] hover:text-slate-950'
                                    }`}
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {openActionDropdown === ord.order_code && (
                                    <div
                                      className={`absolute right-0 top-full mt-1 w-40 rounded-xl p-1.5 z-30 shadow-xl text-left ${t.surfaceCard}`}
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedOrderCode(ord.order_code);
                                          setDrawerOpen(true);
                                          setOpenActionDropdown(null);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                          isDark
                                            ? 'hover:bg-[#0b0f19] text-[#f8fafc]'
                                            : 'hover:bg-[#f1f5f9] text-[#0f172a]'
                                        }`}
                                      >
                                        <Eye className="w-3.5 h-3.5 text-cyan-500" />
                                        <span>Xem chi tiết</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handlePrintWarehouseSlip(ord);
                                          setOpenActionDropdown(null);
                                        }}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                          isDark
                                            ? 'hover:bg-[#0b0f19] text-[#f8fafc]'
                                            : 'hover:bg-[#f1f5f9] text-[#0f172a]'
                                        }`}
                                      >
                                        <Printer className="w-3.5 h-3.5 text-cyan-500" />
                                        <span>In phiếu xuất kho</span>
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          ord.shipping_status === 'delivered' ||
                                          ord.shipping_status === 'cancelled'
                                        }
                                        onClick={() => handleOpenCancelModal(ord)}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-rose-500 ${
                                          isDark ? 'hover:bg-[#4c0519]/40' : 'hover:bg-rose-50'
                                        }`}
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>Từ chối đơn</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================================================================
                  5. SLIDE-OVER RIGHT DRAWER (ORDER DETAILS & ITEM SNAPSHOTS)
                 ================================================================ */}
              {drawerOpen && selectedOrder && (
                <div
                  ref={drawerRef}
                  className={`rounded-xl w-full xl:w-[400px] shrink-0 flex flex-col overflow-hidden animate-fade-in border sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto ${
                    isDark
                      ? '!bg-[#131b2e] !border-[#1e293b] !text-[#f1f5f9]'
                      : '!bg-[#ffffff] !border-[#e2e8f0] !text-[#0f172a]'
                  }`}
                >
                  {/* Drawer Header: Order code, created_at, current status badge */}
                  <div
                    className={`p-4 border-b ${t.borderColor} ${t.tableHeaderBg} flex items-start justify-between gap-2`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-mono text-sm font-extrabold ${t.brandAccentText}`}>
                          {selectedOrder.order_code}
                        </span>
                        <StatusBadge
                          variant={
                            SHIPPING_STATUS_META[selectedOrder.shipping_status]?.variant ||
                            'amber'
                          }
                          isDark={isDark}
                        >
                          {SHIPPING_STATUS_META[selectedOrder.shipping_status]?.shortLabel}
                        </StatusBadge>
                      </div>
                      <div className={`text-[11px] font-mono ${t.textMuted}`}>
                        created_at: {selectedOrder.created_at} · Staff:{' '}
                        <strong className={t.textPrimary}>
                          {selectedOrder.processed_by_staff_id || 'Chưa gán (Unassigned)'}
                        </strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Đóng Drawer"
                      className={`p-1.5 rounded-lg border cursor-pointer ${
                        isDark
                          ? 'border-[#334155] text-[#94a3b8] hover:text-white'
                          : 'border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Status Stepper: Visual 4-step progress line (Pending -> Processing -> Shipping -> Delivered) */}
                  <div className={`px-4 py-3 border-b ${t.borderColor} space-y-2`}>
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase">
                      <span className={t.textMuted}>Tiến trình đơn hàng (Order Fulfillment Stepper)</span>
                      <span className={t.brandAccentText}>{selectedOrder.shipping_status}</span>
                    </div>

                    {selectedOrder.shipping_status === 'cancelled' ? (
                      <div
                        className={`p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                          isDark
                            ? 'bg-[#4c0519]/50 text-[#fb7185] border border-[#fb7185]/30'
                            : 'bg-[#fff1f2] text-[#e11d48] border border-[#e11d48]/25'
                        }`}
                      >
                        <Ban className="w-4 h-4 shrink-0" />
                        <span>Đơn hàng đã bị hủy (shipping_status = 'cancelled')</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {[
                          { key: 'pending', label: 'Pending' },
                          { key: 'processing', label: 'Processing' },
                          { key: 'shipping', label: 'Shipping' },
                          { key: 'delivered', label: 'Delivered' }
                        ].map((step, idx) => {
                          const currentIdx =
                            SHIPPING_STATUS_META[selectedOrder.shipping_status]?.stepIndex ?? 0;
                          const isDone = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;
                          return (
                            <div key={step.key} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  isDone
                                    ? t.brandGradient
                                    : isDark
                                      ? 'bg-[#0b0f19]'
                                      : 'bg-[#e2e8f0]'
                                }`}
                              />
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span
                                  className={
                                    isCurrent
                                      ? `font-extrabold ${t.brandAccentText}`
                                      : isDone
                                        ? t.textPrimary
                                        : t.textMuted
                                  }
                                >
                                  {step.label}
                                </span>
                                {isDone && (
                                  <Check className={`w-3 h-3 ${t.brandAccentText}`} />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Shipping Details: Recipient Name, Phone, Full Address, Customer order_notes */}
                  <div className={`p-4 border-b ${t.borderColor} space-y-2 text-xs`}>
                    <div
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${t.textMuted}`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Thông tin nhận hàng (Shipping Details)</span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-sm">
                        {selectedOrder.recipient_name}
                      </span>
                      <span className={`font-mono font-bold ${t.brandAccentText}`}>
                        {selectedOrder.recipient_phone}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${t.textMuted}`}>
                      {selectedOrder.shipping_address}
                    </p>

                    {selectedOrder.order_notes && (
                      <div
                        className={`p-2.5 rounded-lg text-[11px] border ${
                          isDark
                            ? 'bg-[#0b0f19] border-[#334155] text-[#fbbf24]'
                            : 'bg-[#fffbeb] border-amber-200 text-[#d97706]'
                        }`}
                      >
                        <span className="font-mono font-bold uppercase text-[10px] block mb-0.5">
                          order_notes:
                        </span>
                        {selectedOrder.order_notes}
                      </div>
                    )}

                  </div>

                  {/* Line Items List (`order_items`): Thumbnail, product_name, variant_name, SKU, unit_price x quantity = subtotal */}
                  <div className="p-4 space-y-2.5 max-h-[300px] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${t.textMuted}`}
                      >
                        Chi tiết sản phẩm
                      </span>
                      <span className={`text-[10px] font-mono ${t.textMuted}`}>
                        {selectedOrder.pick_slip_printed
                          ? 'Đã in phiếu xuất kho'
                          : 'Chưa in phiếu kho'}
                      </span>
                    </div>

                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.item_id}
                        className={`p-2.5 rounded-xl border flex gap-3 ${t.subtleSurface} ${t.borderColor}`}
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.product_name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-900"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="text-xs font-bold leading-snug line-clamp-1">
                            {item.product_name}
                          </div>
                          <div className={`text-[11px] font-semibold ${t.brandAccentText}`}>
                            {item.variant_name}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                isDark
                                  ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8]'
                                  : 'bg-white border-[#e2e8f0] text-[#64748b]'
                              }`}
                            >
                              SKU: {item.sku}
                            </span>
                          </div>
                          <div
                            className={`pt-1 border-t ${t.borderColor} flex items-center justify-between text-[11px] font-mono`}
                          >
                            <span className={t.textMuted}>
                              {formatVND(item.unit_price)} × {item.quantity}
                            </span>
                            <span className="font-extrabold">
                              = {formatVND(item.subtotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cost Breakdown: total_amount + shipping_fee = final_amount */}
                  <div
                    className={`p-4 border-t ${t.borderColor} ${t.tableHeaderBg} space-y-1.5 text-xs font-mono`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={t.textMuted}>Tạm tính:</span>
                      <span>{formatVND(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={t.textMuted}>Phí vận chuyển:</span>
                      <span>{formatVND(selectedOrder.shipping_fee)}</span>
                    </div>
                    <div
                      className={`pt-2 mt-1 border-t ${t.borderColor} flex items-center justify-between text-sm font-extrabold`}
                    >
                      <span>Thành tiền:</span>
                      <span className={t.brandAccentText}>
                        {formatVND(selectedOrder.final_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Action Bar: [In phiếu xuất kho] | [Cập nhật trạng thái] */}
                  <div className={`p-3.5 border-t ${t.borderColor} grid grid-cols-2 gap-2.5`}>
                    <button
                      type="button"
                      onClick={() => handlePrintWarehouseSlip(selectedOrder)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        isDark
                          ? 'bg-[#0b0f19] border-[#334155] text-[#f8fafc] hover:border-[#06b6d4]'
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#0f172a] hover:border-[#0891b2]'
                      }`}
                    >
                      <Printer className="w-4 h-4" />
                      <span>In phiếu xuất kho</span>
                    </button>

                    <div className="flex items-center gap-2 flex-1">
                      {(selectedOrder.shipping_status === 'pending' || selectedOrder.shipping_status === 'processing') && (
                        <button
                          type="button"
                          onClick={() => handleOpenCancelModal(selectedOrder)}
                          className="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500/60 bg-rose-500/10 transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                          title="Từ chối / Hủy đơn hàng kèm lý do"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Từ chối</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={
                          selectedOrder.shipping_status === 'delivered' ||
                          selectedOrder.shipping_status === 'cancelled'
                        }
                        onClick={() => handleAdvanceOrderStatus(selectedOrder)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.brandGradient}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>Cập nhật trạng thái</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================
              SECTION 2: RETURN / REFUND REQUESTS (`return_requests`)
             ================================================================== */}
          {activeMenu === 'returns' && (
            <div className={`${t.surfaceCard} rounded-xl overflow-hidden`}>
              <div
                className={`px-4 py-3 border-b ${t.borderColor} flex flex-wrap items-center justify-between gap-2`}
              >
                <div>
                  <h2 className={`text-sm font-extrabold ${t.textPrimary}`}>Quản lý Yêu cầu Đổi trả &amp; Hoàn tiền 
                  </h2>
                </div>
                <StatusBadge variant="rose" isDark={isDark}>
                  {kpiPendingReturns} yêu cầu chờ xử lý
                </StatusBadge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr
                      className={`${t.tableHeaderBg} ${t.textMuted} text-[10px] font-mono uppercase border-b ${t.borderColor}`}
                    >
                      <th className="py-2.5 px-4">Mã RMA</th>
                      <th className="py-2.5 px-3">Mã đơn</th>
                      <th className="py-2.5 px-3">Khách hàng</th>
                      <th className="py-2.5 px-3">Sản phẩm &amp; Lý do đổi trả</th>
                      <th className="py-2.5 px-3 text-right">Số tiền hoàn</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${t.divideColor} text-xs`}>
                    {filteredReturns.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`py-8 text-center text-xs ${t.textMuted}`}>
                          Không tìm thấy yêu cầu đổi trả nào khớp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    )}
                    {filteredReturns.map((req) => {
                      const meta = RETURN_STATUS_META[req.status] || RETURN_STATUS_META.pending;
                      return (
                        <tr key={req.return_id} className={`transition ${isDark ? "!bg-[#131b2e] hover:!bg-[#1a243b]" : "!bg-white hover:!bg-slate-50"}`}>
                          <td className="py-3 px-4 font-mono font-bold">
                            <span className="text-cyan-400 font-extrabold">{req.return_id}</span>
                            <div className={`text-[10px] font-normal ${t.textMuted}`}>{req.created_at}</div>
                          </td>
                          <td className={`py-3 px-3 font-mono font-bold ${t.brandAccentText}`}>
                            {req.order_id}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-xs">
                              {req.customer_name || 'Khách hàng'}
                            </div>
                            <div className={`text-[11px] font-mono ${t.textMuted}`}>
                              {req.customer_phone || req.customer_id || '—'}
                            </div>
                          </td>
                          <td className="py-3 px-3 max-w-md">
                            <div className="font-bold">{req.product_name}</div>
                            <div className={`text-[11px] mt-0.5 ${t.textMuted}`}>
                              {req.reason}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-extrabold">
                            {formatVND(req.refund_amount)}
                          </td>
                          <td className="py-3 px-3">
                            <StatusBadge variant={meta.variant} isDark={isDark}>
                              {meta.label}
                            </StatusBadge>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={req.status === 'approved' || req.status === 'refunded'}
                                onClick={() => handleUpdateReturnStatus(req.return_id, 'approved')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-500 text-slate-950 cursor-pointer disabled:opacity-40"
                              >
                                Duyệt (approved)
                              </button>
                              <button
                                type="button"
                                disabled={req.status === 'refunded'}
                                onClick={() => handleUpdateReturnStatus(req.return_id, 'refunded')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500 text-slate-950 cursor-pointer disabled:opacity-40"
                              >
                                Hoàn tiền (refunded)
                              </button>
                              <button
                                type="button"
                                disabled={req.status === 'rejected' || req.status === 'refunded'}
                                onClick={() => handleUpdateReturnStatus(req.return_id, 'rejected')}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500 text-white cursor-pointer disabled:opacity-40"
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================================================
              SECTION: SUPPORT TICKETS & CUSTOMER CHAT (MESSENGER / ZALO PC STYLE)
              Use Cases: Manage Support Ticket (View Ticket Details, Handle Ticket,
              Close Ticket) and Chat with Customer.
             ================================================================== */}
          {activeMenu === 'tickets' && (
            <div className={`w-full h-[calc(100vh-210px)] min-h-[640px] rounded-2xl border ${t.borderColor} ${t.surfaceCard} flex overflow-hidden shadow-2xl`}>
              
              {/* -------------------------------------------------------------
                  PANE 1: CONVERSATION & TICKET LIST (Left Sidebar, 330px-360px)
                  ------------------------------------------------------------- */}
              <div className={`w-80 lg:w-[350px] shrink-0 border-r ${t.borderColor} flex flex-col h-full ${isDark ? 'bg-[#0f172a]/60' : 'bg-slate-50/80'}`}>
                {/* Search & Filter Header */}
                <div className={`p-3 border-b ${t.borderColor} space-y-2.5 shrink-0 ${isDark ? 'bg-[#131b2e]' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className={`w-4 h-4 ${t.brandAccentText}`} />
                      <span className={`text-xs font-black tracking-tight ${t.textPrimary}`}>
                        Hội thoại CSKH &amp; Ticket
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {supportTickets.length} cuộc hội thoại
                    </span>
                  </div>

                  {/* Search inside tickets */}
                  <div className="relative">
                    <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${t.textMuted}`} />
                    <input
                      type="text"
                      value={ticketSearchQuery}
                      onChange={(e) => setTicketSearchQuery(e.target.value)}
                      placeholder="Tìm #TK, tên khách, SĐT, đơn..."
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition ${t.inputStyle}`}
                    />
                    {ticketSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTicketSearchQuery('')}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${t.textMuted} hover:opacity-80 text-xs`}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter Tabs (Zalo style pills) */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
                    {[
                      { key: 'all', label: 'Tất cả', count: supportTickets.length },
                      { key: 'open', label: 'Chờ xử lý', count: supportTickets.filter((t) => t.status === 'open').length, variant: 'amber' },
                      { key: 'in_progress', label: 'Đang hỗ trợ', count: supportTickets.filter((t) => t.status === 'in_progress').length, variant: 'cyan' },
                      { key: 'closed', label: 'Đã đóng', count: supportTickets.filter((t) => t.status === 'closed').length, variant: 'emerald' }
                    ].map((tab) => {
                      const isActive = ticketFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setTicketFilter(tab.key)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? `${t.brandGradient} text-white shadow-xs`
                              : isDark
                                ? 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
                                : 'bg-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-300'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-slate-700/20 text-inherit'}`}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-800/10 [scrollbar-width:thin]">
                  {filteredTicketList.length === 0 && (
                    <div className={`p-8 text-center text-xs ${t.textMuted}`}>
                      Không tìm thấy ticket hoặc hội thoại nào phù hợp.
                    </div>
                  )}

                  {filteredTicketList.map((tk) => {
                    const isSelected = tk.ticket_id === selectedTicket?.ticket_id;
                    const lastMsg = tk.messages[tk.messages.length - 1];

                    return (
                      <div
                        key={tk.ticket_id}
                        onClick={() => {
                          setSelectedTicketId(tk.ticket_id);
                          // mark read
                          setSupportTickets((prev) =>
                            prev.map((item) => (item.ticket_id === tk.ticket_id ? { ...item, unread: 0 } : item))
                          );
                        }}
                        className={`p-3 transition-all cursor-pointer relative ${
                          isSelected
                            ? isDark
                              ? 'bg-[#1e293b] border-l-4 border-l-[#06b6d4] shadow-inner'
                              : 'bg-cyan-50/90 border-l-4 border-l-[#0891b2] shadow-xs'
                            : t.rowHover
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Avatar with Online badge */}
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                              {tk.customer_name.slice(0, 2).toUpperCase()}
                            </div>
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 ${
                                isDark ? 'border-slate-900' : 'border-white'
                              } ${tk.status === 'closed' ? 'bg-slate-400' : 'bg-emerald-400'}`}
                            />
                          </div>

                          {/* Preview Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-extrabold truncate ${t.textPrimary}`}>
                                {tk.customer_name}
                              </span>
                              <span className={`text-[10px] font-mono shrink-0 ${t.textMuted}`}>
                                {lastMsg?.time || ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-mono text-[10px] font-extrabold text-cyan-400">
                                #{tk.ticket_id}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                tk.category === 'warranty'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : tk.category === 'pc_build'
                                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              }`}>
                                {tk.category_label.split('&')[0]}
                              </span>
                            </div>

                            <p className={`text-[11px] truncate mt-1 ${
                              isSelected
                                ? isDark ? 'text-slate-200' : 'text-slate-800 font-medium'
                                : t.textMuted
                            }`}>
                              {lastMsg?.sender === 'staff' ? (
                                <span className="font-semibold text-cyan-400">Bạn: </span>
                              ) : null}
                              {lastMsg?.text || 'Bắt đầu cuộc trò chuyện'}
                            </p>
                          </div>

                          {/* Status indicator or Unread counter */}
                          <div className="flex flex-col items-end gap-1 shrink-0 self-center">
                            {tk.status === 'open' && (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" title="Chờ tiếp nhận" />
                            )}
                            {tk.unread > 0 && (
                              <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow">
                                {tk.unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* -------------------------------------------------------------
                  PANE 2: ACTIVE CHAT & TICKET WORKSPACE (Center, Flex-1)
                  ------------------------------------------------------------- */}
              {selectedTicket ? (
                <div className="flex-1 flex flex-col h-full min-w-0">
                  {/* Top Header Bar of Active Conversation */}
                  <div className={`p-3.5 border-b ${t.borderColor} flex items-center justify-between gap-3 shrink-0 ${isDark ? 'bg-[#131b2e]' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow">
                        {selectedTicket.customer_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm font-black truncate ${t.textPrimary}`}>
                            {selectedTicket.customer_name}
                          </h3>
                          <StatusBadge
                            variant={selectedTicket.status === 'open' ? 'amber' : selectedTicket.status === 'in_progress' ? 'cyan' : 'emerald'}
                            isDark={isDark}
                          >
                            {selectedTicket.status === 'open' ? 'Chờ tiếp nhận' : selectedTicket.status === 'in_progress' ? 'Đang hỗ trợ' : 'Đã giải quyết'}
                          </StatusBadge>
                          <StatusBadge
                            variant={selectedTicket.priority === 'urgent' ? 'rose' : selectedTicket.priority === 'high' ? 'amber' : 'slate'}
                            isDark={isDark}
                          >
                            {selectedTicket.priority_label}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                          <span>SĐT: <strong className="font-mono text-slate-300">{selectedTicket.customer_phone}</strong></span>
                          <span>•</span>
                          <span
                            className="font-mono text-cyan-400 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                            onClick={() => handleJumpToOrder(selectedTicket.order_code)}
                            title="Nhấp để xem đơn hàng này trong phần Xử lý đơn"
                          >
                            <span>Đơn: {selectedTicket.order_code}</span>
                            <ExternalLink className="w-3 h-3" />
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Đang trực tuyến
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Header Action Buttons (Use Cases: Handle Ticket, Close Ticket) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedTicket.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleAssignTicket(selectedTicket.ticket_id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-500/20 transition flex items-center gap-1.5 cursor-pointer"
                          title="Tiếp nhận xử lý ticket này"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tiếp nhận (Handle)</span>
                        </button>
                      )}

                      {selectedTicket.status !== 'closed' ? (
                        <button
                          type="button"
                          onClick={() => handleCloseTicket(selectedTicket.ticket_id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                          title="Đóng ticket (Hoàn tất hỗ trợ)"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Đóng ticket (Close)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReopenTicket(selectedTicket.ticket_id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5 cursor-pointer"
                          title="Mở lại ticket này"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Mở lại</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleEscalateTicket(selectedTicket.ticket_id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 transition flex items-center gap-1 cursor-pointer hidden md:flex"
                        title="Chuyển sang bộ phận kỹ sư phần cứng"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span>Chuyển Kỹ Thuật</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsTicketDrawerOpen(!isTicketDrawerOpen)}
                        className={`p-2 rounded-xl border transition cursor-pointer ${
                          isTicketDrawerOpen
                            ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                            : `${t.subtleSurface} ${t.textMuted} hover:text-white`
                        }`}
                        title="Bật/Tắt thông tin chi tiết ticket"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Chat Feed Area */}
                  <div className={`flex-1 overflow-y-auto p-4 space-y-3.5 ${isDark ? 'bg-slate-950/40' : 'bg-slate-100/60'} [scrollbar-width:thin]`}>
                    <div className="flex justify-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-medium ${isDark ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-slate-200 text-slate-600'}`}>
                        Hôm nay, 5 tháng 11, 2026
                      </span>
                    </div>

                    {selectedTicket.messages.map((m) => {
                      if (m.sender === 'system') {
                        return (
                          <div key={m.id} className="flex justify-center my-2">
                            <span className="px-3.5 py-1 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 max-w-lg text-center leading-relaxed">
                              {m.text}
                            </span>
                          </div>
                        );
                      }

                      const isStaff = m.sender === 'staff';
                      return (
                        <div key={m.id} className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'} space-y-1`}>
                          <div className="flex items-end gap-2 max-w-[80%]">
                            {!isStaff && (
                              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mb-1">
                                {selectedTicket.customer_name.slice(0, 1)}
                              </div>
                            )}
                            <div
                              className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm ${
                                isStaff
                                  ? `${t.brandGradient} text-white rounded-br-xs shadow-cyan-500/10`
                                  : isDark
                                    ? 'bg-[#1e293b] text-slate-100 border border-slate-800 rounded-bl-xs'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                          <div className={`flex items-center gap-1.5 ${isStaff ? 'pr-1' : 'pl-9'} text-[10px] text-slate-400 font-mono`}>
                            <span>{m.time}</span>
                            {isStaff && (
                              <span className="flex items-center gap-0.5 text-cyan-400 font-semibold">
                                <CheckCheck className="w-3 h-3" />
                                <span>Đã nhận</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatFeedBottomRef} />
                  </div>

                  {/* Canned Responses Suggestion Bar (CSKH Quick Reply Chips) */}
                  <div className={`px-4 py-2 border-t ${t.borderColor} ${isDark ? 'bg-[#0f172a]/70' : 'bg-slate-50'} flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0`}>
                    <span className={`text-[10px] font-black uppercase tracking-wider ${t.textMuted} shrink-0 mr-1 flex items-center gap-1`}>
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Gợi ý:
                    </span>
                    {CANNED_REPLIES.map((canned, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(canned)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap border transition cursor-pointer shrink-0 ${
                          isDark
                            ? 'bg-slate-800/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border-slate-700/60 hover:border-cyan-500/40'
                            : 'bg-white hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border-slate-200 hover:border-cyan-300 shadow-xs'
                        }`}
                        title="Nhấp để gửi ngay phản hồi mẫu này"
                      >
                        {canned}
                      </button>
                    ))}
                  </div>

                  {/* Message Input Toolbar */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage(chatInputText);
                    }}
                    className={`p-3 border-t ${t.borderColor} ${isDark ? 'bg-[#131b2e]' : 'bg-white'} flex items-center gap-2 shrink-0`}
                  >
                    <button
                      type="button"
                      onClick={() => triggerToast('Đã mở hộp thoại tải ảnh / biên bản lỗi linh kiện')}
                      className={`p-2 rounded-xl text-slate-400 hover:text-cyan-400 transition cursor-pointer hover:bg-slate-800/50`}
                      title="Đính kèm ảnh hiện trạng lỗi linh kiện"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      placeholder="Nhập nội dung tư vấn khách hàng (Nhấn Enter để gửi)..."
                      className={`flex-1 px-4 py-2.5 rounded-xl text-xs outline-none border transition ${t.inputStyle}`}
                    />
                    <button
                      type="submit"
                      disabled={!chatInputText.trim()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-md ${t.brandGradient}`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu.
                </div>
              )}

              {/* -------------------------------------------------------------
                  PANE 3: TICKET DETAILS & CUSTOMER PROFILE (Right Drawer)
                  ------------------------------------------------------------- */}
              {isTicketDrawerOpen && selectedTicket && (
                <div className={`w-80 shrink-0 border-l ${t.borderColor} flex flex-col h-full overflow-y-auto ${isDark ? 'bg-[#0f172a]/90' : 'bg-white'} [scrollbar-width:thin]`}>
                  {/* Header of details drawer */}
                  <div className={`p-3.5 border-b ${t.borderColor} flex items-center justify-between shrink-0`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className={`text-xs font-black tracking-tight ${t.textPrimary}`}>
                        Thông tin Ticket &amp; Khách hàng
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTicketDrawerOpen(false)}
                      className={`p-1 rounded-lg ${t.textMuted} hover:text-white transition cursor-pointer`}
                      title="Ẩn bảng chi tiết"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Customer Card */}
                    <div className={`p-3.5 rounded-xl border ${t.borderColor} ${t.subtleSurface} space-y-2.5`}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                          {selectedTicket.customer_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className={`text-xs font-extrabold ${t.textPrimary}`}>
                            {selectedTicket.customer_name}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-medium">
                            Khách hàng đã xác thực
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[11px] pt-1 border-t border-inherit">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-200">{selectedTicket.customer_phone}</span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-slate-300 leading-tight">{selectedTicket.customer_address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Ticket Details Card */}
                    <div className={`p-3.5 rounded-xl border ${t.borderColor} ${t.subtleSurface} space-y-2.5`}>
                      <div className={`text-[10px] font-black uppercase tracking-wider ${t.textMuted}`}>
                        Chi tiết phân loại Ticket
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={t.textMuted}>Mã Ticket:</span>
                          <span className="font-mono font-black text-cyan-400">#{selectedTicket.ticket_id}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={t.textMuted}>Phân loại:</span>
                          <span className="font-semibold text-slate-200">{selectedTicket.category_label}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={t.textMuted}>Mức độ:</span>
                          <StatusBadge variant={selectedTicket.priority === 'urgent' ? 'rose' : selectedTicket.priority === 'high' ? 'amber' : 'slate'} isDark={isDark}>
                            {selectedTicket.priority_label}
                          </StatusBadge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={t.textMuted}>Nhân viên phụ trách:</span>
                          <span className="font-bold text-violet-400">{selectedTicket.assigned_staff || 'Chưa gán'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={t.textMuted}>Thời gian tạo:</span>
                          <span className="font-mono text-[11px] text-slate-400">{selectedTicket.created_at}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attached Order Card */}
                    <div className={`p-3.5 rounded-xl border ${t.borderColor} ${t.subtleSurface} space-y-2.5`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${t.textMuted}`}>
                          Đơn hàng đính kèm
                        </span>
                        <span className="font-mono text-xs font-bold text-cyan-400">
                          {selectedTicket.order_code}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400">Tổng giá trị:</span>
                        <span className="font-mono text-sm font-extrabold text-white">
                          {formatVND(selectedTicket.order_amount)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToOrder(selectedTicket.order_code)}
                        className={`w-full py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-slate-700 hover:border-cyan-500/40'
                            : 'bg-white hover:bg-cyan-50 text-cyan-700 border-slate-300 shadow-xs'
                        }`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem đơn hàng trong Fulfillment</span>
                      </button>
                    </div>

                    {/* Internal Notes (Ghi chú nội bộ cho Staff) */}
                    <div className={`p-3.5 rounded-xl border ${t.borderColor} ${t.subtleSurface} space-y-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${t.textMuted}`}>
                          Ghi chú nội bộ cho ca trực
                        </span>
                        <span className="text-[10px] text-slate-500">(Khách không thấy)</span>
                      </div>
                      <textarea
                        rows={3}
                        value={internalNoteDraft}
                        onChange={(e) => setInternalNoteDraft(e.target.value)}
                        placeholder="Ghi chú kỹ thuật bàn giao cho nhân viên ca sau..."
                        className={`w-full p-2.5 rounded-xl text-xs border outline-none transition resize-none ${t.inputStyle}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveInternalNotes(selectedTicket.ticket_id)}
                        className="w-full py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
                      >
                        Lưu ghi chú nội bộ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================
              SECTION 3: REVIEWS & CUSTOMER SERVICE REPLIES (`reviews`)
             ================================================================== */}
          {activeMenu === 'reviews' && (
            <div className={`${t.surfaceCard} rounded-xl p-4 space-y-4`}>
              {/* Header of Reviews Section */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
                <div>
                  <h2 className={`text-sm font-extrabold flex items-center gap-2 ${t.textPrimary}`}>
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    <span>Phản hồi Đánh giá &amp; Chăm sóc Khách hàng</span>
                  </h2>
                  <p className={`text-xs ${t.textMuted} mt-0.5`}>
                    Tương tác phản hồi khách mua hàng, giải đáp thắc mắc và hỗ trợ bảo hành kỹ thuật 1-đổi-1
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge variant="amber" isDark={isDark}>
                    {unrepliedCount} chưa phản hồi
                  </StatusBadge>
                  <StatusBadge variant="emerald" isDark={isDark}>
                    {repliedCount} đã phản hồi
                  </StatusBadge>
                </div>
              </div>

              {/* Review Cards List */}
              <div className="space-y-3.5">
                {filteredReviews.length === 0 && (
                  <div className={`p-8 text-center text-xs rounded-xl border ${t.borderColor} ${t.subtleSurface} ${t.textMuted}`}>
                    Không tìm thấy đánh giá nào khớp với bộ lọc hiện tại.
                  </div>
                )}
                {filteredReviews.map((rv) => {
                  const isReplying = replyingReviewId === rv.review_id;
                  const hasReply = Boolean(rv.staff_reply);
                  const isHidden = rv.status === 'hidden';

                  return (
                    <div
                      key={rv.review_id}
                      className={`p-4 rounded-xl border transition-all ${t.subtleSurface} ${t.borderColor} ${
                        isHidden ? 'opacity-60 bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Review Top Meta Bar */}
                      <div className="flex flex-wrap items-start justify-between gap-2.5 pb-2.5 border-b border-inherit">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {rv.customer_name ? rv.customer_name.charAt(0).toUpperCase() : 'K'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs">{rv.customer_name}</span>
                              {rv.is_verified_buyer && (
                                <StatusBadge variant="emerald" isDark={isDark} className="!text-[10px] !px-1.5 !py-0">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Đã mua tại TechShop</span>
                                </StatusBadge>
                              )}
                              <span className={`font-mono text-[11px] font-bold ${t.brandAccentText}`}>
                                {rv.review_id}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {/* Star Rating */}
                              <span className="text-amber-400 text-xs font-bold tracking-wider">
                                {'★'.repeat(rv.rating)}
                                <span className={t.textMuted}>{'★'.repeat(Math.max(0, 5 - rv.rating))}</span>
                              </span>
                              <span className={`text-[10px] ${t.textMuted}`}>
                                • {rv.created_at}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5">
                          {isHidden ? (
                            <StatusBadge variant="slate" isDark={isDark}>
                              Đã ẩn (vi phạm)
                            </StatusBadge>
                          ) : hasReply ? (
                            <StatusBadge variant="emerald" isDark={isDark}>
                              <CheckCheck className="w-3 h-3" />
                              <span>Đã phản hồi</span>
                            </StatusBadge>
                          ) : (
                            <StatusBadge variant="amber" isDark={isDark}>
                              <Clock className="w-3 h-3" />
                              <span>Chưa phản hồi</span>
                            </StatusBadge>
                          )}
                        </div>
                      </div>

                      {/* Product Name & SKU */}
                      <div className="pt-2.5">
                        <div className="text-xs font-semibold">
                          <span className={t.textMuted}>Sản phẩm: </span>
                          <span className={t.textPrimary}>{rv.product_name}</span>{' '}
                          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-cyan-700'
                          }`}>
                            {rv.sku}
                          </span>
                        </div>

                        {/* Customer Comment */}
                        <div className={`mt-2 p-3 rounded-lg text-xs italic ${
                          isDark ? 'bg-[#0f172a] text-[#e2e8f0]' : 'bg-[#f1f5f9] text-[#334155]'
                        }`}>
                          “{rv.comment}”
                        </div>
                      </div>

                      {/* Official Staff Reply Box (if replied) */}
                      {hasReply && !isReplying && (
                        <div className={`mt-3 p-3 rounded-lg border-l-4 border-cyan-500 ${
                          isDark
                            ? 'bg-[#0e2439] border-cyan-500/80 text-[#f1f5f9]'
                            : 'bg-[#ecfeff] border-cyan-600 text-[#0f172a]'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>TechShop CSKH Phản hồi</span>
                              {rv.staff_replied_at && (
                                <span className={`text-[10px] font-normal ${t.textMuted}`}>
                                  ({rv.staff_replied_at})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenReplyBox(rv)}
                                className={`p-1 rounded text-[11px] font-semibold hover:opacity-80 flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'text-cyan-300' : 'text-cyan-700'
                                }`}
                                title="Chỉnh sửa nội dung phản hồi"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReply(rv)}
                                className="p-1 rounded text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                                title="Thu hồi phản hồi"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Xóa</span>
                              </button>
                            </div>
                          </div>
                          <p className="text-xs leading-relaxed">{rv.staff_reply}</p>
                        </div>
                      )}

                      {/* Reply Composer Box (when active) */}
                      {isReplying && (
                        <div className={`mt-3 p-3 rounded-xl border ${
                          isDark ? 'bg-[#0f172a] border-cyan-500/40' : 'bg-cyan-50/50 border-cyan-200'
                        } space-y-2.5`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold flex items-center gap-1.5 text-cyan-400">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Soạn câu trả lời gửi đến khách hàng:</span>
                            </span>
                            <span className={`text-[10px] ${t.textMuted}`}>
                              Nhấn mẫu câu nhanh bên dưới để áp dụng
                            </span>
                          </div>

                          {/* Quick Template Chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {QUICK_TEMPLATES.map((tmpl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setReplyInputText(tmpl.text)}
                                className={`text-[10px] font-medium px-2 py-1 rounded-md border transition cursor-pointer ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-cyan-300 hover:bg-slate-700'
                                    : 'bg-white border-slate-200 text-cyan-700 hover:bg-cyan-100'
                                }`}
                              >
                                {tmpl.label}
                              </button>
                            ))}
                          </div>

                          {/* Textarea */}
                          <textarea
                            rows={3}
                            value={replyInputText}
                            onChange={(e) => setReplyInputText(e.target.value)}
                            placeholder="Nhập nội dung phản hồi khách hàng (VD: Dạ TechShop cảm ơn bạn...)..."
                            className={`w-full p-2.5 rounded-lg text-xs border outline-none transition ${t.inputStyle}`}
                          />

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={handleCancelReply}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                                isDark
                                  ? 'bg-[#1e293b] border-[#334155] text-[#94a3b8]'
                                  : 'bg-white border-[#e2e8f0] text-[#64748b]'
                              }`}
                            >
                              Hủy
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingReply}
                              onClick={() => handleSendReply(rv)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isSubmittingReply ? 'Đang gửi...' : 'Gửi phản hồi CSKH'}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Card Footer Bar: Action Buttons when not replying */}
                      {!isReplying && (
                        <div className="mt-3 pt-2.5 border-t border-inherit flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            {!hasReply && (
                              <button
                                type="button"
                                onClick={() => handleOpenReplyBox(rv)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                                  isDark
                                    ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25'
                                    : 'bg-cyan-50 border border-cyan-300 text-cyan-700 hover:bg-cyan-100'
                                }`}
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Phản hồi khách hàng</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleHideReview(rv)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                                isHidden
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : isDark
                                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-rose-400 hover:border-rose-500/40'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-rose-600 hover:border-rose-300'
                              }`}
                            >
                              {isHidden ? 'Hiện lại đánh giá' : 'Ẩn (vi phạm/spam)'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================================
              SECTION 4: DAILY DELEGATIONS & SHIFT ROSTER (`staff_tasks` & `staff_schedules`)
             ================================================================== */}
          {activeMenu === 'tasks' && (
            <div className="w-full">
              {/* Daily Delegations */}
              <div className={`${t.surfaceCard} rounded-xl p-4 space-y-3.5`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className={`text-sm font-extrabold flex items-center gap-2 ${t.textPrimary}`}>
                      <CalendarCheck className="w-4 h-4 text-violet-500" />
                      <span>Nhiệm vụ trong ca làm việc</span>
                    </h2>
                    <p className={`text-xs ${t.textMuted} mt-0.5`}>
                      Danh sách công việc và chỉ tiêu vận hành do Quản lý phân công cho ca trực
                    </p>
                  </div>
                  <StatusBadge variant="violet" isDark={isDark}>
                    {kpiCompletedTasks}/{kpiTotalTasks} task hoàn thành
                  </StatusBadge>
                </div>

                <div className="space-y-2.5">
                  {filteredTasks.length === 0 && (
                    <div className={`p-8 text-center text-xs rounded-xl border ${t.borderColor} ${t.subtleSurface} ${t.textMuted}`}>
                      Không có nhiệm vụ nào khớp với bộ lọc hiện tại.
                    </div>
                  )}
                  {filteredTasks.map((tsk) => {
                    const prioMeta = PRIORITY_META[tsk.priority] || PRIORITY_META.medium;
                    return (
                      <div
                        key={tsk.task_id}
                        className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${t.subtleSurface} ${t.borderColor}`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={tsk.status === 'completed'}
                            onChange={() =>
                              handleSetTaskStatus(
                                tsk.task_id,
                                tsk.status === 'completed' ? 'todo' : 'completed'
                              )
                            }
                            className="mt-1 w-4 h-4 rounded accent-[#06b6d4] cursor-pointer"
                          />
                          <div className="min-w-0 space-y-1.5 flex-1">
                            <div
                              className={`text-xs font-bold ${
                                tsk.status === 'completed'
                                  ? `line-through opacity-60 ${t.textMuted}`
                                  : t.textPrimary
                              }`}
                            >
                              {tsk.title}
                            </div>
                            {tsk.description && (
                              <p className={`text-[11px] ${t.textMuted}`}>
                                {tsk.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap text-[11px]">
                              <span className={`font-mono font-bold ${t.brandAccentText}`}>
                                {tsk.task_id}
                              </span>
                              <span className={t.textMuted}>•</span>
                              <span className={`font-medium flex items-center gap-1 ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                                <User className="w-3 h-3 inline" />
                                Phân công: <strong>{tsk.manager_name || tsk.manager_code || 'Chưa cập nhật'}</strong>
                              </span>
                              <span className={t.textMuted}>•</span>
                              <span className={`flex items-center gap-1 ${t.textMuted}`}>
                                <Clock className="w-3 h-3 inline" />
                                Hạn chót: <span className="font-mono font-semibold">{tsk.due_date}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <StatusBadge variant={prioMeta.variant} isDark={isDark}>
                            {prioMeta.label}
                          </StatusBadge>
                          <select
                            value={tsk.status}
                            onChange={(e) =>
                              handleSetTaskStatus(tsk.task_id, e.target.value)
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer outline-none ${t.inputStyle}`}
                          >
                            <option value="todo">Cần làm</option>
                            <option value="in_progress">Đang xử lý</option>
                            <option value="completed">Đã hoàn thành</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================================
          WAREHOUSE PICK SLIP / DISPATCH NOTE DOCUMENT MODAL
         ====================================================================== */}
      {pickSlipModalOrder && (
        <div
          id="printable-modal-overlay"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center justify-start animate-fade-in"
          onClick={() => setPickSlipModalOrder(null)}
        >
          {/* Action Toolbar (Ẩn khi in ấn qua class .no-print) */}
          <div
            className="w-full max-w-4xl mb-4 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xl bg-[#0f172a] border border-cyan-500/40 text-white no-print"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold flex items-center gap-2">
                  <span>Phiếu Xuất Kho Kiêm Biên Bản Bàn Giao</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {pickSlipModalOrder.order_code}
                  </span>
                </div>
                
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPickSlip}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                title="Mở hộp thoại In / Lưu PDF của trình duyệt (Browser Print Preview)"
              >
                <Printer className="w-4 h-4" />
                <span>In Phiếu Ngay (Print)</span>
              </button>
              <button
                type="button"
                onClick={() => setPickSlipModalOrder(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span>Đóng</span>
              </button>
            </div>
          </div>

          {/* Printable Document Sheet (A4 format: #printable-pick-slip) */}
          <div
            id="printable-pick-slip"
            className="w-full max-w-4xl bg-white text-gray-900 rounded-xl shadow-2xl p-6 sm:p-10 md:p-12 space-y-6 border border-gray-300 font-sans leading-normal relative select-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Embedded Print CSS: Bản xem trước trên giao diện giữ nguyên màu sắc, khi in trình duyệt tự xét 1 trang A4 */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 6mm 10mm;
                }
                html, body {
                  margin: 0 !important;
                  padding: 0 !important;
                  height: auto !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                  background: #ffffff !important;
                  color: #000000 !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                /* Ẩn hoàn toàn toàn bộ ứng dụng nền để không bị phình ra 8 trang */
                aside, header, main, nav, .no-print {
                  display: none !important;
                }
                #printable-modal-overlay {
                  position: static !important;
                  display: block !important;
                  background: transparent !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                }
                #printable-pick-slip {
                  position: static !important;
                  display: block !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 auto !important;
                  padding: 2mm 4mm !important;
                  box-shadow: none !important;
                  border: none !important;
                  page-break-after: avoid !important;
                  break-after: avoid !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
              }
            `}} />

            {/* Header: Company Info & Scannable QR Code */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b-2 border-gray-900">
              {/* Left: Branding TECHGEAR VIỆT NAM (Tuyệt đối không dùng tên bleentechgear) */}
              <div className="space-y-1 sm:max-w-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    TG
                  </div>
                  <div>
                    <span className="font-black text-lg tracking-tight text-gray-900 block leading-tight">
                      TECHGEAR VIỆT NAM
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-700 block">
                      HỆ THỐNG PHÂN PHỐI &amp; BÁN LẺ THIẾT BỊ CÔNG NGHỆ CHÍNH HÃNG
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-600 space-y-0.5 pt-1">
                  <div><strong>Kho tổng:</strong> Tầng 2, Tòa nhà TechGear, Số 123 Đường Cầu Giấy, Hà Nội</div>
                  <div><strong>Hotline CSKH / Khiếu nại đơn hàng:</strong> 1900 6868 | <strong>Email:</strong> kho@techgear.vn</div>
                  <div><strong>Mã số thuế:</strong> 0109887766 · <strong>Website:</strong> www.techgear.vn</div>
                </div>
              </div>

              {/* Right: QR Code for Logistics */}
              <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
                <div className="text-[11px] font-mono text-gray-600 mb-1.5">
                  Mã chứng từ: <strong className="text-gray-900">PXK-{pickSlipModalOrder.order_code.slice(-9)}</strong>
                </div>
                <div className="bg-white p-2 rounded-lg border-2 border-gray-900 flex flex-col items-center shadow-xs">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pickSlipModalOrder.order_code)}`}
                    alt={`QR Code ${pickSlipModalOrder.order_code}`}
                    className="w-24 h-24 object-contain"
                    loading="eager"
                  />
                  <div className="mt-1 text-center">
                    <span className="font-mono text-[10px] font-black text-gray-900 tracking-wider block">
                      {pickSlipModalOrder.order_code}
                    </span>
                    <span className="text-[9px] font-semibold text-gray-600 tracking-tight block">
                      Quét mã đối soát đơn hàng
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 mt-1.5 font-mono">
                  Ngày lập: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="text-center py-2 space-y-1">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
                PHIẾU XUẤT KHO KIÊM BÀN GIAO HÀNG HÓA
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                (Warehouse Pick Slip &amp; Dispatch Note) · Mã đơn hàng: <strong className="text-gray-900">{pickSlipModalOrder.order_code}</strong>
              </p>
            </div>

            {/* Order & Recipient Metadata Grid (Bản giao diện giữ colored đẹp mắt) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              {/* Left Column: Recipient */}
              <div className="space-y-1.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-cyan-800 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Thông Tin Người Nhận</span>
                </div>
                <div><strong>Họ và tên:</strong> {pickSlipModalOrder.recipient_name || pickSlipModalOrder.customer_name || 'Khách hàng'}</div>
                <div><strong>Số điện thoại:</strong> {pickSlipModalOrder.recipient_phone || pickSlipModalOrder.phone || '0900 000 000'}</div>
                <div><strong>Địa chỉ giao nhận:</strong> {pickSlipModalOrder.shipping_address || 'Địa chỉ kho khách hàng TechGear'}</div>
                {pickSlipModalOrder.order_notes && (
                  <div className="text-gray-600 pt-0.5">
                    <strong>Ghi chú đơn hàng:</strong> <span className="italic">{pickSlipModalOrder.order_notes}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Order & Payment Status */}
              <div className="space-y-1.5">
                <div className="font-bold text-[11px] uppercase tracking-wider text-cyan-800 border-b border-gray-200 pb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Thông Tin Xuất Kho &amp; Thanh Toán</span>
                </div>
                <div><strong>Mã đơn hàng:</strong> <span className="font-mono font-bold">{pickSlipModalOrder.order_code}</span></div>
                <div>
                  <strong>Hình thức thanh toán:</strong>{' '}
                  {pickSlipModalOrder.payment_method === 'cod'
                    ? 'Thanh toán khi nhận hàng (COD)'
                    : 'Chuyển khoản VietQR Paid (Đã thanh toán 100%)'}
                </div>
                <div className="flex items-center gap-2">
                  <strong>Trạng thái:</strong>
                  {pickSlipModalOrder.payment_status === 'paid' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ ĐÃ THANH TOÁN (PAID)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      ⚠ CHƯA THANH TOÁN (THU COD)
                    </span>
                  )}
                </div>
                <div>
                  <strong>Nhân viên xuất kho:</strong>{' '}
                  <span className="font-semibold text-gray-800">{staffProfile.full_name}</span>
                </div>
              </div>
            </div>

            {/* Product Items Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-300">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white font-bold border-b border-gray-900">
                    <th className="p-2.5 text-center w-12 border-r border-gray-700">STT</th>
                    <th className="p-2.5 border-r border-gray-700">Tên Sản Phẩm / Phụ Kiện</th>
                    <th className="p-2.5 text-center w-28 border-r border-gray-700">Mã SKU</th>
                    <th className="p-2.5 text-center w-16 border-r border-gray-700">SL</th>
                    <th className="p-2.5 text-right w-28 border-r border-gray-700">Đơn Giá</th>
                    <th className="p-2.5 text-right w-32">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {((pickSlipModalOrder.order_items || pickSlipModalOrder.items || []).length > 0
                    ? (pickSlipModalOrder.order_items || pickSlipModalOrder.items)
                    : [
                        {
                          item_id: 1,
                          product_name: 'Sản phẩm công nghệ TechGear',
                          sku: 'SKU-TG01',
                          quantity: 1,
                          unit_price: pickSlipModalOrder.total_amount || pickSlipModalOrder.final_amount || 0
                        }
                      ]
                  ).map((it, idx) => {
                    const price = Number(it.unit_price || it.price || 0);
                    const qty = Number(it.quantity || 1);
                    return (
                      <tr key={it.item_id || idx} className="hover:bg-gray-50/50">
                        <td className="p-2.5 text-center font-mono border-r border-gray-200 text-gray-600">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-medium text-gray-900 border-r border-gray-200">
                          {it.product_name || it.name}
                          {it.variant_name && (
                            <span className="block text-[10px] text-gray-500 font-normal">
                              Phân loại: {it.variant_name}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-mono text-[11px] border-r border-gray-200 text-gray-600">
                          {it.sku || `SKU-${1000 + idx}`}
                        </td>
                        <td className="p-2.5 text-center font-bold border-r border-gray-200">
                          {qty}
                        </td>
                        <td className="p-2.5 text-right font-mono border-r border-gray-200 text-gray-700">
                          {formatVND(price)}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                          {formatVND(price * qty)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Calculation Block */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-1">
              <div className="text-[11px] text-gray-600 space-y-1 sm:max-w-xs">
                <div><strong>Lưu ý giao nhận &amp; đóng gói:</strong></div>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-500">
                  <li>Kiểm tra tem niêm phong và bọt khí chống sốc trước khi xuất kho.</li>
                  <li>Khách hàng được đồng kiểm ngoại quan sản phẩm trước khi nhận.</li>
                  <li>Giữ nguyên phiếu này trong trường hợp đổi trả bảo hành 1 đổi 1.</li>
                </ul>
              </div>

              {/* Total Calculation Card */}
              <div className="w-full sm:w-72 bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tiền hàng (Subtotal):</span>
                  <span className="font-mono font-bold">
                    {formatVND(pickSlipModalOrder.total_amount || pickSlipModalOrder.final_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển:</span>
                  <span className="font-mono">
                    {formatVND(pickSlipModalOrder.shipping_fee || 30000)}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-300 flex justify-between items-center text-sm">
                  <span className="font-black text-gray-900">TỔNG CỘNG THU (COD):</span>
                  <span className="font-mono font-black text-base text-rose-600">
                    {pickSlipModalOrder.payment_status === 'paid'
                      ? '0 ₫'
                      : formatVND(
                          (pickSlipModalOrder.final_amount || pickSlipModalOrder.total_amount) +
                            (pickSlipModalOrder.shipping_fee || 30000)
                        )}
                  </span>
                </div>
                {pickSlipModalOrder.payment_status === 'paid' && (
                  <div className="text-[10px] text-emerald-700 font-bold text-right">
                    ✓ Đơn hàng đã được thanh toán 100%. Không thu thêm tiền khách.
                  </div>
                )}
              </div>
            </div>

            {/* Signatures Block (3 columns) */}
            <div className="pt-4 grid grid-cols-3 gap-4 text-center text-xs">
              <div className="space-y-12">
                <div>
                  <div className="font-bold text-gray-900 uppercase">NGƯỜI LẬP PHIẾU</div>
                  <div className="text-[10px] text-gray-500">(Ký, ghi rõ họ tên)</div>
                </div>
                <div className="font-bold font-mono text-gray-800">
                  {staffProfile.full_name}
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="font-bold text-gray-900 uppercase">THỦ KHO XUẤT</div>
                  <div className="text-[10px] text-gray-500">(Ký, ghi rõ họ tên)</div>
                </div>
                <div className="text-gray-400 font-mono text-xs italic">
                  (Đã kiểm soát &amp; đóng gói)
                </div>
              </div>

              <div className="space-y-12">
                <div>
                  <div className="font-bold text-gray-900 uppercase">NGƯỜI NHẬN HÀNG</div>
                  <div className="text-[10px] text-gray-500">(Ký, xác nhận nguyên vẹn)</div>
                </div>
                <div className="font-bold text-gray-800">
                  {pickSlipModalOrder.recipient_name || pickSlipModalOrder.customer_name || 'Khách hàng'}
                </div>
              </div>
            </div>

            {/* Print Footer Watermark / Stamp */}
            <div className="pt-4 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-400 font-mono">
              <span>Hệ thống ERP TechGear · Bàn làm việc Vận hành &amp; Xuất kho STF</span>
              <span>In lúc: {new Date().toLocaleTimeString('vi-VN')} · Ngày {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>
      )}

          
      {/* ======================================================================
          REJECT ORDER MODAL (Cancel Order <<include>> Reject Reason)
         ====================================================================== */}
      {cancelOrderModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isSubmittingReject && setCancelOrderModal(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl space-y-4 ${
              isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold">Từ chối / Hủy đơn hàng</h3>
                  <div className="text-[11px] font-mono text-cyan-400">
                    Mã đơn: <strong>{cancelOrderModal.order_code}</strong>
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={isSubmittingReject}
                onClick={() => setCancelOrderModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Summary Snapshot */}
            <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-semibold">{cancelOrderModal.recipient_name || cancelOrderModal.customer_name || 'Khách hàng'} ({cancelOrderModal.recipient_phone || cancelOrderModal.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tổng giá trị đơn:</span>
                <span className="font-mono font-bold text-rose-400">{formatVND(cancelOrderModal.final_amount || cancelOrderModal.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hình thức thanh toán:</span>
                <span className="font-bold">
                  {cancelOrderModal.payment_method === 'cod' ? 'Thanh toán COD' : 'Chuyển khoản VietQR'} ·{' '}
                  {cancelOrderModal.payment_status === 'paid' ? (
                    <span className="text-emerald-400">Đã thanh toán (Paid)</span>
                  ) : (
                    <span className="text-amber-400">Chưa thanh toán</span>
                  )}
                </span>
              </div>
            </div>

            {/* VietQR Refund Notice */}
            {cancelOrderModal.payment_status === 'paid' && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="leading-relaxed">
                  <strong className="text-amber-300 block">Lưu ý Hoàn tiền (Auto Refund Notice):</strong>
                  Đơn hàng đã được thanh toán qua VietQR. Khi xác nhận từ chối, hệ thống sẽ tự động cập nhật trạng thái sang <strong className="text-white">"Đã hoàn tiền (Refunded)"</strong>, ghi nhận vào đối soát tài chính và hoàn trả lại số lượng tồn kho linh kiện.
                </div>
              </div>
            )}

            {/* Reject Reason Selection (<<include>> Reject Reason) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Lý do từ chối đơn hàng (Reject Reason) <span className="text-rose-400">*</span>
              </label>
              <div className="space-y-1.5">
                {REJECT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition ${
                      rejectReasonPreset === r.label
                        ? 'border-rose-500 bg-rose-500/10 text-rose-300 font-semibold'
                        : isDark ? 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reject_reason"
                      value={r.label}
                      checked={rejectReasonPreset === r.label}
                      onChange={() => {
                        setRejectReasonPreset(r.label);
                        setRejectReasonCustom('');
                      }}
                      className="accent-rose-500"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>

              {/* Custom Input */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Hoặc nhập lý do từ chối chi tiết khác..."
                  value={rejectReasonCustom}
                  onChange={(e) => {
                    setRejectReasonCustom(e.target.value);
                    if (e.target.value) setRejectReasonPreset('');
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs border outline-none transition ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white focus:border-rose-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-rose-500'
                  }`}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-inherit">
              <button
                type="button"
                disabled={isSubmittingReject}
                onClick={() => setCancelOrderModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmittingReject || (!rejectReasonPreset && !rejectReasonCustom.trim())}
                onClick={handleConfirmRejectOrder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isSubmittingReject ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Xác nhận từ chối đơn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
