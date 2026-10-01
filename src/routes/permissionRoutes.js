const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const permissionController = require('../controllers/permissionController');

// Tất cả route đều yêu cầu đăng nhập + quyền admin
router.use(verifyToken, requireRole('admin'));

// GET    /api/permissions      — Danh sách tất cả quyền
router.get('/', permissionController.getAllPermissions);

// POST   /api/permissions      — Tạo quyền mới
router.post('/', permissionController.createPermission);

// PUT    /api/permissions/:id  — Cập nhật quyền
router.put('/:id', permissionController.updatePermission);

// DELETE /api/permissions/:id  — Xóa quyền
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
