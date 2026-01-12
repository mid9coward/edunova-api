import { Request, Response } from 'express'
import { SepayWebhookInput } from '../schemas/payment.schema'
import { PaymentService } from '../services/payment.service'
import { StripeService } from '../services/stripe.service'
import { AppError } from '../utils/errors'
import { sendSuccess } from '../utils/success'

/**
 * Payment Controller
 * Handles webhook callbacks and payment operations for payment gateways
 */
export class PaymentController {
  /**
   * SePay webhook callback endpoint
   * Endpoint: POST /payment/sepay-callback
   */
  static async sepayCallback(req: Request, res: Response): Promise<void> {
    // Extract API key from Authorization header
    const authHeader = req.headers.authorization
    const apiKey = authHeader?.replace('Apikey ', '') || ''

    // Validate API key
    if (!PaymentService.validateSepayWebhook(apiKey)) {
      throw new AppError('Invalid API key', 401)
    }

    // Get webhook data from request body
    const webhookData: SepayWebhookInput = req.body

    try {
      // Process webhook
      const result = await PaymentService.handleSepayWebhook(webhookData)

      // Return success response in SePay required format
      res.status(200).json({
        success: result.success,
        message: result.message,
        data: result.order
      })
    } catch (error) {
      // Handle business logic errors gracefully for SePay
      if (error instanceof AppError) {
        // Return success response for ignored cases (SePay expects this)
        res.status(200).json({
          success: true,
          message: `Ignored: ${error.message}`
        })
      } else {
        // Re-throw unexpected errors
        throw error
      }
    }
  }

  /**
   * Create Stripe payment intent
   * Endpoint: POST /payment/create-payment-intent
   */
  static async createPaymentIntent(req: Request, res: Response): Promise<void> {
    const { orderId, currency } = req.body
    const userId = req.user?.userId

    if (!orderId) {
      throw new AppError('Order ID is required', 400)
    }

    // Create payment intent using service with order ID
    const result = await StripeService.createPaymentIntent(orderId, userId, currency)

    sendSuccess.created(res, 'Payment intent created successfully', result)
  }

  /**
   * Confirm Stripe payment
   * Endpoint: POST /payment/confirm-payment
   */
  static async confirmPayment(req: Request, res: Response): Promise<void> {
    const { paymentIntentId } = req.body

    if (!paymentIntentId) {
      throw new AppError('Payment intent ID is required', 400)
    }

    // Retrieve payment intent details
    const paymentIntent = await StripeService.confirmPaymentIntent(paymentIntentId)

    const responseAmount = process.env.STRIPE_CURRENCY === 'vnd' ? paymentIntent.amount : paymentIntent.amount / 100

    sendSuccess.ok(res, 'Payment confirmed successfully', {
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: responseAmount,
        currency: paymentIntent.currency
      }
    })
  }

  /**
   * Get Stripe publishable key
   * Endpoint: GET /payment/stripe-config
   */
  static async getStripeConfig(req: Request, res: Response): Promise<void> {
    const publishableKey = StripeService.getPublishableKey()

    sendSuccess.ok(res, 'Stripe configuration retrieved', {
      publishableKey,
      currency: process.env.STRIPE_CURRENCY || 'usd'
    })
  }

  /**
   * Stripe webhook endpoint
   * Endpoint: POST /payment/stripe-webhook
   */
  static async stripeWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'] as string

    if (!signature) {
      throw new AppError('Missing Stripe signature', 400)
    }

    // Handle webhook with raw body
    const result = await StripeService.handleWebhook(req.body, signature)

    // Return 200 status for Stripe webhook
    res.status(200).json({
      received: true,
      message: result.message
    })
  }
}
