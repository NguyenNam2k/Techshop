const express = require('express');
const router = express.Router();
const StaffController = require('../../controllers/manager/staffController');

/**
 * Subordinate Staff Management, Role Delegation, Tasks & Schedules API Routes
 * Base route: /api/staffs
 */

// =========================================================================
// TASKS, SCHEDULES & PERFORMANCE (Specific paths MUST be defined BEFORE /:id)
// =========================================================================

// Tasks (Assign Tasks)
router.get('/tasks', StaffController.getTasks);
router.post('/tasks', StaffController.assignTask);
router.patch('/tasks/:id/status', StaffController.updateTaskStatus);
router.delete('/tasks/:id', StaffController.deleteTask);

// Schedules (View Working Schedule)
router.get('/schedules', StaffController.getSchedules);
router.post('/schedules', StaffController.createSchedule);
router.delete('/schedules/:id', StaffController.deleteSchedule);

// Performance (View Staff Performance)
router.get('/performance', StaffController.getPerformance);

// =========================================================================
// CORE STAFF CRUD & PERMISSIONS
// =========================================================================

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
