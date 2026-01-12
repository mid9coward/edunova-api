import { z } from 'zod'
import { CourseLevel, CourseStatus, CourseType } from '../enums'

/**
 * Course Validation Schemas
 */

// Base course schema for common fields
const baseLesson = z.object({
  question: z.string().min(1, 'Question is required').trim(),
  answer: z.string().min(1, 'Answer is required').trim()
})

const baseCourseInfo = z.object({
  requirements: z.array(z.string().trim()).default([]),
  benefits: z.array(z.string().trim()).default([]),
  techniques: z.array(z.string().trim()).default([]),
  documents: z.array(z.string().trim()).default([]),
  qa: z.array(baseLesson).default([])
})

// Create course schema
export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim(),
    image: z.string().optional(),
    description: z.string().optional(),
    excerpt: z.string().max(500, 'Excerpt too long').trim().optional(),
    introUrl: z.string().trim().optional(),
    price: z.number().min(0, 'Price must be non-negative'),
    oldPrice: z.number().min(0, 'Old price must be non-negative').optional(),
    originalPrice: z.number().min(0, 'Original price must be non-negative').optional(),
    isFree: z.boolean().optional().default(false),
    status: z.nativeEnum(CourseStatus).optional().default(CourseStatus.DRAFT),
    categoryId: z.string().min(1, 'Category is required'),
    level: z.nativeEnum(CourseLevel),
    info: baseCourseInfo.optional().default(() => ({
      requirements: [],
      benefits: [],
      techniques: [],
      documents: [],
      qa: []
    }))
  })
})

// Update course schema
export const updateCourseSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required')
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
    slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    excerpt: z.string().max(500, 'Excerpt too long').trim().optional(),
    introUrl: z.string().trim().optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    oldPrice: z.number().min(0, 'Old price must be non-negative').optional(),
    isFree: z.boolean().optional(),
    status: z.nativeEnum(CourseStatus).optional(),
    authorId: z.string().min(1, 'Author is required').optional(),
    categoryId: z.string().min(1, 'Category is required').optional(),
    level: z.nativeEnum(CourseLevel).optional(),
    info: baseCourseInfo.optional()
  })
})

// Get courses schema (for query parameters)
export const getCoursesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional().default('1'),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional().default('10'),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    level: z
      .union([
        z.array(z.nativeEnum(CourseLevel)),
        z.string().refine((val) => {
          // Allow comma-separated values
          const values = val.split(',').map((v) => v.trim())
          return values.every((v) => Object.values(CourseLevel).includes(v as CourseLevel))
        }, 'Invalid level value(s)')
      ])
      .optional(),
    status: z
      .union([
        z.nativeEnum(CourseStatus),
        z.string().refine((val) => {
          // Allow comma-separated values
          const values = val.split(',').map((v) => v.trim())
          return values.every((v) => Object.values(CourseStatus).includes(v as CourseStatus))
        }, 'Invalid status value(s)'),
        z.array(z.nativeEnum(CourseStatus))
      ])
      .optional(),
    type: z
      .union([
        z.nativeEnum(CourseType),
        z.string().refine((val) => {
          // Allow comma-separated values
          const values = val.split(',').map((v) => v.trim())
          return values.every((v) => Object.values(CourseType).includes(v as CourseType))
        }, 'Invalid type value(s)'),
        z.array(z.nativeEnum(CourseType))
      ])
      .optional(),
    authorId: z.string().optional(),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Min price must be a number')
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'Max price must be a number')
      .optional(),
    minRating: z
      .string()
      .regex(/^[0-5](\.\d+)?$/, 'Min rating must be between 0 and 5')
      .optional(),
    sortBy: z
      .enum(['newest', 'popular', 'rating', 'price', 'alphabetical', 'createdAt'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
})

// Get course by ID schema
export const getCourseByIdSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required')
  })
})

// Get course by slug schema
export const getCourseBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Course slug is required').trim()
  })
})

// Delete course schema
export const deleteCourseSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required')
  })
})

// Update course info schema
export const updateCourseInfoSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required')
  }),
  body: baseCourseInfo
})

// Bulk operations schema
export const bulkDeleteSchema = z.object({
  body: z.object({
    courseIds: z.array(z.string().min(1, 'Course ID is required')).min(1, 'At least one course ID is required')
  })
})

export const getRelatedCoursesSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, 'Course ID is required')
  }),
  query: z.object({
    limit: z.string().regex(/^\d+$/, 'Limit must be a valid number').optional().default('5')
  })
})

// Types for TypeScript
export type CreateCourseInput = z.infer<typeof createCourseSchema>['body']
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>['body']
export type GetCoursesQuery = z.infer<typeof getCoursesSchema>['query']
