-- ============================================================
-- TechShop Admin RBAC (Role-Based Access Control)
-- Bổ sung bảng: roles, permissions, role_permissions
-- ============================================================

USE `techshop_db`;

-- Xóa bảng cũ nếu có (theo thứ tự phụ thuộc)
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;

-- ============================================================
-- 1. Bảng ROLES (Vai trò)
-- ============================================================
CREATE TABLE `roles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_roles_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Bảng PERMISSIONS (Quyền hạn)
-- ============================================================
CREATE TABLE `permissions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `permission_name` VARCHAR(100) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `module` VARCHAR(50) NOT NULL DEFAULT 'general',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_permissions_name` (`permission_name`),
    INDEX `idx_permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Bảng ROLE_PERMISSIONS (Liên kết Vai trò - Quyền hạn)
-- ============================================================
CREATE TABLE `role_permissions` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT UNSIGNED NOT NULL,
    `permission_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. DỮ LIỆU MẪU (SEED)
-- ============================================================

-- 4A. Vai trò mặc định
INSERT INTO `roles` (`role_name`, `description`) VALUES
('super_admin', 'Quản trị viên cao nhất, toàn quyền hệ thống'),
('system_admin', 'Quản trị viên hệ thống'),
('manager', 'Quản lý chi nhánh / bộ phận'),
('staff', 'Nhân viên vận hành'),
('customer', 'Khách hàng');

-- 4B. Quyền hạn mặc định
INSERT INTO `permissions` (`permission_name`, `description`, `module`) VALUES
-- Module: users
('users.view', 'Xem danh sách người dùng', 'users'),
('users.create', 'Tạo người dùng mới', 'users'),
('users.update', 'Cập nhật thông tin người dùng', 'users'),
('users.delete', 'Xóa người dùng', 'users'),
('users.toggle_status', 'Kích hoạt / Vô hiệu hóa tài khoản', 'users'),
-- Module: roles
('roles.view', 'Xem danh sách vai trò', 'roles'),
('roles.create', 'Tạo vai trò mới', 'roles'),
('roles.update', 'Cập nhật vai trò', 'roles'),
('roles.delete', 'Xóa vai trò', 'roles'),
-- Module: permissions
('permissions.view', 'Xem danh sách quyền hạn', 'permissions'),
('permissions.create', 'Tạo quyền mới', 'permissions'),
('permissions.update', 'Cập nhật quyền', 'permissions'),
('permissions.delete', 'Xóa quyền', 'permissions'),
('permissions.assign', 'Gán quyền cho vai trò', 'permissions');

-- 4C. Gán quyền cho vai trò super_admin (toàn quyền)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'super_admin';

-- 4D. Gán quyền cho vai trò system_admin (quyền xem + quản lý user)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'system_admin'
  AND p.permission_name IN ('users.view', 'users.create', 'users.update', 'users.toggle_status', 'roles.view', 'permissions.view');

-- 4E. Gán quyền cho vai trò manager
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'manager'
  AND p.permission_name IN ('users.view');
