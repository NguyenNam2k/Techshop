const userService = require('../services/userService');

/**
 * Lấy danh sách tất cả người dùng (gộp từ 4 bảng)
 * GET /api/users
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await userService.getAllUsers();
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('[GetAllUsers Error]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Lỗi lấy danh sách người dùng!',
      error: error.error || error.message
    });
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
    const user = await userService.getUserById(id, role);
    return res.json({ success: true, user });
  } catch (error) {
    console.error('[GetUserById Error]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Lỗi lấy thông tin người dùng!',
      error: error.error || error.message
    });
  }
};

/**
 * Tạo người dùng mới (Admin tạo tài khoản cho staff/manager/admin)
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const newUser = await userService.createUser(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: `Tạo tài khoản ${newUser.role} thành công!`,
      user: newUser
    });
  } catch (error) {
    console.error('[CreateUser Error]:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Username hoặc Mã nhân viên đã tồn tại!' });
    }
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Lỗi tạo tài khoản!',
      error: error.error || error.message
    });
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
    await userService.updateUserStatus(id, role, status);

    return res.json({
      success: true,
      message: `Đã ${status === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản thành công!`
    });
  } catch (error) {
    console.error('[UpdateUserStatus Error]:', error);
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Lỗi cập nhật trạng thái!',
      error: error.error || error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUserStatus
};
