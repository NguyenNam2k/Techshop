const Role = require('../models/Role');

/**
 * Lấy danh sách tất cả vai trò
 * GET /api/roles
 */
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();

    // Lấy permissions cho từng role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await Role.getPermissions(role.id);
        return { ...role, permissions };
      })
    );

    return res.json({ success: true, roles: rolesWithPermissions });

  } catch (error) {
    console.error('[GetAllRoles Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách vai trò!', error: error.message });
  }
};

/**
 * Tạo vai trò mới
 * POST /api/roles
 */
const createRole = async (req, res) => {
  try {
    const { role_name, description } = req.body;

    if (!role_name || !role_name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên vai trò!' });
    }

    // Kiểm tra trùng tên
    const existing = await Role.findByName(role_name.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên vai trò đã tồn tại!' });
    }

    const newId = await Role.create({ role_name, description });

    return res.status(201).json({
      success: true,
      message: 'Tạo vai trò thành công!',
      role: { id: newId, role_name: role_name.trim().toLowerCase(), description }
    });

  } catch (error) {
    console.error('[CreateRole Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo vai trò!', error: error.message });
  }
};

/**
 * Cập nhật vai trò
 * PUT /api/roles/:id
 */
const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, description, is_active } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò!' });
    }

    // Kiểm tra trùng tên nếu đổi tên
    if (role_name && role_name.trim().toLowerCase() !== role.role_name) {
      const existing = await Role.findByName(role_name.trim().toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, message: 'Tên vai trò đã tồn tại!' });
      }
    }

    await Role.update(id, { role_name, description, is_active });

    return res.json({ success: true, message: 'Cập nhật vai trò thành công!' });

  } catch (error) {
    console.error('[UpdateRole Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật vai trò!', error: error.message });
  }
};

/**
 * Xóa vai trò
 * DELETE /api/roles/:id
 */
const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò!' });
    }

    // Không cho xóa vai trò mặc định
    const protectedRoles = ['super_admin', 'system_admin', 'manager', 'staff', 'customer'];
    if (protectedRoles.includes(role.role_name)) {
      return res.status(400).json({ success: false, message: 'Không thể xóa vai trò mặc định của hệ thống!' });
    }

    await Role.delete(id);

    return res.json({ success: true, message: 'Xóa vai trò thành công!' });

  } catch (error) {
    console.error('[DeleteRole Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa vai trò!', error: error.message });
  }
};

/**
 * Lấy danh sách permissions của 1 role
 * GET /api/roles/:id/permissions
 */
const getRolePermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò!' });
    }

    const permissions = await Role.getPermissions(id);

    return res.json({ success: true, role: role.role_name, permissions });

  } catch (error) {
    console.error('[GetRolePermissions Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy quyền của vai trò!', error: error.message });
  }
};

/**
 * Gán permissions cho role
 * POST /api/roles/:id/permissions
 */
const assignPermissionsToRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò!' });
    }

    if (!Array.isArray(permission_ids)) {
      return res.status(400).json({ success: false, message: 'permission_ids phải là mảng!' });
    }

    await Role.assignPermissions(id, permission_ids);

    return res.json({
      success: true,
      message: `Đã gán ${permission_ids.length} quyền cho vai trò "${role.role_name}" thành công!`
    });

  } catch (error) {
    console.error('[AssignPermissions Error]:', error);
    return res.status(500).json({ success: false, message: 'Lỗi gán quyền!', error: error.message });
  }
};

module.exports = {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignPermissionsToRole
};
