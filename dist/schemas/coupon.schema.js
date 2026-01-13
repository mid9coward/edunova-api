"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyCouponSchema = exports.getCouponsSchema = exports.updateCouponSchema = exports.createCouponSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/**
 * Coupon Validation Schemas - Simple CRUD
 */
// Create coupon schema
exports.createCouponSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title too long').trim(),
        code: zod_1.z.string().min(3, 'Code must be at least 3 characters').max(20, 'Code too long').trim().toUpperCase(),
        discountType: zod_1.z.enum([enums_1.CouponDiscountType.PERCENT, enums_1.CouponDiscountType.FIXED]),
        discountValue: zod_1.z.number().min(0, 'Value must be positive'),
        courseIds: zod_1.z
            .array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'))
            .optional()
            .default([]),
        minPurchaseAmount: zod_1.z.number().min(0, 'Minimum purchase amount must be positive').optional().default(0),
        maxUses: zod_1.z.number().int().min(1, 'Max uses must be at least 1').optional(),
        startDate: zod_1.z.string().datetime('Invalid start date format').optional(),
        endDate: zod_1.z.string().datetime('Invalid end date format').optional(),
        isActive: zod_1.z.boolean().optional().default(true)
    })
        .refine((data) => {
        // Validate that end date is after start date
        if (data.startDate && data.endDate) {
            return new Date(data.endDate) > new Date(data.startDate);
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['endDate']
    })
        .refine((data) => {
        // If type is percent, value should be between 1-100
        if (data.discountType === enums_1.CouponDiscountType.PERCENT) {
            return data.discountValue >= 1 && data.discountValue <= 100;
        }
        return true;
    }, {
        message: 'Percentage value must be between 1 and 100',
        path: ['discountValue']
    })
});
// Update coupon schema
exports.updateCouponSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(100, 'Title too long').trim().optional(),
        code: zod_1.z
            .string()
            .min(3, 'Code must be at least 3 characters')
            .max(20, 'Code too long')
            .trim()
            .toUpperCase()
            .optional(),
        discountType: zod_1.z.enum([enums_1.CouponDiscountType.PERCENT, enums_1.CouponDiscountType.FIXED]).optional(),
        discountValue: zod_1.z.number().min(0, 'Value must be positive').optional(),
        courseIds: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID')).optional(),
        minPurchaseAmount: zod_1.z.number().min(0, 'Minimum purchase amount must be positive').optional(),
        maxUses: zod_1.z.number().int().min(1, 'Max uses must be at least 1').optional(),
        startDate: zod_1.z.string().datetime('Invalid start date format').optional(),
        endDate: zod_1.z.string().datetime('Invalid end date format').optional(),
        isActive: zod_1.z.boolean().optional()
    })
        .refine((data) => {
        // Validate that end date is after start date if both are provided
        if (data.startDate && data.endDate) {
            return new Date(data.endDate) > new Date(data.startDate);
        }
        return true;
    }, {
        message: 'End date must be after start date',
        path: ['endDate']
    })
        .refine((data) => {
        // If type is percent, value should be between 1-100
        if (data.discountType === enums_1.CouponDiscountType.PERCENT && data.discountValue !== undefined) {
            return data.discountValue >= 1 && data.discountValue <= 100;
        }
        return true;
    }, {
        message: 'Percentage value must be between 1 and 100',
        path: ['discountValue']
    })
});
// Get coupons query schema
exports.getCouponsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: zod_1.z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
        search: zod_1.z.string().max(100, 'Search term too long').optional(),
        isActive: zod_1.z
            .string()
            .transform((val) => val === 'true')
            .optional(),
        discountType: zod_1.z.enum([enums_1.CouponDiscountType.PERCENT, enums_1.CouponDiscountType.FIXED]).optional(),
        sortBy: zod_1.z
            .enum(['title', 'code', 'startDate', 'endDate', 'createdAt', 'updatedAt', 'discountType', 'discountValue'])
            .optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional()
    })
});
// Apply coupon schema
exports.applyCouponSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(1, 'Coupon code is required').trim().toUpperCase(),
        courseIds: zod_1.z
            .array(zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID'))
            .min(1, 'At least one course is required')
    })
});
