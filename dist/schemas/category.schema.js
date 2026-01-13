"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteCategoriesSchema = exports.getCategoriesSchema = exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/**
 * Category Validation Schemas - Simple CRUD
 */
// Create category schema
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
        slug: zod_1.z.string().min(1, 'Slug is required').max(100, 'Slug too long').trim(),
        status: zod_1.z.nativeEnum(enums_1.CategoryStatus).optional().default(enums_1.CategoryStatus.ACTIVE)
    })
});
// Update category schema
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
        slug: zod_1.z.string().min(1, 'Slug is required').max(100, 'Slug too long').trim().optional(),
        status: zod_1.z.nativeEnum(enums_1.CategoryStatus).optional()
    })
});
// Get categories query schema
exports.getCategoriesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        search: zod_1.z.string().max(100, 'Search term too long').optional(),
        status: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.CategoryStatus),
            zod_1.z.string().transform((val) => val.split(',').map((s) => s.trim())),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.CategoryStatus))
        ])
            .optional(),
        sortBy: zod_1.z.enum(['name', 'createdAt', 'updatedAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
// Bulk delete categories schema
exports.bulkDeleteCategoriesSchema = zod_1.z.object({
    body: zod_1.z.object({
        categoryIds: zod_1.z
            .array(zod_1.z.string().min(1, 'Category ID is required'))
            .min(1, 'At least one category ID is required')
            .max(100, 'Cannot delete more than 100 categories at once')
    })
});
