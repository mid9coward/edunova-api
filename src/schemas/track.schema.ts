import { z } from 'zod'
import { objectIdSchema } from './common.schema'

/**
 * Track Schemas
 */

// Toggle track
export const toggleTrackSchema = z.object({
  body: z.object({
    courseId: objectIdSchema,
    lessonId: objectIdSchema
  })
})

// Keep for backward compatibility
export const createTrackSchema = toggleTrackSchema

// Get track queries
export const getTrackQuery = z.object({
  query: z.object({
    courseId: objectIdSchema.optional(),
    lessonId: objectIdSchema.optional(),
    sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
})

// Get course track query
export const getCourseTrackQuery = z.object({
  query: z.object({
    courseId: objectIdSchema
  })
})

// Get user tracks for multiple courses
export const getUserTrackQuery = z.object({
  query: z.object({
    courseIds: z.string().optional() // comma-separated course IDs
  })
})

// Delete track
export const deleteTrackSchema = z.object({
  params: z.object({
    trackId: objectIdSchema
  })
})

// Export types
export type ToggleTrackInput = z.infer<typeof toggleTrackSchema>['body']
export type CreateTrackInput = ToggleTrackInput // Keep for backward compatibility
export type GetTrackQuery = z.infer<typeof getTrackQuery>['query']
export type GetCourseTrackQuery = z.infer<typeof getCourseTrackQuery>['query']
export type GetUserTrackQuery = z.infer<typeof getUserTrackQuery>['query']
