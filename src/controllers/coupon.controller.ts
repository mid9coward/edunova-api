import { Request, Response } from 'express'
import { CouponService } from '../services/coupon.service'
import { sendSuccess } from '../utils/success'
import { CreateCouponInput, UpdateCouponInput, GetCouponsQuery, ApplyCouponInput } from '../schemas/coupon.schema'

/**
 * Coupon Controller
 * Simple CRUD operations for coupons
 */

export class CouponController {
  /**
   * Create new coupon
   */
  static async createCoupon(req: Request, res: Response): Promise<void> {
    const couponData: CreateCouponInput = req.body
    const coupon = await CouponService.createCoupon(couponData)

    sendSuccess.created(res, 'Coupon created successfully', { coupon })
  }

  /**
   * Get all coupons with pagination and filtering
   */
  static async getCoupons(req: Request, res: Response): Promise<void> {
    const query: Partial<GetCouponsQuery> = req.query
    const result = await CouponService.getCoupons(query)

    sendSuccess.ok(res, 'Coupons fetched successfully', result)
  }

  /**
   * Get active coupons only
   */
  static async getActiveCoupons(req: Request, res: Response): Promise<void> {
    const coupons = await CouponService.getActiveCoupons()

    sendSuccess.ok(res, 'Active coupons fetched successfully', { coupons })
  }

  /**
   * Get coupon by ID
   */
  static async getCouponById(req: Request, res: Response): Promise<void> {
    const { couponId } = req.params
    const coupon = await CouponService.getCouponById(couponId as string)

    sendSuccess.ok(res, 'Coupon fetched successfully', { coupon })
  }

  /**
   * Update coupon
   */
  static async updateCoupon(req: Request, res: Response): Promise<void> {
    const { couponId } = req.params
    const updateData: UpdateCouponInput = req.body
    const coupon = await CouponService.updateCoupon(couponId as string, updateData)

    sendSuccess.ok(res, 'Coupon updated successfully', { coupon })
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(req: Request, res: Response): Promise<void> {
    const { couponId } = req.params
    await CouponService.deleteCoupon(couponId as string)

    sendSuccess.ok(res, 'Coupon deleted successfully')
  }

  /**
   * Validate coupon code
   */
  static async validateCoupon(req: Request, res: Response): Promise<void> {
    const validationData: ApplyCouponInput = req.body
    const result = await CouponService.validateCoupon(validationData)

    sendSuccess.ok(res, 'Coupon is valid', result)
  }

  /**
   * Apply coupon (for checkout process)
   */
  static async applyCoupon(req: Request, res: Response): Promise<void> {
    const { couponId } = req.params
    const coupon = await CouponService.applyCoupon(couponId as string)

    sendSuccess.ok(res, 'Coupon applied successfully', { coupon })
  }
}
