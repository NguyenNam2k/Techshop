const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Connection Pool Configuration
 * Utilizes mysql2/promise for async/await transactions and queries
 */
const isRemoteDb = Boolean(process.env.DB_HOST && !['localhost', '127.0.0.1'].includes(process.env.DB_HOST));
const isSslEnabled = process.env.DB_SSL === 'true' || (process.env.DB_SSL !== 'false' && isRemoteDb);

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
  timezone: '+07:00',
  ssl: isSslEnabled ? { minVersion: 'TLSv1.2', rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined
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

    // 2c. Ensure sort_order exists in categories
    try {
      await connection.query("ALTER TABLE `categories` ADD COLUMN `sort_order` INT NOT NULL DEFAULT 0");
    } catch (e) {
      // Column already exists
    }

    try {
      await connection.query(
        "ALTER TABLE `orders` ADD COLUMN `payment_expires_at` TIMESTAMP NULL DEFAULT NULL AFTER `payment_status`"
      );
    } catch (e) {
      // Column already exists or the orders table is not ready yet.
    }
    try {
      await connection.query(
        `UPDATE \`orders\`
         SET \`payment_expires_at\` = DATE_ADD(\`created_at\`, INTERVAL 15 MINUTE)
         WHERE \`payment_method\` = 'vietqr_banking'
           AND \`payment_status\` = 'unpaid'
           AND \`shipping_status\` = 'pending'
           AND \`payment_expires_at\` IS NULL`
      );
    } catch (e) {
      // The orders table may not have been created yet.
    }
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`return_requests\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`order_id\` INT UNSIGNED NOT NULL,
        \`customer_id\` INT UNSIGNED NOT NULL,
        \`reason\` VARCHAR(500) NOT NULL,
        \`status\` ENUM('pending', 'approved', 'rejected', 'refunded') NOT NULL DEFAULT 'pending',
        \`refund_method\` VARCHAR(50) NULL,
        \`manager_note\` VARCHAR(500) NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_return_order\` (\`order_id\`),
        INDEX \`idx_return_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2b. Ensure username column exists in customers, managers, staffs
    for (const tbl of ['customers', 'managers', 'staffs']) {
      try {
        await connection.query(`ALTER TABLE \`${tbl}\` ADD COLUMN \`username\` VARCHAR(50) NULL UNIQUE AFTER \`id\``);
      } catch (e) {
        // Column already exists or error handled
      }
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

    // 10. Ensure reviews table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`reviews\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`product_id\` INT UNSIGNED NOT NULL,
        \`customer_id\` INT UNSIGNED NULL,
        \`customer_name\` VARCHAR(100) NOT NULL DEFAULT 'Khách hàng TechShop',
        \`rating\` TINYINT NOT NULL,
        \`comment\` TEXT NULL,
        \`is_verified_buyer\` TINYINT(1) DEFAULT 1,
        \`likes\` INT DEFAULT 0,
        \`status\` ENUM('approved', 'pending', 'hidden') DEFAULT 'approved',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_reviews_product_id\` (\`product_id\`),
        INDEX \`idx_reviews_status\` (\`status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const [reviewCount] = await connection.query("SELECT COUNT(*) as count FROM `reviews`");
    if (reviewCount[0].count === 0) {
      await connection.query(`
        INSERT INTO \`reviews\` (\`product_id\`, \`customer_name\`, \`rating\`, \`comment\`, \`is_verified_buyer\`, \`likes\`, \`status\`)
        VALUES
          (1, 'Hoàng Nam', 5, 'Card siêu khủng, full load nhiệt độ chỉ tầm 65 độ C. Đóng gói cẩn thận, giao hỏa tốc 2h.', 1, 3, 'approved'),
          (1, 'Đức Anh', 5, 'Card khá to và nặng, anh em nhớ sắm thêm giá đỡ VGA nhé. Hiệu năng đỉnh nóc kịch trần.', 1, 4, 'approved'),
          (2, 'Minh Tuấn', 5, 'Cân tốt mọi game 4K Ray Tracing max setting. Bản White Edition lắp case trắng nhìn đẹp mê ly.', 1, 5, 'approved'),
          (2, 'Văn Hưng', 5, 'Hàng chính hãng bảo hành 36 tháng ASUS, quạt chạy cực êm không hề có tiếng coil whine.', 1, 2, 'approved'),
          (3, 'Quốc Bảo', 5, '3D V-Cache chơi game FPS mượt không đối thủ. Vừa render 4K vừa chơi game không bị drop frame.', 1, 3, 'approved'),
          (3, 'Thanh Tùng', 5, 'Tiết kiệm điện hơn hẳn gen trước. Nhiệt độ mát mẻ khi đi cùng tản AIO 360.', 1, 2, 'approved'),
          (4, 'Thành Long', 5, 'Mainboard flagship hoàn thiện cực kỳ tinh xảo. Bios ASUS trực quan, ép xung RAM DDR5 rất ổn định.', 1, 3, 'approved'),
          (5, 'Duy Khánh', 5, 'Bản Formula White tuyệt đẹp, tản nhiệt VRM xịn có thể gắn custom water cooling.', 1, 1, 'approved'),
          (6, 'Gia Huy', 5, 'LED RGB mịn đẹp xuất sắc qua iCUE. Bật XMP 6000MHz chạy cái ăn ngay không lỗi lầm.', 1, 4, 'approved'),
          (7, 'Bảo Châu', 5, 'Kit RAM trắng tinh tế, tản nhiệt nhôm dày cộm cầm rất nặng tay.', 1, 2, 'approved'),
          (8, 'Bảo Long', 5, 'Tốc độ đọc ghi 7450/6900 MB/s đo thực tế chuẩn đét. Có sẵn heatsink nên nhiệt độ chỉ 45-50 độ.', 1, 5, 'approved'),
          (9, 'Hải Đăng', 5, 'Thiết kế cắm dây bên hông cực kỳ tiện cho việc đi dây nguồn. Quạt êm ru kể cả khi tải nặng.', 1, 3, 'approved'),
          (10, 'Việt Hoàng', 5, 'Nguồn chuẩn ATX 3.0 tặng kèm dây 12VHPWR cho card 40 series, màu trắng tiệp màu case.', 1, 2, 'approved'),
          (11, 'Ngọc Sơn', 5, 'Màn hình LCD 2.36 inch sắc nét, hiển thị nhiệt độ CPU/GPU rất tiện. Cụm bơm hoạt động rất êm.', 1, 4, 'approved'),
          (12, 'Phương Nam', 5, 'Tản nhiệt tốt cho con i9 14900K, phần mềm CAM dễ điều khiển hình động GIF.', 1, 2, 'approved'),
          (13, 'Anh Quân', 5, 'Vỏ case huyền thoại, dải led RGB viền rất sang. Mặt kính trong suốt show linh kiện cực đẹp.', 1, 6, 'approved'),
          (14, 'Duy Khang', 5, 'Full nhôm CNC gõ đầm tay, gasket mount êm ái. Kết nối bluetooth 3 thiết bị chuyển đổi nhanh.', 1, 3, 'approved'),
          (15, 'Trọng Nhân', 5, 'Chuột 60g nhẹ tênh, switch quang cơ gõ nảy và không lo double click. Pin trâu dùng cả tuần.', 1, 7, 'approved'),
          (16, 'Phúc Thịnh', 5, 'Màn hình OLED 240Hz màu đen sâu thẳm, tần số quét mượt mà. Xem phim hay chơi game đều tuyệt đỉnh.', 1, 5, 'approved'),
          (17, 'Quang Minh', 5, 'Màn OLED 240Hz đẹp mê hồn, RTX 4080 kéo game nặng vô tư. Máy mỏng nhẹ hoàn thiện nhôm CNC sang trọng.', 1, 8, 'approved');
      `);
    }

    console.log('✅ Database schema verified (coupons, tasks, schedules, orders, reviews ready).');
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
