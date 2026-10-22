const RoleRepository = require('../../repositories/admin/RoleRepository');
const PermissionRepository = require('../../repositories/admin/PermissionRepository');

/**
 * Controller quản lý vai trò (Roles) cho Admin
 */
const roleController = {
  // GET /api/roles
  getAllRoles: async (req, res) => {
    try {
      const roles = await RoleRepository.findAll();
      return res.json({ success: true, roles });
    } catch (error) {
      console.error('[GetAllRoles Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách vai trò!', error: error.message });
    }
  },

  // GET /api/roles/:id
  getRoleById: async (req, res) => {
    try {
      const role = await RoleRepository.findById(req.params.id);
      if (!role) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò!' });
      }
      return res.json({ success: true, role });
    } catch (error) {
      console.error('[GetRoleById Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin vai trò!', error: error.message });
    }
  },

  // POST /api/roles
  createRole: async (req, res) => {
    try {
      const { role_name, description, is_active } = req.body;
      if (!role_name || !role_name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên vai trò không được để trống!' });
      }

      const cleanName = role_name.trim().toLowerCase();
      const existing = await RoleRepository.findByRoleName(cleanName);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Tên vai trò này đã tồn tại!' });
      }

      const roleId = await RoleRepository.create({
        role_name: cleanName,
        description: description ? description.trim() : '',
        is_active: is_active !== undefined ? is_active : 1
      });

      return res.status(201).json({
        success: true,
        message: 'Tạo vai trò mới thành công!',
        roleId
      });
    } catch (error) {
      console.error('[CreateRole Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi tạo vai trò mới!', error: error.message });
    }
  },

  // PUT /api/roles/:id
  updateRole: async (req, res) => {
    try {
      const { description, is_active } = req.body;
      const updated = await RoleRepository.update(req.params.id, { description, is_active });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy vai trò hoặc không có thay đổi!' });
      }
      return res.json({ success: true, message: 'Cập nhật vai trò thành công!' });
    } catch (error) {
      console.error('[UpdateRole Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật vai trò!', error: error.message });
    }
  },

  // DELETE /api/roles/:id
  deleteRole: async (req, res) => {
    try {
      await RoleRepository.delete(req.params.id);
      return res.json({ success: true, message: 'Xóa vai trò thành công!' });
    } catch (error) {
      console.error('[DeleteRole Error]:', error);
      return res.status(400).json({ success: false, message: error.message || 'Lỗi xóa vai trò!' });
    }
  },

  // GET /api/roles/:id/permissions
  getRolePermissions: async (req, res) => {
    try {
      const permissions = await RoleRepository.getPermissions(req.params.id);
      return res.json({ success: true, permissions });
    } catch (error) {
      console.error('[GetRolePermissions Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách quyền của vai trò!', error: error.message });
    }
  },

  // POST /api/roles/:id/permissions
  updateRolePermissions: async (req, res) => {
    try {
      const { permissionIds } = req.body;
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ success: false, message: 'permissionIds phải là một mảng ID!' });
      }

      await RoleRepository.setPermissions(req.params.id, permissionIds);
      return res.json({ success: true, message: 'Cập nhật phân quyền cho vai trò thành công!' });
    } catch (error) {
      console.error('[UpdateRolePermissions Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lưu phân quyền vai trò!', error: error.message });
    }
  }
};

module.exports = roleController;
