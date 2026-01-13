"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuizSchema = exports.getQuizByIdSchema = exports.getQuizzesQuerySchema = exports.updateQuizSchema = exports.createQuizSchema = exports.deleteArticleSchema = exports.getArticleByIdSchema = exports.getArticlesQuerySchema = exports.updateArticleSchema = exports.createArticleSchema = exports.bulkDeleteVideosSchema = exports.deleteVideoSchema = exports.getVideoByIdSchema = exports.getVideosQuerySchema = exports.updateVideoSchema = exports.createVideoSchema = exports.reorderLessonsSchema = exports.getCourseLessonsSchema = exports.getChapterLessonsSchema = exports.deleteLessonSchema = exports.getLessonByIdSchema = exports.getLessonsQuerySchema = exports.updateLessonSchema = exports.createLessonSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
/**
 * Lesson and Resource Validation Schemas
 */
// Create lesson schema (supports both resource and resourceId)
exports.createLessonSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
        chapterId: common_schema_1.objectIdSchema,
        courseId: common_schema_1.objectIdSchema,
        contentType: zod_1.z.enum(['video', 'quiz', 'article']),
        preview: zod_1.z.boolean().optional().default(false),
        isPublished: zod_1.z.boolean().optional().default(false),
        duration: zod_1.z.number().int().optional(),
        // Either provide resourceId (existing resource) OR resource (create new resource)
        resourceId: common_schema_1.objectIdSchema.optional(),
        resource: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
    })
        .refine((data) => data.resourceId || data.resource, {
        message: 'Either resourceId or resource must be provided',
        path: ['resourceId']
    })
});
// Update lesson schema (with optional resource data)
exports.updateLessonSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
        chapterId: common_schema_1.objectIdSchema.optional(),
        order: zod_1.z.number().int().min(1, 'Order must be at least 1').optional(),
        preview: zod_1.z.boolean().optional(),
        isPublished: zod_1.z.boolean().optional(),
        duration: zod_1.z.number().int().min(0, 'Duration must be 0 or greater (0 = unlimited)').optional(),
        resource: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get lessons query schema (requires chapterId)
exports.getLessonsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        chapterId: common_schema_1.objectIdSchema
    })
});
// Get lesson by ID schema
exports.getLessonByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete lesson schema
exports.deleteLessonSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Get chapter lessons schema
exports.getChapterLessonsSchema = zod_1.z.object({
    params: zod_1.z.object({
        chapterId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        contentType: zod_1.z.enum(['video', 'quiz', 'article']).optional(),
        isPublished: zod_1.z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        sortBy: zod_1.z.enum(['title', 'order', 'createdAt']).default('order'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc')
    })
});
// Get course lessons schema
exports.getCourseLessonsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        chapterId: common_schema_1.objectIdSchema.optional(),
        contentType: zod_1.z.enum(['video', 'quiz', 'article']).optional(),
        isPublished: zod_1.z
            .enum(['true', 'false'])
            .transform((val) => val === 'true')
            .optional(),
        sortBy: zod_1.z.enum(['title', 'order', 'createdAt']).default('order'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc')
    })
});
// Reorder lessons schema
exports.reorderLessonsSchema = zod_1.z.object({
    body: zod_1.z.object({
        lessons: zod_1.z
            .array(zod_1.z.object({
            id: common_schema_1.objectIdSchema,
            order: zod_1.z.number().min(0, 'Order must be non-negative')
        }))
            .min(1, 'At least one lesson is required')
    })
});
/**
 * Video Resource Validation Schemas
 */
// Create video schema
exports.createVideoSchema = zod_1.z.object({
    body: zod_1.z.object({
        url: zod_1.z.string().url('Invalid URL format').min(1, 'URL is required'),
        description: zod_1.z.string().min(1, 'Description is required').max(1000, 'Description too long').trim()
    })
});
// Update video schema
exports.updateVideoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        url: zod_1.z.string().url('Invalid URL format').min(1, 'URL is required').optional(),
        description: zod_1.z.string().min(1, 'Description is required').max(1000, 'Description too long').trim().optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get videos query schema
exports.getVideosQuerySchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['url', 'description', 'createdAt']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get video by ID schema
exports.getVideoByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete video schema
exports.deleteVideoSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Bulk delete videos schema
exports.bulkDeleteVideosSchema = zod_1.z.object({
    body: zod_1.z.object({
        videoIds: zod_1.z.array(common_schema_1.objectIdSchema).min(1, 'At least one video ID is required')
    })
});
/**
 * Article Resource Validation Schemas
 */
// Create article schema
exports.createArticleSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
        description: zod_1.z.string().min(1, 'Description is required').max(5000, 'Description too long').trim()
    })
});
// Update article schema
exports.updateArticleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
        description: zod_1.z.string().min(1, 'Description is required').max(5000, 'Description too long').trim().optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get articles query schema
exports.getArticlesQuerySchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['title', 'createdAt']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get article by ID schema
exports.getArticleByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete article schema
exports.deleteArticleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
/**
 * Quiz Resource Validation Schemas
 */
// Create quiz schema
exports.createQuizSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
        totalAttemptsAllowed: zod_1.z
            .number()
            .int()
            .min(1, 'Total attempts must be at least 1')
            .max(10, 'Total attempts cannot exceed 10'),
        passingScorePercentage: zod_1.z
            .number()
            .int()
            .min(1, 'Passing score must be at least 1%')
            .max(100, 'Passing score cannot exceed 100%'),
        description: zod_1.z.string().trim().optional()
    })
});
// Update quiz schema
exports.updateQuizSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
        totalAttemptsAllowed: zod_1.z
            .number()
            .int()
            .min(1, 'Total attempts must be at least 1')
            .max(10, 'Total attempts cannot exceed 10')
            .optional(),
        passingScorePercentage: zod_1.z
            .number()
            .int()
            .min(1, 'Passing score must be at least 1%')
            .max(100, 'Passing score cannot exceed 100%')
            .optional(),
        description: zod_1.z.string().trim().optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get quizzes query schema
exports.getQuizzesQuerySchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['title', 'duration', 'createdAt']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get quiz by ID schema
exports.getQuizByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete quiz schema
exports.deleteQuizSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
