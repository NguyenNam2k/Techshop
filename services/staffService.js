const StaffRepository = require('../repositories/staffRepository');

/**
 * Staff Service
 * Handles business rules, validations, and permission matrix configuration
 * for subordinate staff members under Manager supervision.
 */
class StaffService {
  /**
   * Standard departments supported by the system
   */
  static DEPARTMENTS = {
    WAREHOUSE: 'Warehouse',
    SALES: 'Sales',
    CUSTOMER_SUPPORT: 'Customer Support'
  };

  /**
   * Default permission templates corresponding to each department
   */
  static getDefaultPermissions(department) {
    switch (department) {
      case this.DEPARTMENTS.WAREHOUSE:
        return {
          can_manage_stock: true,
          can_process_orders: false,
          can_handle_tickets: false,
          can_view_reports: true
        };
      case this.DEPARTMENTS.SALES:
        return {
          can_manage_stock: false,
          can_process_orders: true,
          can_handle_tickets: false,
          can_view_reports: true
        };
      case this.DEPARTMENTS.CUSTOMER_SUPPORT:
        return {
          can_manage_stock: false,
          can_process_orders: false,
          can_handle_tickets: true,
          can_view_reports: false
        };
      default:
        return {
          can_manage_stock: false,
          can_process_orders: false,
          can_handle_tickets: false,
          can_view_reports: false
        };
    }
  }

  /**
   * Get all subordinate staff members for a specific manager
   */
  static async getStaffsByManager(managerId = 1) {
    return await StaffRepository.findAllByManager(managerId);
  }

  /**
   * Get single staff member by ID
   */
  static async getStaffById(id) {
    const staffId = parseInt(id, 10);
    if (!staffId) throw new Error('ID nhân viên không hợp lệ.');
    const staff = await StaffRepository.findById(staffId);
    if (!staff) {
      const err = new Error(`Không tìm thấy nhân viên với ID: ${staffId}`);
      err.statusCode = 404;
      throw err;
    }
    return staff;
  }

  /**
   * Create a new subordinate staff member with role & permission allocation
   */
  static async createStaff({
    staff_code,
    manager_id = 1,
    full_name,
    email,
    phone,
    department = 'Warehouse',
    status = 'active',
    permissions = {}
  }) {
    if (!full_name || !full_name.trim()) {
      const err = new Error('Họ và tên nhân viên không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    if (!email || !email.trim()) {
      const err = new Error('Email nhân viên không được để trống.');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Generate or clean staff code
    let cleanCode = staff_code ? staff_code.trim().toUpperCase() : null;
    if (!cleanCode) {
      const prefix = department === 'Warehouse' ? 'STF-W' : department === 'Sales' ? 'STF-S' : 'STF-CS';
      cleanCode = `${prefix}${Math.floor(100 + Math.random() * 900)}`;
    }

    // Check duplicate code
    const existingCode = await StaffRepository.findByCode(cleanCode);
    if (existingCode) {
      const err = new Error(`Mã nhân viên "${cleanCode}" đã tồn tại. Vui lòng chọn mã khác.`);
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate email
    const existingEmail = await StaffRepository.findByEmail(cleanEmail);
    if (existingEmail) {
      const err = new Error(`Email "${cleanEmail}" đã được sử dụng bởi nhân viên khác.`);
      err.statusCode = 400;
      throw err;
    }

    // Validate department
    const validDepts = Object.values(this.DEPARTMENTS);
    const cleanDept = validDepts.includes(department) ? department : this.DEPARTMENTS.WAREHOUSE;

    // Merge custom permissions with default permissions
    const defaultPerms = this.getDefaultPermissions(cleanDept);
    const finalPermissions = {
      can_manage_stock: permissions.can_manage_stock !== undefined ? Boolean(permissions.can_manage_stock) : defaultPerms.can_manage_stock,
      can_process_orders: permissions.can_process_orders !== undefined ? Boolean(permissions.can_process_orders) : defaultPerms.can_process_orders,
      can_handle_tickets: permissions.can_handle_tickets !== undefined ? Boolean(permissions.can_handle_tickets) : defaultPerms.can_handle_tickets,
      can_view_reports: permissions.can_view_reports !== undefined ? Boolean(permissions.can_view_reports) : defaultPerms.can_view_reports
    };

    const newStaffId = await StaffRepository.insert({
      staff_code: cleanCode,
      manager_id: parseInt(manager_id, 10) || 1,
      full_name: full_name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      department: cleanDept,
      status: status === 'inactive' ? 'inactive' : 'active',
      permissions: finalPermissions
    });

    return await this.getStaffById(newStaffId);
  }

  /**
   * Update subordinate staff member information, role and permissions
   */
  static async updateStaff(id, {
    staff_code,
    full_name,
    email,
    phone,
    department,
    status,
    permissions
  }) {
    const staffId = parseInt(id, 10);
    if (!staffId) throw new Error('ID nhân viên không hợp lệ.');

    const currentStaff = await this.getStaffById(staffId);

    // If staff_code changed, check uniqueness
    if (staff_code && staff_code.trim().toUpperCase() !== currentStaff.staff_code) {
      const cleanCode = staff_code.trim().toUpperCase();
      const codeExists = await StaffRepository.findByCode(cleanCode, staffId);
      if (codeExists) {
        const err = new Error(`Mã nhân viên "${cleanCode}" đã tồn tại trên hệ thống.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // If email changed, check uniqueness
    if (email && email.trim().toLowerCase() !== currentStaff.email.toLowerCase()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailExists = await StaffRepository.findByEmail(cleanEmail, staffId);
      if (emailExists) {
        const err = new Error(`Email "${cleanEmail}" đã được sử dụng bởi nhân viên khác.`);
        err.statusCode = 400;
        throw err;
      }
    }

    // Determine final permissions
    let finalPermissions = currentStaff.permissions;
    if (permissions && typeof permissions === 'object') {
      finalPermissions = {
        can_manage_stock: permissions.can_manage_stock !== undefined ? Boolean(permissions.can_manage_stock) : Boolean(currentStaff.permissions.can_manage_stock),
        can_process_orders: permissions.can_process_orders !== undefined ? Boolean(permissions.can_process_orders) : Boolean(currentStaff.permissions.can_process_orders),
        can_handle_tickets: permissions.can_handle_tickets !== undefined ? Boolean(permissions.can_handle_tickets) : Boolean(currentStaff.permissions.can_handle_tickets),
        can_view_reports: permissions.can_view_reports !== undefined ? Boolean(permissions.can_view_reports) : Boolean(currentStaff.permissions.can_view_reports)
      };
    } else if (department && department !== currentStaff.department) {
      // If department changed and no permissions specified, apply new department defaults
      finalPermissions = this.getDefaultPermissions(department);
    }

    await StaffRepository.update(staffId, {
      staff_code: staff_code ? staff_code.trim().toUpperCase() : undefined,
      full_name: full_name ? full_name.trim() : undefined,
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
      department: department || undefined,
      status: status || undefined,
      permissions: finalPermissions
    });

    return await this.getStaffById(staffId);
  }

  /**
   * Quick update of role (department) and permissions for a staff member
   */
  static async updateStaffPermissions(id, { department, permissions, status }) {
    const staffId = parseInt(id, 10);
    if (!staffId) throw new Error('ID nhân viên không hợp lệ.');

    const currentStaff = await this.getStaffById(staffId);

    const targetDept = department || currentStaff.department;
    let finalPerms = permissions;

    if (!finalPerms) {
      finalPerms = this.getDefaultPermissions(targetDept);
    } else {
      finalPerms = {
        can_manage_stock: Boolean(finalPerms.can_manage_stock),
        can_process_orders: Boolean(finalPerms.can_process_orders),
        can_handle_tickets: Boolean(finalPerms.can_handle_tickets),
        can_view_reports: Boolean(finalPerms.can_view_reports)
      };
    }

    await StaffRepository.updatePermissions(staffId, {
      department: targetDept,
      permissions: finalPerms,
      status: status || currentStaff.status
    });

    return await this.getStaffById(staffId);
  }

  /**
   * Delete staff member
   */
  static async deleteStaff(id) {
    const staffId = parseInt(id, 10);
    if (!staffId) throw new Error('ID nhân viên không hợp lệ.');

    const staff = await this.getStaffById(staffId);
    await StaffRepository.delete(staffId);

    return {
      success: true,
      message: `Đã xóa nhân viên "${staff.full_name}" (${staff.staff_code}) khỏi danh sách cấp dưới.`
    };
  }
}

module.exports = StaffService;
