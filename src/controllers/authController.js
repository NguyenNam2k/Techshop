const authService = require('../services/authService');

/**
 * Đăng ký tài khoản Khách hàng (Customer)
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản Techshop thành công!',
      ...result
    });
  } catch (error) {
    console.error('[Register Error]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Đã có lỗi xảy ra trên hệ thống khi đăng ký tài khoản!',
      error: error.error || error.message
    });
  }
};

/**
 * Đăng nhập (Hỗ trợ Khách hàng, Quản trị viên, Quản lý, Nhân viên)
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      ...result
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Đã có lỗi xảy ra trên hệ thống khi đăng nhập!',
      error: error.error || error.message
    });
  }
};

/**
 * Lấy thông tin cá nhân của người dùng hiện tại (Protected)
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const { id, role } = req.user;
    const userData = await authService.getProfile(id, role);

    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('[GetMe Error]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Lỗi lấy thông tin tài khoản!',
      error: error.error || error.message
    });
  }
};

/**
 * Đăng nhập / Đăng ký bằng Google OAuth 2.0
 * POST /api/auth/google
 */
const googleAuth = async (req, res) => {
  try {
    const result = await authService.googleAuth(req.body);
    const statusCode = result.isNewUser ? 201 : 200;
    const message = result.isNewUser
      ? 'Đăng ký tài khoản Google thành công!'
      : 'Đăng nhập Google thành công!';

    delete result.isNewUser;

    return res.status(statusCode).json({
      success: true,
      message,
      ...result
    });
  } catch (error) {
    console.error('[GoogleAuth Error]:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Xác thực Google thất bại!',
      error: error.error || error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  googleAuth
};
