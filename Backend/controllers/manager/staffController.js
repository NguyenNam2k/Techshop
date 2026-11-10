const StaffService = require('../../services/manager/staffService');

/**
 * Staff Controller
 * Handles HTTP requests, validations, and responses for Subordinate Staff Management.
 * Delegates all business logic to StaffService.
 */
class StaffController {
  /**
   * GET /api/staffs/profile
   * Retrieve personal profile of current staff from JWT token
   */
  static async getProfile(req, res, next) {
    try {
      const { pool } = require('../../config/database');
      const jwt = require('jsonwebtoken');

      let staffId = req.user?.id;
      if (!staffId && req.headers['authorization']) {
        try {
          const token = req.headers['authorization'].split(' ')[1];
          if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'techshop_super_secret_jwt_key_2026');
            staffId = decoded?.id;
          }
        } catch (e) {}
      }

      let rows = [];
      if (staffId) {
        [rows] = await pool.query(
          'SELECT id, username, staff_code, full_name, email, phone, avatar_url, department, status FROM staffs WHERE id = ? LIMIT 1',
          [staffId]
        );
      }
      if (!rows || rows.length === 0) {
        [rows] = await pool.query(
          'SELECT id, username, staff_code, full_name, email, phone, avatar_url, department, status FROM staffs LIMIT 1'
        );
      }

      if (rows && rows.length > 0) {
        const s = rows[0];
        return res.status(200).json({
          success: true,
          data: {
            staff_id: s.id,
            staff_code: s.staff_code || 'STF-102',
            full_name: s.full_name,
            email: s.email,
            phone: s.phone,
            department: s.department || 'Warehouse',
            avatar: s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
            schedule: {
              work_date: 'Hôm nay',
              shift: 'morning',
              shift_hours: '08:00 - 16:00'
            }
          }
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          staff_id: 1,
          staff_code: 'STF001',
          full_name: 'Nhân viên Vận hành',
          department: 'Warehouse'
        }
      });
    } catch (error) {
      next(error);
    }
  }


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
    /**
   * GET /api/staffs/events
   * Server-Sent Events (SSE) stream for realtime staff notifications
   */
  static streamEvents(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.write(`event: connected\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
    try {
      const { addStaffClient } = require('../../../backend/src/services/realtime.service');
      if (typeof addStaffClient === 'function') {
        addStaffClient(res);
        return;
      }
    } catch (e) {}

    const timer = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch (err) {
        clearInterval(timer);
      }
    }, 25000);
    req.on('close', () => clearInterval(timer));
  }

  static async getStaff(req, res, next) {
    try {
      const { id } = req.params;
      const staff = await StaffService.getStaffById(id);

      return res.status(200).json({
        success: true,
        data: staff
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message
      });
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
