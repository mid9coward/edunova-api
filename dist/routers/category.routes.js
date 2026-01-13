"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const category_schema_1 = require("../schemas/category.schema");
const permission_1 = require("../configs/permission");
const router = (0, express_1.Router)();
/**
 * Public Routes
 */
// Get all categories (simple list)
router.get('/all', (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.getAllCategories));
// Get category by ID - MOVED AFTER bulk-delete route
// router.get('/:categoryId', asyncHandler(CategoryController.getCategoryById))
/**
 * Protected Routes (require authentication and admin permissions)
 */
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Get categories with pagination and search
router.get('/', (0, validation_middleware_1.validate)(category_schema_1.getCategoriesSchema), (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.getCategories));
// Bulk delete categories - MOVED BEFORE parameterized routes
router.delete('/bulk-delete', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.CATEGORY_DELETE]), (0, validation_middleware_1.validate)(category_schema_1.bulkDeleteCategoriesSchema), (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.bulkDeleteCategories));
// Create category
router.post('/', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.CATEGORY_CREATE]), (0, validation_middleware_1.validate)(category_schema_1.createCategorySchema), (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.createCategory));
// Update category
router.put('/:categoryId', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.CATEGORY_UPDATE]), (0, validation_middleware_1.validate)(category_schema_1.updateCategorySchema), (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.updateCategory));
// Delete category
router.delete('/:categoryId', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.CATEGORY_DELETE]), (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.deleteCategory));
router.get('/:categoryId', (0, error_middleware_1.asyncHandler)(category_controller_1.CategoryController.getCategoryById));
exports.default = router;
