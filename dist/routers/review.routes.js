"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Public routes for course reviews and stats
router.get('/course/:courseId', (0, validation_middleware_1.validate)(schemas_1.getCourseReviewsSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.getCourseReviews));
router.use(auth_middleware_1.authMiddleware);
router.get('/course/:courseId/stats', (0, validation_middleware_1.validate)(schemas_1.getCourseRatingStatsSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.getCourseRatingStats));
// Protected routes - require authentication
// User can create, update, delete their own reviews
router.post('/', (0, validation_middleware_1.validate)(schemas_1.createReviewSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.createReview));
router.get('/:id', (0, validation_middleware_1.validate)(schemas_1.getReviewByIdSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.getReviewById));
router.put('/:id', (0, validation_middleware_1.validate)(schemas_1.updateReviewSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.updateReview));
router.delete('/:id', (0, validation_middleware_1.validate)(schemas_1.deleteReviewSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.deleteReview));
// Get user's own reviews or any user's reviews (public)
router.get('/user/:userId', (0, validation_middleware_1.validate)(schemas_1.getUserReviewsSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.getUserReviews));
// Admin only routes
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.REVIEW_READ), (0, validation_middleware_1.validate)(schemas_1.getReviewsQuerySchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.getReviews));
router.patch('/:id/status', (0, validation_middleware_1.validate)(schemas_1.updateReviewSchema), (0, error_middleware_1.asyncHandler)(review_controller_1.ReviewController.updateReviewStatus));
exports.default = router;
