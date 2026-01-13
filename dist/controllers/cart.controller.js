"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
const success_1 = require("../utils/success");
const errors_1 = require("../utils/errors");
class CartController {
    /**
     * Get user's cart
     */
    static async getCart(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const cart = await cart_service_1.CartService.getCart(userId);
        success_1.sendSuccess.ok(res, 'Cart retrieved successfully', cart);
    }
    /**
     * Add item to cart
     */
    static async addToCart(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const input = req.body;
        const cart = await cart_service_1.CartService.addToCart(userId, input);
        success_1.sendSuccess.created(res, 'Item added to cart successfully', { cart });
    }
    /**
     * Remove item from cart
     */
    static async removeFromCart(req, res) {
        const userId = req.user?.userId;
        const { courseId } = req.params;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const cart = await cart_service_1.CartService.removeFromCart(userId, courseId);
        success_1.sendSuccess.ok(res, 'Item removed from cart successfully', { cart });
    }
    /**
     * Update cart item
     */
    static async updateCartItem(req, res) {
        const userId = req.user?.userId;
        const { courseId } = req.params;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const input = {
            courseId,
            ...req.body
        };
        const cart = await cart_service_1.CartService.updateCartItem(userId, input);
        success_1.sendSuccess.ok(res, 'Cart item updated successfully', { cart });
    }
    /**
     * Clear entire cart
     */
    static async clearCart(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const cart = await cart_service_1.CartService.clearCart(userId);
        success_1.sendSuccess.ok(res, 'Cart cleared successfully', { cart });
    }
    /**
     * Get cart summary
     */
    static async getCartSummary(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const summary = await cart_service_1.CartService.getCartSummary(userId);
        success_1.sendSuccess.ok(res, 'Cart summary retrieved successfully', summary);
    }
    /**
     * Validate cart before checkout
     */
    static async validateCart(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const validation = await cart_service_1.CartService.validateCart(userId);
        success_1.sendSuccess.ok(res, 'Cart validation completed', validation);
    }
}
exports.CartController = CartController;
