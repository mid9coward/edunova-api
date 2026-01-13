"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleController = void 0;
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const role_service_1 = require("../services/role.service");
const success_1 = require("../utils/success");
const permission_1 = require("../configs/permission");
/**
 * Role Management Controllers
 */
class RoleController {
    static roleService = new role_service_1.RoleService();
    /**
     * Get all roles with optional inheritance information
     */
    static async getRoles(req, res) {
        const roles = await RoleController.roleService.getAllRoles();
        success_1.sendSuccess.ok(res, 'Roles retrieved successfully', roles);
    }
    /**
     * Get role by ID with optional inheritance information
     */
    static async getRoleById(req, res) {
        const { roleId } = req.params;
        const { includeInheritance = false } = req.query;
        const role = await RoleController.roleService.getRoleById(roleId, includeInheritance === 'true');
        success_1.sendSuccess.ok(res, 'Role retrieved successfully', role);
    }
    /**
     * Create new role with inheritance support
     */
    static async createRole(req, res) {
        const { name, description, permissions, inherits } = req.body;
        const role = await RoleController.roleService.createRole({
            name,
            description,
            permissions,
            inherits
        });
        success_1.sendSuccess.created(res, 'Role created successfully', role);
    }
    /**
     * Update role with inheritance support
     */
    static async updateRole(req, res) {
        const { roleId } = req.params;
        const updateData = req.body;
        const role = await RoleController.roleService.updateRole(roleId, updateData);
        success_1.sendSuccess.ok(res, 'Role updated successfully', role);
    }
    /**
     * Delete role with dependency checking
     */
    static async deleteRole(req, res) {
        const { roleId } = req.params;
        await RoleController.roleService.deleteRole(roleId);
        success_1.sendSuccess.ok(res, 'Role deleted successfully');
    }
    /**
     * Get user's permissions including inherited ones
     */
    static async getUserPermissions(req, res) {
        const { userId } = req.params;
        // Check if user can view other users' permissions or only their own
        const canViewAnyUser = (0, rbac_middleware_1.hasPermission)(req.userPermissions || [], permission_1.PERMISSIONS.USER_READ);
        if (!canViewAnyUser && req.user?.userId !== userId) {
            res.status(403);
            return success_1.sendSuccess.ok(res, 'Access denied: You can only view your own permissions', []);
        }
        const permissions = await RoleController.roleService.getUserPermissions(userId);
        success_1.sendSuccess.ok(res, 'User permissions retrieved successfully', { permissions });
    }
    /**
     * Get all permissions for a role (including inherited)
     */
    static async getRolePermissions(req, res) {
        const { roleId } = req.params;
        const permissions = await RoleController.roleService.getAllPermissions(roleId);
        success_1.sendSuccess.ok(res, 'Role permissions retrieved successfully', { permissions });
    }
}
exports.RoleController = RoleController;
