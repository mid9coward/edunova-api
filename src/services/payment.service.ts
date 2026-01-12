import { Order } from '../models/order'
import { OrderService } from './order.service'
import { AppError } from '../utils/errors'
import { SepayWebhookInput } from '../schemas/payment.schema'
import { OrderStatus } from '../enums'

/**
 * Payment Processing Service
 * Handles webhook callbacks from payment gateways
 */

export interface SepayWebhookResult {
  success: boolean
  message: string
  order?: {
    code: string
    status: string
    totalAmount: number
    sepayTransactionId: number
  }
}

// Export type for controller use
export type SepayWebhookData = SepayWebhookInput

export class PaymentService {
  /**
   * Process SePay webhook callback
   */
  static async handleSepayWebhook(webhookData: SepayWebhookInput): Promise<SepayWebhookResult> {
    // Only process incoming transactions (payments)
    if (webhookData.transferType !== 'in') {
      throw new AppError('Not an incoming transaction', 400)
    }

    // Extract order code from payment content or code field
    const orderCode = this.extractOrderCode(webhookData)
    if (!orderCode) {
      throw new AppError('No order code found in transaction', 400)
    }

    // Find order by code
    const order = await Order.findOne({ code: orderCode })
    if (!order) {
      throw new AppError(`Order ${orderCode} not found`, 404)
    }

    // Check order status
    if (order.status === OrderStatus.COMPLETED) {
      throw new AppError('Order already completed', 400)
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError('Order is cancelled', 400)
    }

    // Validate payment amount
    if (webhookData.transferAmount < order.totalAmount) {
      throw new AppError(
        `Payment amount (${webhookData.transferAmount}) is less than order total (${order.totalAmount})`,
        400
      )
    }

    // Update order status to completed and automatically enroll courses
    const updatedOrder = await OrderService.updateOrderStatus(order._id.toString(), { status: OrderStatus.COMPLETED })

    // Log payment information
    console.log('SePay Payment Processed:', {
      orderCode: updatedOrder.code,
      sepayTransactionId: webhookData.id,
      amount: webhookData.transferAmount,
      gateway: webhookData.gateway,
      userId: updatedOrder.userId,
      coursesCount: updatedOrder.items.length
    })

    return {
      success: true,
      message: 'Order updated successfully and courses enrolled',
      order: {
        code: updatedOrder.code,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        sepayTransactionId: webhookData.id
      }
    }
  }

  /**
   * Extract order code from webhook data
   */
  private static extractOrderCode(webhookData: SepayWebhookInput): string | null {
    // Try from code field first (if configured to receive code)
    if (webhookData.code) {
      return webhookData.code
    }

    // Try to find from transfer content
    const description = webhookData.description || webhookData.content || ''

    // Find pattern: ORDYYYYMMDDXXXX (12 digits after ORD)
    const orderCodeMatch = description.match(/ORD\d{12}/i)
    if (orderCodeMatch) {
      return orderCodeMatch[0].toUpperCase()
    }

    return null
  }

  /**
   * Validate SePay webhook API key
   */
  static validateSepayWebhook(apiKey: string): boolean {
    const expectedApiKey = process.env.SEPAY_API_KEY

    if (!expectedApiKey) {
      console.warn('SEPAY_API_KEY not configured')
      return true // Allow if API key is not configured
    }

    return apiKey === expectedApiKey
  }
}
