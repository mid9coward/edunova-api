import { Request, Response } from 'express'
import { StatsService } from '../services/stats.service'
import { sendSuccess } from '../utils/success'

/**
 * Statistics Management Controllers
 */

export class StatsController {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    const stats = await StatsService.getDashboardStats()
    sendSuccess.ok(res, 'Dashboard statistics retrieved successfully', stats)
  }

  /**
   * Get monthly revenue overview for chart
   */
  static async getMonthlyRevenueOverview(req: Request, res: Response): Promise<void> {
    const overview = await StatsService.getMonthlyRevenueOverview()
    sendSuccess.ok(res, 'Monthly revenue overview retrieved successfully', overview)
  }

  /**
   * Get recent sales with current month summary
   */
  static async getRecentSalesWithSummary(req: Request, res: Response): Promise<void> {
    const limit = parseInt(req.query.limit as string) || 10
    const data = await StatsService.getRecentSalesWithSummary(limit)
    sendSuccess.ok(res, 'Recent sales with summary retrieved successfully', data)
  }
}
