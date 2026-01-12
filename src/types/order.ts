import { IOrder, IOrderItem } from '../models/order'
import { OrderStatus } from '../enums'

// Populated order with user and course details
export interface PopulatedOrder extends Omit<IOrder, 'userId' | 'items'> {
  userId: {
    _id: string
    username: string
    email: string
  }
  items: Array<
    Omit<IOrderItem, 'courseId'> & {
      courseId: {
        _id: string
        title: string
        image?: string
      }
    }
  >
}

// Order statistics type
export interface OrderStatistics {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  canceledOrders: number
}

// Order listing result with pagination
export interface GetOrdersResult {
  orders: PopulatedOrder[]
  pagination: {
    currentPage: number
    totalPages: number
    totalOrders: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// User orders result
export interface GetUserOrdersResult {
  orders: IOrder[]
  pagination: {
    currentPage: number
    totalPages: number
    totalOrders: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Order status update payload
export interface OrderStatusUpdate {
  orderId: string
  status: OrderStatus
  updatedBy: string
}
