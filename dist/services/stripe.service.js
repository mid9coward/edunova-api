"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const stripe_2 = __importStar(require("../configs/stripe"));
const order_1 = require("../models/order");
const order_service_1 = require("./order.service");
const errors_1 = require("../utils/errors");
const enums_1 = require("../enums");
class StripeService {
    /**
     * Helper method to convert amount based on currency
     */
    static convertAmountForStripe(amount, currency) {
        return currency === 'vnd' ? Math.round(amount) : Math.round(amount * 100);
    }
    /**
     * Helper method to convert amount from Stripe format to display format
     */
    static convertAmountFromStripe(amount, currency) {
        return currency === 'vnd' ? amount : amount / 100;
    }
    /**
     * Create a payment intent for order payment
     */
    static async createPaymentIntent(orderId, userId, currency) {
        // Find the order by ID
        const order = await order_1.Order.findById(orderId);
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        // Verify order belongs to user (if user is authenticated)
        if (userId && order.userId.toString() !== userId.toString()) {
            throw new errors_1.AppError('Access denied', 403);
        }
        // Validate order
        if (order.status !== 'pending') {
            throw new errors_1.AppError('Order must be in pending status to create payment intent', 400);
        }
        if (order.paymentMethod !== 'stripe') {
            throw new errors_1.AppError('Order payment method must be Stripe', 400);
        }
        // Use provided currency or default to configured currency
        const paymentCurrency = currency || stripe_2.STRIPE_CURRENCY;
        // Convert amount based on currency
        const stripeAmount = this.convertAmountForStripe(order.totalAmount, paymentCurrency);
        try {
            // Create payment intent
            const paymentIntent = await stripe_2.default.paymentIntents.create({
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
            });
            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                orderCode: order.code,
                totalAmount: order.totalAmount,
                currency: paymentCurrency
            };
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeError) {
                throw new errors_1.AppError(`Failed to create payment intent: ${error.message}`, 500);
            }
            throw error;
        }
    }
    /**
     * Retrieve and confirm a payment intent, update order status if successful
     */
    static async confirmPaymentIntent(paymentIntentId) {
        const paymentIntent = await stripe_2.default.paymentIntents.retrieve(paymentIntentId);
        // If payment succeeded, update the order status
        if (paymentIntent.status === 'succeeded') {
            const orderId = paymentIntent.metadata?.orderId;
            const orderCode = paymentIntent.metadata?.orderCode;
            if (orderId || orderCode) {
                // Find order
                let order = null;
                if (orderId) {
                    order = await order_1.Order.findById(orderId);
                }
                else if (orderCode) {
                    order = await order_1.Order.findOne({ code: orderCode });
                }
                if (order && order.status === 'pending') {
                    // Validate payment amount
                    const paidAmount = this.convertAmountFromStripe(paymentIntent.amount, paymentIntent.currency);
                    if (paidAmount >= order.totalAmount) {
                        // Update order status and enroll courses
                        await order_service_1.OrderService.updateOrderStatus(order._id.toString(), {
                            status: enums_1.OrderStatus.COMPLETED
                        });
                    }
                }
            }
        }
        return paymentIntent;
    }
    /**
     * Handle Stripe webhook events
     */
    static async handleWebhook(payload, signature) {
        if (!stripe_2.STRIPE_WEBHOOK_SECRET) {
            throw new errors_1.AppError('Stripe webhook secret not configured', 500);
        }
        let event;
        try {
            // Verify webhook signature
            event = stripe_2.default.webhooks.constructEvent(payload, signature, stripe_2.STRIPE_WEBHOOK_SECRET);
        }
        catch (error) {
            throw new errors_1.AppError(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
        }
        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                return await this.handlePaymentIntentSucceeded(event.data.object);
            case 'payment_intent.payment_failed':
                return await this.handlePaymentIntentFailed();
            case 'payment_intent.canceled':
                return await this.handlePaymentIntentCanceled();
            default:
                return {
                    success: true,
                    message: `Ignored event type: ${event.type}`
                };
        }
    }
    /**
     * Handle successful payment intent
     */
    static async handlePaymentIntentSucceeded(paymentIntent) {
        const orderId = paymentIntent.metadata?.orderId;
        const orderCode = paymentIntent.metadata?.orderCode;
        if (!orderId && !orderCode) {
            throw new errors_1.AppError('No order reference found in payment intent metadata', 400);
        }
        // Find order
        let order = null;
        if (orderId) {
            order = await order_1.Order.findById(orderId);
        }
        else if (orderCode) {
            order = await order_1.Order.findOne({ code: orderCode });
        }
        if (!order) {
            throw new errors_1.AppError(`Order not found for payment intent ${paymentIntent.id}`, 404);
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
            };
        }
        // Validate payment amount
        const paidAmount = this.convertAmountFromStripe(paymentIntent.amount, paymentIntent.currency);
        if (paidAmount < order.totalAmount) {
            throw new errors_1.AppError(`Payment amount (${paidAmount}) is less than order total (${order.totalAmount})`, 400);
        }
        // Update order status and enroll courses
        const updatedOrder = await order_service_1.OrderService.updateOrderStatus(order._id.toString(), {
            status: enums_1.OrderStatus.COMPLETED
        });
        return {
            success: true,
            message: 'Order completed successfully and courses enrolled',
            order: {
                code: updatedOrder.code,
                status: updatedOrder.status,
                totalAmount: updatedOrder.totalAmount,
                stripePaymentIntentId: paymentIntent.id
            }
        };
    }
    /**
     * Handle failed payment intent
     */
    static async handlePaymentIntentFailed() {
        return {
            success: true,
            message: 'Payment intent failed - no action required'
        };
    }
    /**
     * Handle canceled payment intent
     */
    static async handlePaymentIntentCanceled() {
        return {
            success: true,
            message: 'Payment intent canceled - no action required'
        };
    }
    /**
     * Create a refund for a payment
     */
    static async createRefund(paymentIntentId, amount, reason) {
        const refundParams = {
            payment_intent: paymentIntentId,
            reason: reason || 'requested_by_customer'
        };
        if (amount) {
            // Get the payment intent to determine currency
            const paymentIntent = await stripe_2.default.paymentIntents.retrieve(paymentIntentId);
            refundParams.amount = this.convertAmountForStripe(amount, paymentIntent.currency);
        }
        try {
            return await stripe_2.default.refunds.create(refundParams);
        }
        catch (error) {
            if (error instanceof stripe_1.default.errors.StripeError) {
                throw new errors_1.AppError(`Failed to create refund: ${error.message}`, 400);
            }
            throw error;
        }
    }
    /**
     * Get Stripe publishable key for frontend
     */
    static getPublishableKey() {
        if (!process.env.STRIPE_PUBLISHABLE_KEY) {
            throw new errors_1.AppError('Stripe publishable key not configured', 500);
        }
        return process.env.STRIPE_PUBLISHABLE_KEY;
    }
}
exports.StripeService = StripeService;
