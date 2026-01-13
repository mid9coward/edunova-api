"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const cart_1 = require("../models/cart");
const course_1 = require("../models/course");
const enums_1 = require("../enums");
const errors_1 = require("../utils/errors");
class CartService {
    /**
     * Get user's cart
     */
    static async getCart(userId) {
        let cart = await cart_1.Cart.findOne({ userId }).populate({
            path: 'items.courseId',
            select: 'title price oldPrice image status',
            model: 'Course'
        });
        // Create cart if it doesn't exist
        if (!cart) {
            cart = new cart_1.Cart({
                userId,
                items: [],
                totalPrice: 0
            });
            await cart.save();
        }
        return cart;
    }
    /**
     * Add item to cart
     */
    static async addToCart(userId, input) {
        const { courseId } = input;
        // Validate course exists and is published
        const course = await course_1.Course.findById(courseId);
        if (!course) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        if (course.status !== enums_1.CourseStatus.PUBLISHED) {
            throw new errors_1.ValidationError('Course is not available for purchase', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        // Get or create cart
        let cart = await cart_1.Cart.findOne({ userId });
        if (!cart) {
            cart = new cart_1.Cart({
                userId,
                items: [],
                totalPrice: 0
            });
        }
        // Check if course is already in cart
        const existingItemIndex = cart.items.findIndex((item) => item.courseId.toString() === courseId);
        if (existingItemIndex !== -1) {
            throw new errors_1.ValidationError('Course is already in cart', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        // Prepare cart item
        const cartItem = {
            courseId: new mongoose_1.default.Types.ObjectId(courseId),
            title: course.title,
            price: course.price,
            oldPrice: course.oldPrice,
            thumbnail: course.image,
            addedAt: new Date()
        };
        // Add item to cart
        cart.items.push(cartItem);
        await cart.save();
        // Populate course details
        await cart.populate({
            path: 'items.courseId',
            select: 'title price oldPrice image status',
            model: 'Course'
        });
        return cart;
    }
    /**
     * Remove item from cart
     */
    static async removeFromCart(userId, courseId) {
        const cart = await cart_1.Cart.findOne({ userId });
        if (!cart) {
            throw new errors_1.NotFoundError('Cart not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        const itemIndex = cart.items.findIndex((item) => item.courseId.toString() === courseId);
        if (itemIndex === -1) {
            throw new errors_1.NotFoundError('Item not found in cart', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        cart.items.splice(itemIndex, 1);
        await cart.save();
        return cart;
    }
    /**
     * Update cart item (simplified - mainly for future extensibility)
     */
    static async updateCartItem(userId, input) {
        const { courseId } = input;
        const cart = await cart_1.Cart.findOne({ userId });
        if (!cart) {
            throw new errors_1.NotFoundError('Cart not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        const itemIndex = cart.items.findIndex((item) => item.courseId.toString() === courseId);
        if (itemIndex === -1) {
            throw new errors_1.NotFoundError('Item not found in cart', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        // Note: This method is kept for future extensibility
        // Currently, cart items are simple and don't need updates beyond add/remove
        await cart.save();
        // Populate course details
        await cart.populate({
            path: 'items.courseId',
            select: 'title price oldPrice image status',
            model: 'Course'
        });
        return cart;
    }
    /**
     * Clear entire cart
     */
    static async clearCart(userId) {
        const cart = await cart_1.Cart.findOne({ userId });
        if (!cart) {
            throw new errors_1.NotFoundError('Cart not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        cart.items = [];
        cart.totalPrice = 0;
        await cart.save();
        return cart;
    }
    /**
     * Get cart summary (items count and total price)
     */
    static async getCartSummary(userId) {
        const cart = await cart_1.Cart.findOne({ userId });
        if (!cart) {
            return {
                itemCount: 0,
                totalPrice: 0
            };
        }
        const totalPrice = cart.items.reduce((total, item) => total + item.price, 0);
        return {
            itemCount: cart.items.length,
            totalPrice
        };
    }
    /**
     * Validate cart before checkout
     */
    static async validateCart(userId) {
        const cart = await cart_1.Cart.findOne({ userId }).populate({
            path: 'items.courseId',
            select: 'title price oldPrice image status',
            model: 'Course'
        });
        if (!cart || cart.items.length === 0) {
            return {
                isValid: false,
                errors: ['Cart is empty'],
                cart: cart || new cart_1.Cart({ userId, items: [], totalPrice: 0 })
            };
        }
        const errors = [];
        // Check each course
        for (const item of cart.items) {
            const course = item.courseId;
            if (!course) {
                errors.push(`Course ${item.title} no longer exists`);
                continue;
            }
            if (course.status !== enums_1.CourseStatus.PUBLISHED) {
                errors.push(`Course ${item.title} is no longer available`);
            }
            if (course.price !== item.price) {
                errors.push(`Price for course ${item.title} has changed`);
            }
            if (course.oldPrice !== item.oldPrice) {
                errors.push(`Old price for course ${item.title} has changed`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
            cart
        };
    }
}
exports.CartService = CartService;
