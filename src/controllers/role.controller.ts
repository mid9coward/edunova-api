import { Request, Response } from 'express'

import { hasPermission } from '../middlewares/rbac.middleware'
import { RoleService } from '../services/role.service'
import { sendSuccess } from '../utils/success'
import { PERMISSIONS } from '~/configs/permission'

/**
 * Role Management Controllers
 */

export class RoleController {
  private static roleService = new RoleService()

  /**
   * Get all roles with optional inheritance information
   */
  static async getRoles(req: Request, res: Response): Promise<void> {
    const roles = await RoleController.roleService.getAllRoles()

    sendSuccess.ok(res, 'Roles retrieved successfully', roles)
  }

  /**
   * Get role by ID with optional inheritance information
   */
  static async getRoleById(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params
    const { includeInheritance = false } = req.query

    const role = await RoleController.roleService.getRoleById(roleId, includeInheritance === 'true')

    sendSuccess.ok(res, 'Role retrieved successfully', role)
  }

  /**
   * Create new role with inheritance support
   */
  static async createRole(req: Request, res: Response): Promise<void> {
    const { name, description, permissions, inherits } = req.body
    const role = await RoleController.roleService.createRole({
      name,
      description,
      permissions,
      inherits
    })

    sendSuccess.created(res, 'Role created successfully', role)
  }

  /**
   * Update role with inheritance support
   */
  static async updateRole(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params
    const updateData = req.body

    const role = await RoleController.roleService.updateRole(roleId, updateData)

    sendSuccess.ok(res, 'Role updated successfully', role)
  }

  /**
   * Delete role with dependency checking
   */
  static async deleteRole(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params

    await RoleController.roleService.deleteRole(roleId)

    sendSuccess.ok(res, 'Role deleted successfully')
  }

  /**
   * Get user's permissions including inherited ones
   */
  static async getUserPermissions(req: Request, res: Response): Promise<void> {
    const { userId } = req.params

    // Check if user can view other users' permissions or only their own
    const canViewAnyUser = hasPermission(req.userPermissions || [], PERMISSIONS.USER_READ)

    if (!canViewAnyUser && req.user?.userId !== userId) {
      res.status(403)
      return sendSuccess.ok(res, 'Access denied: You can only view your own permissions', [])
    }

    const permissions = await RoleController.roleService.getUserPermissions(userId)

    sendSuccess.ok(res, 'User permissions retrieved successfully', { permissions })
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  static async getRolePermissions(req: Request, res: Response): Promise<void> {
    const { roleId } = req.params

    const permissions = await RoleController.roleService.getAllPermissions(roleId)

    sendSuccess.ok(res, 'Role permissions retrieved successfully', { permissions })
  }
}
