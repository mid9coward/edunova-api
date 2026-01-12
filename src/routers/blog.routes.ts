import { Router } from 'express'
import { BlogController } from '../controllers/blog.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '../configs/permission'
import {
  createBlogSchema,
  updateBlogSchema,
  getBlogsSchema,
  blogParamsSchema,
  blogSlugParamsSchema,
  bulkDeleteBlogsSchema
} from '../schemas/blog.schema'

const router = Router()

/**
 * Public Routes
 */

// Get published blogs (public endpoint)
router.get('/publish', validate(getBlogsSchema), asyncHandler(BlogController.getPublishedBlogs))

// Get blog by slug (public endpoint)
router.get('/slug/:slug', validate(blogSlugParamsSchema), asyncHandler(BlogController.getBlogBySlug))

/**
 * Protected Routes (require authentication)
 */
router.use(authMiddleware)
router.use(loadUserPermissions)

// Get current user's blogs
router.get('/my-blogs', validate(getBlogsSchema), asyncHandler(BlogController.getUserBlogs))

// Bulk delete blogs - MOVED BEFORE parameterized routes
router.delete(
  '/bulk-delete',
  requirePermission([PERMISSIONS.BLOG_DELETE]),
  validate(bulkDeleteBlogsSchema),
  asyncHandler(BlogController.bulkDeleteBlogs)
)

// Create blog
router.post('/', validate(createBlogSchema), asyncHandler(BlogController.createBlog))

// Get all blogs with pagination and filtering (admin only)
router.get(
  '/',
  requirePermission([PERMISSIONS.BLOG_READ]),
  validate(getBlogsSchema),
  asyncHandler(BlogController.getBlogs)
)

// Update blog
router.put('/:blogId', validate(blogParamsSchema), validate(updateBlogSchema), asyncHandler(BlogController.updateBlog))

// Delete blog
router.delete('/:blogId', validate(blogParamsSchema), asyncHandler(BlogController.deleteBlog))

// Get blog by ID
router.get('/:blogId', validate(blogParamsSchema), asyncHandler(BlogController.getBlogById))

export default router
