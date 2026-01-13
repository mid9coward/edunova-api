"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const payment_schema_1 = require("../schemas/payment.schema");
const router = (0, express_1.Router)();
/**
 * Public Routes - Webhook endpoints (no authentication required)
 */
// SePay webhook callback
router.post('/sepay-callback', (0, error_middleware_1.asyncHandler)(payment_controller_1.PaymentController.sepayCallback));
// Stripe webhook callback
router.post('/stripe-webhook', (0, error_middleware_1.asyncHandler)(payment_controller_1.PaymentController.stripeWebhook));
/**
 * Protected Routes - Require authentication
 */
// Get Stripe configuration (publishable key)
router.get('/stripe-config', (0, error_middleware_1.asyncHandler)(payment_controller_1.PaymentController.getStripeConfig));
// Create Stripe payment intent
router.post('/create-payment-intent', rate_limit_middleware_1.paymentRateLimit, auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(payment_schema_1.createPaymentIntentSchema), (0, error_middleware_1.asyncHandler)(payment_controller_1.PaymentController.createPaymentIntent));
// Confirm Stripe payment
router.post('/confirm-payment', rate_limit_middleware_1.paymentRateLimit, auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(payment_schema_1.confirmPaymentSchema), (0, error_middleware_1.asyncHandler)(payment_controller_1.PaymentController.confirmPayment));
exports.default = router;
