const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const { addStaffClient } = require('../services/realtime.service');

function streamEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`);
  addStaffClient(res);
}

async function getProfile(req, res) {
  try {
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
        `SELECT s.id, s.username, s.staff_code, s.full_name, s.email, s.phone, s.avatar_url,
                s.department, s.status, ss.work_date, ss.shift
         FROM staffs s
         LEFT JOIN staff_schedules ss
           ON ss.staff_id = s.id AND ss.work_date = CURDATE()
         WHERE s.id = ?
         ORDER BY ss.id DESC
         LIMIT 1`,
        [staffId]
      );
    }
    if (!rows || rows.length === 0) {
      [rows] = await pool.query(
        `SELECT s.id, s.username, s.staff_code, s.full_name, s.email, s.phone, s.avatar_url,
                s.department, s.status, ss.work_date, ss.shift
         FROM staffs s
         LEFT JOIN staff_schedules ss
           ON ss.staff_id = s.id AND ss.work_date = CURDATE()
         ORDER BY s.id ASC, ss.id DESC
         LIMIT 1`
      );
    }

    if (rows.length > 0) {
      const s = rows[0];
      return res.json({
        success: true,
        data: {
          staff_id: s.id,
          staff_code: s.staff_code,
          full_name: s.full_name,
          email: s.email,
          phone: s.phone,
          department: s.department,
          avatar: s.avatar_url,
          schedule: {
            work_date: s.work_date || '',
            shift: s.shift || '',
            shift_hours: s.shift === 'morning' ? '08:00 - 16:00'
              : s.shift === 'afternoon' ? '16:00 - 22:00' : ''
          }
        }
      });
    }

    return res.status(404).json({ success: false, message: 'Chưa có hồ sơ nhân viên trong cơ sở dữ liệu.' });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getTasks(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT st.id AS task_id, st.title, st.priority, st.status, st.due_date, st.description,
             m.full_name AS manager_name, m.manager_code
      FROM staff_tasks st
      LEFT JOIN managers m ON st.manager_id = m.id
      ORDER BY FIELD(st.priority, 'urgent', 'high', 'medium', 'low'), st.id ASC
    `);

    if (rows.length > 0) {
      return res.json({ success: true, data: rows });
    }

    return res.status(500).json({ success: false, message: 'Không thể tải danh sách nhiệm vụ.' });
  } catch (err) {
    console.error('getTasks error:', err);
    return res.status(500).json({ success: false, message: 'Không thể tải lịch làm việc.' });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = req.params.id;
    const { status } = req.body;
    await pool.query('UPDATE staff_tasks SET status = ?, updated_at = NOW() WHERE id = ?', [status, taskId]);
    return res.json({ success: true, message: 'Cập nhật nhiệm vụ thành công' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getSchedules(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT sc.*, s.full_name, s.staff_code, s.department
      FROM staff_schedules sc
      JOIN staffs s ON s.id = sc.staff_id
      ORDER BY sc.work_date DESC, sc.id DESC
      LIMIT 30
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getSchedules error:', err);
    return res.status(500).json({ success: false, message: 'Không thể tải lịch làm việc.' });
  }
}

module.exports = {
  streamEvents,
  getProfile,
  getTasks,
  updateTask,
  getSchedules
};
