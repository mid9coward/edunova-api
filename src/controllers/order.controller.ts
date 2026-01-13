import { Request, Response } from 'express'
import { OrderService } from '../services/order.service'
import { sendSuccess } from '../utils/success'
import { AppError } from '../utils/errors'
import { PDFService } from '../utils/pdf'
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  GetOrdersQuery,
  BulkDeleteOrdersInput
} from '../schemas/order.schema'

/**
 * Order Management Controllers
 */

export class OrderController {
  /**
   * Create a new order directly from course IDs
   */
  static async createOrder(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User authentication required', 401)
    }

    const orderData: CreateOrderInput = req.body

    const order = await OrderService.createOrder(userId, orderData)

    sendSuccess.created(res, 'Order created successfully', order)
  }

  /**
   * Get all orders (Admin only)
   */
  static async getOrders(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetOrdersQuery
    const result = await OrderService.getOrders(query)

    sendSuccess.ok(res, 'Orders retrieved successfully', result)
  }

  /**
   * Get current user's orders
   */
  static async getUserOrders(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User authentication required', 401)
    }

    const query = req.query as unknown as Partial<GetOrdersQuery>

    const result = await OrderService.getUserOrders(userId, query)
    sendSuccess.ok(res, 'User orders retrieved successfully', result)
  }

  /**
   * Get order by ID
   */
  static async getOrderById(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const order = await OrderService.getOrderById(id as string)

    sendSuccess.ok(res, 'Order retrieved successfully', order)
  }

  /**
   * Get order by code
   */
  static async getOrderByCode(req: Request, res: Response): Promise<void> {
    const { code } = req.params
    const order = await OrderService.getOrderByCode(code as string)

    sendSuccess.ok(res, 'Order retrieved successfully', { order })
  }

  /**
   * Update order status (Admin only)
   */
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const statusData: UpdateOrderStatusInput = req.body

    const order = await OrderService.updateOrderStatus(id as string, statusData)
    sendSuccess.ok(res, 'Order status updated successfully', { order })
  }

  /**
   * Cancel order
   */
  static async cancelOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user?.userId
    const userRoles = req.user?.roles

    if (!userId) {
      throw new AppError('User authentication required', 401)
    }

    // Admin can cancel any order, user can only cancel their own
    const isAdmin = userRoles?.includes('admin')
    const order = await OrderService.cancelOrder(id as string, isAdmin ? undefined : userId)
    sendSuccess.ok(res, 'Order canceled successfully', { order })
  }

  /**
   * Delete order (Admin only)
   */
  static async deleteOrder(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    await OrderService.deleteOrder(id as string)
    sendSuccess.ok(res, 'Order deleted successfully')
  }

  /**
   * Bulk delete orders (Admin only)
   */
  static async bulkDeleteOrders(req: Request, res: Response): Promise<void> {
    const bulkDeleteData: BulkDeleteOrdersInput = req.body
    const result = await OrderService.bulkDeleteOrders(bulkDeleteData)
    sendSuccess.ok(res, 'Orders deleted successfully', result)
  }

  /**
   * Download invoice PDF for an order
   */
  static async downloadInvoice(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      throw new AppError('User authentication required', 401)
    }

    // Get order with user details and check access permissions
    const { order, user } = await OrderService.getOrderForInvoice(id as string, userId)

    // Generate PDF
    const companyInfo = PDFService.getDefaultCompanyInfo()
    const invoiceData = {
      order,
      user,
      companyInfo
    }

    const pdfBuffer = await PDFService.generateInvoicePDF(invoiceData)

    // Set response headers for PDF download
    const filename = `invoice-${order.code}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)

    // Send PDF
    res.send(pdfBuffer)
  }
}
