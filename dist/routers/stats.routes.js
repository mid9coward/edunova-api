"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stats_controller_1 = require("../controllers/stats.controller");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
// Dashboard statistics
router.get('/dashboard', (0, error_middleware_1.asyncHandler)(stats_controller_1.StatsController.getDashboardStats));
// Monthly revenue overview (for chart)
router.get('/overview', (0, error_middleware_1.asyncHandler)(stats_controller_1.StatsController.getMonthlyRevenueOverview));
// Recent sales with current month summary
router.get('/recent-sales', (0, error_middleware_1.asyncHandler)(stats_controller_1.StatsController.getRecentSalesWithSummary));
exports.default = router;
