import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ManagerApp from './manager-app/App';
import './manager-app/index.css';

/**
 * ManagerProductsPage
 * Tích hợp toàn bộ Portal Quản lý đa màn hình từ nhánh feature/manager-duong:
 * - Theme Switcher (Chế độ Sáng / Tối)
 * - Quản lý thiết bị & bộ sưu tập ảnh (GalleryModal)
 * - Danh mục phần cứng (CategoriesView)
 * - Nhập kho & điều chỉnh hàng loạt (BatchStockView)
 * - Nhật ký kho vận & Audit kiểm toán (InventoryLogsView)
 * - Quản lý mã giảm giá (CouponsView)
 * - Báo cáo hoạt động & doanh thu tháng (ReportsView)
 * - Phân quyền & điều phối nhân sự (StaffsView)
 * - Nút Đăng xuất chuẩn hóa kết nối với AuthContext & Router
 */
export default function ManagerProductsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return <ManagerApp user={user} onLogout={handleLogout} />;
}

