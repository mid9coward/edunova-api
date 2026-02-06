"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseCompletionSchema = exports.getRelatedCoursesSchema = exports.bulkDeleteSchema = exports.updateCourseInfoSchema = exports.deleteCourseSchema = exports.getCourseBySlugSchema = exports.getCourseByIdSchema = exports.getCoursesSchema = exports.updateCourseSchema = exports.createCourseSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
const common_schema_1 = require("./common.schema");
/**
 * Course Validation Schemas
 */
// Base course schema for common fields
const baseLesson = zod_1.z.object({
    question: zod_1.z.string().min(1, 'Question is required').trim(),
    answer: zod_1.z.string().min(1, 'Answer is required').trim()
});
const baseCourseInfo = zod_1.z.object({
    requirements: zod_1.z.array(zod_1.z.string().trim()).default([]),
    benefits: zod_1.z.array(zod_1.z.string().trim()).default([]),
    techniques: zod_1.z.array(zod_1.z.string().trim()).default([]),
    documents: zod_1.z.array(zod_1.z.string().trim()).default([]),
    qa: zod_1.z.array(baseLesson).default([])
});
// Create course schema
exports.createCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
        slug: zod_1.z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim(),
        image: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        excerpt: zod_1.z.string().max(500, 'Excerpt too long').trim().optional(),
        introUrl: zod_1.z.string().trim().optional(),
        price: zod_1.z.number().min(0, 'Price must be non-negative'),
        oldPrice: zod_1.z.number().min(0, 'Old price must be non-negative').optional(),
        originalPrice: zod_1.z.number().min(0, 'Original price must be non-negative').optional(),
        isFree: zod_1.z.boolean().optional().default(false),
        status: zod_1.z.nativeEnum(enums_1.CourseStatus).optional().default(enums_1.CourseStatus.DRAFT),
        categoryId: zod_1.z.string().min(1, 'Category is required'),
        level: zod_1.z.nativeEnum(enums_1.CourseLevel),
        info: baseCourseInfo.optional().default(() => ({
            requirements: [],
            benefits: [],
            techniques: [],
            documents: [],
            qa: []
        }))
    })
});
// Update course schema
exports.updateCourseSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: zod_1.z.string().min(1, 'Course ID is required')
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
        slug: zod_1.z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim().optional(),
        image: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        excerpt: zod_1.z.string().max(500, 'Excerpt too long').trim().optional(),
        introUrl: zod_1.z.string().trim().optional(),
        price: zod_1.z.number().min(0, 'Price must be non-negative').optional(),
        oldPrice: zod_1.z.number().min(0, 'Old price must be non-negative').optional(),
        isFree: zod_1.z.boolean().optional(),
        status: zod_1.z.nativeEnum(enums_1.CourseStatus).optional(),
        authorId: zod_1.z.string().min(1, 'Author is required').optional(),
        categoryId: zod_1.z.string().min(1, 'Category is required').optional(),
        level: zod_1.z.nativeEnum(enums_1.CourseLevel).optional(),
        info: baseCourseInfo.optional()
    })
});
// Get courses schema (for query parameters)
exports.getCoursesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
        search: zod_1.z.string().optional(),
        categoryId: zod_1.z.string().optional(),
        level: zod_1.z
            .union([
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.CourseLevel)),
            zod_1.z.string().refine((val) => {
                // Allow comma-separated values
                const values = val.split(',').map((v) => v.trim());
                return values.every((v) => Object.values(enums_1.CourseLevel).includes(v));
            }, 'Invalid level value(s)')
        ])
            .optional(),
        status: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.CourseStatus),
            zod_1.z.string().refine((val) => {
                // Allow comma-separated values
                const values = val.split(',').map((v) => v.trim());
                return values.every((v) => Object.values(enums_1.CourseStatus).includes(v));
            }, 'Invalid status value(s)'),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.CourseStatus))
        ])
            .optional(),
        type: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.CourseType),
            zod_1.z.string().refine((val) => {
                // Allow comma-separated values
                const values = val.split(',').map((v) => v.trim());
                return values.every((v) => Object.values(enums_1.CourseType).includes(v));
            }, 'Invalid type value(s)'),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.CourseType))
        ])
            .optional(),
        authorId: zod_1.z.string().optional(),
        minPrice: zod_1.z
            .string()
            .regex(/^\d+(\.\d+)?$/, 'Min price must be a number')
            .optional(),
        maxPrice: zod_1.z
            .string()
            .regex(/^\d+(\.\d+)?$/, 'Max price must be a number')
            .optional(),
        minRating: zod_1.z
            .string()
            .regex(/^[0-5](\.\d+)?$/, 'Min rating must be between 0 and 5')
            .optional(),
        sortBy: zod_1.z
            .enum(['newest', 'popular', 'rating', 'price', 'alphabetical', 'createdAt'])
            .optional()
            .default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc')
    })
});
// Get course by ID schema
exports.getCourseByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: zod_1.z.string().min(1, 'Course ID is required')
    })
});
// Get course by slug schema
exports.getCourseBySlugSchema = zod_1.z.object({
    params: zod_1.z.object({
        slug: zod_1.z.string().min(1, 'Course slug is required').trim()
    })
});
// Delete course schema
exports.deleteCourseSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: zod_1.z.string().min(1, 'Course ID is required')
    })
});
// Update course info schema
exports.updateCourseInfoSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: zod_1.z.string().min(1, 'Course ID is required')
    }),
    body: baseCourseInfo
});
// Bulk operations schema
exports.bulkDeleteSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseIds: zod_1.z.array(zod_1.z.string().min(1, 'Course ID is required')).min(1, 'At least one course ID is required')
    })
});
exports.getRelatedCoursesSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: zod_1.z.string().min(1, 'Course ID is required')
    }),
    query: zod_1.z.object({
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a valid number').optional().default('5')
    })
});
// Get course completion schema
exports.getCourseCompletionSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    })
});
