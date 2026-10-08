const express = require('express');
const router = express.Router();
const StaffController = require('../controllers/staffController');

/**
 * Subordinate Staff Management & Role Delegation API Routes
 * Base route: /api/staffs
 */

// GET /api/staffs - Lấy danh sách nhân viên cấp dưới của Manager
router.get('/', StaffController.getStaffs);

// GET /api/staffs/:id - Lấy chi tiết nhân viên
router.get('/:id', StaffController.getStaff);

// POST /api/staffs - Thêm mới nhân viên cấp dưới & phân quyền
router.post('/', StaffController.createStaff);

// PUT /api/staffs/:id - Cập nhật thông tin & phân quyền nhân viên
router.put('/:id', StaffController.updateStaff);

// PATCH /api/staffs/:id/permissions - Cập nhật nhanh chức vụ & quyền hạn
router.patch('/:id/permissions', StaffController.updatePermissions);

// DELETE /api/staffs/:id - Xóa nhân viên cấp dưới
router.delete('/:id', StaffController.deleteStaff);

module.exports = router;
