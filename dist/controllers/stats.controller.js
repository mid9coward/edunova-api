"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsController = void 0;
const stats_service_1 = require("../services/stats.service");
const success_1 = require("../utils/success");
/**
 * Statistics Management Controllers
 */
class StatsController {
    /**
     * Get dashboard statistics
     */
    static async getDashboardStats(req, res) {
        const stats = await stats_service_1.StatsService.getDashboardStats();
        success_1.sendSuccess.ok(res, 'Dashboard statistics retrieved successfully', stats);
    }
    /**
     * Get monthly revenue overview for chart
     */
    static async getMonthlyRevenueOverview(req, res) {
        const overview = await stats_service_1.StatsService.getMonthlyRevenueOverview();
        success_1.sendSuccess.ok(res, 'Monthly revenue overview retrieved successfully', overview);
    }
    /**
     * Get recent sales with current month summary
     */
    static async getRecentSalesWithSummary(req, res) {
        const limit = parseInt(req.query.limit) || 10;
        const data = await stats_service_1.StatsService.getRecentSalesWithSummary(limit);
        success_1.sendSuccess.ok(res, 'Recent sales with summary retrieved successfully', data);
    }
}
exports.StatsController = StatsController;
