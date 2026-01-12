import mongoose, { FilterQuery } from 'mongoose'
import { Order, IOrder } from '../models/order'
import { Course } from '../models/course'
import { User } from '../models/user'
import { Cart } from '../models/cart'
import { Coupon } from '../models/coupon'
import { AppError } from '../utils/errors'
import { OrderStatus } from '../enums'
import {
  CreateOrderInput,
  UpdateOrderStatusInput,
  GetOrdersQuery,
  BulkDeleteOrdersInput
} from '../schemas/order.schema'

/**
 * Order Management Service
 * Handles CRUD operations and order-related business logic
 */

interface GetOrdersResult {
  orders: IOrder[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export class OrderService {
  /**
   * Generate unique order code using random approach
   */
  private static async generateOrderCode(): Promise<string> {
    // Simple approach: ORD + timestamp(last 8 digits) + random 4 digits
    const timestamp = Date.now().toString().slice(-8)
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')

    const code = `ORD${timestamp}${randomNum}`

    // Double check uniqueness (very unlikely but safe)
    const existingOrder = await Order.findOne({ code })
    if (existingOrder) {
      return this.generateOrderCode()
    }

    return code
  }

  /**
   * Validate and prepare order items from course IDs
   */
  private static async validateAndPrepareOrderItems(courseIds: string[]) {
    // Check if all courses exist and are available
    const courses = await Course.find({
      _id: { $in: courseIds },
      status: 'published' // Only allow published courses
    }).select('_id title price oldPrice image status')

    if (courses.length !== courseIds.length) {
      const foundIds = courses.map((c) => c._id.toString())
      const missingIds = courseIds.filter((id) => !foundIds.includes(id))
      throw new AppError(`Courses not found or not available: ${missingIds.join(', ')}`, 400)
    }

    // Prepare order items
    const orderItems = courses.map((course) => ({
      courseId: course._id,
      title: course.title,
      price: course.price,
      oldPrice: course.oldPrice,
      thumbnail: course.image
    }))

    return { orderItems, courses }
  }

  /**
   * Calculate order totals with coupon
   */
  private static async calculateOrderTotals(
    orderItems: Array<{
      courseId: mongoose.Types.ObjectId
      title: string
      price: number
      oldPrice?: number
      thumbnail?: string
    }>,
    couponCode?: string
  ): Promise<{
    subTotal: number
    totalDiscount: number
    totalAmount: number
    validatedCouponCode?: string
  }> {
    // Calculate subtotal
    const subTotal = orderItems.reduce((total, item) => total + item.price, 0)
    let totalDiscount = 0
    let validatedCouponCode = undefined

    // Apply coupon if provided
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: new Date() },
        $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
      })

      if (!coupon) {
        throw new AppError('Invalid or expired coupon code', 400)
      }

      // Check if coupon is applicable
      if (coupon.courseIds.length > 0) {
        const orderCourseIds = orderItems.map((item) => item.courseId.toString())
        const hasApplicableCourses = coupon.courseIds.some((courseId: mongoose.Types.ObjectId) =>
          orderCourseIds.includes(courseId.toString())
        )

        if (!hasApplicableCourses) {
          throw new AppError('Coupon is not applicable to any selected courses', 400)
        }
      }

      // Calculate discount
      if (coupon.discountType === 'percent') {
        totalDiscount = Math.round((subTotal * coupon.discountValue) / 100)
      } else {
        totalDiscount = Math.min(coupon.discountValue, subTotal)
      }

      validatedCouponCode = coupon.code
    }

    const totalAmount = Math.max(0, subTotal - totalDiscount)

    return {
      subTotal,
      totalDiscount,
      totalAmount,
      validatedCouponCode
    }
  }

  /**
   * Create a new order from course IDs
   */
  static async createOrder(userId: string, orderData: CreateOrderInput): Promise<IOrder> {
    // Validate user exists
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Validate and prepare order items
    const { orderItems } = await this.validateAndPrepareOrderItems(orderData.courseIds)

    // Calculate totals with coupon
    const { subTotal, totalDiscount, totalAmount, validatedCouponCode } = await this.calculateOrderTotals(
      orderItems,
      orderData.couponCode
    )

    // Generate unique order code
    const code = await this.generateOrderCode()

    // Create order
    const order = new Order({
      code,
      userId: new mongoose.Types.ObjectId(userId),
      items: orderItems,
      couponCode: validatedCouponCode,
      subTotal,
      totalDiscount,
      totalAmount,
      paymentMethod: orderData.paymentMethod,
      status: OrderStatus.PENDING
    })

    await order.save()

    // Remove ordered items from cart after successful order creation
    const orderedCourseIds = orderItems.map((item) => item.courseId.toString())

    // Get current cart
    const cart = await Cart.findOne({ userId })
    if (cart && cart.items.length > 0) {
      // Filter out items that were ordered
      const remainingItems = cart.items.filter((cartItem) => !orderedCourseIds.includes(cartItem.courseId.toString()))

      // Recalculate total price for remaining items
      const newTotalPrice = remainingItems.reduce((total, item) => total + item.price, 0)

      // Update cart with remaining items
      await Cart.findOneAndUpdate(
        { userId },
        {
          items: remainingItems,
          totalPrice: newTotalPrice
        }
      )
    }

    return order
  }

  /**
   * Get orders with pagination and filtering
   */
  static async getOrders(query: GetOrdersQuery): Promise<GetOrdersResult> {
    const { page = 1, limit = 10, status, paymentMethod, sortBy = 'createdAt', sortOrder = 'desc', search } = query
    const pageNum = +page
    const limitNum = +limit

    // Build filter
    const filter: FilterQuery<IOrder> = {}

    if (status) {
      filter.status = status
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod
    }

    if (search) {
      filter.$or = [{ code: { $regex: search, $options: 'i' } }, { 'items.title': { $regex: search, $options: 'i' } }]
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum

    // Execute query with aggregation for user details
    const orders = await Order.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
        }
      },
      { $unwind: '$user' },
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNum }
    ])

    // Get total count
    const totalOrders = await Order.countDocuments(filter)
    const totalPages = Math.ceil(totalOrders / limitNum)

    return {
      orders,
      pagination: {
        total: totalOrders,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get user's orders
   */
  static async getUserOrders(userId: string, query: Partial<GetOrdersQuery>): Promise<GetOrdersResult> {
    const filter: FilterQuery<IOrder> = { userId: new mongoose.Types.ObjectId(userId) }

    if (query.status) {
      filter.status = query.status
    }

    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query
    const pageNum = +page
    const limitNum = +limit

    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const skip = (pageNum - 1) * limitNum

    const orders = await Order.find(filter).sort(sort).skip(skip).limit(limitNum)

    const total = await Order.countDocuments(filter)
    const totalPages = Math.ceil(total / limitNum)

    return {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string): Promise<IOrder> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError('Invalid order ID', 400)
    }

    const order = await Order.findById(orderId).populate({
      path: 'userId',
      select: 'username email'
    })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    return order
  }

  /**
   * Get order by ID with user details (for invoice generation)
   */
  static async getOrderWithUserDetails(
    orderId: string
  ): Promise<{ order: IOrder; user: { username: string; email: string } }> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError('Invalid order ID', 400)
    }

    const order = await Order.findById(orderId).populate({
      path: 'userId',
      select: 'username email'
    })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Extract user details from populated userId
    const populatedUser = order.userId as unknown as { username: string; email: string }

    return {
      order,
      user: {
        username: populatedUser.username,
        email: populatedUser.email
      }
    }
  }

  /**
   * Get order for invoice download with authorization check
   */
  static async getOrderForInvoice(
    orderId: string,
    currentUserId: string
  ): Promise<{ order: IOrder; user: { username: string; email: string } }> {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new AppError('Invalid order ID', 400)
    }

    const order = await Order.findById(orderId).populate({
      path: 'userId',
      select: 'username email'
    })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Check authorization: users can only download their own invoices
    // Convert both to string for proper comparison since order.userId might be ObjectId
    const orderUserId = order.userId._id?.toString() || order.userId.toString()
    const isOwner = orderUserId === currentUserId

    if (!isOwner) {
      throw new AppError('Access denied. You can only download your own invoices.', 403)
    }

    // Extract user details from populated userId
    const populatedUser = order.userId as unknown as { username: string; email: string }

    return {
      order,
      user: {
        username: populatedUser.username,
        email: populatedUser.email
      }
    }
  }

  /**
   * Get order by code
   */
  static async getOrderByCode(code: string): Promise<IOrder> {
    const order = await Order.findOne({ code })
      .populate({
        path: 'userId',
        select: 'username email'
      })
      .populate({
        path: 'items.courseId',
        select: 'title image'
      })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    return order
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(orderId: string, statusData: UpdateOrderStatusInput): Promise<IOrder> {
    // Get current order to check previous status
    const currentOrder = await Order.findById(orderId)
    if (!currentOrder) {
      throw new AppError('Order not found', 404)
    }

    const previousStatus = currentOrder.status
    const newStatus = statusData.status

    // Update order status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true, runValidators: true }
    ).populate({
      path: 'userId',
      select: 'username email'
    })

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // Handle course enrollment based on status change
    await this.handleCourseEnrollment(order, previousStatus, newStatus)

    return order
  }

  /**
   * Handle course enrollment when order status changes
   */
  private static async handleCourseEnrollment(order: IOrder, previousStatus: string, newStatus: string): Promise<void> {
    const courseIds = order.items.map((item) => item.courseId)
    const userId = order.userId
    if (newStatus === OrderStatus.COMPLETED && previousStatus !== OrderStatus.COMPLETED) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: {
          courses: { $each: courseIds }
        }
      })
    }

    // When order is canceled or reverted from completed: Remove courses from user
    else if (
      (newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.PENDING) &&
      previousStatus === OrderStatus.COMPLETED
    ) {
      await User.findByIdAndUpdate(userId, {
        $pullAll: {
          courses: courseIds
        }
      })
    }
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, userId?: string): Promise<IOrder> {
    const filter: FilterQuery<IOrder> = { _id: orderId }
    if (userId) {
      filter.userId = new mongoose.Types.ObjectId(userId)
    }

    const order = await Order.findOne(filter)

    if (!order) {
      throw new AppError('Order not found', 404)
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new AppError('Cannot cancel completed order', 400)
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError('Order is already canceled', 400)
    }

    order.status = OrderStatus.CANCELLED
    await order.save()

    return order
  }

  /**
   * Delete order (Hard delete - Admin only)
   */
  static async deleteOrder(orderId: string): Promise<void> {
    const order = await Order.findById(orderId)
    if (!order) {
      throw new AppError('Order not found', 404)
    }

    // If order is completed, remove courses from user
    if (order.status === OrderStatus.COMPLETED) {
      const courseIds = order.items.map((item) => item.courseId)
      await User.findByIdAndUpdate(order.userId, {
        $pullAll: {
          courses: courseIds
        }
      })
    }

    await Order.findByIdAndDelete(orderId)
  }

  /**
   * Bulk delete orders (Hard delete - Admin only)
   */
  static async bulkDeleteOrders(data: BulkDeleteOrdersInput): Promise<{ deletedCount: number; errors: string[] }> {
    const { orderIds } = data
    const errors: string[] = []
    let deletedCount = 0

    // Validate all IDs first
    const invalidIds = orderIds.filter((id) => !mongoose.Types.ObjectId.isValid(id))
    if (invalidIds.length > 0) {
      throw new AppError(`Invalid order IDs: ${invalidIds.join(', ')}`, 400)
    }

    // Process deletions one by one to handle user course removal
    for (const orderId of orderIds) {
      try {
        const order = await Order.findById(orderId)
        if (!order) {
          errors.push(`Order ${orderId} not found`)
          continue
        }

        // If order is completed, remove courses from user
        if (order.status === OrderStatus.COMPLETED) {
          const courseIds = order.items.map((item) => item.courseId)
          await User.findByIdAndUpdate(order.userId, {
            $pullAll: {
              courses: courseIds
            }
          })
        }

        await Order.findByIdAndDelete(orderId)
        deletedCount++
      } catch (error) {
        errors.push(`Failed to delete order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { deletedCount, errors }
  }
}
