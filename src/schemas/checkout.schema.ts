import { z } from 'zod'
import { PaymentMethod } from '../enums'

/**
 * Checkout Validation Schemas
 */

// Checkout preview schema
export const checkoutPreviewSchema = z.object({
  body: z.object({
    couponCode: z.string().optional()
  })
})

// Process checkout schema
export const processCheckoutSchema = z.object({
  body: z.object({
    couponCode: z.string().optional(),
    paymentMethod: z.enum([PaymentMethod.STRIPE, PaymentMethod.BANK_TRANSFER], {
      message: 'Invalid payment method'
    })
  })
})

// Export types
export type CheckoutPreviewInput = z.infer<typeof checkoutPreviewSchema>['body']
export type ProcessCheckoutInput = z.infer<typeof processCheckoutSchema>['body']
