"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const cart_schema_1 = require("../schemas/cart.schema");
const router = (0, express_1.Router)();
// All cart routes require authentication
router.use(auth_middleware_1.authMiddleware);
// Get user's cart
router.get('/', (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.getCart));
// Get cart summary (item count and total price)
router.get('/summary', (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.getCartSummary));
// Validate cart before checkout
router.get('/validate', (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.validateCart));
// Add item to cart
router.post('/add', (0, validation_middleware_1.validate)(cart_schema_1.addToCartSchema), (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.addToCart));
// Update cart item (reserved for future extensibility)
router.put('/items/:courseId', (0, validation_middleware_1.validate)(cart_schema_1.updateCartItemSchema), (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.updateCartItem));
// Remove item from cart
router.delete('/items/:courseId', (0, validation_middleware_1.validate)(cart_schema_1.removeFromCartSchema), (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.removeFromCart));
// Clear entire cart
router.delete('/clear', (0, error_middleware_1.asyncHandler)(cart_controller_1.CartController.clearCart));
exports.default = router;
