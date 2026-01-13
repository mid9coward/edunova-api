"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCartItemSchema = exports.removeFromCartSchema = exports.addToCartSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
/**
 * Cart Validation Schemas
 */
// Add to cart schema
exports.addToCartSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    })
});
// Remove from cart schema
exports.removeFromCartSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    })
});
// Update cart item schema
exports.updateCartItemSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    }),
    body: zod_1.z.object({
    // Reserved for future cart item updates
    })
});
