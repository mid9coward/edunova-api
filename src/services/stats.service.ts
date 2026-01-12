import { User } from '../models/user'
import { Course } from '../models/course'
import { Role } from '../models/role'
import { Order } from '../models/order'
import { CourseStatus } from '../enums'

/**
 * Statistics Service
 * Handles dashboard statistics and analytics
 */

export interface DashboardStats {
  totalUsers: {
    count: number
    changeFromLastMonth: number
    changePercentage: number
  }
  activeCourses: {
    count: number
    changeFromLastMonth: number
    changePercentage: number
  }
  userRoles: {
    count: number
    changeFromLastMonth: number
    changePercentage: number
  }
  totalRevenue: {
    count: number
    changeFromLastMonth: number
    changePercentage: number
  }
}

export class StatsService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Get total users stats
    const totalUsersStats = await this.getTotalUsersStats(currentMonth, lastMonth)

    // Get active courses stats
    const activeCoursesStats = await this.getActiveCoursesStats(currentMonth, lastMonth)

    // Get user roles stats
    const userRolesStats = await this.getUserRolesStats(currentMonth, lastMonth)

    // Get total revenue stats
    const totalRevenueStats = await this.getTotalRevenueStats(currentMonth, lastMonth)

    return {
      totalUsers: totalUsersStats,
      activeCourses: activeCoursesStats,
      userRoles: userRolesStats,
      totalRevenue: totalRevenueStats
    }
  }

  /**
   * Get total users statistics
   */
  private static async getTotalUsersStats(currentMonth: Date, lastMonth: Date) {
    // Total users count
    const totalUsers = await User.countDocuments()

    // Users created this month
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: currentMonth }
    })

    // Users created last month
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: lastMonth, $lt: currentMonth }
    })

    const changeFromLastMonth = usersThisMonth - usersLastMonth
    const changePercentage =
      usersLastMonth > 0 ? Math.round((changeFromLastMonth / usersLastMonth) * 100) : usersThisMonth > 0 ? 100 : 0
    return {
      count: totalUsers,
      changeFromLastMonth,
      changePercentage
    }
  }

  /**
   * Get active courses statistics
   */
  private static async getActiveCoursesStats(currentMonth: Date, lastMonth: Date) {
    // Total active (published) courses
    const activeCourses = await Course.countDocuments({
      status: CourseStatus.PUBLISHED
    })

    // Active courses created this month
    const activeCoursesThisMonth = await Course.countDocuments({
      status: CourseStatus.PUBLISHED,
      createdAt: { $gte: currentMonth }
    })

    // Active courses created last month
    const activeCoursesLastMonth = await Course.countDocuments({
      status: CourseStatus.PUBLISHED,
      createdAt: { $gte: lastMonth, $lt: currentMonth }
    })

    const changeFromLastMonth = activeCoursesThisMonth - activeCoursesLastMonth
    const changePercentage =
      activeCoursesLastMonth > 0
        ? Math.round((changeFromLastMonth / activeCoursesLastMonth) * 100)
        : activeCoursesThisMonth > 0
          ? 100
          : 0

    return {
      count: activeCourses,
      changeFromLastMonth,
      changePercentage
    }
  }

  /**
   * Get user roles statistics
   */
  private static async getUserRolesStats(currentMonth: Date, lastMonth: Date) {
    // Total number of roles
    const totalRoles = await Role.countDocuments()

    // Roles created this month
    const rolesThisMonth = await Role.countDocuments({
      createdAt: { $gte: currentMonth }
    })

    // Roles created last month
    const rolesLastMonth = await Role.countDocuments({
      createdAt: { $gte: lastMonth, $lt: currentMonth }
    })

    const changeFromLastMonth = rolesThisMonth - rolesLastMonth
    const changePercentage =
      rolesLastMonth > 0 ? Math.round((changeFromLastMonth / rolesLastMonth) * 100) : rolesThisMonth > 0 ? 100 : 0

    return {
      count: totalRoles,
      changeFromLastMonth,
      changePercentage
    }
  }

  /**
   * Get total revenue statistics
   */
  private static async getTotalRevenueStats(currentMonth: Date, lastMonth: Date) {
    // Total revenue from completed orders
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])

    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalAmount : 0

    // Revenue this month
    const revenueThisMonthResult = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])

    const revenueThisMonth = revenueThisMonthResult.length > 0 ? revenueThisMonthResult[0].totalAmount : 0

    // Revenue last month
    const revenueLastMonthResult = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: lastMonth, $lt: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])

    const revenueLastMonth = revenueLastMonthResult.length > 0 ? revenueLastMonthResult[0].totalAmount : 0

    const changeFromLastMonth = revenueThisMonth - revenueLastMonth
    const changePercentage =
      revenueLastMonth > 0 ? Math.round((changeFromLastMonth / revenueLastMonth) * 100) : revenueThisMonth > 0 ? 100 : 0
    return {
      count: totalRevenue,
      changeFromLastMonth,
      changePercentage
    }
  }

  /**
   * Get monthly revenue overview (for chart) - current year only
   */
  static async getMonthlyRevenueOverview() {
    const now = new Date()
    const currentYear = now.getFullYear()
    const startDate = new Date(currentYear, 0, 1) // January 1st of current year

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalAmount' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $sort: {
          '_id.month': 1
        }
      }
    ])

    // Fill in missing months with 0 revenue (only current year, months 1-12)
    const result = []
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (let month = 1; month <= 12; month++) {
      const existing = monthlyRevenue.find((item) => item._id.year === currentYear && item._id.month === month)

      result.push({
        year: currentYear,
        month,
        monthName: shortMonthNames[month - 1],
        totalRevenue: existing ? existing.totalRevenue : 0,
        salesCount: existing ? existing.salesCount : 0
      })
    }

    return result
  }

  /**
   * Get recent sales with current month summary
   */
  static async getRecentSalesWithSummary(limit: number = 10) {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get recent sales
    const recentOrders = await Order.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 1,
          code: 1,
          totalAmount: 1,
          createdAt: 1,
          'user.username': 1,
          'user.email': 1,
          'user.avatar': 1,
          itemCount: { $size: '$items' }
        }
      }
    ])

    // Get current month sales summary
    const summary = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ])

    const recentSales = recentOrders.map((order) => ({
      id: order._id,
      orderCode: order.code,
      customer: {
        name: order.user.username,
        email: order.user.email,
        avatar: order.user.avatar
      },
      amount: order.totalAmount,
      itemCount: order.itemCount,
      date: order.createdAt
    }))

    const currentMonthSummary = {
      salesCount: summary.length > 0 ? summary[0].totalSales : 0,
      totalRevenue: summary.length > 0 ? summary[0].totalRevenue : 0
    }

    return {
      recentSales,
      currentMonthSummary
    }
  }
}
