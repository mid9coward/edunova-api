import { z } from 'zod'
import { objectIdSchema, paginationSchema } from './common.schema'
import { ReviewStatus } from '../enums'

// Create review schema
export const createReviewSchema = z.object({
  body: z.object({
    courseId: objectIdSchema,
    star: z
      .number()
      .int('Star rating must be a whole number')
      .min(1, 'Star rating must be at least 1')
      .max(5, 'Star rating cannot exceed 5'),
    content: z
      .string()
      .trim()
      .min(1, 'Review content must be at least 1 character')
      .max(1000, 'Review content cannot exceed 1000 characters')
  })
})

// Update review schema
export const updateReviewSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),

  body: z
    .object({
      star: z
        .number()
        .int('Star rating must be a whole number')
        .min(1, 'Star rating must be at least 1')
        .max(5, 'Star rating cannot exceed 5')
        .optional(),
      content: z
        .string()
        .trim()
        .min(1, 'Review content must be at least 1 characters')
        .max(1000, 'Review content cannot exceed 1000 characters')
        .optional(),
      status: z.enum([ReviewStatus.ACTIVE, ReviewStatus.INACTIVE]).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get reviews query schema
export const getReviewsQuerySchema = z.object({
  query: paginationSchema.extend({
    courseId: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
    status: z.enum([ReviewStatus.ACTIVE, ReviewStatus.INACTIVE]).optional(),
    star: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => !val || (val >= 1 && val <= 5), 'Star rating must be between 1 and 5'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'star']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get review by ID schema
export const getReviewByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete review schema
export const deleteReviewSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Get course reviews schema
export const getCourseReviewsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema
  }),
  query: paginationSchema.extend({
    status: z.enum([ReviewStatus.ACTIVE, ReviewStatus.INACTIVE]).optional(),
    minStar: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => !val || (val >= 1 && val <= 5), 'Minimum star rating must be between 1 and 5'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'star']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get user reviews schema
export const getUserReviewsSchema = z.object({
  params: z.object({
    userId: objectIdSchema
  }),
  query: paginationSchema.extend({
    status: z.enum([ReviewStatus.ACTIVE, ReviewStatus.INACTIVE]).optional(),
    star: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined))
      .refine((val) => !val || (val >= 1 && val <= 5), 'Star rating must be between 1 and 5'),
    sortBy: z.enum(['createdAt', 'updatedAt', 'star']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get course rating stats schema
export const getCourseRatingStatsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema
  })
})

// Type exports for the schemas
export type CreateReviewInput = z.infer<typeof createReviewSchema>['body']
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>['body']
export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>['query']
export type GetCourseReviewsQuery = z.infer<typeof getCourseReviewsSchema>['query']
export type GetUserReviewsQuery = z.infer<typeof getUserReviewsSchema>['query']
