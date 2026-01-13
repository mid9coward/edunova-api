"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const blog_controller_1 = require("../controllers/blog.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const blog_schema_1 = require("../schemas/blog.schema");
const router = (0, express_1.Router)();
/**
 * Public Routes
 */
// Get published blogs (public endpoint)
router.get('/publish', (0, validation_middleware_1.validate)(blog_schema_1.getBlogsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.getPublishedBlogs));
// Get blog by slug (public endpoint)
router.get('/slug/:slug', (0, validation_middleware_1.validate)(blog_schema_1.blogSlugParamsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.getBlogBySlug));
/**
 * Protected Routes (require authentication)
 */
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Get current user's blogs
router.get('/my-blogs', (0, validation_middleware_1.validate)(blog_schema_1.getBlogsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.getUserBlogs));
// Bulk delete blogs - MOVED BEFORE parameterized routes
router.delete('/bulk-delete', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.BLOG_DELETE]), (0, validation_middleware_1.validate)(blog_schema_1.bulkDeleteBlogsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.bulkDeleteBlogs));
// Create blog
router.post('/', (0, validation_middleware_1.validate)(blog_schema_1.createBlogSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.createBlog));
// Get all blogs with pagination and filtering (admin only)
router.get('/', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.BLOG_READ]), (0, validation_middleware_1.validate)(blog_schema_1.getBlogsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.getBlogs));
// Update blog
router.put('/:blogId', (0, validation_middleware_1.validate)(blog_schema_1.blogParamsSchema), (0, validation_middleware_1.validate)(blog_schema_1.updateBlogSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.updateBlog));
// Delete blog
router.delete('/:blogId', (0, validation_middleware_1.validate)(blog_schema_1.blogParamsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.deleteBlog));
// Get blog by ID
router.get('/:blogId', (0, validation_middleware_1.validate)(blog_schema_1.blogParamsSchema), (0, error_middleware_1.asyncHandler)(blog_controller_1.BlogController.getBlogById));
exports.default = router;
