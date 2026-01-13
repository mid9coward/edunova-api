"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserSchema = exports.getUserByIdSchema = exports.getUsersSchema = exports.adminUpdateUserSchema = exports.updateProfileSchema = exports.updateUserSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
const common_schema_1 = require("./common.schema");
const mongoose_1 = __importDefault(require("mongoose"));
// Base user data schema
const userDataSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
    email: zod_1.z.string().email('Invalid email address'),
    userType: zod_1.z.nativeEnum(enums_1.UserType).optional(),
    status: zod_1.z.nativeEnum(enums_1.UserStatus).optional(),
    avatar: zod_1.z.string().url('Invalid avatar URL').optional().or(zod_1.z.literal(''))
});
// Update user schema
exports.updateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
            message: 'Invalid user ID format'
        })
    }),
    body: userDataSchema
        .extend({
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must not exceed 100 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
            .optional(),
        role: zod_1.z.string().optional()
    })
        .partial()
});
// Profile update schema (for user-owned updates)
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        username: zod_1.z
            .string()
            .min(3, 'Username must be at least 3 characters')
            .max(50, 'Username must not exceed 50 characters')
            .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
            .optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        password: zod_1.z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .max(100, 'Password must not exceed 100 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
            .optional(),
        avatar: zod_1.z.string().url('Invalid avatar URL').optional().or(zod_1.z.literal(''))
    })
        .refine((data) => {
        // At least one field must be provided
        return Object.keys(data).length > 0;
    }, {
        message: 'At least one field must be provided'
    })
});
// Admin update user schema (for admin-level updates)
exports.adminUpdateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
            message: 'Invalid user ID format'
        })
    }),
    body: zod_1.z
        .object({
        roles: zod_1.z.array(zod_1.z.string()).optional(),
        status: zod_1.z.nativeEnum(enums_1.UserStatus).optional()
    })
        .refine((data) => {
        // At least one field must be provided
        return data.roles !== undefined || data.status !== undefined;
    }, {
        message: 'At least one field (roles or status) must be provided'
    })
});
// Get users schema
exports.getUsersSchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        status: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.UserStatus),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.UserStatus)),
            zod_1.z.string().transform((val) => {
                // Handle comma-separated values or multiple query params
                if (val.includes(',')) {
                    return val.split(',').map((s) => s.trim());
                }
                return val;
            })
        ])
            .optional(),
        userType: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.UserType),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.UserType)),
            zod_1.z.string().transform((val) => {
                // Handle comma-separated values or multiple query params
                if (val.includes(',')) {
                    return val.split(',').map((s) => s.trim());
                }
                return val;
            })
        ])
            .optional(),
        role: zod_1.z.string().optional(),
        search: zod_1.z.string().optional()
    })
});
// Get user by ID schema
exports.getUserByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
            message: 'Invalid user ID format'
        })
    })
});
// Delete user schema
exports.deleteUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
            message: 'Invalid user ID format'
        })
    })
});
