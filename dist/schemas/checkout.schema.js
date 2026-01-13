"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCheckoutSchema = exports.checkoutPreviewSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../enums");
/**
 * Checkout Validation Schemas
 */
// Checkout preview schema
exports.checkoutPreviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        couponCode: zod_1.z.string().optional()
    })
});
// Process checkout schema
exports.processCheckoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        couponCode: zod_1.z.string().optional(),
        paymentMethod: zod_1.z.enum([enums_1.PaymentMethod.STRIPE, enums_1.PaymentMethod.BANK_TRANSFER], {
            message: 'Invalid payment method'
        })
    })
});
