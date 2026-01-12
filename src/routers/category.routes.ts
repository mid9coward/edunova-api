import { Router } from 'express'
import { CategoryController } from '../controllers/category.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'

import {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesSchema,
  bulkDeleteCategoriesSchema
} from '../schemas/category.schema'
import { PERMISSIONS } from '~/configs/permission'

const router = Router()

/**
 * Public Routes
 */

// Get all categories (simple list)
router.get('/all', asyncHandler(CategoryController.getAllCategories))

// Get category by ID - MOVED AFTER bulk-delete route
// router.get('/:categoryId', asyncHandler(CategoryController.getCategoryById))

/**
 * Protected Routes (require authentication and admin permissions)
 */
router.use(authMiddleware)
router.use(loadUserPermissions)

// Get categories with pagination and search
router.get('/', validate(getCategoriesSchema), asyncHandler(CategoryController.getCategories))

// Bulk delete categories - MOVED BEFORE parameterized routes
router.delete(
  '/bulk-delete',
  requirePermission([PERMISSIONS.CATEGORY_DELETE]),
  validate(bulkDeleteCategoriesSchema),
  asyncHandler(CategoryController.bulkDeleteCategories)
)

// Create category
router.post(
  '/',
  requirePermission([PERMISSIONS.CATEGORY_CREATE]),
  validate(createCategorySchema),
  asyncHandler(CategoryController.createCategory)
)

// Update category
router.put(
  '/:categoryId',
  requirePermission([PERMISSIONS.CATEGORY_UPDATE]),
  validate(updateCategorySchema),
  asyncHandler(CategoryController.updateCategory)
)

// Delete category
router.delete(
  '/:categoryId',
  requirePermission([PERMISSIONS.CATEGORY_DELETE]),
  asyncHandler(CategoryController.deleteCategory)
)

router.get('/:categoryId', asyncHandler(CategoryController.getCategoryById))

export default router
