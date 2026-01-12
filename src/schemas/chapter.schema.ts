import { z } from 'zod'
import { objectIdSchema } from './common.schema'

/**
 * Chapter Validation Schemas
 */

// Create chapter schema
export const createChapterSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    description: z.string().max(2000, 'Description too long').trim().optional(),
    courseId: objectIdSchema,
    isPublished: z.boolean().default(false).optional()
  })
})

// Update chapter schema
export const updateChapterSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
      description: z.string().max(2000, 'Description too long').trim().optional(),
      isPublished: z.boolean().optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get chapters query schema
export const getChaptersQuerySchema = z.object({
  query: z.object({
    courseId: objectIdSchema
  })
})

// Get chapter by ID schema
export const getChapterByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete chapter schema
export const deleteChapterSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Get course chapters schema
export const getCourseChaptersSchema = z.object({
  params: z.object({
    courseId: objectIdSchema
  }),
  query: z.object({
    isPublished: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z.enum(['title', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
})

// Reorder chapters schema
export const reorderChaptersSchema = z.object({
  body: z.object({
    chapters: z
      .array(
        z.object({
          id: objectIdSchema,
          order: z.number().min(0, 'Order must be non-negative')
        })
      )
      .min(1, 'At least one chapter is required')
  })
})

// Type exports for the schemas
export type CreateChapterInput = z.infer<typeof createChapterSchema>['body']
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>['body']
export type GetChaptersQuery = z.infer<typeof getChaptersQuerySchema>['query']
export type GetCourseChaptersQuery = z.infer<typeof getCourseChaptersSchema>['query']
export type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>['body']
