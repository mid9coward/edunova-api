"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteOrdersSchema = exports.orderParamsSchema = exports.getOrdersQuerySchema = exports.updateOrderStatusSchema = exports.createOrderFromCartSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/**
 * Order Validation Schemas
 */
// Create order schema
exports.createOrderSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseIds: zod_1.z.array(zod_1.z.string().min(1, 'Course ID is required')).min(1, 'At least one course is required'),
        couponCode: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.enum([enums_1.PaymentMethod.STRIPE, enums_1.PaymentMethod.BANK_TRANSFER], {
            message: 'Invalid payment method'
        })
    })
});
// Create order from cart schema
exports.createOrderFromCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentMethod: zod_1.z.enum([enums_1.PaymentMethod.STRIPE, enums_1.PaymentMethod.BANK_TRANSFER], {
            message: 'Invalid payment method'
        }),
        couponCode: zod_1.z.string().optional()
    })
});
// Update order status schema
exports.updateOrderStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum([enums_1.OrderStatus.PENDING, enums_1.OrderStatus.COMPLETED, enums_1.OrderStatus.CANCELLED], {
            message: 'Invalid order status'
        })
    })
});
// Get orders query schema
exports.getOrdersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional().default('1').transform(Number).pipe(zod_1.z.number().min(1)),
        limit: zod_1.z.string().optional().default('10').transform(Number).pipe(zod_1.z.number().min(1).max(100)),
        status: zod_1.z.enum([enums_1.OrderStatus.PENDING, enums_1.OrderStatus.COMPLETED, enums_1.OrderStatus.CANCELLED]).optional(),
        paymentMethod: zod_1.z.enum([enums_1.PaymentMethod.STRIPE, enums_1.PaymentMethod.BANK_TRANSFER]).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'totalAmount', 'code']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
        search: zod_1.z.string().optional()
    })
});
// Order ID param schema
exports.orderParamsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1, 'Order ID is required')
    })
});
// Bulk delete orders schema
exports.bulkDeleteOrdersSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderIds: zod_1.z
            .array(zod_1.z.string().min(1, 'Order ID is required'))
            .min(1, 'At least one order ID is required')
            .max(100, 'Cannot delete more than 100 orders at once')
    })
});
