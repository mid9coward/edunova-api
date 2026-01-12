import { Request, Response } from 'express'
import { CartService, AddToCartInput, UpdateCartItemInput } from '../services/cart.service'
import { sendSuccess } from '../utils/success'
import { ValidationError } from '../utils/errors'

export class CartController {
  /**
   * Get user's cart
   */
  static async getCart(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const cart = await CartService.getCart(userId)

    sendSuccess.ok(res, 'Cart retrieved successfully', cart)
  }

  /**
   * Add item to cart
   */
  static async addToCart(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const input: AddToCartInput = req.body

    const cart = await CartService.addToCart(userId, input)

    sendSuccess.created(res, 'Item added to cart successfully', { cart })
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    const { courseId } = req.params

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const cart = await CartService.removeFromCart(userId, courseId)

    sendSuccess.ok(res, 'Item removed from cart successfully', { cart })
  }

  /**
   * Update cart item
   */
  static async updateCartItem(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    const { courseId } = req.params

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const input: UpdateCartItemInput = {
      courseId,
      ...req.body
    }

    const cart = await CartService.updateCartItem(userId, input)

    sendSuccess.ok(res, 'Cart item updated successfully', { cart })
  }

  /**
   * Clear entire cart
   */
  static async clearCart(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const cart = await CartService.clearCart(userId)

    sendSuccess.ok(res, 'Cart cleared successfully', { cart })
  }

  /**
   * Get cart summary
   */
  static async getCartSummary(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const summary = await CartService.getCartSummary(userId)

    sendSuccess.ok(res, 'Cart summary retrieved successfully', summary)
  }

  /**
   * Validate cart before checkout
   */
  static async validateCart(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const validation = await CartService.validateCart(userId)

    sendSuccess.ok(res, 'Cart validation completed', validation)
  }
}
