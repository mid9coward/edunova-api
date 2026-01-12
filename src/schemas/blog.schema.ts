import { z } from 'zod'
import { BlogStatus } from '../enums'

/**
 * Blog Validation Schemas
 */

// Create blog schema
export const createBlogSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim().toLowerCase(),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt too long').trim(),
    thumbnail: z.string().optional(),
    status: z.nativeEnum(BlogStatus).optional().default(BlogStatus.DRAFT),
    publishedAt: z.string().datetime('Invalid date format').optional(),
    categoryId: z.string().min(1, 'Category ID is required').optional()
  })
})

// Update blog schema
export const updateBlogSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
    slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').trim().toLowerCase().optional(),
    content: z.string().min(1, 'Content is required').optional(),
    excerpt: z.string().min(1, 'Excerpt is required').max(500, 'Excerpt too long').trim().optional(),
    thumbnail: z.string().min(1, 'Thumbnail is required').url('Thumbnail must be a valid URL').optional(),
    status: z.nativeEnum(BlogStatus).optional(),
    publishedAt: z.string().datetime('Invalid date format').optional(),
    categoryId: z.string().min(1, 'Category ID is required').optional()
  })
})

// Get blogs query schema
export const getBlogsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    search: z.string().max(100, 'Search term too long').optional(),
    status: z
      .union([
        z.nativeEnum(BlogStatus),
        z.string().transform((val) => val.split(',').map((s) => s.trim())),
        z.array(z.nativeEnum(BlogStatus))
      ])
      .optional(),
    authorId: z.string().optional(),
    categoryId: z.string().optional(),
    sortBy: z.enum(['title', 'publishedAt', 'createdAt', 'updatedAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
})

// Blog params schema
export const blogParamsSchema = z.object({
  params: z.object({
    blogId: z.string().min(1, 'Blog ID is required')
  })
})

// Blog slug params schema
export const blogSlugParamsSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Blog slug is required')
  })
})

// Bulk delete blogs schema
export const bulkDeleteBlogsSchema = z.object({
  body: z.object({
    blogIds: z
      .array(z.string().min(1, 'Blog ID is required'))
      .min(1, 'At least one blog ID is required')
      .max(100, 'Cannot delete more than 100 blogs at once')
  })
})

// Type exports
export type CreateBlogInput = z.infer<typeof createBlogSchema>['body']
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>['body']
export type GetBlogsQuery = z.infer<typeof getBlogsSchema>['query']
export type BlogParamsInput = z.infer<typeof blogParamsSchema>['params']
export type BlogSlugParamsInput = z.infer<typeof blogSlugParamsSchema>['params']
export type BulkDeleteBlogsInput = z.infer<typeof bulkDeleteBlogsSchema>['body']
