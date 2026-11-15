const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middlewares/authMiddleware');
const userController = require('../../controllers/admin/userController');

// Tất cả route đều yêu cầu đăng nhập + quyền admin
router.use(verifyToken, requireRole('admin'));

// GET    /api/users          — Danh sách tất cả người dùng
router.get('/', userController.getAllUsers);

// GET    /api/users/:id      — Chi tiết 1 người dùng (?role=customer)
router.get('/:id', userController.getUserById);

// POST   /api/users          — Tạo người dùng mới
router.post('/', userController.createUser);

// PATCH  /api/users/:id/status — Kích hoạt / Vô hiệu hóa tài khoản
router.patch('/:id/status', userController.updateUserStatus);

// PATCH  /api/users/:id/role   — Phân lại vai trò (Assign Role)
router.patch('/:id/role', userController.updateUserRole);

module.exports = router;
