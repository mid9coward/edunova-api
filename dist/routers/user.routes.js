"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const user_schema_1 = require("../schemas/user.schema");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use(auth_middleware_1.authMiddleware);
// Load user permissions for all user routes
router.use(rbac_middleware_1.loadUserPermissions);
// Profile management routes (for current user) - these need to be before parameterized routes
// Get current user profile
router.get('/profile/me', (0, error_middleware_1.asyncHandler)(user_controller_1.UserController.getCurrentUser));
// Update current user profile
router.put('/profile/me', (0, validation_middleware_1.validate)(user_schema_1.updateProfileSchema), (0, error_middleware_1.asyncHandler)(user_controller_1.UserController.updateProfile));
// Get all users with filtering and pagination
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.USER_READ), (0, validation_middleware_1.validate)(user_schema_1.getUsersSchema), (0, error_middleware_1.asyncHandler)(user_controller_1.UserController.getUsers));
// Get user by ID
router.get('/:userId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.USER_READ), (0, validation_middleware_1.validate)(user_schema_1.getUserByIdSchema), (0, error_middleware_1.asyncHandler)(user_controller_1.UserController.getUserById));
// Update user (admin only - roles and status)
router.put('/:userId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.USER_UPDATE), (0, validation_middleware_1.validate)(user_schema_1.adminUpdateUserSchema), (0, error_middleware_1.asyncHandler)(user_controller_1.UserController.updateUser));
// Delete user (soft delete - admin only)
router.delete('/:userId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.USER_DELETE), (0, validation_middleware_1.validate)(user_schema_1.deleteUserSchema), (0, error_middleware_1.asyncHandler)(user_controller_1.UserController.deleteUser));
exports.default = router;
