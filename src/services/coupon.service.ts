import mongoose from 'mongoose'
import { Coupon, ICoupon } from '../models/coupon'
import { Course } from '../models/course'
import { ValidationError, NotFoundError, ConflictError, ErrorCodes } from '../utils/errors'
import { CreateCouponInput, UpdateCouponInput, GetCouponsQuery, ApplyCouponInput } from '../schemas/coupon.schema'
import { CouponDiscountType } from '../enums'

/**
 * Coupon Management Service
 * Simple CRUD operations for coupons
 */

interface GetCouponsResult {
  coupons: ICoupon[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export class CouponService {
  /**
   * Create a new coupon
   */
  static async createCoupon(couponData: CreateCouponInput): Promise<ICoupon> {
    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: couponData.code.toUpperCase() })
    if (existingCoupon) {
      throw new ConflictError('Coupon code already exists', ErrorCodes.COUPON_CODE_EXISTS)
    }

    // Validate courses if provided
    if (couponData.courseIds && couponData.courseIds.length > 0) {
      const courseCount = await Course.countDocuments({ _id: { $in: couponData.courseIds } })
      if (courseCount !== couponData.courseIds.length) {
        throw new NotFoundError('Some courses do not exist', ErrorCodes.COURSE_NOT_FOUND)
      }
    }

    // Convert date strings to Date objects if provided
    const couponCreateData: Record<string, unknown> = {
      ...couponData,
      code: couponData.code.toUpperCase()
    }

    // Convert courseIds to ObjectIds if provided
    if (couponData.courseIds && couponData.courseIds.length > 0) {
      couponCreateData.courseIds = couponData.courseIds.map((id: string) => new mongoose.Types.ObjectId(id))
    }

    if (couponData.startDate) {
      couponCreateData.startDate = new Date(couponData.startDate)
    }

    if (couponData.endDate) {
      couponCreateData.endDate = new Date(couponData.endDate)
    }

    const coupon = new Coupon(couponCreateData)

    await coupon.save()
    return coupon
  }

  /**
   * Get all coupons with pagination and filtering
   */
  static async getCoupons(options: Partial<GetCouponsQuery> = {}): Promise<GetCouponsResult> {
    const { page = 1, limit = 10, search, isActive, discountType, sortBy = 'createdAt', sortOrder = 'desc' } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = {}

    if (search) {
      filter.$or = [{ title: { $regex: search, $options: 'i' } }, { code: { $regex: search, $options: 'i' } }]
    }

    if (isActive !== undefined) {
      filter.isActive = isActive
    }

    if (discountType) {
      filter.discountType = discountType
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [coupons, total] = await Promise.all([
      Coupon.find(filter).populate('courseIds', 'title').sort(sort).skip(skip).limit(limitNum).lean(),
      Coupon.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      coupons: coupons as ICoupon[],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  }

  /**
   * Get coupon by ID
   */
  static async getCouponById(couponId: string): Promise<ICoupon> {
    const coupon = await Coupon.findById(couponId).populate('courseIds', 'title')

    if (!coupon) {
      throw new NotFoundError('Coupon not found', ErrorCodes.COUPON_NOT_FOUND)
    }

    return coupon
  }

  /**
   * Update coupon
   */
  static async updateCoupon(couponId: string, updateData: UpdateCouponInput): Promise<ICoupon> {
    const coupon = await Coupon.findById(couponId)
    if (!coupon) {
      throw new NotFoundError('Coupon not found', ErrorCodes.COUPON_NOT_FOUND)
    }

    // Check if code is being updated and already exists
    if (updateData.code && updateData.code.toUpperCase() !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code: updateData.code.toUpperCase() })
      if (existingCoupon) {
        throw new ConflictError('Coupon code already exists', ErrorCodes.COUPON_CODE_EXISTS)
      }
    }

    // Validate courses if provided
    if (updateData.courseIds && updateData.courseIds.length > 0) {
      const courseCount = await Course.countDocuments({ _id: { $in: updateData.courseIds } })
      if (courseCount !== updateData.courseIds.length) {
        throw new NotFoundError('Some courses do not exist', ErrorCodes.COURSE_NOT_FOUND)
      }
    }

    // Prepare update object
    const updateObject: Partial<ICoupon> = {}

    if (updateData.title) updateObject.title = updateData.title
    if (updateData.isActive !== undefined) updateObject.isActive = updateData.isActive
    if (updateData.maxUses) updateObject.maxUses = updateData.maxUses
    if (updateData.minPurchaseAmount !== undefined) updateObject.minPurchaseAmount = updateData.minPurchaseAmount
    if (updateData.courseIds) {
      updateObject.courseIds = updateData.courseIds.map((id: string) => new mongoose.Types.ObjectId(id))
    }
    if (updateData.discountType) updateObject.discountType = updateData.discountType as CouponDiscountType
    if (updateData.discountValue) updateObject.discountValue = updateData.discountValue

    if (updateData.code) {
      updateObject.code = updateData.code.toUpperCase()
    }

    if (updateData.startDate) {
      updateObject.startDate = new Date(updateData.startDate)
    }

    if (updateData.endDate) {
      updateObject.endDate = new Date(updateData.endDate)
    }

    // Update the coupon
    Object.assign(coupon, updateObject)
    await coupon.save()

    return coupon
  }

  /**
   * Delete coupon
   */
  static async deleteCoupon(couponId: string): Promise<void> {
    const coupon = await Coupon.findById(couponId)
    if (!coupon) {
      throw new NotFoundError('Coupon not found', ErrorCodes.COUPON_NOT_FOUND)
    }

    await Coupon.findByIdAndDelete(couponId)
  }

  /**
   * Get all active coupons
   */
  static async getActiveCoupons(): Promise<ICoupon[]> {
    const now = new Date()
    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
      $expr: { $lt: ['$usedCount', { $ifNull: ['$maxUses', Number.MAX_SAFE_INTEGER] }] }
    })
      .populate('courseIds', 'title')
      .sort({ createdAt: -1 })

    return coupons
  }

  /**
   * Validate coupon - throws errors if invalid
   */
  static async validateCoupon(validationData: ApplyCouponInput): Promise<ICoupon> {
    const { code, courseIds } = validationData

    // Find coupon by code
    const coupon = await Coupon.findOne({ code: code.toUpperCase() }).populate('courseIds', 'title price')

    if (!coupon) {
      throw new NotFoundError('Invalid coupon code', ErrorCodes.COUPON_NOT_FOUND)
    }

    const now = new Date()

    // Check if coupon is active
    if (!coupon.isActive) {
      throw new ValidationError('Coupon is not active', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Check if coupon is within valid date range
    if (now < coupon.startDate) {
      throw new ValidationError('Coupon is not yet valid', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    if (coupon.endDate && now > coupon.endDate) {
      throw new ValidationError('Coupon has expired', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new ValidationError('Coupon usage limit exceeded', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Check if coupon applies to the specified courses
    if (coupon.courseIds.length > 0) {
      // Get the list of valid course IDs from the coupon
      const validCourseIds = coupon.courseIds.map((course: { _id: mongoose.Types.ObjectId }) => course._id.toString())

      // Check that ALL requested courses are included in the coupon's valid courses
      const allCoursesAreValid = courseIds.every((courseId) => validCourseIds.includes(courseId))

      if (!allCoursesAreValid) {
        throw new ValidationError('Coupon is not applicable to the selected courses', ErrorCodes.INVALID_INPUT_FORMAT)
      }
    }

    return coupon
  }

  /**
   * Apply coupon (increment usage count with validation)
   */
  static async applyCoupon(couponId: string, courseIds?: string[]): Promise<ICoupon> {
    // First, get the coupon to validate it
    const coupon = await Coupon.findById(couponId)

    if (!coupon) {
      throw new NotFoundError('Coupon not found', ErrorCodes.COUPON_NOT_FOUND)
    }

    // Use the existing validateCoupon function for validation (will throw errors if invalid)
    await this.validateCoupon({
      code: coupon.code,
      courseIds: courseIds || []
    })

    // If all validations pass, increment the usage count
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $inc: { usedCount: 1 } },
      { new: true, runValidators: true }
    )

    if (!updatedCoupon) {
      throw new NotFoundError('Coupon not found', ErrorCodes.COUPON_NOT_FOUND)
    }

    return updatedCoupon
  }

  /**
   * Get coupon statistics
   */
  static async getCouponStats(): Promise<{
    totalCoupons: number
    activeCoupons: number
    expiredCoupons: number
    fullyUsedCoupons: number
  }> {
    const now = new Date()

    const [totalCoupons, activeCoupons, expiredCoupons, fullyUsedCoupons] = await Promise.all([
      Coupon.countDocuments({}),
      Coupon.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }],
        $expr: { $lt: ['$usedCount', { $ifNull: ['$maxUses', Number.MAX_SAFE_INTEGER] }] }
      }),
      Coupon.countDocuments({
        $or: [{ isActive: false }, { endDate: { $lt: now } }]
      }),
      Coupon.countDocuments({
        maxUses: { $exists: true },
        $expr: { $gte: ['$usedCount', '$maxUses'] }
      })
    ])

    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      fullyUsedCoupons
    }
  }

  /**
   * Auto-expire coupons that have passed their end date
   */
  static async autoExpireCoupons(): Promise<number> {
    const now = new Date()

    const result = await Coupon.updateMany(
      {
        isActive: true,
        endDate: { $lt: now }
      },
      {
        $set: { isActive: false }
      }
    )

    return result.modifiedCount
  }

  /**
   * Check if a coupon can be used by a specific user (for future user-specific restrictions)
   */
  static async canUseByUser(couponId: string, userId?: string): Promise<boolean> {
    const coupon = await Coupon.findById(couponId)
    if (!coupon) {
      throw new NotFoundError('Coupon not found', ErrorCodes.COUPON_NOT_FOUND)
    }

    const now = new Date()

    // Check basic coupon validity
    const isValid =
      coupon.isActive &&
      now >= coupon.startDate &&
      (!coupon.endDate || now <= coupon.endDate) &&
      (!coupon.maxUses || coupon.usedCount < coupon.maxUses)

    // Additional user-specific checks can be added here in the future
    // For example: user usage history, user tier restrictions, etc.
    // The userId parameter is reserved for future implementation
    if (userId) {
      // Future: Check user-specific usage limits, restrictions, etc.
      // For now, just return the basic validity
    }

    return isValid
  }
}
