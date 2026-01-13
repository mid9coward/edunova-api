"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
const cart_service_1 = require("./cart.service");
const order_service_1 = require("./order.service");
const coupon_1 = require("../models/coupon");
const errors_1 = require("../utils/errors");
/**
 * Checkout Service
 * Handles cart to order conversion and coupon application
 */
class CheckoutService {
    /**
     * Preview checkout (calculate totals with coupon)
     */
    static async previewCheckout(userId, couponCode) {
        // Validate cart
        const { cart, isValid, errors } = await cart_service_1.CartService.validateCart(userId);
        if (!isValid) {
            throw new errors_1.AppError(`Cart validation failed: ${errors.join(', ')}`, 400);
        }
        if (cart.items.length === 0) {
            throw new errors_1.AppError('Cart is empty', 400);
        }
        // Calculate subtotal
        const subTotal = cart.items.reduce((total, item) => total + item.price, 0);
        let totalDiscount = 0;
        let appliedCouponDetails = undefined;
        // Apply coupon if provided
        if (couponCode) {
            const coupon = await coupon_1.Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
            });
            if (!coupon) {
                throw new errors_1.AppError('Invalid or expired coupon code', 400);
            }
            // Check if coupon is applicable to cart items
            if (coupon.courseIds.length > 0) {
                // Course-specific coupon - check if any cart items match
                const cartCourseIds = cart.items.map((item) => item.courseId.toString());
                const hasApplicableCourses = coupon.courseIds.some((courseId) => cartCourseIds.includes(courseId.toString()));
                if (!hasApplicableCourses) {
                    throw new errors_1.AppError('Coupon is not applicable to any courses in your cart', 400);
                }
            }
            // Calculate discount
            if (coupon.discountType === 'percent') {
                totalDiscount = Math.round((subTotal * coupon.discountValue) / 100);
            }
            else {
                totalDiscount = Math.min(coupon.discountValue, subTotal);
            }
            appliedCouponDetails = {
                code: coupon.code,
                discountAmount: totalDiscount,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue
            };
        }
        const totalAmount = Math.max(0, subTotal - totalDiscount);
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
        };
    }
    /**
     * Process checkout (create order from cart)
     */
    static async processCheckout(userId, checkoutData) {
        // Get user's cart
        const cart = await cart_service_1.CartService.getCart(userId);
        if (cart.items.length === 0) {
            throw new errors_1.AppError('Cart is empty', 400);
        }
        // Extract course IDs from cart
        const courseIds = cart.items.map((item) => item.courseId.toString());
        // Create order using the unified createOrder method
        const order = await order_service_1.OrderService.createOrder(userId, {
            courseIds,
            paymentMethod: checkoutData.paymentMethod,
            couponCode: checkoutData.couponCode
        });
        // Clear the cart after successful order creation
        await cart_service_1.CartService.clearCart(userId);
        return order;
    }
    /**
     * Validate checkout data
     */
    static async validateCheckout(userId, checkoutData) {
        try {
            const preview = await this.previewCheckout(userId, checkoutData.couponCode);
            return {
                isValid: true,
                errors: [],
                preview
            };
        }
        catch (error) {
            return {
                isValid: false,
                errors: [error instanceof errors_1.AppError ? error.message : 'Checkout validation failed']
            };
        }
    }
}
exports.CheckoutService = CheckoutService;
