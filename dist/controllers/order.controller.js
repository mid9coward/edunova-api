"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const order_service_1 = require("../services/order.service");
const success_1 = require("../utils/success");
const errors_1 = require("../utils/errors");
const pdf_1 = require("../utils/pdf");
/**
 * Order Management Controllers
 */
class OrderController {
    /**
     * Create a new order directly from course IDs
     */
    static async createOrder(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User authentication required', 401);
        }
        const orderData = req.body;
        const order = await order_service_1.OrderService.createOrder(userId, orderData);
        success_1.sendSuccess.created(res, 'Order created successfully', order);
    }
    /**
     * Get all orders (Admin only)
     */
    static async getOrders(req, res) {
        const query = req.query;
        const result = await order_service_1.OrderService.getOrders(query);
        success_1.sendSuccess.ok(res, 'Orders retrieved successfully', result);
    }
    /**
     * Get current user's orders
     */
    static async getUserOrders(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User authentication required', 401);
        }
        const query = req.query;
        const result = await order_service_1.OrderService.getUserOrders(userId, query);
        success_1.sendSuccess.ok(res, 'User orders retrieved successfully', result);
    }
    /**
     * Get order by ID
     */
    static async getOrderById(req, res) {
        const { id } = req.params;
        const order = await order_service_1.OrderService.getOrderById(id);
        success_1.sendSuccess.ok(res, 'Order retrieved successfully', order);
    }
    /**
     * Get order by code
     */
    static async getOrderByCode(req, res) {
        const { code } = req.params;
        const order = await order_service_1.OrderService.getOrderByCode(code);
        success_1.sendSuccess.ok(res, 'Order retrieved successfully', { order });
    }
    /**
     * Update order status (Admin only)
     */
    static async updateOrderStatus(req, res) {
        const { id } = req.params;
        const statusData = req.body;
        const order = await order_service_1.OrderService.updateOrderStatus(id, statusData);
        success_1.sendSuccess.ok(res, 'Order status updated successfully', { order });
    }
    /**
     * Cancel order
     */
    static async cancelOrder(req, res) {
        const { id } = req.params;
        const userId = req.user?.userId;
        const userRoles = req.user?.roles;
        if (!userId) {
            throw new errors_1.AppError('User authentication required', 401);
        }
        // Admin can cancel any order, user can only cancel their own
        const isAdmin = userRoles?.includes('admin');
        const order = await order_service_1.OrderService.cancelOrder(id, isAdmin ? undefined : userId);
        success_1.sendSuccess.ok(res, 'Order canceled successfully', { order });
    }
    /**
     * Delete order (Admin only)
     */
    static async deleteOrder(req, res) {
        const { id } = req.params;
        await order_service_1.OrderService.deleteOrder(id);
        success_1.sendSuccess.ok(res, 'Order deleted successfully');
    }
    /**
     * Bulk delete orders (Admin only)
     */
    static async bulkDeleteOrders(req, res) {
        const bulkDeleteData = req.body;
        const result = await order_service_1.OrderService.bulkDeleteOrders(bulkDeleteData);
        success_1.sendSuccess.ok(res, 'Orders deleted successfully', result);
    }
    /**
     * Download invoice PDF for an order
     */
    static async downloadInvoice(req, res) {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User authentication required', 401);
        }
        // Get order with user details and check access permissions
        const { order, user } = await order_service_1.OrderService.getOrderForInvoice(id, userId);
        // Generate PDF
        const companyInfo = pdf_1.PDFService.getDefaultCompanyInfo();
        const invoiceData = {
            order,
            user,
            companyInfo
        };
        const pdfBuffer = await pdf_1.PDFService.generateInvoicePDF(invoiceData);
        // Set response headers for PDF download
        const filename = `invoice-${order.code}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        // Send PDF
        res.send(pdfBuffer);
    }
}
exports.OrderController = OrderController;
