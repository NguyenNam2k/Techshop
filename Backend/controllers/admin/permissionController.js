const PermissionRepository = require('../../repositories/admin/PermissionRepository');

/**
 * Controller quản lý quyền hạn (Permissions) cho Admin
 */
const permissionController = {
  // GET /api/permissions
  getAllPermissions: async (req, res) => {
    try {
      const permissions = await PermissionRepository.findAll();
      return res.json({ success: true, permissions });
    } catch (error) {
      console.error('[GetAllPermissions Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách quyền hạn!', error: error.message });
    }
  },

  // POST /api/permissions
  createPermission: async (req, res) => {
    try {
      const { permission_name, description, module } = req.body;
      if (!permission_name || !permission_name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên quyền không được để trống!' });
      }

      const id = await PermissionRepository.create({
        permission_name: permission_name.trim(),
        description: description ? description.trim() : '',
        module: module ? module.trim().toLowerCase() : 'general'
      });

      return res.status(201).json({ success: true, message: 'Tạo quyền hạn mới thành công!', permissionId: id });
    } catch (error) {
      console.error('[CreatePermission Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi tạo quyền hạn!', error: error.message });
    }
  },

  // DELETE /api/permissions/:id
  deletePermission: async (req, res) => {
    try {
      await PermissionRepository.delete(req.params.id);
      return res.json({ success: true, message: 'Đã xóa quyền hạn thành công!' });
    } catch (error) {
      console.error('[DeletePermission Error]:', error);
      return res.status(500).json({ success: false, message: 'Lỗi xóa quyền hạn!', error: error.message });
    }
  }
};

module.exports = permissionController;
