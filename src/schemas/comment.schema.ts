import { z } from 'zod'
import { objectIdSchema, paginationSchema } from './common.schema'
import { CommentStatus } from '~/enums'

/**
 * Comment Validation Schemas
 */

// Reaction type enum validation
const reactionTypeSchema = z.enum(['like', 'love', 'care', 'fun', 'wow', 'sad', 'angry'])

// Create comment schema
export const createCommentSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Content is required').max(2000, 'Content too long').trim(),
    lessonId: objectIdSchema,
    parentId: z.union([objectIdSchema, z.null()]).optional(), // For replies - allow null or valid ObjectId
    mentions: z.array(objectIdSchema).optional() // Mentioned users
  })
})

// Add reaction schema
export const addReactionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    type: reactionTypeSchema
  })
})

// Remove reaction schema
export const removeReactionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    type: reactionTypeSchema
  })
})

// Update comment schema
export const updateCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    content: z.string().min(1, 'Content is required').max(2000, 'Content too long').trim()
  })
})

// Get comment by ID schema
export const getCommentByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Get lesson comments schema
export const getLessonCommentsSchema = z.object({
  params: z.object({
    lessonId: objectIdSchema
  }),
  query: paginationSchema.extend({
    status: z.nativeEnum(CommentStatus).optional(),
    sortBy: z.enum(['createdAt', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get user comments schema
export const getUserCommentsSchema = z.object({
  params: z.object({
    userId: objectIdSchema
  }),
  query: paginationSchema.extend({
    status: z.nativeEnum(CommentStatus).optional(),
    sortBy: z.enum(['createdAt', 'status']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get all comments schema (for admin)
export const getCommentsSchema = z.object({
  query: paginationSchema.extend({
    lessonId: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
    status: z
      .union([
        z.nativeEnum(CommentStatus),
        z.array(z.nativeEnum(CommentStatus)),
        z.string().transform((val) => {
          // Handle comma-separated values or multiple query params
          if (val.includes(',')) {
            return val.split(',').map((s) => s.trim())
          }
          return val
        })
      ])
      .optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'status', 'content']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Moderate comment schema (approve/reject)
export const moderateCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    status: z.enum([CommentStatus.APPROVED, CommentStatus.REJECTED]),
    reason: z.string().optional() // Optional moderation reason
  })
})

// Delete comment schema
export const deleteCommentSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  query: z.object({
    deleteReplies: z
      .string()
      .regex(/^(true|false)$/)
      .optional()
      .default('false')
  })
})

// Bulk moderate comments schema
export const bulkModerateCommentsSchema = z.object({
  body: z.object({
    commentIds: z.array(objectIdSchema).min(1, 'At least one comment ID is required'),
    status: z.enum([CommentStatus.APPROVED, CommentStatus.REJECTED]),
    reason: z.string().optional()
  })
})

// Get comment replies schema
export const getCommentRepliesSchema = z.object({
  params: z.object({
    commentId: objectIdSchema
  }),
  query: paginationSchema.extend({
    status: z.nativeEnum(CommentStatus).optional(),
    maxLevel: z
      .string()
      .regex(/^[1-5]$/)
      .optional()
      .default('5'), // Maximum nesting level to fetch
    sortBy: z.enum(['createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc') // Replies usually asc
  })
})

// Get comment reactions schema
export const getCommentReactionsSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  query: z.object({
    type: reactionTypeSchema.optional() // Filter by reaction type
  })
})

// Type exports
export type CreateCommentInput = z.infer<typeof createCommentSchema>['body']
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>['body']
export type AddReactionInput = z.infer<typeof addReactionSchema>['body']
export type RemoveReactionInput = z.infer<typeof removeReactionSchema>['body']
export type GetLessonCommentsQuery = z.infer<typeof getLessonCommentsSchema>['query']
export type GetUserCommentsQuery = z.infer<typeof getUserCommentsSchema>['query']
export type GetCommentsQuery = z.infer<typeof getCommentsSchema>['query']
export type ModerateCommentInput = z.infer<typeof moderateCommentSchema>['body']
export type BulkModerateCommentsInput = z.infer<typeof bulkModerateCommentsSchema>['body']
export type GetCommentRepliesQuery = z.infer<typeof getCommentRepliesSchema>['query']
export type GetCommentReactionsQuery = z.infer<typeof getCommentReactionsSchema>['query']
