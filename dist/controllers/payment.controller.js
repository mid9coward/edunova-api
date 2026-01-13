"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const stripe_service_1 = require("../services/stripe.service");
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
/**
 * Payment Controller
 * Handles webhook callbacks and payment operations for payment gateways
 */
class PaymentController {
    /**
     * SePay webhook callback endpoint
     * Endpoint: POST /payment/sepay-callback
     */
    static async sepayCallback(req, res) {
        // Extract API key from Authorization header
        const authHeader = req.headers.authorization;
        const apiKey = authHeader?.replace('Apikey ', '') || '';
        // Validate API key
        if (!payment_service_1.PaymentService.validateSepayWebhook(apiKey)) {
            throw new errors_1.AppError('Invalid API key', 401);
        }
        // Get webhook data from request body
        const webhookData = req.body;
        try {
            // Process webhook
            const result = await payment_service_1.PaymentService.handleSepayWebhook(webhookData);
            // Return success response in SePay required format
            res.status(200).json({
                success: result.success,
                message: result.message,
                data: result.order
            });
        }
        catch (error) {
            // Handle business logic errors gracefully for SePay
            if (error instanceof errors_1.AppError) {
                // Return success response for ignored cases (SePay expects this)
                res.status(200).json({
                    success: true,
                    message: `Ignored: ${error.message}`
                });
            }
            else {
                // Re-throw unexpected errors
                throw error;
            }
        }
    }
    /**
     * Create Stripe payment intent
     * Endpoint: POST /payment/create-payment-intent
     */
    static async createPaymentIntent(req, res) {
        const { orderId, currency } = req.body;
        const userId = req.user?.userId;
        if (!orderId) {
            throw new errors_1.AppError('Order ID is required', 400);
        }
        // Create payment intent using service with order ID
        const result = await stripe_service_1.StripeService.createPaymentIntent(orderId, userId, currency);
        success_1.sendSuccess.created(res, 'Payment intent created successfully', result);
    }
    /**
     * Confirm Stripe payment
     * Endpoint: POST /payment/confirm-payment
     */
    static async confirmPayment(req, res) {
        const { paymentIntentId } = req.body;
        if (!paymentIntentId) {
            throw new errors_1.AppError('Payment intent ID is required', 400);
        }
        // Retrieve payment intent details
        const paymentIntent = await stripe_service_1.StripeService.confirmPaymentIntent(paymentIntentId);
        const responseAmount = process.env.STRIPE_CURRENCY === 'vnd' ? paymentIntent.amount : paymentIntent.amount / 100;
        success_1.sendSuccess.ok(res, 'Payment confirmed successfully', {
            paymentIntent: {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: responseAmount,
                currency: paymentIntent.currency
            }
        });
    }
    /**
     * Get Stripe publishable key
     * Endpoint: GET /payment/stripe-config
     */
    static async getStripeConfig(req, res) {
        const publishableKey = stripe_service_1.StripeService.getPublishableKey();
        success_1.sendSuccess.ok(res, 'Stripe configuration retrieved', {
            publishableKey,
            currency: process.env.STRIPE_CURRENCY || 'usd'
        });
    }
    /**
     * Stripe webhook endpoint
     * Endpoint: POST /payment/stripe-webhook
     */
    static async stripeWebhook(req, res) {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            throw new errors_1.AppError('Missing Stripe signature', 400);
        }
        // Handle webhook with raw body
        const result = await stripe_service_1.StripeService.handleWebhook(req.body, signature);
        // Return 200 status for Stripe webhook
        res.status(200).json({
            received: true,
            message: result.message
        });
    }
}
exports.PaymentController = PaymentController;
