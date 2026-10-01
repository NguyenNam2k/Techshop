const Permission = require('../models/Permission');

/**
 * Lấy danh sách tất cả quyền hạn
 * GET /api/permissions
 */
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    const modules = await Permission.getModules();

    return res.json({ success: true, permissions, modules });

  } catch (error) {
    console.error('[GetAllPermissions Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách quyền!', error: error.message });
  }
};

/**
 * Tạo quyền mới
 * POST /api/permissions
 */
const createPermission = async (req, res) => {
  try {
    const { permission_name, description, module } = req.body;

    if (!permission_name || !permission_name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên quyền!' });
    }

    const existing = await Permission.findByName(permission_name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên quyền đã tồn tại!' });
    }

    const newId = await Permission.create({ permission_name, description, module });

    return res.status(201).json({
      success: true,
      message: 'Tạo quyền thành công!',
      permission: { id: newId, permission_name: permission_name.trim().toLowerCase(), description, module }
    });

  } catch (error) {
    console.error('[CreatePermission Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo quyền!', error: error.message });
  }
};

/**
 * Cập nhật quyền
 * PUT /api/permissions/:id
 */
const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_name, description, module } = req.body;

    const perm = await Permission.findById(id);
    if (!perm) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quyền!' });
    }

    if (permission_name && permission_name.trim().toLowerCase() !== perm.permission_name) {
      const existing = await Permission.findByName(permission_name.trim().toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Tên quyền đã tồn tại!' });
      }
    }

    await Permission.update(id, { permission_name, description, module });

    return res.json({ success: true, message: 'Cập nhật quyền thành công!' });

  } catch (error) {
    console.error('[UpdatePermission Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật quyền!', error: error.message });
  }
};

/**
 * Xóa quyền
 * DELETE /api/permissions/:id
 */
const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    const perm = await Permission.findById(id);
    if (!perm) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quyền!' });
    }

    await Permission.delete(id);

    return res.json({ success: true, message: 'Xóa quyền thành công!' });

  } catch (error) {
    console.error('[DeletePermission Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa quyền!', error: error.message });
  }
};

module.exports = {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission
};
