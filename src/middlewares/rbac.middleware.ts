import { Request, Response, NextFunction } from 'express'
import { Role } from '../models/role'
import { AuthenticationError, AuthorizationError, ErrorCodes } from '../utils/errors'
import { Permission } from '~/configs/permission'

/**
 * RBAC (Role-Based Access Control) Middleware
 * Handles permission checking and authorization
 */

/**
 * Middleware to load user permissions from their role
 */
export const loadUserPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Skip if no user (for public routes)
    if (!req.user?.userId) {
      return next()
    }

    // Get user's roles from the user object (assuming it's populated)
    const roleIds = req.user.roles
    if (!roleIds || roleIds.length === 0) {
      throw new AuthorizationError('User has no assigned roles', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    // Fetch roles with permissions
    const roles = await Role.find({ _id: { $in: roleIds } }).lean()
    if (!roles || roles.length === 0) {
      throw new AuthorizationError('Invalid user roles', ErrorCodes.ROLE_NOT_FOUND)
    }

    // Collect all permissions from all roles (merge and deduplicate)
    const allPermissions = new Set<Permission>()
    const roleNames: string[] = []

    roles.forEach((role) => {
      roleNames.push(role.name)
      if (role.permissions) {
        role.permissions.forEach((permission) => allPermissions.add(permission as Permission))
      }
    })

    // Add permissions and roles to request
    req.userPermissions = Array.from(allPermissions)
    req.userRoles = roleNames

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Creates a middleware to check if user has required permission(s)
 * @param requiredPermissions - Single permission or array of permissions
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 */
export const requirePermission = (requiredPermissions: Permission | Permission[], requireAll: boolean = true) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

      // Check if user permissions are loaded
      if (!req.userPermissions) {
        throw new AuthorizationError('User permissions not loaded', ErrorCodes.UNAUTHORIZED_ACTION)
      }

      // Check permissions
      const hasPermission = requireAll
        ? permissions.every((permission) => req.userPermissions!.includes(permission))
        : permissions.some((permission) => req.userPermissions!.includes(permission))

      if (!hasPermission) {
        const permissionList = permissions.join(', ')
        const operator = requireAll ? 'all' : 'any'
        throw new AuthorizationError(
          `Access denied. Required ${operator} of: ${permissionList}`,
          ErrorCodes.INSUFFICIENT_PERMISSIONS
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Combines ownership check with permission check
 * User can access if they own the resource OR have the required permission
 */
export const requireOwnershipOrPermission = (permission: Permission, resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const requestUserId = req.user?.userId
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField]

      if (!requestUserId) {
        throw new AuthenticationError('User not authenticated', ErrorCodes.TOKEN_INVALID)
      }

      // Check ownership first
      if (requestUserId === resourceUserId) {
        return next()
      }

      // Check permission
      if (!req.userPermissions?.includes(permission)) {
        throw new AuthorizationError(
          `Access denied. Required permission: ${permission} or resource ownership`,
          ErrorCodes.INSUFFICIENT_PERMISSIONS
        )
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

/**
 * Utility function to check if user has permission (for use in controllers)
 */
export const hasPermission = (userPermissions: Permission[], permission: Permission): boolean => {
  return userPermissions.includes(permission)
}
