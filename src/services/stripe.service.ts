import Stripe from 'stripe'
import stripe, { STRIPE_WEBHOOK_SECRET, STRIPE_CURRENCY } from '../configs/stripe'
import { Order } from '../models/order'
import { OrderService } from './order.service'
import { AppError } from '../utils/errors'
import { IOrder } from '../models/order'
import { OrderStatus } from '../enums'

/**
 * Stripe Payment Service
 * Handles Stripe payment processing using Payment Intents API
 */

export interface StripePaymentIntent {
  clientSecret: string
  paymentIntentId: string
}

export interface StripeWebhookResult {
  success: boolean
  message: string
  order?: {
    code: string
    status: string
    totalAmount: number
    stripePaymentIntentId?: string
  }
}

export class StripeService {
  /**
   * Helper method to convert amount based on currency
   */
  private static convertAmountForStripe(amount: number, currency: string): number {
    return currency === 'vnd' ? Math.round(amount) : Math.round(amount * 100)
  }

  /**
   * Helper method to convert amount from Stripe format to display format
   */
  private static convertAmountFromStripe(amount: number, currency: string): number {
    return currency === 'vnd' ? amount : amount / 100
  }

  /**
   * Create a payment intent for order payment
   */
  static async createPaymentIntent(
    orderId: string,
    userId?: string,
    currency?: string
  ): Promise<StripePaymentIntent & { orderCode: string; totalAmount: number; currency: string }> {
    // Find the order by ID
    const order = await Order.findById(orderId)
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Verify order belongs to user (if user is authenticated)
    if (userId && order.userId.toString() !== userId.toString()) {
      throw new AppError('Access denied', 403)
    }

    // Validate order
    if (order.status !== 'pending') {
      throw new AppError('Order must be in pending status to create payment intent', 400)
    }

    if (order.paymentMethod !== 'stripe') {
      throw new AppError('Order payment method must be Stripe', 400)
    }

    // Use provided currency or default to configured currency
    const paymentCurrency = currency || STRIPE_CURRENCY

    // Convert amount based on currency
    const stripeAmount = this.convertAmountForStripe(order.totalAmount, paymentCurrency)

    try {
      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: paymentCurrency,
        metadata: {
          orderId: order._id.toString(),
          orderCode: order.code,
          userId: order.userId.toString(),
          couponCode: order.couponCode || '',
          itemsCount: order.items.length.toString(),
          currency: paymentCurrency
        },
        automatic_payment_methods: {
          enabled: true
        },
        description: `Payment for order ${order.code}`
      })

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        orderCode: order.code,
        totalAmount: order.totalAmount,
        currency: paymentCurrency
      }
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Failed to create payment intent: ${error.message}`, 500)
      }
      throw error
    }
  }

  /**
   * Retrieve and confirm a payment intent, update order status if successful
   */
  static async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // If payment succeeded, update the order status
    if (paymentIntent.status === 'succeeded') {
      const orderId = paymentIntent.metadata?.orderId
      const orderCode = paymentIntent.metadata?.orderCode

      if (orderId || orderCode) {
        // Find order
        let order: IOrder | null = null
        if (orderId) {
          order = await Order.findById(orderId)
        } else if (orderCode) {
          order = await Order.findOne({ code: orderCode })
        }

        if (order && order.status === 'pending') {
          // Validate payment amount
          const paidAmount = this.convertAmountFromStripe(paymentIntent.amount, paymentIntent.currency)

          if (paidAmount >= order.totalAmount) {
            // Update order status and enroll courses
            await OrderService.updateOrderStatus(order._id.toString(), {
              status: OrderStatus.COMPLETED
            })
          }
        }
      }
    }

    return paymentIntent
  }
  /**
   * Handle Stripe webhook events
   */
  static async handleWebhook(payload: string | Buffer, signature: string): Promise<StripeWebhookResult> {
    if (!STRIPE_WEBHOOK_SECRET) {
      throw new AppError('Stripe webhook secret not configured', 500)
    }

    let event: Stripe.Event

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
    } catch (error) {
      throw new AppError(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        400
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        return await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)

      case 'payment_intent.payment_failed':
        return await this.handlePaymentIntentFailed()

      case 'payment_intent.canceled':
        return await this.handlePaymentIntentCanceled()

      default:
        return {
          success: true,
          message: `Ignored event type: ${event.type}`
        }
    }
  }

  /**
   * Handle successful payment intent
   */
  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<StripeWebhookResult> {
    const orderId = paymentIntent.metadata?.orderId
    const orderCode = paymentIntent.metadata?.orderCode

    if (!orderId && !orderCode) {
      throw new AppError('No order reference found in payment intent metadata', 400)
    }

    // Find order
    let order: IOrder | null = null
    if (orderId) {
      order = await Order.findById(orderId)
    } else if (orderCode) {
      order = await Order.findOne({ code: orderCode })
    }

    if (!order) {
      throw new AppError(`Order not found for payment intent ${paymentIntent.id}`, 404)
    }

    // Check if order is already completed
    if (order.status === 'completed') {
      return {
        success: true,
        message: 'Order already completed',
        order: {
          code: order.code,
          status: order.status,
          totalAmount: order.totalAmount,
          stripePaymentIntentId: paymentIntent.id
        }
      }
    }

    // Validate payment amount
    const paidAmount = this.convertAmountFromStripe(paymentIntent.amount, paymentIntent.currency)

    if (paidAmount < order.totalAmount) {
      throw new AppError(`Payment amount (${paidAmount}) is less than order total (${order.totalAmount})`, 400)
    }

    // Update order status and enroll courses
    const updatedOrder = await OrderService.updateOrderStatus(order._id.toString(), {
      status: OrderStatus.COMPLETED
    })

    return {
      success: true,
      message: 'Order completed successfully and courses enrolled',
      order: {
        code: updatedOrder.code,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        stripePaymentIntentId: paymentIntent.id
      }
    }
  }

  /**
   * Handle failed payment intent
   */
  private static async handlePaymentIntentFailed(): Promise<StripeWebhookResult> {
    return {
      success: true,
      message: 'Payment intent failed - no action required'
    }
  }

  /**
   * Handle canceled payment intent
   */
  private static async handlePaymentIntentCanceled(): Promise<StripeWebhookResult> {
    return {
      success: true,
      message: 'Payment intent canceled - no action required'
    }
  }

  /**
   * Create a refund for a payment
   */
  static async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ): Promise<Stripe.Refund> {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer'
    }

    if (amount) {
      // Get the payment intent to determine currency
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      refundParams.amount = this.convertAmountForStripe(amount, paymentIntent.currency)
    }

    try {
      return await stripe.refunds.create(refundParams)
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        throw new AppError(`Failed to create refund: ${error.message}`, 400)
      }
      throw error
    }
  }

  /**
   * Get Stripe publishable key for frontend
   */
  static getPublishableKey(): string {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      throw new AppError('Stripe publishable key not configured', 500)
    }
    return process.env.STRIPE_PUBLISHABLE_KEY
  }
}
