"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseRatingStatsSchema = exports.getUserReviewsSchema = exports.getCourseReviewsSchema = exports.deleteReviewSchema = exports.getReviewByIdSchema = exports.getReviewsQuerySchema = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
const enums_1 = require("../enums");
// Create review schema
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema,
        star: zod_1.z
            .number()
            .int('Star rating must be a whole number')
            .min(1, 'Star rating must be at least 1')
            .max(5, 'Star rating cannot exceed 5'),
        content: zod_1.z
            .string()
            .trim()
            .min(1, 'Review content must be at least 1 character')
            .max(1000, 'Review content cannot exceed 1000 characters')
    })
});
// Update review schema
exports.updateReviewSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        star: zod_1.z
            .number()
            .int('Star rating must be a whole number')
            .min(1, 'Star rating must be at least 1')
            .max(5, 'Star rating cannot exceed 5')
            .optional(),
        content: zod_1.z
            .string()
            .trim()
            .min(1, 'Review content must be at least 1 characters')
            .max(1000, 'Review content cannot exceed 1000 characters')
            .optional(),
        status: zod_1.z.enum([enums_1.ReviewStatus.ACTIVE, enums_1.ReviewStatus.INACTIVE]).optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get reviews query schema
exports.getReviewsQuerySchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        courseId: common_schema_1.objectIdSchema.optional(),
        userId: common_schema_1.objectIdSchema.optional(),
        status: zod_1.z.enum([enums_1.ReviewStatus.ACTIVE, enums_1.ReviewStatus.INACTIVE]).optional(),
        star: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => !val || (val >= 1 && val <= 5), 'Star rating must be between 1 and 5'),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'star']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get review by ID schema
exports.getReviewByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete review schema
exports.deleteReviewSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Get course reviews schema
exports.getCourseReviewsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        status: zod_1.z.enum([enums_1.ReviewStatus.ACTIVE, enums_1.ReviewStatus.INACTIVE]).optional(),
        minStar: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => !val || (val >= 1 && val <= 5), 'Minimum star rating must be between 1 and 5'),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'star']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get user reviews schema
exports.getUserReviewsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        status: zod_1.z.enum([enums_1.ReviewStatus.ACTIVE, enums_1.ReviewStatus.INACTIVE]).optional(),
        star: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined))
            .refine((val) => !val || (val >= 1 && val <= 5), 'Star rating must be between 1 and 5'),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'star']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get course rating stats schema
exports.getCourseRatingStatsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    })
});
