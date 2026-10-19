const StaffService = require('../services/staffService');

/**
 * Staff Controller
 * Handles HTTP requests, validations, and responses for Subordinate Staff Management.
 * Delegates all business logic to StaffService.
 */
class StaffController {
  /**
   * GET /api/staffs
   * Retrieve all subordinate staff members for the current Manager
   */
  static async getStaffs(req, res, next) {
    try {
      const managerId = req.query.manager_id ? parseInt(req.query.manager_id, 10) : 1;
      const staffs = await StaffService.getStaffsByManager(managerId);

      return res.status(200).json({
        success: true,
        data: staffs
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/staffs/:id
   * Retrieve details of a specific staff member
   */
  static async getStaff(req, res, next) {
    try {
      const { id } = req.params;
      const staff = await StaffService.getStaffById(id);

      return res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/staffs
   * Create a new subordinate staff member with role and permissions
   */
  static async createStaff(req, res, next) {
    try {
      const {
        staff_code,
        full_name,
        email,
        phone,
        department,
        status,
        permissions
      } = req.body;

      const newStaff = await StaffService.createStaff({
        staff_code,
        manager_id: req.body.manager_id || 1,
        full_name,
        email,
        phone,
        department,
        status,
        permissions
      });

      return res.status(201).json({
        success: true,
        message: `Thêm nhân viên "${newStaff.full_name}" (${newStaff.staff_code}) và phân quyền thành công!`,
        data: newStaff
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/staffs/:id
   * Update full staff information and permissions
   */
  static async updateStaff(req, res, next) {
    try {
      const { id } = req.params;
      const {
        staff_code,
        full_name,
        email,
        phone,
        department,
        status,
        permissions
      } = req.body;

      const updated = await StaffService.updateStaff(id, {
        staff_code,
        full_name,
        email,
        phone,
        department,
        status,
        permissions
      });

      return res.status(200).json({
        success: true,
        message: `Cập nhật thông tin và phân quyền cho nhân viên "${updated.full_name}" thành công!`,
        data: updated
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/staffs/:id/permissions
   * Quick update of role (department) and permission flags
   */
  static async updatePermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { department, permissions, status } = req.body;

      const updated = await StaffService.updateStaffPermissions(id, {
        department,
        permissions,
        status
      });

      return res.status(200).json({
        success: true,
        message: `Phân chia quyền và chức vụ cho "${updated.full_name}" thành công!`,
        data: updated
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/staffs/:id
   * Remove subordinate staff member
   */
  static async deleteStaff(req, res, next) {
    try {
      const { id } = req.params;
      const result = await StaffService.deleteStaff(id);

      return res.status(200).json(result);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  // =========================================================================
  // TASK ASSIGNMENT HANDLERS (Assign Tasks)
  // =========================================================================

  static async getTasks(req, res, next) {
    try {
      const { staff_id, status } = req.query;
      const tasks = await StaffService.getTasks({ staff_id, status });
      return res.status(200).json({ success: true, data: tasks });
    } catch (error) {
      next(error);
    }
  }

  static async assignTask(req, res, next) {
    try {
      const result = await StaffService.assignTask(req.body);
      return res.status(201).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateTaskStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await StaffService.updateTaskStatus(id, status);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const result = await StaffService.deleteTask(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // =========================================================================
  // WORKING SCHEDULE HANDLERS (View Working Schedule)
  // =========================================================================

  static async getSchedules(req, res, next) {
    try {
      const { work_date, staff_id } = req.query;
      const schedules = await StaffService.getSchedules({ work_date, staff_id });
      return res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  }

  static async createSchedule(req, res, next) {
    try {
      const result = await StaffService.createSchedule(req.body);
      return res.status(201).json({ success: true, ...result });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async deleteSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const result = await StaffService.deleteSchedule(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  // =========================================================================
  // STAFF PERFORMANCE HANDLERS (View Staff Performance)
  // =========================================================================

  static async getPerformance(req, res, next) {
    try {
      const performance = await StaffService.getPerformance();
      return res.status(200).json({ success: true, data: performance });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StaffController;
