"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderChaptersSchema = exports.getCourseChaptersSchema = exports.deleteChapterSchema = exports.getChapterByIdSchema = exports.getChaptersQuerySchema = exports.updateChapterSchema = exports.createChapterSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
/**
 * Chapter Validation Schemas
 */
// Create chapter schema
exports.createChapterSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
        description: zod_1.z.string().max(2000, 'Description too long').trim().optional(),
        courseId: common_schema_1.objectIdSchema,
        isPublished: zod_1.z.boolean().default(false).optional()
    })
});
// Update chapter schema
exports.updateChapterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
        description: zod_1.z.string().max(2000, 'Description too long').trim().optional(),
        isPublished: zod_1.z.boolean().optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get chapters query schema
exports.getChaptersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    })
});
// Get chapter by ID schema
exports.getChapterByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete chapter schema
exports.deleteChapterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Get course chapters schema
exports.getCourseChaptersSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    }),
    query: zod_1.z.object({
        isPublished: zod_1.z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        sortBy: zod_1.z.enum(['title', 'order', 'createdAt']).default('order'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc')
    })
});
// Reorder chapters schema
exports.reorderChaptersSchema = zod_1.z.object({
    body: zod_1.z.object({
        chapters: zod_1.z
            .array(zod_1.z.object({
            id: common_schema_1.objectIdSchema,
            order: zod_1.z.number().min(0, 'Order must be non-negative')
        }))
            .min(1, 'At least one chapter is required')
    })
});
