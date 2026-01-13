"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const order_schema_1 = require("../schemas/order.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
/**
 * @route POST /api/orders
 * @desc Create a new order from course IDs
 * @access Private (Authenticated users)
 */
router.post('/', (0, validation_middleware_1.validate)(order_schema_1.createOrderSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.createOrder));
/**
 * @route GET /api/orders/my-orders
 * @desc Get current user's orders
 * @access Private (Authenticated users)
 */
router.get('/my-orders', (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.getUserOrders));
/**
 * @route GET /api/orders/code/:code
 * @desc Get order by code
 * @access Private (Authenticated users)
 */
router.get('/code/:code', (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.getOrderByCode));
/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private (Authenticated users)
 */
router.get('/:id', (0, validation_middleware_1.validate)(order_schema_1.orderParamsSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.getOrderById));
/**
 * @route GET /api/orders/:id/invoice
 * @desc Download invoice PDF for an order
 * @access Private (Users can only download their own invoices)
 */
router.get('/:id/invoice', (0, validation_middleware_1.validate)(order_schema_1.orderParamsSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.downloadInvoice));
/**
 * @route GET /api/orders
 * @desc Get all orders with pagination and filtering
 * @access Private (Admin only)
 */
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ORDER_READ), (0, validation_middleware_1.validate)(order_schema_1.getOrdersQuerySchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.getOrders));
/**
 * @route DELETE /api/orders/bulk-delete
 * @desc Bulk delete orders
 * @access Private (Admin only)
 */
router.delete('/bulk-delete', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ORDER_DELETE), (0, validation_middleware_1.validate)(order_schema_1.bulkDeleteOrdersSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.bulkDeleteOrders));
/**
 * @route PUT /api/orders/:id/cancel
 * @desc Cancel order
 * @access Private (Authenticated users - own orders, Admin - any order)
 */
router.put('/:id/cancel', (0, validation_middleware_1.validate)(order_schema_1.orderParamsSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.cancelOrder));
/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status
 * @access Private (Admin only)
 */
router.put('/:id/status', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ORDER_UPDATE), (0, validation_middleware_1.validate)(order_schema_1.orderParamsSchema), (0, validation_middleware_1.validate)(order_schema_1.updateOrderStatusSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.updateOrderStatus));
/**
 * @route DELETE /api/orders/:id
 * @desc Delete order
 * @access Private (Admin only)
 */
router.delete('/:id', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.ORDER_DELETE), (0, validation_middleware_1.validate)(order_schema_1.orderParamsSchema), (0, error_middleware_1.asyncHandler)(order_controller_1.OrderController.deleteOrder));
exports.default = router;
