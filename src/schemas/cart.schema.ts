import { z } from 'zod'
import { objectIdSchema } from './common.schema'

/**
 * Cart Validation Schemas
 */

// Add to cart schema
export const addToCartSchema = z.object({
  body: z.object({
    courseId: objectIdSchema
  })
})

// Remove from cart schema
export const removeFromCartSchema = z.object({
  params: z.object({
    courseId: objectIdSchema
  })
})

// Update cart item schema
export const updateCartItemSchema = z.object({
  params: z.object({
    courseId: objectIdSchema
  }),
  body: z.object({
    // Reserved for future cart item updates
  })
})

// Type exports
export type AddToCartInput = z.infer<typeof addToCartSchema>['body']
export type RemoveFromCartParams = z.infer<typeof removeFromCartSchema>['params']
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body']
export type UpdateCartItemParams = z.infer<typeof updateCartItemSchema>['params']
