"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const coupon_schema_1 = require("../schemas/coupon.schema");
const router = (0, express_1.Router)();
/**
 * Public Routes
 */
// Get active coupons (for frontend coupon selection)
router.get('/active', (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.getActiveCoupons));
// Validate coupon code (for checkout process)
router.post('/validate', (0, validation_middleware_1.validate)(coupon_schema_1.applyCouponSchema), (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.validateCoupon));
/**
 * Protected Routes (require authentication and admin permissions)
 */
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Get all coupons with filtering and pagination (admin only)
router.get('/', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.COUPON_READ]), (0, validation_middleware_1.validate)(coupon_schema_1.getCouponsSchema), (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.getCoupons));
// Get coupon by ID
router.get('/:couponId', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.COUPON_READ]), (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.getCouponById));
// Create new coupon (admin only)
router.post('/', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.COUPON_CREATE]), (0, validation_middleware_1.validate)(coupon_schema_1.createCouponSchema), (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.createCoupon));
// Update coupon (admin only)
router.put('/:couponId', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.COUPON_UPDATE]), (0, validation_middleware_1.validate)(coupon_schema_1.updateCouponSchema), (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.updateCoupon));
// Delete coupon (admin only)
router.delete('/:couponId', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.COUPON_DELETE]), (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.deleteCoupon));
// Apply coupon (increment usage - for internal use during checkout)
router.patch('/:couponId/apply', (0, error_middleware_1.asyncHandler)(coupon_controller_1.CouponController.applyCoupon));
exports.default = router;
