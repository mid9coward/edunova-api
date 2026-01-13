"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissionsSchema = exports.getRolesSchema = exports.deleteRoleSchema = exports.getRoleByIdSchema = exports.updateRoleSchema = exports.createRoleSchema = void 0;
const zod_1 = require("zod");
const permission_1 = require("../configs/permission");
/**
 * Role validation schemas
 */
// Create role schema
exports.createRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, 'Role name must be at least 2 characters')
            .max(50, 'Role name must not exceed 50 characters')
            .regex(/^[a-zA-Z\s]+$/, 'Role name can only contain letters and spaces'),
        description: zod_1.z
            .string()
            .min(5, 'Description must be at least 5 characters')
            .max(200, 'Description must not exceed 200 characters')
            .optional(),
        permissions: zod_1.z.array(zod_1.z.enum(permission_1.ALL_PERMISSIONS)).optional(),
        inherits: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')).optional()
    })
});
// Update role schema
exports.updateRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        roleId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(2, 'Role name must be at least 2 characters')
            .max(50, 'Role name must not exceed 50 characters')
            .regex(/^[a-zA-Z\s]+$/, 'Role name can only contain letters and spaces')
            .optional(),
        description: zod_1.z
            .string()
            .min(5, 'Description must be at least 5 characters')
            .max(200, 'Description must not exceed 200 characters')
            .optional(),
        permissions: zod_1.z.array(zod_1.z.enum(permission_1.ALL_PERMISSIONS)).optional(),
        inherits: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')).optional()
    })
});
// Get role by ID schema
exports.getRoleByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        roleId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')
    }),
    query: zod_1.z.object({
        includeInheritance: zod_1.z
            .string()
            .optional()
            .refine((val) => val === undefined || val === 'true' || val === 'false', 'includeInheritance must be true or false')
    })
});
// Delete role schema
exports.deleteRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        roleId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')
    })
});
// Get roles query schema
exports.getRolesSchema = zod_1.z.object({
    query: zod_1.z.object({
        includeInheritance: zod_1.z
            .string()
            .optional()
            .refine((val) => val === undefined || val === 'true' || val === 'false', 'includeInheritance must be true or false')
    })
});
// Get user permissions schema
exports.getUserPermissionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
    })
});
