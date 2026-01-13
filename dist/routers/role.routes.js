"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const permission_1 = require("../configs/permission");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const role_schema_1 = require("../schemas/role.schema");
const router = (0, express_1.Router)();
// Apply auth and permission loading middleware to all routes
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Role CRUD operations
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ROLE_READ), (0, validation_middleware_1.validate)(role_schema_1.getRolesSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.getRoles));
router.get('/:roleId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ROLE_READ), (0, validation_middleware_1.validate)(role_schema_1.getRoleByIdSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.getRoleById));
router.post('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ROLE_CREATE), (0, validation_middleware_1.validate)(role_schema_1.createRoleSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.createRole));
router.put('/:roleId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ROLE_UPDATE), (0, validation_middleware_1.validate)(role_schema_1.updateRoleSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.updateRole));
router.delete('/:roleId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ROLE_DELETE), (0, validation_middleware_1.validate)(role_schema_1.deleteRoleSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.deleteRole));
// Role assignment (removed - will be handled through user management)
router.get('/:roleId/permissions', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ROLE_READ), (0, validation_middleware_1.validate)(role_schema_1.getRoleByIdSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.getRolePermissions));
router.get('/user/:userId/permissions', (0, rbac_middleware_1.requireOwnershipOrPermission)(permission_1.PERMISSIONS.USER_READ, 'userId'), (0, validation_middleware_1.validate)(role_schema_1.getUserPermissionsSchema), (0, error_middleware_1.asyncHandler)(role_controller_1.RoleController.getUserPermissions));
exports.default = router;
