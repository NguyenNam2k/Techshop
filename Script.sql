-- ==============================================================================
-- TECHSHOP DATABASE INITIALIZATION SCRIPT (techshop_db)
-- Hệ quản trị CSDL: MySQL 8.0+ / TiDB (InnoDB Engine, utf8mb4_unicode_ci)
-- Tính năng: Thương mại điện tử, Biến thể linh kiện, AI Embeddings, Đơn hàng & VietQR,
--           Phân quyền RBAC, và Hệ thống Đánh giá sản phẩm (Product Reviews)
-- ==============================================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `techshop_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `techshop_db`;

-- ==============================================================================
-- DỌN DẸP BẢNG CŨ (DROP TABLES IN SAFE REVERSE ORDER)
-- ==============================================================================
DROP TABLE IF EXISTS `staff_schedules`;
DROP TABLE IF EXISTS `staff_tasks`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `inventory_logs`;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `product_embeddings`;
DROP TABLE IF EXISTS `product_images`;
DROP TABLE IF EXISTS `product_specifications`;
DROP TABLE IF EXISTS `product_variants`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `staffs`;
DROP TABLE IF EXISTS `managers`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `guests`;

-- ==============================================================================
-- 1. BẢNG GUESTS (Khách vãng lai chưa đăng nhập)
-- ==============================================================================
CREATE TABLE `guests` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `session_token` VARCHAR(100) NOT NULL UNIQUE,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `expires_at` TIMESTAMP NULL,
    INDEX `idx_guests_session` (`session_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. BẢNG CUSTOMERS (Khách hàng thành viên)
-- ==============================================================================
CREATE TABLE `customers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `username` VARCHAR(50) NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `avatar_url` VARCHAR(500) NULL,
    `google_id` VARCHAR(100) NULL UNIQUE,
    `status` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_customers_email` (`email`),
    INDEX `idx_customers_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. BẢNG ADMINS (Quản trị viên hệ thống)
-- ==============================================================================
CREATE TABLE `admins` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `security_level` ENUM('super_admin', 'system_admin') NOT NULL DEFAULT 'super_admin',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_admins_username` (`username`),
    INDEX `idx_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. BẢNG MANAGERS (Quản lý chi nhánh / Cửa hàng)
-- ==============================================================================
CREATE TABLE `managers` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NULL UNIQUE,
    `manager_code` VARCHAR(20) NOT NULL UNIQUE,
    `admin_id` INT UNSIGNED NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `branch_name` VARCHAR(100) NOT NULL DEFAULT 'TechGear Flagship Store',
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_managers_admin` 
        FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_managers_code` (`manager_code`),
    INDEX `idx_managers_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. BẢNG STAFFS (Nhân viên vận hành, kho, bán hàng)
-- ==============================================================================
CREATE TABLE `staffs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NULL UNIQUE,
    `staff_code` VARCHAR(20) NOT NULL UNIQUE,
    `manager_id` INT UNSIGNED NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `department` ENUM('Warehouse', 'Sales', 'Customer Support') NOT NULL DEFAULT 'Warehouse',
    `permissions` JSON NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_staffs_manager` 
        FOREIGN KEY (`manager_id`) REFERENCES `managers` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_staffs_code` (`staff_code`),
    INDEX `idx_staffs_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 6. BẢNG CATEGORIES (Danh mục linh kiện / thiết bị)
-- ==============================================================================
CREATE TABLE `categories` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(120) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `icon_url` VARCHAR(255) NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `parent_id` INT UNSIGNED NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_categories_parent` 
        FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 7. BẢNG PRODUCTS (Sản phẩm phần cứng & Gear)
-- ==============================================================================
CREATE TABLE `products` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT UNSIGNED NOT NULL,
    `created_by_manager_id` INT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(280) NOT NULL UNIQUE,
    `brand` VARCHAR(100) NOT NULL,
    `model_code` VARCHAR(100) NULL,
    `base_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `description` LONGTEXT NULL,
    `thumbnail_url` VARCHAR(500) NULL,
    `warranty_months` INT UNSIGNED NOT NULL DEFAULT 12,
    `status` ENUM('draft', 'active', 'out_of_stock', 'archived') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_products_category` 
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_products_manager` 
        FOREIGN KEY (`created_by_manager_id`) REFERENCES `managers` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_products_brand` (`brand`),
    INDEX `idx_products_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 8. BẢNG PRODUCT_VARIANTS (Biến thể SKU: phiên bản, màu sắc, tồn kho)
-- ==============================================================================
CREATE TABLE `product_variants` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT UNSIGNED NOT NULL,
    `sku` VARCHAR(100) NOT NULL UNIQUE,
    `color` VARCHAR(50) NOT NULL,
    `color_code` VARCHAR(20) NULL,
    `spec_version` VARCHAR(150) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `image_url` VARCHAR(500) NULL,
    `status` ENUM('available', 'low_stock', 'out_of_stock', 'discontinued') NOT NULL DEFAULT 'available',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_variants_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_variants_sku` (`sku`),
    INDEX `idx_variants_stock` (`stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 9. BẢNG PRODUCT_SPECIFICATIONS (Thông số kỹ thuật chi tiết theo nhóm)
-- ==============================================================================
CREATE TABLE `product_specifications` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT UNSIGNED NOT NULL,
    `spec_group` VARCHAR(100) NOT NULL DEFAULT 'Thông số chung',
    `spec_name` VARCHAR(150) NOT NULL,
    `spec_value` VARCHAR(500) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_specs_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_specs_group` (`spec_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 10. BẢNG PRODUCT_IMAGES (Thư viện hình ảnh gallery sản phẩm)
-- ==============================================================================
CREATE TABLE `product_images` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT UNSIGNED NOT NULL,
    `variant_id` INT UNSIGNED NULL DEFAULT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `public_id` VARCHAR(255) NULL,
    `angle_label` VARCHAR(100) NOT NULL DEFAULT 'Góc nhìn tổng thể',
    `is_primary` BOOLEAN NOT NULL DEFAULT FALSE,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_images_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_images_variant` 
        FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 11. BẢNG PRODUCT_EMBEDDINGS (Vector nhúng AI cho Visual & Semantic Search)
-- ==============================================================================
CREATE TABLE `product_embeddings` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT UNSIGNED NOT NULL,
    `image_id` INT UNSIGNED NULL DEFAULT NULL,
    `embedding_type` ENUM('image', 'text', 'hybrid') NOT NULL DEFAULT 'image',
    `vector` JSON NOT NULL,
    `model_name` VARCHAR(100) NOT NULL DEFAULT 'clip-ViT-B-32-multilingual-v1',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_embeddings_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_embeddings_image` 
        FOREIGN KEY (`image_id`) REFERENCES `product_images` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_embeddings_type` (`embedding_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 12. BẢNG CART_ITEMS (Giỏ hàng hỗ trợ cả Customer lẫn Khách vãng lai)
-- ==============================================================================
CREATE TABLE `cart_items` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT UNSIGNED NULL DEFAULT NULL,
    `guest_id` INT UNSIGNED NULL DEFAULT NULL,
    `variant_id` INT UNSIGNED NOT NULL,
    `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cart_customer` 
        FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cart_guest` 
        FOREIGN KEY (`guest_id`) REFERENCES `guests` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_cart_variant` 
        FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 13. BẢNG ORDERS (Đơn đặt hàng & thông tin thanh toán VietQR / COD)
-- ==============================================================================
CREATE TABLE `orders` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_code` VARCHAR(50) NOT NULL UNIQUE,
    `customer_id` INT UNSIGNED NOT NULL,
    `processed_by_staff_id` INT UNSIGNED NULL DEFAULT NULL,
    `recipient_name` VARCHAR(100) NOT NULL,
    `recipient_phone` VARCHAR(20) NOT NULL,
    `shipping_address` TEXT NOT NULL,
    `payment_method` ENUM('cod', 'vietqr_banking') NOT NULL DEFAULT 'cod',
    `payment_status` ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    `payment_expires_at` TIMESTAMP NULL DEFAULT NULL,
    `shipping_status` ENUM('pending', 'processing', 'shipping', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `final_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `order_notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_orders_customer` 
        FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_orders_staff` 
        FOREIGN KEY (`processed_by_staff_id`) REFERENCES `staffs` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_orders_customer` (`customer_id`),
    INDEX `idx_orders_shipping_status` (`shipping_status`),
    INDEX `idx_orders_payment_status` (`payment_status`),
    INDEX `idx_orders_payment_expires_at` (`payment_expires_at`),
    INDEX `idx_orders_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 14. BẢNG ORDER_ITEMS (Chi tiết từng sản phẩm trong đơn đặt hàng)
-- ==============================================================================
CREATE TABLE `order_items` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT UNSIGNED NOT NULL,
    `variant_id` INT UNSIGNED NULL DEFAULT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `variant_name` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_order_items_order` 
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_order_items_variant` 
        FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `return_requests` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` INT UNSIGNED NOT NULL,
    `customer_id` INT UNSIGNED NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected', 'refunded') NOT NULL DEFAULT 'pending',
    `refund_method` VARCHAR(50) NULL,
    `manager_note` VARCHAR(500) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_return_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_return_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE RESTRICT,
    INDEX `idx_return_order` (`order_id`),
    INDEX `idx_return_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 15. BẢNG INVENTORY_LOGS (Nhật ký xuất nhập và biến động tồn kho linh kiện)
-- ==============================================================================
CREATE TABLE `inventory_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `variant_id` INT UNSIGNED NOT NULL,
    `staff_id` INT UNSIGNED NULL DEFAULT NULL,
    `manager_id` INT UNSIGNED NULL DEFAULT NULL,
    `order_id` INT UNSIGNED NULL DEFAULT NULL,
    `change_type` ENUM('import', 'order_deduct', 'order_cancel_restock', 'manual_adjustment') NOT NULL,
    `quantity_changed` INT NOT NULL,
    `stock_after` INT NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_inv_variant` 
        FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_inv_staff` 
        FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_inv_manager` 
        FOREIGN KEY (`manager_id`) REFERENCES `managers` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `fk_inv_order` 
        FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 16. BẢNG AUDIT_LOGS (Nhật ký kiểm toán thay đổi dữ liệu hệ thống)
-- ==============================================================================
CREATE TABLE `audit_logs` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT UNSIGNED NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `old_data` JSON NULL,
    `new_data` JSON NULL,
    `changed_by` VARCHAR(100) NOT NULL DEFAULT 'Admin',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
    INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 17. BẢNG COUPONS (Mã giảm giá & chương trình khuyến mãi)
-- ==============================================================================
CREATE TABLE `coupons` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    `discount_value` DECIMAL(12, 2) NOT NULL,
    `min_order_value` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `max_discount_amount` DECIMAL(12, 2) NULL,
    `usage_limit` INT UNSIGNED NOT NULL DEFAULT 100,
    `used_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_coupon_code` (`code`),
    INDEX `idx_coupon_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 18. BẢNG REVIEWS (Đánh giá, xếp hạng sao & nhận xét sản phẩm)
-- ==============================================================================
CREATE TABLE `reviews` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `product_id` INT UNSIGNED NOT NULL,
    `customer_id` INT UNSIGNED NULL DEFAULT NULL,
    `customer_name` VARCHAR(100) NOT NULL DEFAULT 'Khách hàng TechShop',
    `rating` TINYINT UNSIGNED NOT NULL,
    `comment` TEXT NULL,
    `is_verified_buyer` TINYINT(1) NOT NULL DEFAULT 1,
    `likes` INT UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('approved', 'pending', 'hidden') NOT NULL DEFAULT 'approved',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_reviews_product` 
        FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_customer` 
        FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX `idx_reviews_product_id` (`product_id`),
    INDEX `idx_reviews_customer_id` (`customer_id`),
    INDEX `idx_reviews_rating` (`rating`),
    INDEX `idx_reviews_status` (`status`),
    INDEX `idx_reviews_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 19. BẢNG STAFF_TASKS (Phân công nhiệm vụ nội bộ cho nhân viên)
-- ==============================================================================
CREATE TABLE `staff_tasks` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `staff_id` INT UNSIGNED NOT NULL,
    `manager_id` INT UNSIGNED NOT NULL DEFAULT 1,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
    `status` ENUM('todo', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'todo',
    `due_date` DATE NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_tasks_staff` 
        FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_tasks_manager` 
        FOREIGN KEY (`manager_id`) REFERENCES `managers` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_task_staff` (`staff_id`),
    INDEX `idx_task_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 20. BẢNG STAFF_SCHEDULES (Lịch làm việc ca trực của nhân sự)
-- ==============================================================================
CREATE TABLE `staff_schedules` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `staff_id` INT UNSIGNED NOT NULL,
    `work_date` DATE NOT NULL,
    `shift` ENUM('morning', 'afternoon', 'evening') NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_schedules_staff` 
        FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_schedule_date` (`work_date`),
    INDEX `idx_schedule_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 21. BẢNG ROLES (Vai trò phân quyền RBAC)
-- ==============================================================================
CREATE TABLE `roles` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_roles_name` (`role_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 22. BẢNG PERMISSIONS (Danh mục quyền hạn chi tiết theo module)
-- ==============================================================================
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

-- ==============================================================================
-- 23. BẢNG ROLE_PERMISSIONS (Bảng liên kết Nhiều-Nhiều giữa Vai trò & Quyền hạn)
-- ==============================================================================
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

-- ==============================================================================
-- DỮ LIỆU MẪU MẶC ĐỊNH CHO HỆ THỐNG RBAC & ĐIỀU HÀNH
-- ==============================================================================

-- 1. Vai trò mặc định trong hệ thống
INSERT INTO `roles` (`role_name`, `description`) VALUES
('super_admin', 'Quản trị viên cao nhất, toàn quyền cấu hình và điều hành hệ thống'),
('system_admin', 'Quản trị viên kỹ thuật hệ thống và quản trị tài khoản'),
('manager', 'Quản lý cửa hàng, chi nhánh, kho và kiểm duyệt đánh giá'),
('staff', 'Nhân viên bán hàng, đóng gói và chăm sóc khách hàng'),
('customer', 'Khách hàng thành viên mua sắm');

-- 2. Quyền hạn mặc định (Permissions theo từng module chức năng)
INSERT INTO `permissions` (`permission_name`, `description`, `module`) VALUES
-- Module: users (Quản lý người dùng)
('users.view', 'Xem danh sách và hồ sơ người dùng', 'users'),
('users.create', 'Tạo tài khoản người dùng / nhân sự mới', 'users'),
('users.update', 'Cập nhật thông tin và mật khẩu người dùng', 'users'),
('users.delete', 'Xóa tài khoản người dùng', 'users'),
('users.toggle_status', 'Khóa hoặc mở khóa trạng thái tài khoản', 'users'),

-- Module: roles (Quản lý vai trò)
('roles.view', 'Xem danh mục các vai trò', 'roles'),
('roles.create', 'Tạo vai trò phân quyền mới', 'roles'),
('roles.update', 'Cập nhật thông tin vai trò', 'roles'),
('roles.delete', 'Xóa vai trò phân quyền', 'roles'),

-- Module: permissions (Quản lý quyền hạn)
('permissions.view', 'Xem danh mục các quyền hạn', 'permissions'),
('permissions.create', 'Khai báo quyền hạn mới', 'permissions'),
('permissions.update', 'Cập nhật quyền hạn', 'permissions'),
('permissions.delete', 'Xóa quyền hạn', 'permissions'),
('permissions.assign', 'Gán hoặc thu hồi quyền hạn cho vai trò', 'permissions'),

-- Module: reviews (Quản lý đánh giá sản phẩm)
('reviews.view', 'Xem danh sách và chi tiết đánh giá sản phẩm', 'reviews'),
('reviews.moderate', 'Kiểm duyệt, ẩn hoặc phê duyệt đánh giá của khách hàng', 'reviews'),
('reviews.reply', 'Phản hồi đánh giá của khách hàng với tư cách cửa hàng', 'reviews'),
('reviews.delete', 'Xóa đánh giá vi phạm tiêu chuẩn cộng đồng', 'reviews');

-- 3. Gán quyền cho vai trò Super Admin (Toàn bộ quyền hạn)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'super_admin';

-- 4. Gán quyền cho System Admin (Quản lý người dùng, vai trò & phân quyền)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'system_admin'
  AND p.permission_name IN (
    'users.view', 'users.create', 'users.update', 'users.toggle_status',
    'roles.view', 'permissions.view', 'reviews.view', 'reviews.moderate'
  );

-- 5. Gán quyền cho Manager (Xem user và toàn quyền kiểm duyệt đánh giá sản phẩm)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'manager'
  AND p.permission_name IN (
    'users.view', 'reviews.view', 'reviews.moderate', 'reviews.reply', 'reviews.delete'
  );

-- 6. Gán quyền cho Staff (Xem và phản hồi đánh giá)
INSERT INTO `role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `roles` r, `permissions` p
WHERE r.role_name = 'staff'
  AND p.permission_name IN (
    'reviews.view', 'reviews.reply'
  );

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- HOÀN TẤT KHỞI TẠO CẤU TRÚC DATABASE TECHSHOP_DB (23 BẢNG + RBAC SEED)
-- Để nạp dữ liệu danh mục & reviews đầy đủ, chạy: seed_full_catalog.sql
-- ==============================================================================
