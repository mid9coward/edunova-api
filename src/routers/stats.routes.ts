import { Router } from 'express'
import { StatsController } from '../controllers/stats.controller'
import { asyncHandler } from '../middlewares/error.middleware'

const router = Router()

// Dashboard statistics
router.get('/dashboard', asyncHandler(StatsController.getDashboardStats))

// Monthly revenue overview (for chart)
router.get('/overview', asyncHandler(StatsController.getMonthlyRevenueOverview))

// Recent sales with current month summary
router.get('/recent-sales', asyncHandler(StatsController.getRecentSalesWithSummary))

export default router
