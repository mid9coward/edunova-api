import { z } from 'zod'
import { OrderStatus, PaymentMethod } from '../enums'

/**
 * Order Validation Schemas
 */

// Create order schema
export const createOrderSchema = z.object({
  body: z.object({
    courseIds: z.array(z.string().min(1, 'Course ID is required')).min(1, 'At least one course is required'),
    couponCode: z.string().optional(),
    paymentMethod: z.enum([PaymentMethod.STRIPE, PaymentMethod.BANK_TRANSFER], {
      message: 'Invalid payment method'
    })
  })
})

// Create order from cart schema
export const createOrderFromCartSchema = z.object({
  body: z.object({
    paymentMethod: z.enum([PaymentMethod.STRIPE, PaymentMethod.BANK_TRANSFER], {
      message: 'Invalid payment method'
    }),
    couponCode: z.string().optional()
  })
})

// Update order status schema
export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.CANCELLED], {
      message: 'Invalid order status'
    })
  })
})

// Get orders query schema
export const getOrdersQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().default('1').transform(Number).pipe(z.number().min(1)),
    limit: z.string().optional().default('10').transform(Number).pipe(z.number().min(1).max(100)),
    status: z.enum([OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.CANCELLED]).optional(),
    paymentMethod: z.enum([PaymentMethod.STRIPE, PaymentMethod.BANK_TRANSFER]).optional(),
    sortBy: z.enum(['createdAt', 'totalAmount', 'code']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    search: z.string().optional()
  })
})

// Order ID param schema
export const orderParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Order ID is required')
  })
})

// Bulk delete orders schema
export const bulkDeleteOrdersSchema = z.object({
  body: z.object({
    orderIds: z
      .array(z.string().min(1, 'Order ID is required'))
      .min(1, 'At least one order ID is required')
      .max(100, 'Cannot delete more than 100 orders at once')
  })
})

// Export types
export type CreateOrderInput = z.infer<typeof createOrderSchema>['body']
export type CreateOrderFromCartInput = z.infer<typeof createOrderFromCartSchema>['body']
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body']
export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>['query']
export type OrderParams = z.infer<typeof orderParamsSchema>['params']
export type BulkDeleteOrdersInput = z.infer<typeof bulkDeleteOrdersSchema>['body']
