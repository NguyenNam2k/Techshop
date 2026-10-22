const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const permissionController = require('../../controllers/admin/permissionController');

// Tất cả các route quản lý Permission đều yêu cầu quyền Admin
router.use(verifyToken, requireRole('admin'));

// GET    /api/permissions     — Danh sách tất cả các quyền hạn
router.get('/', permissionController.getAllPermissions);

// POST   /api/permissions     — Tạo quyền hạn mới
router.post('/', permissionController.createPermission);

// DELETE /api/permissions/:id — Xóa quyền hạn
router.delete('/:id', permissionController.deletePermission);

module.exports = router;
