const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT Token từ Header Authorization
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy Token xác thực trong Header (Authorization header is missing)!'
    });
  }

  // Format: Bearer <TOKEN>
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc bị rỗng!'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026');
    req.user = decoded; // { id, name, email, role, iat, exp }
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token hết hạn hoặc không hợp lệ!',
      error: error.message
    });
  }
};

/**
 * Middleware kiểm tra vai trò (Role-based access control)
 * @param {Array<string>} roles - Danh sách vai trò được phép truy cập, ví dụ: ['admin', 'manager']
 */
const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập vào chức năng này!'
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
