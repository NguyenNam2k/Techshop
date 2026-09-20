const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/register - Đăng ký tài khoản khách hàng mới
router.post('/register', register);

// POST /api/auth/login - Đăng nhập hệ thống (Khách hàng & Nhân viên/Quản trị)
router.post('/login', login);

// GET /api/auth/me - Lấy thông tin tài khoản hiện tại dựa trên Token JWT (Đã bảo vệ)
router.get('/me', verifyToken, getMe);

module.exports = router;
