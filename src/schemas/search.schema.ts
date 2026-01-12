import { z } from 'zod'

/**
 * Search Validation Schemas
 */

// Search query schema
export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters').trim()
  })
})

export type SearchQueryInput = z.infer<typeof searchQuerySchema>
