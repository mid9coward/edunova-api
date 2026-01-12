import { z } from 'zod'
import { CouponDiscountType } from '../enums'

/**
 * Coupon Validation Schemas - Simple CRUD
 */

// Create coupon schema
export const createCouponSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(100, 'Title too long').trim(),
      code: z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code too long').trim().toUpperCase(),
      discountType: z.enum([CouponDiscountType.PERCENT, CouponDiscountType.FIXED]),
      discountValue: z.number().min(0, 'Value must be positive'),
      courseIds: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'))
        .optional()
        .default([]),
      minPurchaseAmount: z.number().min(0, 'Minimum purchase amount must be positive').optional().default(0),
      maxUses: z.number().int().min(1, 'Max uses must be at least 1').optional(),
      startDate: z.string().datetime('Invalid start date format').optional(),
      endDate: z.string().datetime('Invalid end date format').optional(),
      isActive: z.boolean().optional().default(true)
    })
    .refine(
      (data) => {
        // Validate that end date is after start date
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) > new Date(data.startDate)
        }
        return true
      },
      {
        message: 'End date must be after start date',
        path: ['endDate']
      }
    )
    .refine(
      (data) => {
        // If type is percent, value should be between 1-100
        if (data.discountType === CouponDiscountType.PERCENT) {
          return data.discountValue >= 1 && data.discountValue <= 100
        }
        return true
      },
      {
        message: 'Percentage value must be between 1 and 100',
        path: ['discountValue']
      }
    )
})

// Update coupon schema
export const updateCouponSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(100, 'Title too long').trim().optional(),
      code: z
        .string()
        .min(3, 'Code must be at least 3 characters')
        .max(20, 'Code too long')
        .trim()
        .toUpperCase()
        .optional(),
      discountType: z.enum([CouponDiscountType.PERCENT, CouponDiscountType.FIXED]).optional(),
      discountValue: z.number().min(0, 'Value must be positive').optional(),
      courseIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID')).optional(),
      minPurchaseAmount: z.number().min(0, 'Minimum purchase amount must be positive').optional(),
      maxUses: z.number().int().min(1, 'Max uses must be at least 1').optional(),
      startDate: z.string().datetime('Invalid start date format').optional(),
      endDate: z.string().datetime('Invalid end date format').optional(),
      isActive: z.boolean().optional()
    })
    .refine(
      (data) => {
        // Validate that end date is after start date if both are provided
        if (data.startDate && data.endDate) {
          return new Date(data.endDate) > new Date(data.startDate)
        }
        return true
      },
      {
        message: 'End date must be after start date',
        path: ['endDate']
      }
    )
    .refine(
      (data) => {
        // If type is percent, value should be between 1-100
        if (data.discountType === CouponDiscountType.PERCENT && data.discountValue !== undefined) {
          return data.discountValue >= 1 && data.discountValue <= 100
        }
        return true
      },
      {
        message: 'Percentage value must be between 1 and 100',
        path: ['discountValue']
      }
    )
})

// Get coupons query schema
export const getCouponsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
    limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    search: z.string().max(100, 'Search term too long').optional(),
    isActive: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    discountType: z.enum([CouponDiscountType.PERCENT, CouponDiscountType.FIXED]).optional(),
    sortBy: z
      .enum(['title', 'code', 'startDate', 'endDate', 'createdAt', 'updatedAt', 'discountType', 'discountValue'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
})

// Apply coupon schema
export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Coupon code is required').trim().toUpperCase(),
    courseIds: z
      .array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'))
      .min(1, 'At least one course is required')
  })
})

// Type exports
export type CreateCouponInput = z.infer<typeof createCouponSchema>['body']
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>['body']
export type GetCouponsQuery = z.infer<typeof getCouponsSchema>['query']
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>['body']
