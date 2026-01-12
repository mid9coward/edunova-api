import { z } from 'zod'

/**
 * Payment Validation Schemas
 */

// SePay webhook data schema
export const sepayWebhookSchema = z.object({
  body: z.object({
    id: z.number().int().positive('Transaction ID is required'),
    gateway: z.string().min(1, 'Gateway is required'),
    transferType: z.enum(['in', 'out'], { message: 'Transfer type is required' }),
    transferAmount: z.number().positive('Transfer amount must be positive'),
    accountNumber: z.string().optional(),
    subAccount: z.string().optional(),
    code: z.string().optional(),
    content: z.string().optional(),
    description: z.string().optional(),
    referenceCode: z.string().optional(),
    body: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
  })
})

// Stripe create payment intent schema
export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    currency: z.string().min(3, 'Currency code is required').max(3, 'Currency code must be 3 characters').optional()
  })
})

// Stripe confirm payment schema
export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'Payment intent ID is required')
  })
})

// API key validation schema
export const apiKeyHeaderSchema = z.object({
  headers: z.object({
    authorization: z.string().min(1, 'Authorization header is required')
  })
})

// Payment callback query schema
export const paymentCallbackQuerySchema = z.object({
  query: z.object({
    status: z.enum(['success', 'failed', 'pending']).optional(),
    orderId: z.string().optional(),
    transactionId: z.string().optional()
  })
})

// Type exports
export type SepayWebhookInput = z.infer<typeof sepayWebhookSchema>['body']
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>['body']
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>['body']
export type ApiKeyHeaderInput = z.infer<typeof apiKeyHeaderSchema>['headers']
export type PaymentCallbackQuery = z.infer<typeof paymentCallbackQuerySchema>['query']
