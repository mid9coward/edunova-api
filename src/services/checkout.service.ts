import { CartService } from './cart.service'
import { OrderService } from './order.service'
import { IOrder } from '../models/order'
import { Coupon } from '../models/coupon'
import { AppError } from '../utils/errors'
import { PaymentMethod } from '../enums'

export interface CheckoutInput {
  couponCode?: string
  paymentMethod: PaymentMethod
}

export interface CheckoutSummary {
  items: Array<{
    courseId: string
    title: string
    price: number
    thumbnail?: string
  }>
  subTotal: number
  totalDiscount: number
  totalAmount: number
  couponCode?: string
  appliedCouponDetails?: {
    code: string
    discountAmount: number
    discountType: 'percent' | 'fixed'
    discountValue: number
  }
}

/**
 * Checkout Service
 * Handles cart to order conversion and coupon application
 */
export class CheckoutService {
  /**
   * Preview checkout (calculate totals with coupon)
   */
  static async previewCheckout(userId: string, couponCode?: string): Promise<CheckoutSummary> {
    // Validate cart
    const { cart, isValid, errors } = await CartService.validateCart(userId)

    if (!isValid) {
      throw new AppError(`Cart validation failed: ${errors.join(', ')}`, 400)
    }

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400)
    }

    // Calculate subtotal
    const subTotal = cart.items.reduce((total, item) => total + item.price, 0)

    let totalDiscount = 0
    let appliedCouponDetails = undefined

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
      })

      if (!coupon) {
        throw new AppError('Invalid or expired coupon code', 400)
      }

      // Check if coupon is applicable to cart items
      if (coupon.courseIds.length > 0) {
        // Course-specific coupon - check if any cart items match
        const cartCourseIds = cart.items.map((item) => item.courseId.toString())
        const hasApplicableCourses = coupon.courseIds.some((courseId) => cartCourseIds.includes(courseId.toString()))

        if (!hasApplicableCourses) {
          throw new AppError('Coupon is not applicable to any courses in your cart', 400)
        }
      }

      // Calculate discount
      if (coupon.discountType === 'percent') {
        totalDiscount = Math.round((subTotal * coupon.discountValue) / 100)
      } else {
        totalDiscount = Math.min(coupon.discountValue, subTotal)
      }

      appliedCouponDetails = {
        code: coupon.code,
        discountAmount: totalDiscount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    }

    const totalAmount = Math.max(0, subTotal - totalDiscount)

    return {
      items: cart.items.map((item) => ({
        courseId: item.courseId.toString(),
        title: item.title,
        price: item.price,
        oldPrice: item.oldPrice,
        thumbnail: item.thumbnail
      })),
      subTotal,
      totalDiscount,
      totalAmount,
      couponCode: couponCode?.toUpperCase(),
      appliedCouponDetails
    }
  }

  /**
   * Process checkout (create order from cart)
   */
  static async processCheckout(userId: string, checkoutData: CheckoutInput): Promise<IOrder> {
    // Get user's cart
    const cart = await CartService.getCart(userId)

    if (cart.items.length === 0) {
      throw new AppError('Cart is empty', 400)
    }

    // Extract course IDs from cart
    const courseIds = cart.items.map((item) => item.courseId.toString())

    // Create order using the unified createOrder method
    const order = await OrderService.createOrder(userId, {
      courseIds,
      paymentMethod: checkoutData.paymentMethod,
      couponCode: checkoutData.couponCode
    })

    // Clear the cart after successful order creation
    await CartService.clearCart(userId)

    return order
  }

  /**
   * Validate checkout data
   */
  static async validateCheckout(
    userId: string,
    checkoutData: CheckoutInput
  ): Promise<{
    isValid: boolean
    errors: string[]
    preview?: CheckoutSummary
  }> {
    try {
      const preview = await this.previewCheckout(userId, checkoutData.couponCode)
      return {
        isValid: true,
        errors: [],
        preview
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof AppError ? error.message : 'Checkout validation failed']
      }
    }
  }
}
