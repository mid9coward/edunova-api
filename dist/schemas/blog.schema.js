"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteBlogsSchema = exports.blogSlugParamsSchema = exports.blogParamsSchema = exports.getBlogsSchema = exports.updateBlogSchema = exports.createBlogSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/**
 * Blog Validation Schemas
 */
// Create blog schema
exports.createBlogSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
        slug: zod_1.z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim().toLowerCase(),
        content: zod_1.z.string().min(1, 'Content is required'),
        excerpt: zod_1.z.string().min(1, 'Excerpt is required').max(500, 'Excerpt too long').trim(),
        thumbnail: zod_1.z.string().optional(),
        status: zod_1.z.nativeEnum(enums_1.BlogStatus).optional().default(enums_1.BlogStatus.DRAFT),
        publishedAt: zod_1.z.string().datetime('Invalid date format').optional(),
        categoryId: zod_1.z.string().min(1, 'Category ID is required').optional()
    })
});
// Update blog schema
exports.updateBlogSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
        slug: zod_1.z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim().toLowerCase().optional(),
        content: zod_1.z.string().min(1, 'Content is required').optional(),
        excerpt: zod_1.z.string().min(1, 'Excerpt is required').max(500, 'Excerpt too long').trim().optional(),
        thumbnail: zod_1.z.string().min(1, 'Thumbnail is required').url('Thumbnail must be a valid URL').optional(),
        status: zod_1.z.nativeEnum(enums_1.BlogStatus).optional(),
        publishedAt: zod_1.z.string().datetime('Invalid date format').optional(),
        categoryId: zod_1.z.string().min(1, 'Category ID is required').optional()
    })
});
// Get blogs query schema
exports.getBlogsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        search: zod_1.z.string().max(100, 'Search term too long').optional(),
        status: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.BlogStatus),
            zod_1.z.string().transform((val) => val.split(',').map((s) => s.trim())),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.BlogStatus))
        ])
            .optional(),
        authorId: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['title', 'publishedAt', 'createdAt', 'updatedAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
// Blog params schema
exports.blogParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        blogId: zod_1.z.string().min(1, 'Blog ID is required')
    })
});
// Blog slug params schema
exports.blogSlugParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        slug: zod_1.z.string().min(1, 'Blog slug is required')
    })
});
// Bulk delete blogs schema
exports.bulkDeleteBlogsSchema = zod_1.z.object({
    body: zod_1.z.object({
        blogIds: zod_1.z
            .array(zod_1.z.string().min(1, 'Blog ID is required'))
            .min(1, 'At least one blog ID is required')
            .max(100, 'Cannot delete more than 100 blogs at once')
    })
});
