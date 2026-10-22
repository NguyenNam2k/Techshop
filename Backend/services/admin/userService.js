const bcrypt = require('bcryptjs');
const Customer = require('../../repositories/customer/CustomerRepository');
const Admin = require('../../repositories/admin/AdminRepository');
const Manager = require('../../repositories/manager/ManagerRepository');
const Staff = require('../../repositories/manager/StaffRepository');

const userService = {
  /**
   * Lấy danh sách tất cả người dùng từ 4 bảng CSDL
   */
  getAllUsers: async () => {
    const [customers, admins, managers, staffs] = await Promise.all([
      Customer.findAll(),
      Admin.findAll(),
      Manager.findAll(),
      Staff.findAll()
    ]);

    const allUsers = [
      ...customers.map(u => ({ ...u, role: 'customer' })),
      ...admins.map(u => ({ ...u, role: 'admin' })),
      ...managers.map(u => ({ ...u, role: 'manager' })),
      ...staffs.map(u => ({ ...u, role: 'staff' }))
    ];

    // Sắp xếp theo thứ tự ID nhỏ đến lớn
    allUsers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);

    return { users: allUsers, total: allUsers.length };
  },

  /**
   * Lấy chi tiết 1 người dùng theo id + role
   */
  getUserById: async (id, role) => {
    let user = null;

    if (role === 'customer') {
      user = await Customer.findByIdForProfile(id);
    } else if (role === 'admin') {
      user = await Admin.findByIdForProfile(id);
    } else if (role === 'manager') {
      user = await Manager.findByIdForProfile(id);
    } else if (role === 'staff') {
      user = await Staff.findByIdForProfile(id);
    }

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng!' };
    }

    user.role = role;
    return user;
  },

  /**
   * Tạo tài khoản người dùng mới (Admin khởi tạo)
   */
  createUser: async (adminUserId, { role, name, email, password, phone, ...extra }) => {
    if (!role) throw { status: 400, message: 'Vui lòng chọn Role!' };
    if (!name || !name.trim()) throw { status: 400, message: 'Vui lòng nhập Họ và tên!' };
    if (!email || !email.trim()) throw { status: 400, message: 'Vui lòng nhập Email!' };

    // Nếu không nhập mật khẩu -> tự động dùng mật khẩu mặc định 123456
    const rawPassword = (password && password.trim()) ? password.trim() : '123456';
    if (rawPassword.length < 6) {
      throw { status: 400, message: 'Mật khẩu phải ít nhất 6 ký tự!' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(rawPassword, salt);
    let newId;

    if (role === 'customer') {
      const exists = await Customer.findByEmail(cleanEmail);
      if (exists) throw { status: 400, message: 'Email đã tồn tại trong hệ thống!' };

      newId = await Customer.create({
        name: name.trim(), email: cleanEmail, password_hash,
        phone: phone ? phone.trim() : null,
        address: extra.address ? extra.address.trim() : null
      });

    } else if (role === 'admin') {
      const exists = await Admin.findByEmail(cleanEmail);
      if (exists) throw { status: 400, message: 'Email đã tồn tại trong hệ thống!' };
      if (!extra.username) throw { status: 400, message: 'Admin cần có Username!' };

      newId = await Admin.create({
        username: extra.username.trim(), email: cleanEmail, password_hash,
        full_name: name.trim(), phone: phone ? phone.trim() : null,
        security_level: extra.security_level || 'system_admin'
      });

    } else if (role === 'manager') {
      const exists = await Manager.findByEmail(cleanEmail);
      if (exists) throw { status: 400, message: 'Email đã tồn tại trong hệ thống!' };
      if (!extra.manager_code) throw { status: 400, message: 'Manager cần có Mã quản lý!' };

      newId = await Manager.create({
        manager_code: extra.manager_code.trim(), email: cleanEmail, password_hash,
        full_name: name.trim(), phone: phone ? phone.trim() : null,
        branch_name: extra.branch_name || 'TechGear Flagship Store',
        admin_id: adminUserId
      });

    } else if (role === 'staff') {
      const exists = await Staff.findByEmail(cleanEmail);
      if (exists) throw { status: 400, message: 'Email đã tồn tại trong hệ thống!' };
      if (!extra.staff_code) throw { status: 400, message: 'Staff cần có Mã nhân viên!' };

      newId = await Staff.create({
        staff_code: extra.staff_code.trim(), email: cleanEmail, password_hash,
        full_name: name.trim(), phone: phone ? phone.trim() : null,
        department: extra.department || 'Warehouse',
        manager_id: extra.manager_id || null
      });

    } else {
      throw { status: 400, message: 'Role không hợp lệ!' };
    }

    return { id: newId, name: name.trim(), email: cleanEmail, role };
  },

  /**
   * Kích hoạt / Vô hiệu hóa tài khoản (active / blocked)
   */
  updateUserStatus: async (id, role, status) => {
    if (!role || !status) {
      throw { status: 400, message: 'Thiếu role hoặc status!' };
    }

    const validCustomerStatus = ['active', 'blocked'];
    const validOtherStatus = ['active', 'inactive'];

    if (role === 'customer') {
      if (!validCustomerStatus.includes(status)) {
        throw { status: 400, message: 'Status không hợp lệ! (active | blocked)' };
      }
      await Customer.updateStatus(id, status);
    } else if (role === 'admin') {
      if (!validOtherStatus.includes(status)) {
        throw { status: 400, message: 'Status không hợp lệ! (active | inactive)' };
      }
      await Admin.updateStatus(id, status);
    } else if (role === 'manager') {
      if (!validOtherStatus.includes(status)) {
        throw { status: 400, message: 'Status không hợp lệ! (active | inactive)' };
      }
      await Manager.updateStatus(id, status);
    } else if (role === 'staff') {
      if (!validOtherStatus.includes(status)) {
        throw { status: 400, message: 'Status không hợp lệ! (active | inactive)' };
      }
      await Staff.updateStatus(id, status);
    } else {
      throw { status: 400, message: 'Role không hợp lệ!' };
    }

    return { status };
  },

  /**
   * Thay đổi vai trò người dùng (Assign Role)
   */
  updateUserRole: async (id, currentRole, newRole) => {
    if (!currentRole || !newRole) {
      throw { status: 400, message: 'Thiếu vai trò hiện tại hoặc vai trò mới!' };
    }
    if (currentRole === newRole) {
      return { success: true, message: 'Vai trò không thay đổi.' };
    }

    const validRoles = ['customer', 'admin', 'manager', 'staff'];
    if (!validRoles.includes(newRole)) {
      throw { status: 400, message: 'Vai trò mới không hợp lệ!' };
    }

    const user = await userService.getUserById(id, currentRole);
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng!' };
    }

    const { pool } = require('../../config/database');
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const name = user.full_name || user.name || 'Người dùng';
      const email = user.email;
      const phone = user.phone || null;
      const pwdHash = user.password_hash || '$2a$10$3c4573b0f5ef89791ffbbuJ80b4jQy48p5wL47q66UaK2w3G';

      if (newRole === 'customer') {
        await conn.query(
          `INSERT INTO customers (name, email, password_hash, phone, status) VALUES (?, ?, ?, ?, 'active')`,
          [name, email, pwdHash, phone]
        );
      } else if (newRole === 'admin') {
        const username = user.username || `admin_${Date.now().toString().slice(-4)}`;
        await conn.query(
          `INSERT INTO admins (username, email, password_hash, full_name, phone, security_level, status) VALUES (?, ?, ?, ?, ?, 'system_admin', 'active')`,
          [username, email, pwdHash, name, phone]
        );
      } else if (newRole === 'manager') {
        const mgrCode = user.manager_code || `MGR${Date.now().toString().slice(-4)}`;
        await conn.query(
          `INSERT INTO managers (manager_code, full_name, email, password_hash, phone, status) VALUES (?, ?, ?, ?, ?, 'active')`,
          [mgrCode, name, email, pwdHash, phone]
        );
      } else if (newRole === 'staff') {
        const stfCode = user.staff_code || `STF${Date.now().toString().slice(-4)}`;
        await conn.query(
          `INSERT INTO staffs (staff_code, full_name, email, password_hash, phone, department, status) VALUES (?, ?, ?, ?, ?, 'Warehouse', 'active')`,
          [stfCode, name, email, pwdHash, phone]
        );
      }

      const oldTable = currentRole === 'staff' ? 'staffs' : currentRole === 'admin' ? 'admins' : currentRole === 'manager' ? 'managers' : 'customers';
      await conn.query(`DELETE FROM ${oldTable} WHERE id = ?`, [id]);

      await conn.commit();
      return { success: true };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
};

module.exports = userService;
