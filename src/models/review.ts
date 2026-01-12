import mongoose, { Document, Schema, Types, Model } from 'mongoose'
import { ReviewStatus } from '../enums'

export interface IReview extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  courseId: Types.ObjectId
  star: number
  content: string
  status: ReviewStatus
  createdAt: Date
  updatedAt: Date
}

// Interface for static methods
interface IReviewModel extends Model<IReview> {
  getAverageRating(courseId: Types.ObjectId): Promise<{ averageRating: number; totalReviews: number }>
  getRatingDistribution(courseId: Types.ObjectId): Promise<Record<number, number>>
}

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    star: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.ACTIVE
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
)

// Compound index to ensure one review per user per course
reviewSchema.index({ userId: 1, courseId: 1 })

// Additional indexes for efficient queries
reviewSchema.index({ courseId: 1, status: 1 })
reviewSchema.index({ userId: 1, status: 1 })
reviewSchema.index({ star: 1 })
reviewSchema.index({ createdAt: -1 })

// Virtual for populating user details
reviewSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
})

// Static method to get average rating for a course
reviewSchema.statics.getAverageRating = async function (courseId: Types.ObjectId) {
  const result = await this.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: ReviewStatus.ACTIVE
      }
    },
    {
      $group: {
        _id: '$courseId',
        averageRating: { $avg: '$star' },
        totalReviews: { $sum: 1 }
      }
    }
  ])

  return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 }
}

// Static method to get rating distribution for a course
reviewSchema.statics.getRatingDistribution = async function (courseId: Types.ObjectId) {
  const result = await this.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        status: ReviewStatus.ACTIVE
      }
    },
    {
      $group: {
        _id: '$star',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: -1 }
    }
  ])

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  result.forEach((item) => {
    distribution[item._id as keyof typeof distribution] = item.count
  })

  return distribution
}

export const Review = mongoose.model<IReview, IReviewModel>('Review', reviewSchema)
