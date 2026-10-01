const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Staff = require('../models/Staff');

/**
 * Lấy danh sách tất cả người dùng (gộp từ 4 bảng)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const [customers, admins, managers, staffs] = await Promise.all([
      Customer.findAll(),
      Admin.findAll(),
      Manager.findAll(),
      Staff.findAll()
    ]);

    // Gắn role cho từng danh sách
    const allUsers = [
      ...customers.map(u => ({ ...u, role: 'customer' })),
      ...admins.map(u => ({ ...u, role: 'admin' })),
      ...managers.map(u => ({ ...u, role: 'manager' })),
      ...staffs.map(u => ({ ...u, role: 'staff' }))
    ];

    // Sắp xếp theo ngày tạo mới nhất
    allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ success: true, users: allUsers, total: allUsers.length });

  } catch (error) {
    console.error('[GetAllUsers Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách người dùng!', error: error.message });
  }
};

/**
 * Lấy chi tiết 1 người dùng theo id + role
 * GET /api/users/:id?role=customer
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query;

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
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
    }

    user.role = role;
    return res.json({ success: true, user });

  } catch (error) {
    console.error('[GetUserById Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin người dùng!', error: error.message });
  }
};

/**
 * Tạo người dùng mới (Admin tạo tài khoản cho staff/manager/admin)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { role, name, email, password, phone, ...extra } = req.body;

    // Validate chung
    if (!role) return res.status(400).json({ success: false, message: 'Vui lòng chọn Role!' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập Họ và tên!' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'Vui lòng nhập Email!' });
    if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Mật khẩu phải ít nhất 6 ký tự!' });

    const cleanEmail = email.trim().toLowerCase();

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    let newId;

    if (role === 'customer') {
      const exists = await Customer.findByEmail(cleanEmail);
      if (exists) return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống!' });

      newId = await Customer.create({
        name: name.trim(), email: cleanEmail, password_hash,
        phone: phone ? phone.trim() : null,
        address: extra.address ? extra.address.trim() : null
      });

    } else if (role === 'admin') {
      const exists = await Admin.findByEmail(cleanEmail);
      if (exists) return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống!' });

      if (!extra.username) return res.status(400).json({ success: false, message: 'Admin cần có Username!' });

      newId = await Admin.create({
        username: extra.username.trim(), email: cleanEmail, password_hash,
        full_name: name.trim(), phone: phone ? phone.trim() : null,
        security_level: extra.security_level || 'system_admin'
      });

    } else if (role === 'manager') {
      const exists = await Manager.findByEmail(cleanEmail);
      if (exists) return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống!' });

      if (!extra.manager_code) return res.status(400).json({ success: false, message: 'Manager cần có Mã quản lý!' });

      newId = await Manager.create({
        manager_code: extra.manager_code.trim(), email: cleanEmail, password_hash,
        full_name: name.trim(), phone: phone ? phone.trim() : null,
        branch_name: extra.branch_name || 'TechGear Flagship Store',
        admin_id: req.user.id
      });

    } else if (role === 'staff') {
      const exists = await Staff.findByEmail(cleanEmail);
      if (exists) return res.status(400).json({ success: false, message: 'Email đã tồn tại trong hệ thống!' });

      if (!extra.staff_code) return res.status(400).json({ success: false, message: 'Staff cần có Mã nhân viên!' });

      newId = await Staff.create({
        staff_code: extra.staff_code.trim(), email: cleanEmail, password_hash,
        full_name: name.trim(), phone: phone ? phone.trim() : null,
        department: extra.department || 'Warehouse',
        manager_id: extra.manager_id || null
      });

    } else {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ!' });
    }

    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${role} thành công!`,
      user: { id: newId, name: name.trim(), email: cleanEmail, role }
    });

  } catch (error) {
    console.error('[CreateUser Error]:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Username hoặc Mã nhân viên đã tồn tại!' });
    }
    return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản!', error: error.message });
  }
};

/**
 * Kích hoạt / Vô hiệu hóa tài khoản
 * PATCH /api/users/:id/status
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    if (!role || !status) {
      return res.status(400).json({ success: false, message: 'Thiếu role hoặc status!' });
    }

    const validCustomerStatus = ['active', 'blocked'];
    const validOtherStatus = ['active', 'inactive'];

    if (role === 'customer') {
      if (!validCustomerStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status không hợp lệ! (active | blocked)' });
      }
      await Customer.updateStatus(id, status);
    } else if (role === 'admin') {
      if (!validOtherStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status không hợp lệ! (active | inactive)' });
      }
      await Admin.updateStatus(id, status);
    } else if (role === 'manager') {
      if (!validOtherStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status không hợp lệ! (active | inactive)' });
      }
      await Manager.updateStatus(id, status);
    } else if (role === 'staff') {
      if (!validOtherStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Status không hợp lệ! (active | inactive)' });
      }
      await Staff.updateStatus(id, status);
    } else {
      return res.status(400).json({ success: false, message: 'Role không hợp lệ!' });
    }

    return res.json({
      success: true,
      message: `Đã ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản thành công!`
    });

  } catch (error) {
    console.error('[UpdateUserStatus Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái!', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserStatus
};
