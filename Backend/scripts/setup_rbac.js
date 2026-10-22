const { pool } = require('../config/database');

async function setupRbacTables() {
  try {
    console.log('--- Checking & Creating RBAC Tables ---');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`role_name\` VARCHAR(50) NOT NULL UNIQUE,
        \`display_name\` VARCHAR(100) NOT NULL,
        \`description\` TEXT NULL,
        \`is_system\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`permissions\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`permission_name\` VARCHAR(100) NOT NULL UNIQUE,
        \`display_name\` VARCHAR(150) NOT NULL,
        \`module\` VARCHAR(50) NOT NULL,
        \`description\` TEXT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`role_permissions\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`role_id\` INT UNSIGNED NOT NULL,
        \`permission_id\` INT UNSIGNED NOT NULL,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY \`uk_role_perm\` (\`role_id\`, \`permission_id\`),
        CONSTRAINT \`fk_rp_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_rp_perm\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed Roles
    const roles = [
      ['admin', 'Quản trị viên hệ thống', 'Toàn quyền cấu hình và quản trị hệ sinh thái TechShop', 1],
      ['manager', 'Quản lý cửa hàng', 'Quản lý sản phẩm, tồn kho, đơn hàng, báo cáo và nhân sự', 1],
      ['staff', 'Nhân viên bán hàng / kho', 'Xử lý đơn hàng, kho bãi và hỗ trợ khách hàng', 1],
      ['customer', 'Khách hàng', 'Người mua sắm trực tuyến trên hệ thống', 1]
    ];

    for (const [name, display, desc, isSys] of roles) {
      await pool.query(
        `INSERT IGNORE INTO \`roles\` (role_name, display_name, description, is_system) VALUES (?, ?, ?, ?)`,
        [name, display, desc, isSys]
      );
    }

    // Seed Permissions
    const perms = [
      // Module Users & Roles
      ['users.view', 'Xem danh sách người dùng', 'users', 'Xem chi tiết các tài khoản người dùng'],
      ['users.create', 'Tạo tài khoản người dùng', 'users', 'Thêm mới khách hàng, nhân viên, quản lý'],
      ['users.status', 'Khóa / Mở khóa tài khoản', 'users', 'Thay đổi trạng thái hoạt động của tài khoản'],
      ['roles.view', 'Xem danh sách vai trò', 'roles', 'Xem các vai trò và quyền hạn trong hệ thống'],
      ['roles.manage', 'Quản lý vai trò & quyền', 'roles', 'Tạo mới, sửa và gán quyền cho vai trò'],
      
      // Module Products & Catalog
      ['products.view', 'Xem danh sách sản phẩm', 'products', 'Xem danh sách linh kiện phần cứng'],
      ['products.create', 'Thêm mới sản phẩm', 'products', 'Đăng tải sản phẩm mới lên sàn'],
      ['products.update', 'Chỉnh sửa sản phẩm', 'products', 'Cập nhật thông tin, giá, thông số và biến thể'],
      ['products.delete', 'Xóa sản phẩm', 'products', 'Xóa sản phẩm an toàn'],
      ['inventory.manage', 'Quản lý tồn kho', 'inventory', 'Điều chỉnh số lượng kho hàng, xem nhật ký tồn kho'],
      ['categories.manage', 'Quản lý danh mục', 'categories', 'Thêm, sửa, xóa danh mục linh kiện'],

      // Module Orders & Coupons
      ['orders.view', 'Xem danh sách đơn hàng', 'orders', 'Xem chi tiết và trạng thái đơn hàng của khách'],
      ['orders.update', 'Xử lý & Cập nhật đơn hàng', 'orders', 'Duyệt đơn, đổi trạng thái giao hàng'],
      ['coupons.manage', 'Quản lý khuyến mãi / mã giảm giá', 'coupons', 'Tạo mã voucher, cấu hình chiết khấu'],
      
      // Module Staff & Reports
      ['staffs.manage', 'Quản lý & Phân công nhân viên', 'staffs', 'Phân ca làm, giao nhiệm vụ, đánh giá KPI'],
      ['reports.view', 'Xem báo cáo doanh thu', 'reports', 'Xem biểu đồ thống kê tài chính và sản lượng bán']
    ];

    for (const [name, display, moduleName, desc] of perms) {
      await pool.query(
        `INSERT IGNORE INTO \`permissions\` (permission_name, display_name, module, description) VALUES (?, ?, ?, ?)`,
        [name, display, moduleName, desc]
      );
    }

    // Assign all permissions to 'admin'
    const [adminRole] = await pool.query(`SELECT id FROM \`roles\` WHERE role_name = 'admin'`);
    if (adminRole.length > 0) {
      const adminId = adminRole[0].id;
      const [allPerms] = await pool.query(`SELECT id FROM \`permissions\``);
      for (const p of allPerms) {
        await pool.query(
          `INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (?, ?)`,
          [adminId, p.id]
        );
      }
    }

    // Assign manager permissions
    const [managerRole] = await pool.query(`SELECT id FROM \`roles\` WHERE role_name = 'manager'`);
    if (managerRole.length > 0) {
      const managerId = managerRole[0].id;
      const [mgrPerms] = await pool.query(
        `SELECT id FROM \`permissions\` WHERE module IN ('products', 'inventory', 'categories', 'orders', 'coupons', 'staffs', 'reports')`
      );
      for (const p of mgrPerms) {
        await pool.query(
          `INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (?, ?)`,
          [managerId, p.id]
        );
      }
    }

    // Assign staff permissions
    const [staffRole] = await pool.query(`SELECT id FROM \`roles\` WHERE role_name = 'staff'`);
    if (staffRole.length > 0) {
      const staffId = staffRole[0].id;
      const [stfPerms] = await pool.query(
        `SELECT id FROM \`permissions\` WHERE permission_name IN ('products.view', 'inventory.manage', 'orders.view', 'orders.update')`
      );
      for (const p of stfPerms) {
        await pool.query(
          `INSERT IGNORE INTO \`role_permissions\` (role_id, permission_id) VALUES (?, ?)`,
          [staffId, p.id]
        );
      }
    }

    console.log('✅ RBAC Tables setup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ RBAC Tables setup failed:', err.message);
    process.exit(1);
  }
}

setupRbacTables();
