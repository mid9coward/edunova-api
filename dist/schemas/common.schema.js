"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.objectIdSchema = exports.usernameSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
// Common validation schemas
exports.emailSchema = zod_1.z.string().email('Please provide a valid email address').min(1, 'Email is required');
exports.passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
exports.usernameSchema = zod_1.z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
exports.objectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
// Pagination schemas
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, 'Page must be a positive number'),
    limit: zod_1.z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
    search: zod_1.z.string().optional(),
    sort: zod_1.z.string().optional()
});
