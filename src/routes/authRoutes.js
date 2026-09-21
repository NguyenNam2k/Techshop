const express = require('express');
const router = express.Router();
const { register, login, getMe, googleAuth } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/register - Đăng ký tài khoản khách hàng mới
router.post('/register', register);

// POST /api/auth/login - Đăng nhập hệ thống (Khách hàng & Nhân viên/Quản trị)
router.post('/login', login);

// POST /api/auth/google - Đăng nhập / Đăng ký bằng Google OAuth 2.0
router.post('/google', googleAuth);

// GET /api/auth/me - Lấy thông tin tài khoản hiện tại dựa trên Token JWT (Đã bảo vệ)
router.get('/me', verifyToken, getMe);

module.exports = router;
