import { Router } from 'express'
import { PaymentController } from '../controllers/payment.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { paymentRateLimit } from '../middlewares/rate-limit.middleware'
import { validate } from '../middlewares/validation.middleware'
import { confirmPaymentSchema, createPaymentIntentSchema } from '../schemas/payment.schema'

const router = Router()

/**
 * Public Routes - Webhook endpoints (no authentication required)
 */

// SePay webhook callback
router.post('/sepay-callback', asyncHandler(PaymentController.sepayCallback))

// Stripe webhook callback
router.post('/stripe-webhook', asyncHandler(PaymentController.stripeWebhook))

/**
 * Protected Routes - Require authentication
 */

// Get Stripe configuration (publishable key)
router.get('/stripe-config', asyncHandler(PaymentController.getStripeConfig))

// Create Stripe payment intent
router.post(
  '/create-payment-intent',
  paymentRateLimit,
  authMiddleware,
  validate(createPaymentIntentSchema),
  asyncHandler(PaymentController.createPaymentIntent)
)

// Confirm Stripe payment
router.post(
  '/confirm-payment',
  paymentRateLimit,
  authMiddleware,
  validate(confirmPaymentSchema),
  asyncHandler(PaymentController.confirmPayment)
)

export default router
