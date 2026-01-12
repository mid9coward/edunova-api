import { Router } from 'express'
import { RoleController } from '../controllers/role.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { loadUserPermissions, requireOwnershipOrPermission, requirePermission } from '../middlewares/rbac.middleware'

import { PERMISSIONS } from '~/configs/permission'
import { validate } from '../middlewares/validation.middleware'
import {
  createRoleSchema,
  deleteRoleSchema,
  getRoleByIdSchema,
  getRolesSchema,
  getUserPermissionsSchema,
  updateRoleSchema
} from '../schemas/role.schema'

const router = Router()

// Apply auth and permission loading middleware to all routes
router.use(authMiddleware)
router.use(loadUserPermissions)

// Role CRUD operations
router.get(
  '/',
  requirePermission(PERMISSIONS.ROLE_READ),
  validate(getRolesSchema),
  asyncHandler(RoleController.getRoles)
)

router.get(
  '/:roleId',
  requirePermission(PERMISSIONS.ROLE_READ),
  validate(getRoleByIdSchema),
  asyncHandler(RoleController.getRoleById)
)

router.post(
  '/',
  requirePermission(PERMISSIONS.ROLE_CREATE),
  validate(createRoleSchema),
  asyncHandler(RoleController.createRole)
)

router.put(
  '/:roleId',
  requirePermission(PERMISSIONS.ROLE_UPDATE),
  validate(updateRoleSchema),
  asyncHandler(RoleController.updateRole)
)

router.delete(
  '/:roleId',
  requirePermission(PERMISSIONS.ROLE_DELETE),
  validate(deleteRoleSchema),
  asyncHandler(RoleController.deleteRole)
)

// Role assignment (removed - will be handled through user management)

router.get(
  '/:roleId/permissions',
  requirePermission(PERMISSIONS.ROLE_READ),
  validate(getRoleByIdSchema),
  asyncHandler(RoleController.getRolePermissions)
)

router.get(
  '/user/:userId/permissions',
  requireOwnershipOrPermission(PERMISSIONS.USER_READ, 'userId'),
  validate(getUserPermissionsSchema),
  asyncHandler(RoleController.getUserPermissions)
)

export default router
