"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const user_1 = require("../models/user");
const course_1 = require("../models/course");
const role_1 = require("../models/role");
const order_1 = require("../models/order");
const enums_1 = require("../enums");
class StatsService {
    /**
     * Get dashboard statistics
     */
    static async getDashboardStats() {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // Get total users stats
        const totalUsersStats = await this.getTotalUsersStats(currentMonth, lastMonth);
        // Get active courses stats
        const activeCoursesStats = await this.getActiveCoursesStats(currentMonth, lastMonth);
        // Get user roles stats
        const userRolesStats = await this.getUserRolesStats(currentMonth, lastMonth);
        // Get total revenue stats
        const totalRevenueStats = await this.getTotalRevenueStats(currentMonth, lastMonth);
        return {
            totalUsers: totalUsersStats,
            activeCourses: activeCoursesStats,
            userRoles: userRolesStats,
            totalRevenue: totalRevenueStats
        };
    }
    /**
     * Get total users statistics
     */
    static async getTotalUsersStats(currentMonth, lastMonth) {
        // Total users count
        const totalUsers = await user_1.User.countDocuments();
        // Users created this month
        const usersThisMonth = await user_1.User.countDocuments({
            createdAt: { $gte: currentMonth }
        });
        // Users created last month
        const usersLastMonth = await user_1.User.countDocuments({
            createdAt: { $gte: lastMonth, $lt: currentMonth }
        });
        const changeFromLastMonth = usersThisMonth - usersLastMonth;
        const changePercentage = usersLastMonth > 0 ? Math.round((changeFromLastMonth / usersLastMonth) * 100) : usersThisMonth > 0 ? 100 : 0;
        return {
            count: totalUsers,
            changeFromLastMonth,
            changePercentage
        };
    }
    /**
     * Get active courses statistics
     */
    static async getActiveCoursesStats(currentMonth, lastMonth) {
        // Total active (published) courses
        const activeCourses = await course_1.Course.countDocuments({
            status: enums_1.CourseStatus.PUBLISHED
        });
        // Active courses created this month
        const activeCoursesThisMonth = await course_1.Course.countDocuments({
            status: enums_1.CourseStatus.PUBLISHED,
            createdAt: { $gte: currentMonth }
        });
        // Active courses created last month
        const activeCoursesLastMonth = await course_1.Course.countDocuments({
            status: enums_1.CourseStatus.PUBLISHED,
            createdAt: { $gte: lastMonth, $lt: currentMonth }
        });
        const changeFromLastMonth = activeCoursesThisMonth - activeCoursesLastMonth;
        const changePercentage = activeCoursesLastMonth > 0
            ? Math.round((changeFromLastMonth / activeCoursesLastMonth) * 100)
            : activeCoursesThisMonth > 0
                ? 100
                : 0;
        return {
            count: activeCourses,
            changeFromLastMonth,
            changePercentage
        };
    }
    /**
     * Get user roles statistics
     */
    static async getUserRolesStats(currentMonth, lastMonth) {
        // Total number of roles
        const totalRoles = await role_1.Role.countDocuments();
        // Roles created this month
        const rolesThisMonth = await role_1.Role.countDocuments({
            createdAt: { $gte: currentMonth }
        });
        // Roles created last month
        const rolesLastMonth = await role_1.Role.countDocuments({
            createdAt: { $gte: lastMonth, $lt: currentMonth }
        });
        const changeFromLastMonth = rolesThisMonth - rolesLastMonth;
        const changePercentage = rolesLastMonth > 0 ? Math.round((changeFromLastMonth / rolesLastMonth) * 100) : rolesThisMonth > 0 ? 100 : 0;
        return {
            count: totalRoles,
            changeFromLastMonth,
            changePercentage
        };
    }
    /**
     * Get total revenue statistics
     */
    static async getTotalRevenueStats(currentMonth, lastMonth) {
        // Total revenue from completed orders
        const totalRevenueResult = await order_1.Order.aggregate([
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
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalAmount : 0;
        // Revenue this month
        const revenueThisMonthResult = await order_1.Order.aggregate([
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
        ]);
        const revenueThisMonth = revenueThisMonthResult.length > 0 ? revenueThisMonthResult[0].totalAmount : 0;
        // Revenue last month
        const revenueLastMonthResult = await order_1.Order.aggregate([
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
        ]);
        const revenueLastMonth = revenueLastMonthResult.length > 0 ? revenueLastMonthResult[0].totalAmount : 0;
        const changeFromLastMonth = revenueThisMonth - revenueLastMonth;
        const changePercentage = revenueLastMonth > 0 ? Math.round((changeFromLastMonth / revenueLastMonth) * 100) : revenueThisMonth > 0 ? 100 : 0;
        return {
            count: totalRevenue,
            changeFromLastMonth,
            changePercentage
        };
    }
    /**
     * Get monthly revenue overview (for chart) - current year only
     */
    static async getMonthlyRevenueOverview() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const startDate = new Date(currentYear, 0, 1); // January 1st of current year
        const monthlyRevenue = await order_1.Order.aggregate([
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
        ]);
        // Fill in missing months with 0 revenue (only current year, months 1-12)
        const result = [];
        const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let month = 1; month <= 12; month++) {
            const existing = monthlyRevenue.find((item) => item._id.year === currentYear && item._id.month === month);
            result.push({
                year: currentYear,
                month,
                monthName: shortMonthNames[month - 1],
                totalRevenue: existing ? existing.totalRevenue : 0,
                salesCount: existing ? existing.salesCount : 0
            });
        }
        return result;
    }
    /**
     * Get recent sales with current month summary
     */
    static async getRecentSalesWithSummary(limit = 10) {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        // Get recent sales
        const recentOrders = await order_1.Order.aggregate([
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
        ]);
        // Get current month sales summary
        const summary = await order_1.Order.aggregate([
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
        ]);
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
        }));
        const currentMonthSummary = {
            salesCount: summary.length > 0 ? summary[0].totalSales : 0,
            totalRevenue: summary.length > 0 ? summary[0].totalRevenue : 0
        };
        return {
            recentSales,
            currentMonthSummary
        };
    }
}
exports.StatsService = StatsService;
