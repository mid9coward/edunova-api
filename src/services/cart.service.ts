import mongoose from 'mongoose'
import { Cart, ICart, ICartItem } from '../models/cart'
import { Course, ICourse } from '../models/course'
import { CourseStatus } from '../enums'
import { ValidationError, NotFoundError, ErrorCodes } from '../utils/errors'

export interface AddToCartInput {
  courseId: string
}

export interface UpdateCartItemInput {
  courseId: string
}

export class CartService {
  /**
   * Get user's cart
   */
  static async getCart(userId: string): Promise<ICart> {
    let cart = await Cart.findOne({ userId }).populate({
      path: 'items.courseId',
      select: 'title price oldPrice image status',
      model: 'Course'
    })

    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        totalPrice: 0
      })
      await cart.save()
    }

    return cart
  }

  /**
   * Add item to cart
   */
  static async addToCart(userId: string, input: AddToCartInput): Promise<ICart> {
    const { courseId } = input

    // Validate course exists and is published
    const course = await Course.findById(courseId)
    if (!course) {
      throw new NotFoundError('Course not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ValidationError('Course is not available for purchase', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId })
    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
        totalPrice: 0
      })
    }

    // Check if course is already in cart
    const existingItemIndex = cart.items.findIndex((item) => item.courseId.toString() === courseId)

    if (existingItemIndex !== -1) {
      throw new ValidationError('Course is already in cart', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Prepare cart item
    const cartItem: ICartItem = {
      courseId: new mongoose.Types.ObjectId(courseId),
      title: course.title,
      price: course.price,
      oldPrice: course.oldPrice,
      thumbnail: course.image,
      addedAt: new Date()
    }

    // Add item to cart
    cart.items.push(cartItem)
    await cart.save()

    // Populate course details
    await cart.populate({
      path: 'items.courseId',
      select: 'title price oldPrice image status',
      model: 'Course'
    })

    return cart
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(userId: string, courseId: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId })
    if (!cart) {
      throw new NotFoundError('Cart not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    const itemIndex = cart.items.findIndex((item) => item.courseId.toString() === courseId)

    if (itemIndex === -1) {
      throw new NotFoundError('Item not found in cart', ErrorCodes.LESSON_NOT_FOUND)
    }

    cart.items.splice(itemIndex, 1)
    await cart.save()

    return cart
  }

  /**
   * Update cart item (simplified - mainly for future extensibility)
   */
  static async updateCartItem(userId: string, input: UpdateCartItemInput): Promise<ICart> {
    const { courseId } = input

    const cart = await Cart.findOne({ userId })
    if (!cart) {
      throw new NotFoundError('Cart not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    const itemIndex = cart.items.findIndex((item) => item.courseId.toString() === courseId)

    if (itemIndex === -1) {
      throw new NotFoundError('Item not found in cart', ErrorCodes.LESSON_NOT_FOUND)
    }

    // Note: This method is kept for future extensibility
    // Currently, cart items are simple and don't need updates beyond add/remove
    await cart.save()

    // Populate course details
    await cart.populate({
      path: 'items.courseId',
      select: 'title price oldPrice image status',
      model: 'Course'
    })

    return cart
  }

  /**
   * Clear entire cart
   */
  static async clearCart(userId: string): Promise<ICart> {
    const cart = await Cart.findOne({ userId })
    if (!cart) {
      throw new NotFoundError('Cart not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    cart.items = []
    cart.totalPrice = 0
    await cart.save()

    return cart
  }

  /**
   * Get cart summary (items count and total price)
   */
  static async getCartSummary(userId: string): Promise<{
    itemCount: number
    totalPrice: number
  }> {
    const cart = await Cart.findOne({ userId })
    if (!cart) {
      return {
        itemCount: 0,
        totalPrice: 0
      }
    }

    const totalPrice = cart.items.reduce((total, item) => total + item.price, 0)

    return {
      itemCount: cart.items.length,
      totalPrice
    }
  }

  /**
   * Validate cart before checkout
   */
  static async validateCart(userId: string): Promise<{
    isValid: boolean
    errors: string[]
    cart: ICart
  }> {
    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.courseId',
      select: 'title price oldPrice image status',
      model: 'Course'
    })

    if (!cart || cart.items.length === 0) {
      return {
        isValid: false,
        errors: ['Cart is empty'],
        cart: cart || new Cart({ userId, items: [], totalPrice: 0 })
      }
    }

    const errors: string[] = []

    // Check each course
    for (const item of cart.items) {
      const course = item.courseId as unknown as ICourse

      if (!course) {
        errors.push(`Course ${item.title} no longer exists`)
        continue
      }

      if (course.status !== CourseStatus.PUBLISHED) {
        errors.push(`Course ${item.title} is no longer available`)
      }

      if (course.price !== item.price) {
        errors.push(`Price for course ${item.title} has changed`)
      }

      if (course.oldPrice !== item.oldPrice) {
        errors.push(`Old price for course ${item.title} has changed`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      cart
    }
  }
}
