import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { validate } from '../middlewares/validation.middleware'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '~/configs/permission'
import {
  updateProfileSchema,
  adminUpdateUserSchema,
  getUsersSchema,
  getUserByIdSchema,
  deleteUserSchema
} from '../schemas/user.schema'

const router = Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Load user permissions for all user routes
router.use(loadUserPermissions)

// Profile management routes (for current user) - these need to be before parameterized routes

// Get current user profile
router.get('/profile/me', asyncHandler(UserController.getCurrentUser))

// Update current user profile
router.put('/profile/me', validate(updateProfileSchema), asyncHandler(UserController.updateProfile))

// Get all users with filtering and pagination
router.get(
  '/',
  requirePermission(PERMISSIONS.USER_READ),
  validate(getUsersSchema),
  asyncHandler(UserController.getUsers)
)

// Get user by ID
router.get(
  '/:userId',
  requirePermission(PERMISSIONS.USER_READ),
  validate(getUserByIdSchema),
  asyncHandler(UserController.getUserById)
)

// Update user (admin only - roles and status)
router.put(
  '/:userId',
  requirePermission(PERMISSIONS.USER_UPDATE),
  validate(adminUpdateUserSchema),
  asyncHandler(UserController.updateUser)
)

// Delete user (soft delete - admin only)
router.delete(
  '/:userId',
  requirePermission(PERMISSIONS.USER_DELETE),
  validate(deleteUserSchema),
  asyncHandler(UserController.deleteUser)
)

export default router
