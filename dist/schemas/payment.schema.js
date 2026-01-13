"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCallbackQuerySchema = exports.apiKeyHeaderSchema = exports.confirmPaymentSchema = exports.createPaymentIntentSchema = exports.sepayWebhookSchema = void 0;
const zod_1 = require("zod");
/**
 * Payment Validation Schemas
 */
// SePay webhook data schema
exports.sepayWebhookSchema = zod_1.z.object({
    body: zod_1.z.object({
        id: zod_1.z.number().int().positive('Transaction ID is required'),
        gateway: zod_1.z.string().min(1, 'Gateway is required'),
        transferType: zod_1.z.enum(['in', 'out'], { message: 'Transfer type is required' }),
        transferAmount: zod_1.z.number().positive('Transfer amount must be positive'),
        accountNumber: zod_1.z.string().optional(),
        subAccount: zod_1.z.string().optional(),
        code: zod_1.z.string().optional(),
        content: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        referenceCode: zod_1.z.string().optional(),
        body: zod_1.z.string().optional(),
        createdAt: zod_1.z.string().optional(),
        updatedAt: zod_1.z.string().optional()
    })
});
// Stripe create payment intent schema
exports.createPaymentIntentSchema = zod_1.z.object({
    body: zod_1.z.object({
        orderId: zod_1.z.string().min(1, 'Order ID is required'),
        currency: zod_1.z.string().min(3, 'Currency code is required').max(3, 'Currency code must be 3 characters').optional()
    })
});
// Stripe confirm payment schema
exports.confirmPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        paymentIntentId: zod_1.z.string().min(1, 'Payment intent ID is required')
    })
});
// API key validation schema
exports.apiKeyHeaderSchema = zod_1.z.object({
    headers: zod_1.z.object({
        authorization: zod_1.z.string().min(1, 'Authorization header is required')
    })
});
// Payment callback query schema
exports.paymentCallbackQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['success', 'failed', 'pending']).optional(),
        orderId: zod_1.z.string().optional(),
        transactionId: zod_1.z.string().optional()
    })
});
