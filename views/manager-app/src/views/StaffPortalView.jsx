import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Cpu, Sun, Moon, LogOut, Search, Bell, CheckCircle2, Truck, FileText,
  Package, RotateCcw, Star, CalendarCheck, ClipboardList, Printer,
  MapPin, Phone, User, ShieldCheck, AlertTriangle, Clock, ChevronRight,
  X, Check, QrCode, CreditCard, Eye, RefreshCw, MoreVertical, Ban,
  ArrowRight, MessageSquare, Send, Sparkles, CheckCheck, Trash2, Edit3, CornerDownRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ============================================================================
   MYSQL RELATIONAL SCHEMA SEED DATA (SDS SPECIFICATION)
   Tables: staffs, staff_schedules, orders, order_items, return_requests,
           reviews, staff_tasks
   ============================================================================ */

const INITIAL_STAFF_PROFILE = {
  staff_id: 102,
  staff_code: 'STF-102',
  full_name: 'Nguyễn Văn Nam',
  department: 'Warehouse', // 'Warehouse' | 'Sales' | 'Customer Support'
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  schedule: {
    schedule_id: 501,
    work_date: 'Hôm nay (21/09/2026)',
    shift: 'morning', // 'morning' (08:00-16:00) | 'afternoon' (16:00-22:00)
    shift_hours: '08:00 - 16:00'
  }
};

const INITIAL_ORDERS = [
  {
    order_id: 1201,
    order_code: 'ORD-176208573-1201',
    created_at: '2026-09-21 14:25:10',
    recipient_name: 'Nguyễn Văn Minh',
    recipient_phone: '0908 123 456',
    shipping_address: 'Số 12, Ngõ 45 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
    order_notes: 'Giao giờ hành chính, bọc chống sốc kỹ card RTX 4090 White Edition.',
    payment_method: 'vietqr_banking',
    payment_status: 'paid',
    shipping_status: 'pending',
    total_amount: 90470000,
    shipping_fee: 0,
    final_amount: 90470000,
    processed_by_staff_id: null,
    pick_slip_printed: false,
    order_items: [
      {
        item_id: 1,
        product_name: 'ASUS ROG Strix GeForce RTX 4090 24GB GDDR6X',
        variant_name: 'White Edition · OC Mode',
        sku: 'ROG-STRIX-RTX4090-O24G-W',
        unit_price: 54990000,
        quantity: 1,
        subtotal: 54990000,
        thumbnail: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=240&auto=format&fit=crop&q=80'
      },
      {
        item_id: 2,
        product_name: 'Màn Hình Gaming ASUS ROG Swift OLED PG32UCDM 32"',
        variant_name: '4K QD-OLED · 240Hz · 0.03ms',
        sku: 'PG32UCDM-OLED-32',
        unit_price: 31990000,
        quantity: 1,
        subtotal: 31990000,
        thumbnail: 'https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?w=240&auto=format&fit=crop&q=80'
      },
      {
        item_id: 3,
        product_name: 'Chuột Không Dây Logitech G Pro X Superlight 2 DEX',
        variant_name: 'Trắng Tuyết (White) · 8000Hz Polling',
        sku: 'G-PRO-SL2-DEX-W',
        unit_price: 3490000,
        quantity: 1,
        subtotal: 3490000,
        thumbnail: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1202,
    order_code: 'ORD-176208573-1202',
    created_at: '2026-09-21 14:12:04',
    recipient_name: 'Phạm Đức Anh',
    recipient_phone: '0934 111 222',
    shipping_address: '86 Nguyễn Thị Minh Khai, Phường Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    order_notes: 'Lắp sẵn CPU + SSD vào Mainboard trước khi đóng thùng xốp.',
    payment_method: 'vietqr_banking',
    payment_status: 'paid',
    shipping_status: 'pending',
    total_amount: 36900000,
    shipping_fee: 0,
    final_amount: 36900000,
    processed_by_staff_id: null,
    pick_slip_printed: false,
    order_items: [
      {
        item_id: 4,
        product_name: 'PC Gaming & Creator Studio Ryzen 7 7800X3D',
        variant_name: 'RTX 4070 Super 12G · 32GB DDR5 · 1TB NVMe Gen4',
        sku: 'PC-CREATOR-7800X3D',
        unit_price: 36900000,
        quantity: 1,
        subtotal: 36900000,
        thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1203,
    order_code: 'ORD-176208573-1203',
    created_at: '2026-09-21 13:50:42',
    recipient_name: 'Trần Thị Thu Thảo',
    recipient_phone: '0912 987 654',
    shipping_address: 'Tòa S2.05 Vinhomes Grand Park, Phường Long Thạnh Mỹ, TP. Thủ Đức, TP.HCM',
    order_notes: 'Gọi điện trước khi giao 15 phút, khách nhận tại sảnh lễ tân.',
    payment_method: 'cod',
    payment_status: 'unpaid',
    shipping_status: 'processing',
    total_amount: 7980000,
    shipping_fee: 35000,
    final_amount: 8015000,
    processed_by_staff_id: 'STF-102',
    pick_slip_printed: true,
    order_items: [
      {
        item_id: 5,
        product_name: 'Chuột Logitech G Pro X Superlight 2 DEX',
        variant_name: 'Hồng Magenta · Optical Switch',
        sku: 'G-PRO-SL2-DEX-M',
        unit_price: 3490000,
        quantity: 1,
        subtotal: 3490000,
        thumbnail: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=240&auto=format&fit=crop&q=80'
      },
      {
        item_id: 6,
        product_name: 'Bàn Phím Cơ Keychron Q1 Pro QMK/VIA Wireless',
        variant_name: 'Shell White · K Pro Banana Switch · Nhôm CNC',
        sku: 'KC-Q1PRO-W-BAN',
        unit_price: 4490000,
        quantity: 1,
        subtotal: 4490000,
        thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1204,
    order_code: 'ORD-176208573-1204',
    created_at: '2026-09-21 13:18:19',
    recipient_name: 'Vũ Hoàng Yến',
    recipient_phone: '0965 321 789',
    shipping_address: '102 Lạch Tray, Phường Lạch Tray, Quận Ngô Quyền, TP. Hải Phòng',
    order_notes: 'Giao buổi chiều sau 15h00. Kiểm tra nguyên seal hộp Intel.',
    payment_method: 'cod',
    payment_status: 'unpaid',
    shipping_status: 'pending',
    total_amount: 14990000,
    shipping_fee: 45000,
    final_amount: 15035000,
    processed_by_staff_id: null,
    pick_slip_printed: false,
    order_items: [
      {
        item_id: 7,
        product_name: 'CPU Intel Core i9-14900K Box Chính Hãng',
        variant_name: '24 Nhân 32 Luồng · Up to 6.0GHz · LGA1700',
        sku: 'BX8071514900K',
        unit_price: 14990000,
        quantity: 1,
        subtotal: 14990000,
        thumbnail: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1205,
    order_code: 'ORD-176208573-1205',
    created_at: '2026-09-21 12:40:00',
    recipient_name: 'Lê Hoàng Nam',
    recipient_phone: '0983 555 888',
    shipping_address: '218B Đội Cấn, Phường Liễu Giai, Quận Ba Đình, Hà Nội',
    order_notes: 'Đã chuyển khoản VietQR, nhờ shop xuất hóa đơn điện tử VAT công ty.',
    payment_method: 'vietqr_banking',
    payment_status: 'paid',
    shipping_status: 'shipping',
    total_amount: 20480000,
    shipping_fee: 0,
    final_amount: 20480000,
    processed_by_staff_id: 'STF-102',
    pick_slip_printed: true,
    order_items: [
      {
        item_id: 8,
        product_name: 'CPU Intel Core i9-14900K Box Chính Hãng',
        variant_name: '24 Nhân 32 Luồng · Socket LGA1700',
        sku: 'BX8071514900K',
        unit_price: 14990000,
        quantity: 1,
        subtotal: 14990000,
        thumbnail: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=240&auto=format&fit=crop&q=80'
      },
      {
        item_id: 9,
        product_name: 'Tai Nghe Gaming Logitech G PRO X 2 LIGHTSPEED',
        variant_name: 'Trắng (White) · Driver Graphene 50mm',
        sku: 'GPRO-X2-LS-W',
        unit_price: 5490000,
        quantity: 1,
        subtotal: 5490000,
        thumbnail: 'https://images.unsplash.com/photo-1610041321063-bbaf5286de89?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1206,
    order_code: 'ORD-176208573-1206',
    created_at: '2026-09-21 11:55:27',
    recipient_name: 'Đỗ Quang Khải',
    recipient_phone: '0946 777 333',
    shipping_address: 'Số 54 Liễu Giai, Quận Ba Đình, Hà Nội',
    order_notes: 'Đóng gói kèm cáp chuyển 12VHPWR chính hãng Corsair.',
    payment_method: 'vietqr_banking',
    payment_status: 'paid',
    shipping_status: 'processing',
    total_amount: 15780000,
    shipping_fee: 0,
    final_amount: 15780000,
    processed_by_staff_id: 'STF-102',
    pick_slip_printed: false,
    order_items: [
      {
        item_id: 10,
        product_name: 'RAM Corsair Dominator Titanium 64GB (2x32GB)',
        variant_name: 'White · DDR5 6600MHz · RGB LED',
        sku: 'CMP64GX5M2X6600C32W',
        unit_price: 7890000,
        quantity: 2,
        subtotal: 15780000,
        thumbnail: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1207,
    order_code: 'ORD-176208573-1207',
    created_at: '2026-09-21 11:05:12',
    recipient_name: 'Bùi Quang Huy',
    recipient_phone: '0903 888 234',
    shipping_address: 'Số 9 Trần Thái Tông, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    order_notes: 'Khách đã nhận hàng và kích hoạt bảo hành điện tử Serial Number.',
    payment_method: 'vietqr_banking',
    payment_status: 'paid',
    shipping_status: 'delivered',
    total_amount: 31990000,
    shipping_fee: 0,
    final_amount: 31990000,
    processed_by_staff_id: 'STF-102',
    pick_slip_printed: true,
    order_items: [
      {
        item_id: 11,
        product_name: 'Màn Hình Gaming ASUS ROG Swift OLED PG32UCDM',
        variant_name: '32 inch · 4K QD-OLED · 240Hz · USB-C 90W',
        sku: 'PG32UCDM-OLED-32',
        unit_price: 31990000,
        quantity: 1,
        subtotal: 31990000,
        thumbnail: 'https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1208,
    order_code: 'ORD-176208573-1208',
    created_at: '2026-09-21 10:22:50',
    recipient_name: 'Ngô Minh Quân',
    recipient_phone: '0978 456 123',
    shipping_address: '145 Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng',
    order_notes: 'Khách yêu cầu hủy đơn để đổi sang cấu hình RTX 4080 Super.',
    payment_method: 'cod',
    payment_status: 'unpaid',
    shipping_status: 'cancelled',
    total_amount: 18590000,
    shipping_fee: 50000,
    final_amount: 18640000,
    processed_by_staff_id: 'STF-102',
    pick_slip_printed: false,
    order_items: [
      {
        item_id: 12,
        product_name: 'Card Màn Hình GIGABYTE GeForce RTX 4070 Ti SUPER',
        variant_name: 'AERO OC 16GB GDDR6X · White',
        sku: 'GV-N407TSAERO-OC-16GD',
        unit_price: 18590000,
        quantity: 1,
        subtotal: 18590000,
        thumbnail: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1209,
    order_code: 'ORD-176208573-1209',
    created_at: '2026-09-21 09:45:33',
    recipient_name: 'Hoàng Thanh Tùng',
    recipient_phone: '0919 654 321',
    shipping_address: 'Khu đô thị Ecopark, Huyện Văn Giang, Tỉnh Hưng Yên',
    order_notes: 'Giao trong ngày, kiểm tra kỹ cáp DisplayPort 2.1 đi kèm.',
    payment_method: 'vietqr_banking',
    payment_status: 'paid',
    shipping_status: 'pending',
    total_amount: 24990000,
    shipping_fee: 40000,
    final_amount: 25030000,
    processed_by_staff_id: null,
    pick_slip_printed: false,
    order_items: [
      {
        item_id: 13,
        product_name: 'Màn Hình LG UltraGear 32GS95UE-B 32" 4K OLED',
        variant_name: 'Dual-Mode 4K 240Hz / FHD 480Hz · Pixel Sound',
        sku: '32GS95UE-B-OLED',
        unit_price: 24990000,
        quantity: 1,
        subtotal: 24990000,
        thumbnail: 'https://images.unsplash.com/photo-1614179924047-e1ab49a0a0cf?w=240&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    order_id: 1210,
    order_code: 'ORD-176208573-1210',
    created_at: '2026-09-21 09:10:05',
    recipient_name: 'Đặng Thu Hà',
    recipient_phone: '0989 222 888',
    shipping_address: 'Số 28 Nguyễn Trãi, Quận Thanh Xuân, Hà Nội',
    order_notes: 'Thu hộ COD đúng số tiền trên phiếu xuất kho.',
    payment_method: 'cod',
    payment_status: 'unpaid',
    shipping_status: 'shipping',
    total_amount: 6390000,
    shipping_fee: 30000,
    final_amount: 6420000,
    processed_by_staff_id: 'STF-102',
    pick_slip_printed: true,
    order_items: [
      {
        item_id: 14,
        product_name: 'Nguồn Corsair RM1000e ATX 3.0 PCIe 5.0',
        variant_name: 'White · 1000W 80 Plus Gold · Full Modular',
        sku: 'CP-9020264-NA',
        unit_price: 2900000,
        quantity: 1,
        subtotal: 2900000,
        thumbnail: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=240&auto=format&fit=crop&q=80'
      },
      {
        item_id: 15,
        product_name: 'Chuột Logitech G Pro X Superlight 2 DEX',
        variant_name: 'Đen (Black) · HERO 2 Sensor 32K DPI',
        sku: 'G-PRO-SL2-DEX-B',
        unit_price: 3490000,
        quantity: 1,
        subtotal: 3490000,
        thumbnail: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=240&auto=format&fit=crop&q=80'
      }
    ]
  }
];

const INITIAL_RETURN_REQUESTS = [
  {
    return_id: 'RET-409',
    order_id: 'ORD-176208573-1194',
    customer_id: 'CUS-8821',
    customer_name: 'Đặng Quốc Khánh',
    customer_phone: '0977 404 909',
    product_name: 'Màn Hình LG UltraGear 32GS95UE 32" 4K OLED',
    sku: '32GS95UE-B-OLED',
    reason: 'Tấm nền xuất hiện 1 điểm chết sáng ở góc phải dưới sau 48h sử dụng (kèm video unbox).',
    refund_amount: 24990000,
    created_at: '2026-09-21 10:05',
    status: 'pending' // 'pending' | 'approved' | 'rejected' | 'refunded'
  },
  {
    return_id: 'RET-408',
    order_id: 'ORD-176208573-1189',
    customer_id: 'CUS-7610',
    customer_name: 'Hoàng Minh Tuấn',
    customer_phone: '0918 222 678',
    product_name: 'Chuột Logitech G Pro X Superlight 2 DEX White',
    sku: 'G-PRO-SL2-DEX-W',
    reason: 'Con lăn cuộn (scroll wheel encoder) bị nhảy bước ngược khi cuộn nhanh.',
    refund_amount: 3490000,
    created_at: '2026-09-21 09:15',
    status: 'pending'
  },
  {
    return_id: 'RET-407',
    order_id: 'ORD-176208573-1182',
    customer_id: 'CUS-6402',
    customer_name: 'Nguyễn Thị Lan',
    customer_phone: '0945 612 333',
    product_name: 'RAM Corsair Dominator Titanium 64GB DDR5 6600MHz',
    sku: 'CMP64GX5M2X6600C32W',
    reason: 'Khách đặt nhầm kit Intel XMP cho bo mạch chủ AMD AM5 (hộp còn nguyên seal nilon).',
    refund_amount: 7890000,
    created_at: '2026-09-20 17:40',
    status: 'pending'
  },
  {
    return_id: 'RET-406',
    order_id: 'ORD-176208573-1165',
    customer_id: 'CUS-5190',
    customer_name: 'Trịnh Đình Quang',
    customer_phone: '0904 512 999',
    product_name: 'Bàn Phím Cơ Keychron Q1 Pro Wireless',
    sku: 'KC-Q1PRO-W-BAN',
    reason: 'Hoàn tiền chênh lệch chương trình ưu đãi Back-to-School qua VietQR.',
    refund_amount: 500000,
    created_at: '2026-09-20 11:20',
    status: 'refunded'
  }
];

const INITIAL_REVIEWS = [
  {
    review_id: 'REV-901',
    customer_name: 'Nguyễn Văn Minh',
    product_name: 'ASUS ROG Strix GeForce RTX 4090 White Edition 24GB',
    sku: 'ROG-STRIX-RTX4090-O24G-W',
    rating: 5,
    comment: 'Card đẹp xuất sắc cho bộ PC full trắng, full load Cyberpunk 4K Path Tracing chỉ 62 độ C, đóng gói chống sốc rất kỹ!',
    is_verified_buyer: true,
    created_at: '2026-09-21 14:05',
    status: 'approved',
    staff_reply: 'Dạ TechShop chân thành cảm ơn anh Minh đã tin tưởng và ủng hộ sản phẩm cao cấp bên shop ạ! Chúc anh có trải nghiệm đồ họa tuyệt vời nhất!',
    staff_replied_at: '2026-09-21 14:20'
  },
  {
    review_id: 'REV-902',
    customer_name: 'Lê Hoàng Nam',
    product_name: 'Tai Nghe Gaming Logitech G PRO X 2 LIGHTSPEED Trắng',
    sku: 'GPRO-X2-LS-W',
    rating: 5,
    comment: 'Âm bước chân trong CS2 rất rõ và tách lớp tốt, đệm tai đeo êm hơn bản đời đầu, pin dùng cả tuần chưa cần sạc.',
    is_verified_buyer: true,
    created_at: '2026-09-21 12:50',
    status: 'approved',
    staff_reply: null,
    staff_replied_at: null
  },
  {
    review_id: 'REV-903',
    customer_name: 'Phạm Quốc Bảo',
    product_name: 'CPU Intel Core i9-14900K Box Chính Hãng',
    sku: 'BX8071514900K',
    rating: 3,
    comment: 'Render Premiere cực nhanh nhưng bắt buộc phải đi kèm tản nước AIO 360mm và cập nhật BIOS microcode 0x129 mới nhất.',
    is_verified_buyer: true,
    created_at: '2026-09-21 10:30',
    status: 'approved',
    staff_reply: null,
    staff_replied_at: null
  },
  {
    review_id: 'REV-904',
    customer_name: 'Tài Khoản Ẩn Danh',
    product_name: 'Màn Hình Gaming ASUS ROG Swift OLED PG32UCDM 32"',
    sku: 'PG32UCDM-OLED-32',
    rating: 1,
    comment: 'Spam link quảng cáo bên thứ ba không liên quan đến sản phẩm.',
    is_verified_buyer: false,
    created_at: '2026-09-20 22:15',
    status: 'hidden',
    staff_reply: null,
    staff_replied_at: null
  }
];

const INITIAL_STAFF_TASKS = [
  {
    task_id: 'TSK-101',
    title: 'Tiếp nhận & xuất phiếu kho lô đơn VietQR Paid ưu tiên đầu ca sáng',
    priority: 'urgent', // 'low' | 'medium' | 'high' | 'urgent'
    status: 'completed', // 'todo' | 'in_progress' | 'completed'
    due_date: '2026-09-21 09:30'
  },
  {
    task_id: 'TSK-102',
    title: 'Quét mã Serial Number & dán tem bảo hành lô card RTX 4090 White Edition',
    priority: 'high',
    status: 'completed',
    due_date: '2026-09-21 10:30'
  },
  {
    task_id: 'TSK-103',
    title: 'Bàn giao kiện hàng đợt 1 kèm biên bản đồng kiểm cho Shipper GHN Express',
    priority: 'high',
    status: 'completed',
    due_date: '2026-09-21 11:30'
  },
  {
    task_id: 'TSK-104',
    title: 'Kiểm đếm tồn kho vật lý kệ Gaming Gear (Logitech G Pro / Keychron)',
    priority: 'medium',
    status: 'completed',
    due_date: '2026-09-21 13:30'
  },
  {
    task_id: 'TSK-105',
    title: 'Thẩm định 3 yêu cầu đổi trả & hoàn tiền (RET-409, RET-408, RET-407)',
    priority: 'urgent',
    status: 'in_progress',
    due_date: '2026-09-21 15:00'
  },
  {
    task_id: 'TSK-106',
    title: 'Kiểm duyệt đánh giá khách hàng mới & chốt biên bản bàn giao ca chiều',
    priority: 'low',
    status: 'todo',
    due_date: '2026-09-21 16:00'
  }
];

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
    label: 'Chờ xác nhận (pending)',
    shortLabel: 'Chờ duyệt (pending)',
    variant: 'amber',
    stepIndex: 0
  },
  processing: {
    label: 'Đang đóng gói (processing)',
    shortLabel: 'Đang đóng gói (processing)',
    variant: 'cyan',
    stepIndex: 1
  },
  shipping: {
    label: 'Đang giao (shipping)',
    shortLabel: 'Đang giao (shipping)',
    variant: 'sky',
    stepIndex: 2
  },
  delivered: {
    label: 'Hoàn tất (delivered)',
    shortLabel: 'Hoàn tất (delivered)',
    variant: 'emerald',
    stepIndex: 3
  },
  cancelled: {
    label: 'Đã hủy (cancelled)',
    shortLabel: 'Đã hủy (cancelled)',
    variant: 'slate',
    stepIndex: -1
  }
};

const PRIORITY_META = {
  low: { label: 'low', variant: 'slate' },
  medium: { label: 'medium', variant: 'sky' },
  high: { label: 'high', variant: 'amber' },
  urgent: { label: 'urgent', variant: 'rose' }
};

const TASK_STATUS_META = {
  todo: { label: 'todo', variant: 'slate' },
  in_progress: { label: 'in_progress', variant: 'cyan' },
  completed: { label: 'completed', variant: 'emerald' }
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

/* ============================================================================
   MAIN EXPORT: TECHSHOP STAFF OPERATIONS PORTAL (1440PX HIGH-DENSITY DESKTOP)
   ============================================================================ */
export default function StaffPortalView() {
  const { user: authUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Active Sidebar Navigation Section ('orders' | 'returns' | 'reviews' | 'tasks')
  const [activeMenu, setActiveMenu] = useState('orders');
  const handleSelectMenu = (m) => {
    setActiveMenu(m);
    setStatusFilter('all');
    setSearchQuery('');
  };

  // Current Staff Profile & Schedule (Directly synced from Auth & Database)
  const [staffProfile, setStaffProfile] = useState(() => ({
    staff_id: authUser?.staff_id || authUser?.id || 102,
    staff_code: authUser?.staff_code || 'STF005',
    full_name: authUser?.full_name || authUser?.name || 'Vũ Thùy Linh',
    avatar: authUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80',
    department: authUser?.department || 'Đóng Gói & Xuất Kho',
    role: authUser?.role || 'staff',
    schedule: {
      work_date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      shift: 'Ca sáng (morning)',
      shift_hours: '08:00 - 16:00'
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
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [selectedOrderCode, setSelectedOrderCode] = useState('ORD-176208573-1201');
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
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [checkedOrderCodes, setCheckedOrderCodes] = useState(['ORD-176208573-1201']);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
  const [openActionDropdown, setOpenActionDropdown] = useState(null);

  const [returnRequests, setReturnRequests] = useState(INITIAL_RETURN_REQUESTS);
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [staffTasks, setStaffTasks] = useState(INITIAL_STAFF_TASKS);

  // RTC Real-Time Customer Chat State
  const [rtcModalOrder, setRtcModalOrder] = useState(null);
  const [rtcChatInput, setRtcChatInput] = useState('');
  const [rtcMessages, setRtcMessages] = useState([
    {
      id: 1,
      sender: 'customer',
      senderName: 'Nguyễn Văn Minh',
      text: 'Shop ơi đơn ORD-176208573-1201 mình dặn bọc xốp kỹ card RTX 4090 White nhé, với giao giờ hành chính giúp mình!',
      time: '14:26'
    },
    {
      id: 2,
      sender: 'staff',
      senderName: 'Staff Nguyễn Văn Nam',
      text: 'Dạ chào anh Minh! Đơn hàng của anh đã thanh toán VietQR thành công, em đã in phiếu xuất kho và gắn tag "Đơn hàng giá trị cao", bên em sẽ bọc 2 lớp xốp bong bóng và dán tem niêm phong trước khi giao cho GHN ạ!',
      time: '14:28'
    }
  ]);

  // Topbar UI state
  const [notifOpen, setNotifOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [pickSlipModalOrder, setPickSlipModalOrder] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2800);
  };

  // Fetch all real entities from MySQL Database via REST APIs
  const fetchDatabaseData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Orders from Database API
      try {
        const res = await fetch('/api/orders?limit=100');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const dbOrders = json.data.map((o, idx) => {
            const rawItems = Array.isArray(o.items) ? o.items : [];
            const amount = Number(o.final_amount || o.total || 0);
            return {
              order_id: o.orderId || o.order_code || (1200 + idx),
              order_code: o.order_code || o.orderCode || `ORD-DB-${idx + 1}`,
              created_at: o.created_at || o.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
              recipient_name: o.recipient_name || o.recipientName || 'Khách hàng',
              recipient_phone: o.recipient_phone || o.recipientPhone || '0900 000 000',
              shipping_address: o.shipping_address || o.shippingAddress || 'Địa chỉ nhận hàng',
              order_notes: o.order_notes || o.orderNotes || '',
              payment_method: o.payment_method || o.paymentMethodCode || 'vietqr_banking',
              payment_status: o.payment_status || o.paymentStatus || 'paid',
              shipping_status: o.shipping_status || o.shippingStatus || 'pending',
              total_amount: Number(o.total_amount || o.subtotal || amount),
              shipping_fee: Number(o.shipping_fee || o.shippingFee || 0),
              final_amount: amount,
              processed_by_staff_id: o.processed_by_staff_id || null,
              pick_slip_printed: false,
              is_high_value: amount >= 10000000,
              customer_credibility: '100% nhận hàng (Lịch sử uy tín)',
              has_rtc_request: Boolean(o.cancel_requested_at || (o.order_notes && o.order_notes.length > 0)),
              order_items: rawItems.length > 0 ? rawItems.map((it, i) => ({
                item_id: it.id || i + 1,
                product_name: it.name || it.product_name || 'Sản phẩm công nghệ TechShop',
                variant_name: it.variant || it.variant_name || 'Bản tiêu chuẩn',
                sku: it.sku || `SKU-${it.id || i + 1}`,
                unit_price: Number(it.unit_price || it.price || 0),
                quantity: Number(it.quantity || 1),
                subtotal: Number(it.subtotal || (Number(it.unit_price || it.price || 0) * Number(it.quantity || 1))),
                thumbnail: it.image || it.image_url || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=240&auto=format&fit=crop&q=80'
              })) : [
                {
                  item_id: 1,
                  product_name: 'Linh kiện phần cứng TechShop BleenTechGear',
                  variant_name: 'Bản phân phối chính hãng',
                  sku: 'TECH-HW-GENUINE',
                  unit_price: amount,
                  quantity: 1,
                  subtotal: amount,
                  thumbnail: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=240&auto=format&fit=crop&q=80'
                }
              ]
            };
          });
          setOrders(dbOrders);
          setSelectedOrderCode(dbOrders[0].order_code);
        }
      } catch (err) {
        console.warn('Orders API not responding, keeping current seed:', err);
      }

      // 2. Fetch Return Requests from Database API
      try {
        const res = await fetch('/api/returns');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setReturnRequests(json.data.map((r) => ({
            return_id: `RET-${r.id}`,
            created_at: r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 16) : 'Hôm nay',
            order_id: r.order_code || `ORD-${r.order_id}`,
            customer_id: `CUST-${r.customer_id}`,
            customer_name: r.recipient_name || `Khách hàng #${r.customer_id}`,
            customer_phone: r.recipient_phone || '0908 000 000',
            product_name: r.product_name || 'Linh kiện / Thiết bị đổi trả',
            reason: r.reason || 'Sản phẩm lỗi hoặc không tương thích',
            refund_amount: Number(r.final_amount || 0),
            status: r.status || 'pending'
          })));
        }
      } catch (err) {
        console.warn('Returns API not responding:', err);
      }

      // 3. Fetch Reviews from Database API
      try {
        const res = await fetch('/api/reviews');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setReviews(json.data.map((rv) => ({
            review_id: `REV-${rv.review_id}`,
            customer_name: rv.customer_name || 'Khách hàng TechShop',
            product_name: rv.product_name || 'Linh kiện Gaming Gear',
            sku: `SKU-${rv.product_id}`,
            rating: Number(rv.rating || 5),
            comment: rv.comment || 'Sản phẩm hoạt động tốt, đóng gói cẩn thận!',
            is_verified_buyer: Boolean(rv.is_verified_buyer),
            created_at: rv.created_at ? new Date(rv.created_at).toISOString().replace('T', ' ').slice(0, 16) : 'Vừa xong',
            status: rv.status || 'approved',
            staff_reply: rv.staff_reply || null,
            staff_replied_at: rv.staff_replied_at ? new Date(rv.staff_replied_at).toISOString().replace('T', ' ').slice(0, 16) : null
          })));
        }
      } catch (err) {
        console.warn('Reviews API not responding:', err);
      }

      // 4. Fetch Staff Tasks from Database API
      try {
        const res = await fetch('/api/staffs/tasks');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStaffTasks(json.data.map((t) => ({
            task_id: `TSK-${t.id || t.task_id}`,
            title: t.title,
            priority: t.priority || 'medium',
            status: t.status || 'todo',
            due_date: t.due_date ? new Date(t.due_date).toISOString().slice(0, 10) : '2026-09-21'
          })));
        }
      } catch (err) {
        console.warn('Tasks API not responding:', err);
      }

      // 5. Fetch Staff Profile from Database API
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/staffs/profile', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
        const json = await res.json();
        if (json.success && json.data) {
          setStaffProfile((prev) => ({
            ...prev,
            ...json.data
          }));
        }
      } catch (err) {}

    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDatabaseData();
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
    sidebarBg: isDark
      ? 'bg-[#0b0f19] border-r border-[#1e293b]'
      : 'bg-[#ffffff] border-r border-[#e2e8f0]',
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
        const matchName = ord.recipient_name.toLowerCase().includes(q);
        const matchPhone = ord.recipient_phone.toLowerCase().includes(q);
        const matchSku = ord.order_items.some(
          (it) =>
            it.sku.toLowerCase().includes(q) || it.product_name.toLowerCase().includes(q)
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

  // Dynamic filtered return requests
  const filteredReturns = useMemo(() => {
    return returnRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.return_id.toLowerCase().includes(q) ||
          r.order_id.toLowerCase().includes(q) ||
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_phone.toLowerCase().includes(q) ||
          r.product_name.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
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
      await fetch(`/api/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus: 'processing' })
      });
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
      await fetch(`/api/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus: 'shipping' })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    triggerToast(`Đã in vận đơn & bàn giao Shipper cho đơn ${orderCode} -> Đang giao (shipping)`);
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
      await fetch(`/api/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus: 'delivered' })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    triggerToast(`Đã xác nhận giao thành công đơn ${orderCode} -> Hoàn tất (delivered)`);
  };

  // Cancel order
  const handleCancelOrder = async (orderCode) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_code === orderCode
          ? {
              ...o,
              shipping_status: 'cancelled',
              payment_status: o.payment_status === 'paid' ? 'refunded' : o.payment_status,
              processed_by_staff_id: o.processed_by_staff_id || staffProfile.staff_code
            }
          : o
      )
    );
    setOpenActionDropdown(null);
    try {
      await fetch(`/api/orders/${orderCode}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus: 'cancelled' })
      });
    } catch (e) {
      console.warn('API sync warning:', e);
    }
    triggerToast(`Đã hủy đơn hàng ${orderCode} -> Đã hủy (cancelled)`);
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
        await fetch(`/api/returns/${cleanId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
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
        const res = await fetch(`/api/reviews/${cleanId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reply: trimmed })
        });
        const resJson = await res.json();
        if (!resJson.success) {
          throw new Error(resJson.message || 'Lỗi khi gửi phản hồi');
        }
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
        await fetch(`/api/reviews/${cleanId}/reply`, {
          method: 'DELETE'
        });
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
        await fetch(`/api/reviews/${cleanId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });
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
  const handleCycleTaskStatus = async (taskId, explicitStatus = null) => {
    let targetStatus = explicitStatus;
    setStaffTasks((prev) =>
      prev.map((tsk) => {
        if (tsk.task_id !== taskId) return tsk;
        const next =
          explicitStatus ||
          (tsk.status === 'todo'
            ? 'in_progress'
            : tsk.status === 'in_progress'
              ? 'completed'
              : 'todo');
        targetStatus = next;
        return { ...tsk, status: next };
      })
    );
    const cleanId = String(taskId).replace(/[^0-9]/g, '');
    if (cleanId && targetStatus) {
      try {
        await fetch(`/api/staffs/tasks/${cleanId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: targetStatus })
        });
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
      key: 'reviews',
      label: 'Phản hồi đánh giá',
      icon: MessageSquare,
      badge: unrepliedCount,
      badgeVariant: 'sky'
    },
    {
      key: 'tasks',
      label: 'Nhiệm vụ & Ca trực',
      icon: CalendarCheck,
      badge: `${kpiCompletedTasks}/${kpiTotalTasks}`,
      badgeVariant: 'violet'
    }
  ];

  // Dynamic Status Filter Tabs Configuration per Active Section
  const ORDER_FILTER_TABS = [
    { key: 'all', label: 'Tất cả đơn', pillVariant: 'slate', count: orders.length },
    { key: 'pending', label: 'Chờ xác nhận (pending)', pillVariant: 'amber', count: kpiPendingOrders },
    { key: 'processing', label: 'Đang đóng gói (processing)', pillVariant: 'cyan', count: kpiProcessingOrders },
    { key: 'shipping', label: 'Đang giao (shipping)', pillVariant: 'sky', count: kpiShippingOrders },
    { key: 'delivered', label: 'Hoàn tất (delivered)', pillVariant: 'emerald', count: kpiDeliveredOrders },
    { key: 'cancelled', label: 'Đã hủy (cancelled)', pillVariant: 'slate', count: orders.filter((o) => o.shipping_status === 'cancelled').length }
  ];

  const RETURN_FILTER_TABS = [
    { key: 'all', label: 'Tất cả yêu cầu', pillVariant: 'slate', count: returnRequests.length },
    { key: 'pending', label: 'Chờ xử lý (pending)', pillVariant: 'amber', count: returnRequests.filter((r) => r.status === 'pending').length },
    { key: 'approved', label: 'Đã duyệt đổi (approved)', pillVariant: 'cyan', count: returnRequests.filter((r) => r.status === 'approved').length },
    { key: 'refunded', label: 'Đã hoàn tiền (refunded)', pillVariant: 'emerald', count: returnRequests.filter((r) => r.status === 'refunded').length },
    { key: 'rejected', label: 'Từ chối (rejected)', pillVariant: 'rose', count: returnRequests.filter((r) => r.status === 'rejected').length }
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
    { key: 'todo', label: 'Cần làm (todo)', pillVariant: 'amber', count: staffTasks.filter((t) => t.status !== 'completed').length },
    { key: 'completed', label: 'Đã hoàn thành', pillVariant: 'emerald', count: staffTasks.filter((t) => t.status === 'completed').length }
  ];

  const currentTabs = useMemo(() => {
    switch (activeMenu) {
      case 'returns':
        return RETURN_FILTER_TABS;
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
    orders: 'Xử lý đơn hàng (Fulfillment Center)',
    returns: 'Yêu cầu đổi trả & Hoàn tiền (Returns & Refunds)',
    reviews: 'Phản hồi đánh giá khách hàng (Reviews & CS Replies)',
    tasks: 'Nhiệm vụ & Ca trực (My Tasks & Roster)'
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col lg:flex-row transition-colors duration-200 ${t.canvasBg} ${t.textPrimary}`}
      onClick={() => {
        if (openActionDropdown) setOpenActionDropdown(null);
      }}
    >
      {/* ======================================================================
          1. LEFT NAVIGATION SIDEBAR (240px Desktop Width)
         ====================================================================== */}
      <aside
        className={`w-full lg:w-[240px] shrink-0 flex flex-col p-3 select-none lg:h-[calc(100vh-53px)] lg:sticky lg:top-[53px] ${t.sidebarBg}`}
      >
        <div className="space-y-3 overflow-y-auto no-scrollbar flex-1">
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

          {/* Staff Identity Card (`staffs` & `staff_schedules`) */}
          <div className={`${t.surfaceCard} rounded-xl p-2.5 space-y-2`}>
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <img
                    src={staffProfile.avatar}
                    alt={staffProfile.full_name}
                    className="w-8 h-8 rounded-lg object-cover ring-2 ring-[#06b6d4]/40"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0f19]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold truncate">{staffProfile.full_name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isDark
                          ? 'bg-[#0b0f19] text-[#22d3ee] border border-[#334155]'
                          : 'bg-[#f1f5f9] text-[#0891b2] border border-[#e2e8f0]'
                      }`}
                    >
                      {staffProfile.staff_code}
                    </span>
                    <StatusBadge variant="violet" isDark={isDark} className="!text-[10px] !px-1.5 !py-0">
                      {staffProfile.department}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </div>

            {/* Shift Pill Badge (`staff_schedules`) */}
            <div
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold space-y-1 ${
                isDark
                  ? 'bg-[#0b0f19] border border-[#334155]'
                  : 'bg-[#f8fafc] border border-[#e2e8f0]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={t.textMuted}>work_date:</span>
                <span className="font-mono font-bold">{staffProfile.schedule.work_date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={t.textMuted}>shift:</span>
                <span
                  className={`inline-flex items-center gap-1 font-mono font-bold ${
                    isDark ? 'text-[#34d399]' : 'text-[#059669]'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  {staffProfile.schedule.shift} ({staffProfile.schedule.shift_hours})
                </span>
              </div>
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
        <div className={`pt-2.5 mt-auto border-t ${t.borderColor} shrink-0`}>
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
                        ? 'Tìm theo mã RMA (RET-...), mã đơn, tên khách, lý do...'
                        : activeMenu === 'reviews'
                          ? 'Tìm theo sản phẩm, tên khách, nội dung đánh giá hoặc phản hồi CSKH...'
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
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-mono font-bold flex items-center justify-center">
                    3
                  </span>
                </button>

                {notifOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-80 rounded-xl p-3 z-40 shadow-2xl ${t.surfaceCard}`}
                  >
                    <div className={`flex items-center justify-between pb-2 mb-2 border-b ${t.borderColor}`}>
                      <span className="text-xs font-extrabold">Thông báo hệ thống (3)</span>
                      <button
                        type="button"
                        onClick={() => setNotifOpen(false)}
                        className={`text-[10px] ${t.textMuted} cursor-pointer`}
                      >
                        Đóng
                      </button>
                    </div>
                    <div className="space-y-2 text-[11px]">
                      <div className={`p-2 rounded-lg border ${t.subtleSurface} ${t.borderColor}`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-mono font-bold ${t.brandAccentText}`}>
                            ORD-176208573-1201
                          </span>
                          <StatusBadge variant="emerald" isDark={isDark}>
                            VietQR Paid
                          </StatusBadge>
                        </div>
                        <p className="mt-1">
                          Khách Nguyễn Văn Minh đã thanh toán 90.470.000 ₫. Cần tiếp nhận &amp; đóng gói.
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg border ${t.subtleSurface} ${t.borderColor}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-rose-400">RET-409</span>
                          <StatusBadge variant="rose" isDark={isDark}>
                            Pending Return
                          </StatusBadge>
                        </div>
                        <p className="mt-1">
                          Yêu cầu đổi trả mới cho đơn ORD-176208573-1194 (Màn hình LG OLED).
                        </p>
                      </div>
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
                <StatusBadge variant="amber" isDark={isDark} className="!text-[10px] !px-1.5 !py-0.5">
                  pending
                </StatusBadge>
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
                <span className="font-mono font-bold text-amber-400">Bước 2</span>
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
                <StatusBadge variant="cyan" isDark={isDark} className="!text-[10px] !px-1.5 !py-0.5">
                  processing
                </StatusBadge>
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
                <span className={`font-mono font-bold ${t.brandAccentText}`}>Bước 2-3</span>
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
                <StatusBadge variant="rose" isDark={isDark} className="!text-[10px] !px-1.5 !py-0.5">
                  returns
                </StatusBadge>
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
                <span className="font-mono font-bold text-rose-400">Bước 5</span>
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
                <StatusBadge variant="violet" isDark={isDark} className="!text-[10px] !px-1.5 !py-0.5">
                  tasks
                </StatusBadge>
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
                        <th className="py-2.5 px-2.5">Mã đơn (order_code)</th>
                        <th className="py-2.5 px-2.5">Người nhận (recipient)</th>
                        <th className="py-2.5 px-2.5">Thanh toán (payment)</th>
                        <th className="py-2.5 px-2.5 text-right">Tổng tiền (final_amount)</th>
                        <th className="py-2.5 px-2.5">Trạng thái vận chuyển</th>
                        <th className="py-2.5 pl-2.5 pr-3.5 text-right">Thao tác (Actions)</th>
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
                                    In vận đơn &amp; Giao Shipper
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
                                        disabled={
                                          ord.shipping_status === 'delivered' ||
                                          ord.shipping_status === 'cancelled'
                                        }
                                        onClick={() => handleCancelOrder(ord.order_code)}
                                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-rose-500 ${
                                          isDark ? 'hover:bg-[#4c0519]/40' : 'hover:bg-rose-50'
                                        }`}
                                      >
                                        <Ban className="w-3.5 h-3.5" />
                                        <span>Hủy đơn</span>
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
                      <span className={t.textMuted}>Tiến trình vận đơn (Shipping Stepper)</span>
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

                    {/* YẾU TỐ ĐỂ NHÂN VIÊN TỰ QUYẾT ĐỊNH (DECISION MATRIX) */}
                    <div className={`p-3 rounded-xl border ${t.borderColor} ${isDark ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'} space-y-2 mt-2`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-extrabold uppercase flex items-center gap-1.5 ${t.brandAccentText}`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Yếu tố Tự Quyết định của Staff</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Đủ điều kiện xuất kho
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className={`p-2 rounded-lg border ${t.borderColor} ${t.subtleSurface}`}>
                          <span className={`text-[9px] block uppercase ${t.textMuted}`}>Rủi ro thanh toán:</span>
                          <span className="font-bold text-[11px] mt-0.5 block">
                            {selectedOrder.payment_status === 'paid' ? (
                              <span className="text-emerald-400">VietQR Paid · An toàn 100%</span>
                            ) : (
                              <span className="text-amber-400">COD · Cần kiểm tra SĐT</span>
                            )}
                          </span>
                        </div>

                        <div className={`p-2 rounded-lg border ${t.borderColor} ${t.subtleSurface}`}>
                          <span className={`text-[9px] block uppercase ${t.textMuted}`}>Quy chuẩn đóng gói:</span>
                          <span className="font-bold text-[11px] mt-0.5 block">
                            {selectedOrder.final_amount >= 10000000 ? (
                              <span className="text-rose-400">Hàng giá trị cao · Bọc 2 lớp</span>
                            ) : (
                              <span className="text-sky-400">Chuẩn thùng xốp niêm phong</span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
                        isDark ? 'bg-[#06b6d4]/10 border-[#06b6d4]/30' : 'bg-cyan-50 border-cyan-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                          </span>
                          <div>
                            <p className="text-[11px] font-extrabold text-cyan-400">RTC Trực tiếp từ Khách</p>
                            <p className={`text-[9px] ${t.textMuted}`}>Yêu cầu tư vấn / kiểm tra hàng</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRtcModalOrder(selectedOrder)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold bg-gradient-to-r from-cyan-500 to-violet-600 text-white cursor-pointer shadow-md hover:scale-105 transition"
                        >
                          Mở RTC Chat
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Line Items List (`order_items`): Thumbnail, product_name, variant_name, SKU, unit_price x quantity = subtotal */}
                  <div className="p-4 space-y-2.5 max-h-[300px] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider ${t.textMuted}`}
                      >
                        Chi tiết sản phẩm (`order_items` · {selectedOrder.order_items.length})
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
                      <span className={t.textMuted}>total_amount (Tạm tính):</span>
                      <span>{formatVND(selectedOrder.total_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={t.textMuted}>+ shipping_fee (Phí vận chuyển):</span>
                      <span>{formatVND(selectedOrder.shipping_fee)}</span>
                    </div>
                    <div
                      className={`pt-2 mt-1 border-t ${t.borderColor} flex items-center justify-between text-sm font-extrabold`}
                    >
                      <span>= final_amount (Tổng cộng):</span>
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

                    <button
                      type="button"
                      disabled={
                        selectedOrder.shipping_status === 'delivered' ||
                        selectedOrder.shipping_status === 'cancelled'
                      }
                      onClick={() => handleAdvanceOrderStatus(selectedOrder)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${t.brandGradient}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Cập nhật trạng thái</span>
                    </button>
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
                  <h2 className={`text-sm font-extrabold ${t.textPrimary}`}>Quản lý Yêu cầu Đổi trả &amp; Hoàn tiền (`return_requests`)
                  </h2>
                  <p className={`text-xs ${t.textMuted}`}>
                    Trạng thái quy chuẩn: pending | approved | rejected | refunded
                  </p>
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
                      <th className="py-2.5 px-3">order_id</th>
                      <th className="py-2.5 px-3">customer_id</th>
                      <th className="py-2.5 px-3">Sản phẩm &amp; Lý do (reason)</th>
                      <th className="py-2.5 px-3 text-right">Số tiền hoàn</th>
                      <th className="py-2.5 px-3">status</th>
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
                            {req.return_id}
                            <div className={`text-[10px] ${t.textMuted}`}>{req.created_at}</div>
                          </td>
                          <td className={`py-3 px-3 font-mono font-bold ${t.brandAccentText}`}>
                            {req.order_id}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-[11px]">
                              {req.customer_id}
                            </div>
                            <div className={t.textMuted}>
                              {req.customer_name} · {req.customer_phone}
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
              SECTION 3: REVIEWS & CUSTOMER SERVICE REPLIES (`reviews`)
             ================================================================== */}
          {activeMenu === 'reviews' && (
            <div className={`${t.surfaceCard} rounded-xl p-4 space-y-4`}>
              {/* Header of Reviews Section */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
                <div>
                  <h2 className={`text-sm font-extrabold flex items-center gap-2 ${t.textPrimary}`}>
                    <MessageSquare className="w-4 h-4 text-cyan-500" />
                    <span>Phản hồi Đánh giá &amp; Chăm sóc Khách hàng (`reviews`)</span>
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
              {/* Daily Delegations (`staff_tasks`) */}
              <div className={`${t.surfaceCard} xl:col-span-2 rounded-xl p-4 space-y-3.5`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className={`text-sm font-extrabold ${t.textPrimary}`}>Nhiệm vụ trong ca (`staff_tasks`)
                    </h2>
                    <p className={`text-xs ${t.textMuted}`}>
                      title, priority ('low' | 'medium' | 'high' | 'urgent'), status ('todo' | 'in_progress' | 'completed'), due_date
                    </p>
                  </div>
                  <StatusBadge variant="violet" isDark={isDark}>
                    {kpiCompletedTasks}/{kpiTotalTasks} task hoàn thành
                  </StatusBadge>
                </div>

                <div className="space-y-2">
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
                        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${t.subtleSurface} ${t.borderColor}`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={tsk.status === 'completed'}
                            onChange={() =>
                              handleCycleTaskStatus(
                                tsk.task_id,
                                tsk.status === 'completed' ? 'todo' : 'completed'
                              )
                            }
                            className="mt-0.5 w-4 h-4 rounded accent-[#06b6d4] cursor-pointer"
                          />
                          <div className="min-w-0 space-y-1">
                            <div
                              className={`text-xs font-bold ${
                                tsk.status === 'completed'
                                  ? `line-through ${t.textMuted}`
                                  : ''
                              }`}
                            >
                              {tsk.title}
                            </div>
                            <div className={`text-[11px] font-mono flex items-center gap-2 flex-wrap ${t.textMuted}`}>
                              <span>{tsk.task_id}</span>
                              <span>·</span>
                              <span>due_date: {tsk.due_date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <StatusBadge variant={prioMeta.variant} isDark={isDark}>
                            priority: {prioMeta.label}
                          </StatusBadge>
                          <select
                            value={tsk.status}
                            onChange={(e) =>
                              handleCycleTaskStatus(tsk.task_id, e.target.value)
                            }
                            className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer outline-none ${t.inputStyle}`}
                          >
                            <option value="todo">todo</option>
                            <option value="in_progress">in_progress</option>
                            <option value="completed">completed</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shift Roster Card (`staffs` & `staff_schedules`) */}
              <div className={`${t.surfaceCard} rounded-xl p-4 space-y-3.5`}>
                <h3 className="text-sm font-extrabold">
                  Hồ sơ Ca trực (`staffs` &amp; `staff_schedules`)
                </h3>
                <div className={`p-3 rounded-xl border space-y-2 text-xs ${t.subtleSurface} ${t.borderColor}`}>
                  <div className="flex justify-between">
                    <span className={t.textMuted}>staff_code:</span>
                    <span className="font-mono font-bold">{staffProfile.staff_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={t.textMuted}>full_name:</span>
                    <span className="font-bold">{staffProfile.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={t.textMuted}>department:</span>
                    <select
                      value={staffProfile.department}
                      onChange={(e) =>
                        setStaffProfile((prev) => ({
                          ...prev,
                          department: e.target.value
                        }))
                      }
                      className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer ${t.inputStyle}`}
                    >
                      <option value="Warehouse">Warehouse</option>
                      <option value="Sales">Sales</option>
                      <option value="Customer Support">Customer Support</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={t.textMuted}>shift:</span>
                    <select
                      value={staffProfile.schedule.shift}
                      onChange={(e) => {
                        const nextShift = e.target.value;
                        setStaffProfile((prev) => ({
                          ...prev,
                          schedule: {
                            ...prev.schedule,
                            shift: nextShift,
                            shift_hours:
                              nextShift === 'morning' ? '08:00 - 16:00' : '16:00 - 22:00'
                          }
                        }));
                      }}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border cursor-pointer ${t.inputStyle}`}
                    >
                      <option value="morning">morning (08:00-16:00)</option>
                      <option value="afternoon">afternoon (16:00-22:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================================
          WAREHOUSE PICK SLIP MODAL (Triggered by [In phiếu xuất kho])
         ====================================================================== */}
      {pickSlipModalOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPickSlipModalOrder(null)}
        >
          <div
            className={`w-full max-w-lg rounded-2xl p-5 space-y-4 shadow-2xl ${t.surfaceCard}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${t.borderColor}`}>
              <div>
                <span className={`text-[10px] font-mono uppercase ${t.brandAccentText}`}>
                  TECHSHOP WAREHOUSE PICK SLIP
                </span>
                <h3 className="text-base font-extrabold font-mono">
                  Phiếu Xuất Kho · {pickSlipModalOrder.order_code}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPickSlipModalOrder(null)}
                className={`p-1.5 rounded-lg border cursor-pointer ${t.borderColor}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className={t.textMuted}>Người nhận:</span>
                <span className="font-bold">
                  {pickSlipModalOrder.recipient_name} ({pickSlipModalOrder.recipient_phone})
                </span>
              </div>
              <div className="flex justify-between">
                <span className={t.textMuted}>Nhân viên xuất kho:</span>
                <span className="font-mono font-bold">
                  {staffProfile.staff_code} - {staffProfile.full_name}
                </span>
              </div>
              <div className={`p-2.5 rounded-lg border ${t.subtleSurface} ${t.borderColor}`}>
                {pickSlipModalOrder.order_items.map((it) => (
                  <div
                    key={it.item_id}
                    className="flex items-center justify-between py-1 text-xs font-mono"
                  >
                    <span className="truncate pr-2">
                      [{it.sku}] {it.product_name}
                    </span>
                    <span className="font-bold shrink-0">x{it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-mono font-extrabold text-sm pt-1">
                <span>Tổng thu (final_amount):</span>
                <span className={t.brandAccentText}>
                  {formatVND(pickSlipModalOrder.final_amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPickSlipModalOrder(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer ${t.brandGradient}`}
              >
                Hoàn tất lệnh in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          RTC LIVE CUSTOMER SUPPORT & STAFF DECISION MODAL
         ====================================================================== */}
      {rtcModalOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setRtcModalOrder(null)}
        >
          <div
            className={`${t.surfaceCard} rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border ${t.borderColor} flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`p-4 border-b ${t.borderColor} ${t.tableHeaderBg} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white shadow-md">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm">Kênh Hỗ trợ Trực tiếp (RTC Live Support)</h3>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Trực tuyến 24/7
                    </span>
                  </div>
                  <p className={`text-[11px] font-mono ${t.textMuted}`}>
                    Đơn hàng: {rtcModalOrder.order_code} · Khách hàng: {rtcModalOrder.recipient_name} ({rtcModalOrder.recipient_phone})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRtcModalOrder(null)}
                className={`p-1.5 rounded-lg border cursor-pointer ${
                  isDark ? 'border-[#334155] text-[#94a3b8] hover:text-white' : 'border-[#e2e8f0] text-[#64748b] hover:text-slate-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Decision Factors Bar (Bảng kiểm soát yếu tố tự quyết) */}
            <div className={`px-4 py-2.5 border-b ${t.borderColor} ${isDark ? 'bg-[#0f172a]' : 'bg-[#f1f5f9]'} grid grid-cols-3 gap-2 text-center text-[11px]`}>
              <div>
                <span className={`text-[10px] block ${t.textMuted}`}>Thanh toán:</span>
                <span className="font-bold text-emerald-400">{rtcModalOrder.payment_method === 'vietqr_banking' ? 'VietQR Paid (An toàn)' : 'COD (Thu tiền sau)'}</span>
              </div>
              <div>
                <span className={`text-[10px] block ${t.textMuted}`}>Lịch sử khách:</span>
                <span className="font-bold text-cyan-400">100% nhận hàng (5 đơn)</span>
              </div>
              <div>
                <span className={`text-[10px] block ${t.textMuted}`}>Tồn kho sản phẩm:</span>
                <span className="font-bold text-emerald-400">Sẵn sàng 100%</span>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className={`p-4 space-y-3 overflow-y-auto max-h-[300px] min-h-[200px] ${t.subtleSurface}`}>
              {rtcMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'staff' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`text-[10px] font-mono mb-1 ${t.textMuted}`}>
                    {msg.senderName} · {msg.time}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      msg.sender === 'staff'
                        ? `${t.brandGradient} text-white rounded-tr-none shadow-md`
                        : `${isDark ? 'bg-[#1e293b] border border-[#334155]' : 'bg-white border border-[#e2e8f0]'} rounded-tl-none shadow-xs`
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Staff Decision Action Buttons */}
            <div className={`px-4 py-2.5 border-t ${t.borderColor} ${t.tableHeaderBg} flex items-center justify-between gap-2 text-[11px]`}>
              <span className={`font-bold ${t.textMuted}`}>Quyết định nhanh:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    handleAcceptAndPack(rtcModalOrder.order_code);
                    triggerToast(`Đã chấp thuận yêu cầu và tiếp nhận đóng gói đơn ${rtcModalOrder.order_code}`);
                    setRtcModalOrder(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition cursor-pointer"
                >
                  ✓ Đồng ý &amp; Đóng gói
                </button>
                <a
                  href={`tel:${rtcModalOrder.recipient_phone}`}
                  className="px-2.5 py-1.5 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-600 transition cursor-pointer"
                >
                  📞 Gọi điện xác nhận
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const reply = 'Dạ TechShop đã ghi nhận yêu cầu của anh/chị và cập nhật vào ghi chú xuất kho!';
                    setRtcMessages((prev) => [
                      ...prev,
                      {
                        id: Date.now(),
                        sender: 'staff',
                        senderName: `Staff ${staffProfile.staff_code}`,
                        text: reply,
                        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                  }}
                  className="px-2.5 py-1.5 rounded-lg font-bold bg-violet-600 text-white hover:bg-violet-500 transition cursor-pointer"
                >
                  ⚡ Gửi câu mẫu
                </button>
              </div>
            </div>

            {/* Message Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!rtcChatInput.trim()) return;
                setRtcMessages((prev) => [
                  ...prev,
                  {
                    id: Date.now(),
                    sender: 'staff',
                    senderName: `Staff ${staffProfile.staff_code}`,
                    text: rtcChatInput.trim(),
                    time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
                setRtcChatInput('');
              }}
              className={`p-3 border-t ${t.borderColor} flex items-center gap-2`}
            >
              <input
                type="text"
                value={rtcChatInput}
                onChange={(e) => setRtcChatInput(e.target.value)}
                placeholder="Nhập phản hồi trao đổi trực tiếp với khách hàng..."
                className={`flex-1 rounded-xl px-3.5 py-2 text-xs border focus:outline-hidden ${t.inputStyle}`}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md ${t.brandGradient}`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
