const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Connection Pool Configuration
 * Utilizes mysql2/promise for async/await transactions and queries
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'techshop_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  timezone: '+07:00'
});

/**
 * Ensure necessary auxiliary tables and default records exist.
 * - audit_logs: Needed for Transaction 2 (Product Update audit trail)
 * - Default category (id=1, "Uncategorized"): Needed for Transaction 5 (Category Cascade Reassignment)
 */
async function initDatabaseSchema() {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Create audit_logs table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`entity_type\` VARCHAR(50) NOT NULL,
        \`entity_id\` INT UNSIGNED NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`old_data\` JSON NULL,
        \`new_data\` JSON NULL,
        \`changed_by\` VARCHAR(100) NOT NULL DEFAULT 'Admin',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_audit_entity\` (\`entity_type\`, \`entity_id\`),
        INDEX \`idx_audit_action\` (\`action\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Ensure default "Uncategorized" category exists with id=1
    const [cats] = await connection.query(`SELECT id FROM \`categories\` WHERE \`id\` = 1 LIMIT 1`);
    if (cats.length === 0) {
      await connection.query(`
        INSERT INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`description\`)
        VALUES (1, 'Uncategorized', 'uncategorized', 'Danh mục mặc định hệ thống cho các thiết bị chưa phân loại')
        ON DUPLICATE KEY UPDATE \`name\` = \`name\`;
      `);
    }

    // 3. Ensure permissions column exists in staffs table
    try {
      await connection.query("ALTER TABLE `staffs` ADD COLUMN `permissions` JSON NULL");
    } catch (e) {
      // Column already exists or error handled
    }

    // 4. Ensure default Manager (id=1) exists
    const [mgrRows] = await connection.query("SELECT id FROM `managers` WHERE id = 1 LIMIT 1");
    if (mgrRows.length === 0) {
      await connection.query(`
        INSERT INTO \`managers\` (\`id\`, \`manager_code\`, \`full_name\`, \`email\`, \`password_hash\`, \`phone\`, \`branch_name\`, \`status\`)
        VALUES (1, 'MGR001', 'Nguyễn Nam', 'manager@techshop.vn', '$2b$10$defaultHashForDemo', '0901234567', 'TechShop Flagship Store', 'active')
        ON DUPLICATE KEY UPDATE \`full_name\` = VALUES(\`full_name\`);
      `);
    }

    // 5. Ensure sample subordinate staffs exist for Manager id=1
    const [staffRows] = await connection.query("SELECT id FROM `staffs` LIMIT 1");
    if (staffRows.length === 0) {
      await connection.query(`
        INSERT INTO \`staffs\` (\`staff_code\`, \`manager_id\`, \`full_name\`, \`email\`, \`password_hash\`, \`phone\`, \`department\`, \`status\`, \`permissions\`)
        VALUES 
          ('STF-W01', 1, 'Trần Minh Tuấn', 'tuan.tm@techshop.vn', '$2b$10$defaultHashForDemo', '0912345671', 'Warehouse', 'active', JSON_OBJECT('can_manage_stock', true, 'can_process_orders', false, 'can_handle_tickets', false, 'can_view_reports', true)),
          ('STF-S01', 1, 'Lê Thị Thu Thảo', 'thao.lt@techshop.vn', '$2b$10$defaultHashForDemo', '0912345672', 'Sales', 'active', JSON_OBJECT('can_manage_stock', false, 'can_process_orders', true, 'can_handle_tickets', false, 'can_view_reports', true)),
          ('STF-CS01', 1, 'Phạm Hoàng Nam', 'nam.ph@techshop.vn', '$2b$10$defaultHashForDemo', '0912345673', 'Customer Support', 'active', JSON_OBJECT('can_manage_stock', false, 'can_process_orders', false, 'can_handle_tickets', true, 'can_view_reports', false));
      `);
    }

    // 6. Ensure coupons table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`coupons\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`code\` VARCHAR(50) NOT NULL UNIQUE,
        \`description\` VARCHAR(255) NULL,
        \`discount_type\` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
        \`discount_value\` DECIMAL(12,2) NOT NULL,
        \`min_order_value\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`max_discount_amount\` DECIMAL(12,2) NULL,
        \`usage_limit\` INT UNSIGNED NOT NULL DEFAULT 100,
        \`used_count\` INT UNSIGNED NOT NULL DEFAULT 0,
        \`start_date\` DATE NOT NULL,
        \`end_date\` DATE NOT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_coupon_code\` (\`code\`),
        INDEX \`idx_coupon_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default coupons if empty
    const [couponCount] = await connection.query("SELECT COUNT(*) as count FROM `coupons`");
    if (couponCount[0].count === 0) {
      await connection.query(`
        INSERT INTO \`coupons\` (\`code\`, \`description\`, \`discount_type\`, \`discount_value\`, \`min_order_value\`, \`max_discount_amount\`, \`usage_limit\`, \`used_count\`, \`start_date\`, \`end_date\`, \`is_active\`)
        VALUES 
          ('TECH10', 'Giảm 10% đơn hàng công nghệ từ 2 triệu', 'percentage', 10.00, 2000000.00, 500000.00, 200, 15, '2026-10-01', '2026-10-31', 1),
          ('GAMING500K', 'Giảm 500,000đ cho Laptop Gaming cao cấp', 'fixed', 500000.00, 15000000.00, 500000.00, 50, 8, '2026-10-01', '2026-11-15', 1),
          ('WELCOME', 'Giảm 5% cho khách hàng mới gia nhập', 'percentage', 5.00, 500000.00, 200000.00, 500, 120, '2026-09-01', '2026-12-31', 1),
          ('BLACKFRIDAY', 'Ưu đãi ngày hội công nghệ TechShop', 'percentage', 15.00, 5000000.00, 1500000.00, 100, 0, '2026-11-20', '2026-11-30', 0);
      `);
    }

    // 7. Ensure staff_tasks table exists (Assign Tasks)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`staff_tasks\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`staff_id\` INT UNSIGNED NOT NULL,
        \`manager_id\` INT UNSIGNED NOT NULL DEFAULT 1,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`priority\` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        \`status\` ENUM('todo', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'todo',
        \`due_date\` DATE NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_task_staff\` (\`staff_id\`),
        INDEX \`idx_task_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default tasks if empty
    const [taskCount] = await connection.query("SELECT COUNT(*) as count FROM `staff_tasks`");
    if (taskCount[0].count === 0) {
      await connection.query(`
        INSERT INTO \`staff_tasks\` (\`staff_id\`, \`manager_id\`, \`title\`, \`description\`, \`priority\`, \`status\`, \`due_date\`)
        VALUES 
          (1, 1, 'Kiểm kê lô hàng màn hình Gaming Dell 27 inch', 'Kiểm đếm tồn kho thực tế và lập biên bản đối chiếu hệ thống', 'high', 'in_progress', '2026-10-10'),
          (1, 1, 'Nhập kho đợt linh kiện RAM DDR5 & SSD NVMe', 'Thực hiện quy trình nhập kho hàng loạt và dán tem SKU barcode', 'urgent', 'todo', '2026-10-12'),
          (2, 1, 'Tư vấn và chốt đơn hợp đồng khách hàng doanh nghiệp B2B', 'Gửi báo giá combo 15 bộ PC văn phòng Core i5', 'high', 'completed', '2026-10-08'),
          (3, 1, 'Xử lý 5 yêu cầu bảo hành đổi trả thiết bị tai nghe', 'Kiểm tra tem bảo hành và xác nhận lỗi nhà sản xuất với khách', 'medium', 'in_progress', '2026-10-11');
      `);
    }

    // 8. Ensure staff_schedules table exists (Working Schedule)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`staff_schedules\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`staff_id\` INT UNSIGNED NOT NULL,
        \`work_date\` DATE NOT NULL,
        \`shift\` ENUM('morning', 'afternoon', 'evening') NOT NULL,
        \`note\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_schedule_date\` (\`work_date\`),
        INDEX \`idx_schedule_staff\` (\`staff_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed default schedules if empty
    const [schedCount] = await connection.query("SELECT COUNT(*) as count FROM `staff_schedules`");
    if (schedCount[0].count === 0) {
      await connection.query(`
        INSERT INTO \`staff_schedules\` (\`staff_id\`, \`work_date\`, \`shift\`, \`note\`)
        VALUES 
          (1, '2026-10-08', 'morning', 'Trực kho & tiếp nhận hàng về'),
          (2, '2026-10-08', 'morning', 'Trực quầy bán hàng Flagship'),
          (3, '2026-10-08', 'afternoon', 'Trực tổng đài CSKH & hỗ trợ bảo hành'),
          (1, '2026-10-09', 'afternoon', 'Sắp xếp phân khu linh kiện máy tính'),
          (2, '2026-10-09', 'morning', 'Trực showroom công nghệ'),
          (3, '2026-10-09', 'evening', 'Trực ca tối chốt đơn livestream');
      `);
    }

    // 9. Seed sample customer & orders & order_items for Monthly Report if empty
    const [custRows] = await connection.query("SELECT id FROM `customers` WHERE id = 1 LIMIT 1");
    if (custRows.length === 0) {
      await connection.query(`
        INSERT INTO \`customers\` (\`id\`, \`name\`, \`email\`, \`phone\`, \`password_hash\`, \`address\`, \`status\`)
        VALUES (1, 'Khách Hàng TechShop', 'customer@techshop.vn', '0987654321', '$2b$10$defaultHashForDemo', 'Hà Nội, Việt Nam', 'active')
        ON DUPLICATE KEY UPDATE \`name\` = \`name\`;
      `);
    }

    const [ordersCount] = await connection.query("SELECT COUNT(*) as count FROM `orders`");
    if (ordersCount[0].count === 0) {
      await connection.query(`
        INSERT INTO \`orders\` (\`id\`, \`order_code\`, \`customer_id\`, \`recipient_name\`, \`recipient_phone\`, \`shipping_address\`, \`payment_method\`, \`payment_status\`, \`shipping_status\`, \`total_amount\`, \`shipping_fee\`, \`final_amount\`, \`order_notes\`, \`created_at\`)
        VALUES
          (1, 'ORD-202610-001', 1, 'Trần Văn Hoàng', '0987654321', 'Số 12 Cầu Giấy, Hà Nội', 'vietqr_banking', 'paid', 'delivered', 25500000.00, 0.00, 25500000.00, 'Giao giờ hành chính', '2026-10-02 10:30:00'),
          (2, 'ORD-202610-002', 1, 'Nguyễn Thị Mai', '0912888999', 'Toà Landmark 81, TP.HCM', 'cod', 'paid', 'delivered', 18200000.00, 30000.00, 18230000.00, 'Khách hẹn giao sau 5h chiều', '2026-10-03 14:15:00'),
          (3, 'ORD-202610-003', 1, 'Lê Hữu Đạt', '0903112233', 'Khu CNC Hoà Lạc, Hà Nội', 'vietqr_banking', 'paid', 'shipping', 45000000.00, 0.00, 45000000.00, 'Combo PC Đồ hoạ', '2026-10-05 09:00:00'),
          (4, 'ORD-202610-004', 1, 'Phạm Minh Trí', '0933445566', '120 Trần Phú, Đà Nẵng', 'cod', 'unpaid', 'processing', 3200000.00, 30000.00, 3230000.00, 'Giao tận tay', '2026-10-07 16:45:00'),
          (5, 'ORD-202610-005', 1, 'Đặng Thu Hương', '0977889900', '25 Lê Duẩn, Huế', 'vietqr_banking', 'refunded', 'cancelled', 8500000.00, 0.00, 8500000.00, 'Khách đổi ý mua dòng khác', '2026-10-06 11:20:00'),
          (6, 'ORD-202610-006', 1, 'Vũ Quốc Bảo', '0945678901', '78 Nguyễn Huệ, Q.1, TP.HCM', 'vietqr_banking', 'paid', 'delivered', 31900000.00, 0.00, 31900000.00, 'Kèm quà tặng TechShop', '2026-10-08 08:30:00');
      `);

      // Seed items
      await connection.query(`
        INSERT INTO \`order_items\` (\`order_id\`, \`product_name\`, \`variant_name\`, \`sku\`, \`unit_price\`, \`quantity\`, \`subtotal\`)
        VALUES 
          (1, 'Laptop Gaming ASUS ROG Strix G16', 'i7-13650HX / 16GB / RTX 4060', 'ROG-G16-4060', 25500000.00, 1, 25500000.00),
          (2, 'Màn hình Dell UltraSharp 27 4K U2723QE', '27 inch 4K IPS Black', 'DELL-U2723QE', 18200000.00, 1, 18200000.00),
          (3, 'Card Màn Hình VGA RTX 4070 Ti Super 16GB', 'Triple Fan OC Edition', 'VGA-RTX4070TIS', 23000000.00, 1, 23000000.00),
          (3, 'CPU Intel Core i9-14900K 24 Nhân 32 Luồng', 'Box Chính Hãng', 'CPU-I9-14900K', 14500000.00, 1, 14500000.00),
          (3, 'Mainboard ASUS ROG MAXIMUS Z790 HERO', 'ATX DDR5 WiFi 7', 'MB-ASUS-Z790H', 7500000.00, 1, 7500000.00),
          (4, 'Bàn phím cơ không dây ASUS ROG Azoth OLED', 'ROG NX Red Switch', 'KB-ROG-AZOTH', 3200000.00, 1, 3200000.00),
          (5, 'Tai nghe không dây Sony WH-1000XM5 Hi-Res', 'Silver Platinum', 'HEAD-SONY-XM5', 8500000.00, 1, 8500000.00),
          (6, 'Apple iPhone 15 Pro Max 256GB Titan Tự Nhiên', '256GB Titan', 'IP15PM-256-NAT', 31900000.00, 1, 31900000.00);
      `);
    }

    console.log('✅ Database schema verified (coupons, tasks, schedules, orders ready).');
  } catch (error) {
    console.warn('⚠️ Notice during initDatabaseSchema:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Health check helper to test database connectivity
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('🚀 MySQL Connection Pool successfully established.');
    connection.release();
    await initDatabaseSchema();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabaseSchema
};
