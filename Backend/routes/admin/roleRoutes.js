const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../../middleware/authMiddleware');
const roleController = require('../../controllers/admin/roleController');

// Tất cả các route quản lý Role đều yêu cầu quyền Admin
router.use(verifyToken, requireRole('admin'));

// GET    /api/roles                 — Danh sách tất cả các vai trò
router.get('/', roleController.getAllRoles);

// GET    /api/roles/:id             — Chi tiết 1 vai trò kèm danh sách quyền
router.get('/:id', roleController.getRoleById);

// POST   /api/roles                 — Tạo vai trò mới
router.post('/', roleController.createRole);

// PUT    /api/roles/:id             — Cập nhật thông tin vai trò
router.put('/:id', roleController.updateRole);

// DELETE /api/roles/:id             — Xóa vai trò
router.delete('/:id', roleController.deleteRole);

// GET    /api/roles/:id/permissions — Lấy danh sách quyền của vai trò
router.get('/:id/permissions', roleController.getRolePermissions);

// POST   /api/roles/:id/permissions — Cập nhật/gán danh sách quyền cho vai trò
router.post('/:id/permissions', roleController.updateRolePermissions);

module.exports = router;
