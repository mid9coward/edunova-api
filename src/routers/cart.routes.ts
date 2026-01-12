import { Router } from 'express'
import { CartController } from '../controllers/cart.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { addToCartSchema, removeFromCartSchema, updateCartItemSchema } from '../schemas/cart.schema'

const router = Router()

// All cart routes require authentication
router.use(authMiddleware)

// Get user's cart
router.get('/', asyncHandler(CartController.getCart))

// Get cart summary (item count and total price)
router.get('/summary', asyncHandler(CartController.getCartSummary))

// Validate cart before checkout
router.get('/validate', asyncHandler(CartController.validateCart))

// Add item to cart
router.post('/add', validate(addToCartSchema), asyncHandler(CartController.addToCart))

// Update cart item (reserved for future extensibility)
router.put('/items/:courseId', validate(updateCartItemSchema), asyncHandler(CartController.updateCartItem))

// Remove item from cart
router.delete('/items/:courseId', validate(removeFromCartSchema), asyncHandler(CartController.removeFromCart))

// Clear entire cart
router.delete('/clear', asyncHandler(CartController.clearCart))

export default router
