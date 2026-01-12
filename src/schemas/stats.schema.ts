import { z } from 'zod'

/**
 * Statistics Validation Schemas
 */

// Get monthly revenue trend schema
export const getMonthlyRevenueTrendSchema = z.object({
  query: z.object({
    months: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true
        const num = parseInt(val)
        return !isNaN(num) && num > 0 && num <= 24
      }, 'Months must be a number between 1 and 24')
      .transform((val) => (val ? parseInt(val) : undefined))
  })
})

// Get user registration trend schema
export const getUserRegistrationTrendSchema = z.object({
  query: z.object({
    days: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true
        const num = parseInt(val)
        return !isNaN(num) && num > 0 && num <= 365
      }, 'Days must be a number between 1 and 365')
      .transform((val) => (val ? parseInt(val) : undefined))
  })
})

// Type exports for TypeScript
export type GetMonthlyRevenueTrendQuery = z.infer<typeof getMonthlyRevenueTrendSchema>['query']
export type GetUserRegistrationTrendQuery = z.infer<typeof getUserRegistrationTrendSchema>['query']
