/**
 * seed-accounts.js
 * Tạo các tài khoản test cho từng role trong TechShop DB
 * Chạy: node seed-accounts.js
 */

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const SALT_ROUNDS = 10;

// ============================================================
// Danh sách tài khoản cần tạo
// ============================================================
const ACCOUNTS = {
  customers: [
    {
      name: 'Nguyễn Văn Khách',
      email: 'customer@techshop.vn',
      password: 'customer123',
      phone: '0901234567',
      address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      status: 'active',
    },
    {
      name: 'Trần Thị Mua Hàng',
      email: 'customer2@techshop.vn',
      password: 'customer123',
      phone: '0912345678',
      address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      status: 'active',
    },
  ],

  admins: [
    {
      username: 'superadmin',
      email: 'admin@techshop.vn',
      password: 'admin123',
      full_name: 'Quản Trị Viên Chính',
      phone: '0888123456',
      security_level: 'super_admin',
      status: 'active',
    },
    {
      username: 'sysadmin',
      email: 'sysadmin@techshop.vn',
      password: 'admin123',
      full_name: 'Quản Trị Hệ Thống',
      phone: '0888654321',
      security_level: 'system_admin',
      status: 'active',
    },
  ],

  managers: [
    {
      manager_code: 'MGR001',
      full_name: 'Nguyễn Thị Quản Lý',
      email: 'manager@techshop.vn',
      password: 'manager123',
      phone: '0977123456',
      branch_name: 'TechShop Chi Nhánh Hà Nội',
      status: 'active',
    },
    {
      manager_code: 'MGR002',
      full_name: 'Lê Văn Trưởng Nhóm',
      email: 'manager2@techshop.vn',
      password: 'manager123',
      phone: '0977654321',
      branch_name: 'TechShop Chi Nhánh TP.HCM',
      status: 'active',
    },
  ],

  staffs: [
    {
      staff_code: 'STF001',
      full_name: 'Phạm Văn Nhân Viên',
      email: 'staff@techshop.vn',
      password: 'staff123',
      phone: '0966123456',
      department: 'Sales',
      status: 'active',
    },
    {
      staff_code: 'STF002',
      full_name: 'Đỗ Thị Kho Hàng',
      email: 'staff2@techshop.vn',
      password: 'staff123',
      phone: '0966654321',
      department: 'Warehouse',
      status: 'active',
    },
    {
      staff_code: 'STF003',
      full_name: 'Võ Văn Hỗ Trợ',
      email: 'staff3@techshop.vn',
      password: 'staff123',
      phone: '0966789012',
      department: 'Customer Support',
      status: 'active',
    },
  ],
};

// ============================================================
async function main() {
  console.log('🚀 TechShop — Bắt đầu tạo tài khoản test...\n');

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'techshop_db',
    port:     process.env.DB_PORT     || 3306,
  });

  console.log('✅ Kết nối database thành công!\n');

  // ── CUSTOMERS ──────────────────────────────────────────────
  console.log('👤 Tạo tài khoản CUSTOMERS...');
  for (const c of ACCOUNTS.customers) {
    const hash = await bcrypt.hash(c.password, SALT_ROUNDS);
    try {
      await conn.execute(
        'INSERT INTO customers (name, email, password_hash, phone, address, status) VALUES (?, ?, ?, ?, ?, ?)',
        [c.name, c.email, hash, c.phone, c.address, c.status]
      );
      console.log(`   ✓ ${c.email}  (password: ${c.password})`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`   ⚠ ${c.email} đã tồn tại — bỏ qua`);
      } else throw e;
    }
  }

  // ── ADMINS ─────────────────────────────────────────────────
  console.log('\n🔐 Tạo tài khoản ADMINS...');
  for (const a of ACCOUNTS.admins) {
    const hash = await bcrypt.hash(a.password, SALT_ROUNDS);
    try {
      await conn.execute(
        'INSERT INTO admins (username, email, password_hash, full_name, phone, security_level, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [a.username, a.email, hash, a.full_name, a.phone, a.security_level, a.status]
      );
      console.log(`   ✓ ${a.email}  (username: ${a.username}, password: ${a.password})`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`   ⚠ ${a.email} đã tồn tại — bỏ qua`);
      } else throw e;
    }
  }

  // ── MANAGERS ───────────────────────────────────────────────
  console.log('\n🏢 Tạo tài khoản MANAGERS...');
  for (const m of ACCOUNTS.managers) {
    const hash = await bcrypt.hash(m.password, SALT_ROUNDS);
    try {
      await conn.execute(
        'INSERT INTO managers (manager_code, full_name, email, password_hash, phone, branch_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [m.manager_code, m.full_name, m.email, hash, m.phone, m.branch_name, m.status]
      );
      console.log(`   ✓ ${m.email}  (code: ${m.manager_code}, password: ${m.password})`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`   ⚠ ${m.email} đã tồn tại — bỏ qua`);
      } else throw e;
    }
  }

  // ── STAFFS ─────────────────────────────────────────────────
  console.log('\n👷 Tạo tài khoản STAFFS...');
  for (const s of ACCOUNTS.staffs) {
    const hash = await bcrypt.hash(s.password, SALT_ROUNDS);
    try {
      await conn.execute(
        'INSERT INTO staffs (staff_code, full_name, email, password_hash, phone, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [s.staff_code, s.full_name, s.email, hash, s.phone, s.department, s.status]
      );
      console.log(`   ✓ ${s.email}  (code: ${s.staff_code}, password: ${s.password})`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`   ⚠ ${s.email} đã tồn tại — bỏ qua`);
      } else throw e;
    }
  }

  await conn.end();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎉 HOÀN TẤT! Danh sách tài khoản test:\n');
  console.log('ROLE        EMAIL                      PASSWORD      CODE/USERNAME');
  console.log('──────────  ─────────────────────────  ────────────  ─────────────');
  console.log('customer    customer@techshop.vn        customer123   (email)');
  console.log('customer    customer2@techshop.vn       customer123   (email)');
  console.log('admin       admin@techshop.vn           admin123      superadmin');
  console.log('admin       sysadmin@techshop.vn        admin123      sysadmin');
  console.log('manager     manager@techshop.vn         manager123    MGR001');
  console.log('manager     manager2@techshop.vn        manager123    MGR002');
  console.log('staff       staff@techshop.vn           staff123      STF001');
  console.log('staff       staff2@techshop.vn          staff123      STF002');
  console.log('staff       staff3@techshop.vn          staff123      STF003');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('\n❌ Lỗi:', err.message);
  process.exit(1);
});
