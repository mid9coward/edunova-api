"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponController = void 0;
const coupon_service_1 = require("../services/coupon.service");
const success_1 = require("../utils/success");
/**
 * Coupon Controller
 * Simple CRUD operations for coupons
 */
class CouponController {
    /**
     * Create new coupon
     */
    static async createCoupon(req, res) {
        const couponData = req.body;
        const coupon = await coupon_service_1.CouponService.createCoupon(couponData);
        success_1.sendSuccess.created(res, 'Coupon created successfully', { coupon });
    }
    /**
     * Get all coupons with pagination and filtering
     */
    static async getCoupons(req, res) {
        const query = req.query;
        const result = await coupon_service_1.CouponService.getCoupons(query);
        success_1.sendSuccess.ok(res, 'Coupons fetched successfully', result);
    }
    /**
     * Get active coupons only
     */
    static async getActiveCoupons(req, res) {
        const coupons = await coupon_service_1.CouponService.getActiveCoupons();
        success_1.sendSuccess.ok(res, 'Active coupons fetched successfully', { coupons });
    }
    /**
     * Get coupon by ID
     */
    static async getCouponById(req, res) {
        const { couponId } = req.params;
        const coupon = await coupon_service_1.CouponService.getCouponById(couponId);
        success_1.sendSuccess.ok(res, 'Coupon fetched successfully', { coupon });
    }
    /**
     * Update coupon
     */
    static async updateCoupon(req, res) {
        const { couponId } = req.params;
        const updateData = req.body;
        const coupon = await coupon_service_1.CouponService.updateCoupon(couponId, updateData);
        success_1.sendSuccess.ok(res, 'Coupon updated successfully', { coupon });
    }
    /**
     * Delete coupon
     */
    static async deleteCoupon(req, res) {
        const { couponId } = req.params;
        await coupon_service_1.CouponService.deleteCoupon(couponId);
        success_1.sendSuccess.ok(res, 'Coupon deleted successfully');
    }
    /**
     * Validate coupon code
     */
    static async validateCoupon(req, res) {
        const validationData = req.body;
        const result = await coupon_service_1.CouponService.validateCoupon(validationData);
        success_1.sendSuccess.ok(res, 'Coupon is valid', result);
    }
    /**
     * Apply coupon (for checkout process)
     */
    static async applyCoupon(req, res) {
        const { couponId } = req.params;
        const coupon = await coupon_service_1.CouponService.applyCoupon(couponId);
        success_1.sendSuccess.ok(res, 'Coupon applied successfully', { coupon });
    }
}
exports.CouponController = CouponController;
