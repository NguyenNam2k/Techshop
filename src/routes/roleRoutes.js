const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/authMiddleware');
const roleController = require('../controllers/roleController');

// Tất cả route đều yêu cầu đăng nhập + quyền admin
router.use(verifyToken, requireRole('admin'));

// GET    /api/roles                  — Danh sách tất cả vai trò
router.get('/', roleController.getAllRoles);

// POST   /api/roles                  — Tạo vai trò mới
router.post('/', roleController.createRole);

// PUT    /api/roles/:id              — Cập nhật vai trò
router.put('/:id', roleController.updateRole);

// DELETE /api/roles/:id              — Xóa vai trò
router.delete('/:id', roleController.deleteRole);

// GET    /api/roles/:id/permissions  — Xem quyền của vai trò
router.get('/:id/permissions', roleController.getRolePermissions);

// POST   /api/roles/:id/permissions  — Gán quyền cho vai trò
router.post('/:id/permissions', roleController.assignPermissionsToRole);

module.exports = router;
