import { Router } from 'express'
import { CouponController } from '../controllers/coupon.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '~/configs/permission'
import { createCouponSchema, updateCouponSchema, getCouponsSchema, applyCouponSchema } from '../schemas/coupon.schema'

const router = Router()

/**
 * Public Routes
 */

// Get active coupons (for frontend coupon selection)
router.get('/active', asyncHandler(CouponController.getActiveCoupons))

// Validate coupon code (for checkout process)
router.post('/validate', validate(applyCouponSchema), asyncHandler(CouponController.validateCoupon))

/**
 * Protected Routes (require authentication and admin permissions)
 */
router.use(authMiddleware)
router.use(loadUserPermissions)

// Get all coupons with filtering and pagination (admin only)
router.get(
  '/',
  requirePermission([PERMISSIONS.COUPON_READ]),
  validate(getCouponsSchema),
  asyncHandler(CouponController.getCoupons)
)

// Get coupon by ID
router.get('/:couponId', requirePermission([PERMISSIONS.COUPON_READ]), asyncHandler(CouponController.getCouponById))

// Create new coupon (admin only)
router.post(
  '/',
  requirePermission([PERMISSIONS.COUPON_CREATE]),
  validate(createCouponSchema),
  asyncHandler(CouponController.createCoupon)
)

// Update coupon (admin only)
router.put(
  '/:couponId',
  requirePermission([PERMISSIONS.COUPON_UPDATE]),
  validate(updateCouponSchema),
  asyncHandler(CouponController.updateCoupon)
)

// Delete coupon (admin only)
router.delete('/:couponId', requirePermission([PERMISSIONS.COUPON_DELETE]), asyncHandler(CouponController.deleteCoupon))

// Apply coupon (increment usage - for internal use during checkout)
router.patch('/:couponId/apply', asyncHandler(CouponController.applyCoupon))

export default router
