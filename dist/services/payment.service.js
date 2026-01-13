"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const order_1 = require("../models/order");
const order_service_1 = require("./order.service");
const errors_1 = require("../utils/errors");
const enums_1 = require("../enums");
class PaymentService {
    /**
     * Process SePay webhook callback
     */
    static async handleSepayWebhook(webhookData) {
        // Only process incoming transactions (payments)
        if (webhookData.transferType !== 'in') {
            throw new errors_1.AppError('Not an incoming transaction', 400);
        }
        // Extract order code from payment content or code field
        const orderCode = this.extractOrderCode(webhookData);
        if (!orderCode) {
            throw new errors_1.AppError('No order code found in transaction', 400);
        }
        // Find order by code
        const order = await order_1.Order.findOne({ code: orderCode });
        if (!order) {
            throw new errors_1.AppError(`Order ${orderCode} not found`, 404);
        }
        // Check order status
        if (order.status === enums_1.OrderStatus.COMPLETED) {
            throw new errors_1.AppError('Order already completed', 400);
        }
        if (order.status === enums_1.OrderStatus.CANCELLED) {
            throw new errors_1.AppError('Order is cancelled', 400);
        }
        // Validate payment amount
        if (webhookData.transferAmount < order.totalAmount) {
            throw new errors_1.AppError(`Payment amount (${webhookData.transferAmount}) is less than order total (${order.totalAmount})`, 400);
        }
        // Update order status to completed and automatically enroll courses
        const updatedOrder = await order_service_1.OrderService.updateOrderStatus(order._id.toString(), { status: enums_1.OrderStatus.COMPLETED });
        // Log payment information
        console.log('SePay Payment Processed:', {
            orderCode: updatedOrder.code,
            sepayTransactionId: webhookData.id,
            amount: webhookData.transferAmount,
            gateway: webhookData.gateway,
            userId: updatedOrder.userId,
            coursesCount: updatedOrder.items.length
        });
        return {
            success: true,
            message: 'Order updated successfully and courses enrolled',
            order: {
                code: updatedOrder.code,
                status: updatedOrder.status,
                totalAmount: updatedOrder.totalAmount,
                sepayTransactionId: webhookData.id
            }
        };
    }
    /**
     * Extract order code from webhook data
     */
    static extractOrderCode(webhookData) {
        // Try from code field first (if configured to receive code)
        if (webhookData.code) {
            return webhookData.code;
        }
        // Try to find from transfer content
        const description = webhookData.description || webhookData.content || '';
        // Find pattern: ORDYYYYMMDDXXXX (12 digits after ORD)
        const orderCodeMatch = description.match(/ORD\d{12}/i);
        if (orderCodeMatch) {
            return orderCodeMatch[0].toUpperCase();
        }
        return null;
    }
    /**
     * Validate SePay webhook API key
     */
    static validateSepayWebhook(apiKey) {
        const expectedApiKey = process.env.SEPAY_API_KEY;
        if (!expectedApiKey) {
            console.warn('SEPAY_API_KEY not configured');
            return true; // Allow if API key is not configured
        }
        return apiKey === expectedApiKey;
    }
}
exports.PaymentService = PaymentService;
