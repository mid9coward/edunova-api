import { Router } from 'express'
import { ReviewController } from '../controllers/review.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '~/configs/permission'
import {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema,
  getReviewByIdSchema,
  deleteReviewSchema,
  getCourseReviewsSchema,
  getUserReviewsSchema,
  getCourseRatingStatsSchema
} from '../schemas'

const router = Router()

// Public routes for course reviews and stats
router.get('/course/:courseId', validate(getCourseReviewsSchema), asyncHandler(ReviewController.getCourseReviews))

router.use(authMiddleware)

router.get(
  '/course/:courseId/stats',
  validate(getCourseRatingStatsSchema),
  asyncHandler(ReviewController.getCourseRatingStats)
)

// Protected routes - require authentication

// User can create, update, delete their own reviews
router.post('/', validate(createReviewSchema), asyncHandler(ReviewController.createReview))

router.get('/:id', validate(getReviewByIdSchema), asyncHandler(ReviewController.getReviewById))

router.put('/:id', validate(updateReviewSchema), asyncHandler(ReviewController.updateReview))

router.delete('/:id', validate(deleteReviewSchema), asyncHandler(ReviewController.deleteReview))

// Get user's own reviews or any user's reviews (public)
router.get('/user/:userId', validate(getUserReviewsSchema), asyncHandler(ReviewController.getUserReviews))

// Admin only routes
router.get(
  '/',
  requirePermission(PERMISSIONS.REVIEW_READ),
  validate(getReviewsQuerySchema),
  asyncHandler(ReviewController.getReviews)
)

router.patch(
  '/:id/status',

  validate(updateReviewSchema),
  asyncHandler(ReviewController.updateReviewStatus)
)

export default router
