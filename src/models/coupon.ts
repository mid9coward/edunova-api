import mongoose, { Document, Schema } from 'mongoose'
import { CouponDiscountType } from '../enums'

export interface ICoupon extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  code: string
  discountType: CouponDiscountType
  discountValue: number
  courseIds: mongoose.Types.ObjectId[]
  minPurchaseAmount: number
  maxUses?: number
  usedCount: number
  startDate: Date
  endDate?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const couponSchema = new Schema<ICoupon>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    // Discount type: percentage or fixed amount
    discountType: {
      type: String,
      enum: Object.values(CouponDiscountType),
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    courseIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    // Eligibility rules
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Usage control
    maxUses: {
      type: Number,
      min: 1
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Time validity
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    // Status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes for better performance
couponSchema.index({ isActive: 1 })
couponSchema.index({ startDate: 1, endDate: 1 })
couponSchema.index({ discountType: 1 })

export const Coupon = mongoose.model<ICoupon>('Coupon', couponSchema)
