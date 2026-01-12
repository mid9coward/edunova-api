import { z } from 'zod'
import { CategoryStatus } from '../enums'

/**
 * Category Validation Schemas - Simple CRUD
 */

// Create category schema
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
    slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').trim(),
    status: z.nativeEnum(CategoryStatus).optional().default(CategoryStatus.ACTIVE)
  })
})

// Update category schema
export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim().optional(),
    slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long').trim().optional(),
    status: z.nativeEnum(CategoryStatus).optional()
  })
})

// Get categories query schema
export const getCategoriesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    search: z.string().max(100, 'Search term too long').optional(),
    status: z
      .union([
        z.nativeEnum(CategoryStatus),
        z.string().transform((val) => val.split(',').map((s) => s.trim())),
        z.array(z.nativeEnum(CategoryStatus))
      ])
      .optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
})

// Bulk delete categories schema
export const bulkDeleteCategoriesSchema = z.object({
  body: z.object({
    categoryIds: z
      .array(z.string().min(1, 'Category ID is required'))
      .min(1, 'At least one category ID is required')
      .max(100, 'Cannot delete more than 100 categories at once')
  })
})

// Type exports
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body']
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body']
export type GetCategoriesQuery = z.infer<typeof getCategoriesSchema>['query']
export type BulkDeleteCategoriesInput = z.infer<typeof bulkDeleteCategoriesSchema>['body']
