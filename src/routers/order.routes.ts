import { Router } from 'express'
import { OrderController } from '../controllers/order.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '../configs/permission'
import {
  createOrderSchema,
  updateOrderStatusSchema,
  getOrdersQuerySchema,
  orderParamsSchema,
  bulkDeleteOrdersSchema
} from '../schemas/order.schema'

const router = Router()

// All routes require authentication
router.use(authMiddleware)
router.use(loadUserPermissions)

/**
 * @route POST /api/orders
 * @desc Create a new order from course IDs
 * @access Private (Authenticated users)
 */
router.post('/', validate(createOrderSchema), asyncHandler(OrderController.createOrder))

/**
 * @route GET /api/orders/my-orders
 * @desc Get current user's orders
 * @access Private (Authenticated users)
 */
router.get('/my-orders', asyncHandler(OrderController.getUserOrders))

/**
 * @route GET /api/orders/code/:code
 * @desc Get order by code
 * @access Private (Authenticated users)
 */
router.get('/code/:code', asyncHandler(OrderController.getOrderByCode))

/**
 * @route GET /api/orders/:id
 * @desc Get order by ID
 * @access Private (Authenticated users)
 */
router.get('/:id', validate(orderParamsSchema), asyncHandler(OrderController.getOrderById))

/**
 * @route GET /api/orders/:id/invoice
 * @desc Download invoice PDF for an order
 * @access Private (Users can only download their own invoices)
 */
router.get('/:id/invoice', validate(orderParamsSchema), asyncHandler(OrderController.downloadInvoice))

/**
 * @route GET /api/orders
 * @desc Get all orders with pagination and filtering
 * @access Private (Admin only)
 */
router.get(
  '/',
  requirePermission(PERMISSIONS.ORDER_READ),
  validate(getOrdersQuerySchema),
  asyncHandler(OrderController.getOrders)
)

/**
 * @route DELETE /api/orders/bulk-delete
 * @desc Bulk delete orders
 * @access Private (Admin only)
 */
router.delete(
  '/bulk-delete',
  requirePermission(PERMISSIONS.ORDER_DELETE),
  validate(bulkDeleteOrdersSchema),
  asyncHandler(OrderController.bulkDeleteOrders)
)

/**
 * @route PUT /api/orders/:id/cancel
 * @desc Cancel order
 * @access Private (Authenticated users - own orders, Admin - any order)
 */
router.put('/:id/cancel', validate(orderParamsSchema), asyncHandler(OrderController.cancelOrder))

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status
 * @access Private (Admin only)
 */
router.put(
  '/:id/status',
  requirePermission(PERMISSIONS.ORDER_UPDATE),
  validate(orderParamsSchema),
  validate(updateOrderStatusSchema),
  asyncHandler(OrderController.updateOrderStatus)
)

/**
 * @route DELETE /api/orders/:id
 * @desc Delete order
 * @access Private (Admin only)
 */
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.ORDER_DELETE),
  validate(orderParamsSchema),
  asyncHandler(OrderController.deleteOrder)
)

export default router
