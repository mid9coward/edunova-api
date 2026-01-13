import { Types } from 'mongoose'
import { Review, Course, User, type IReview } from '../models'
import { ValidationError, NotFoundError, ErrorCodes } from '../utils/errors'
import { ReviewStatus } from '../enums'
import type {
  CreateReviewInput,
  UpdateReviewInput,
  GetReviewsQuery,
  GetCourseReviewsQuery,
  GetUserReviewsQuery
} from '../schemas'

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(userId: string, reviewData: CreateReviewInput): Promise<IReview> {
    // Check if course exists
    const courseExists = await Course.exists({ _id: reviewData.courseId })
    if (!courseExists) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    const review = await Review.create({
      userId: userId,
      courseId: reviewData.courseId,
      star: reviewData.star,
      content: reviewData.content
    })

    return review
  }

  /**
   * Get all reviews with pagination and filtering
   */
  static async getReviews(options: Partial<GetReviewsQuery> = {}): Promise<{
    reviews: IReview[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      courseId,
      userId,
      status,
      star,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = {}

    if (search) {
      filter.content = { $regex: search, $options: 'i' }
    }

    if (courseId) {
      filter.courseId = courseId
    }

    if (userId) {
      filter.userId = userId
    }

    if (status) {
      filter.status = status
    }

    if (star) {
      filter.star = star
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [reviews, total] = await Promise.all([
      Review.find(filter).populate('userDetails', 'username email avatar').sort(sort).skip(skip).limit(limitNum).lean(),
      Review.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      reviews: reviews as unknown as IReview[],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  }

  /**
   * Get review by ID
   */
  static async getReviewById(reviewId: string): Promise<IReview> {
    const review = await Review.findById(reviewId).populate('userDetails', 'username email avatar')

    if (!review) {
      throw new NotFoundError('Review not found', ErrorCodes.REVIEW_NOT_FOUND)
    }

    return review
  }

  /**
   * Update review
   */
  static async updateReview(reviewId: string, userId: string, updateData: UpdateReviewInput): Promise<IReview> {
    const review = await Review.findById(reviewId)
    if (!review) {
      throw new NotFoundError('Review not found', ErrorCodes.REVIEW_NOT_FOUND)
    }

    // Check if user owns this review or is admin
    if (review.userId.toString() !== userId) {
      throw new ValidationError('You can only update your own reviews', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    // Update fields
    if (updateData.star !== undefined) {
      review.star = updateData.star
    }

    if (updateData.content !== undefined) {
      review.content = updateData.content
    }

    if (updateData.status !== undefined) {
      review.status = updateData.status as ReviewStatus
    }

    await review.save()

    return review
  }

  /**
   * Delete review
   */
  static async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await Review.findById(reviewId)
    if (!review) {
      throw new NotFoundError('Review not found', ErrorCodes.REVIEW_NOT_FOUND)
    }

    // Check if user owns this review
    if (review.userId.toString() !== userId) {
      throw new ValidationError('You can only delete your own reviews', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    await Review.findByIdAndDelete(reviewId)
  }

  /**
   * Get reviews for a specific course
   */
  static async getCourseReviews(
    courseId: string,
    options: Partial<GetCourseReviewsQuery> = {}
  ): Promise<{
    reviews: IReview[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
    averageRating: number
    ratingDistribution: Record<number, number>
  }> {
    // Check if course exists
    const courseExists = await Course.exists({ _id: courseId })
    if (!courseExists) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    const { page = 1, limit = 10, status, minStar, sortBy = 'createdAt', sortOrder = 'desc' } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = { courseId: courseId }

    if (status) {
      filter.status = status
    }

    if (minStar) {
      filter.star = { $gte: minStar }
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [reviews, total, ratingStats, ratingDistribution] = await Promise.all([
      Review.find(filter).populate('user', 'username email avatar').sort(sort).skip(skip).limit(limitNum).lean(),
      Review.countDocuments(filter),
      Review.getAverageRating(new Types.ObjectId(courseId)),
      Review.getRatingDistribution(new Types.ObjectId(courseId))
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      reviews: reviews as unknown as IReview[],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      averageRating: ratingStats.averageRating || 0,
      ratingDistribution
    }
  }

  /**
   * Get reviews by a specific user
   */
  static async getUserReviews(
    userId: string,
    options: Partial<GetUserReviewsQuery> = {}
  ): Promise<{
    reviews: IReview[]
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }> {
    // Check if user exists
    const userExists = await User.exists({ _id: userId })
    if (!userExists) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    const { page = 1, limit = 10, status, star, sortBy = 'createdAt', sortOrder = 'desc' } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = { userId: userId }

    if (status) {
      filter.status = status
    }

    if (star) {
      filter.star = star
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [reviews, total] = await Promise.all([
      Review.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Review.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      reviews: reviews as unknown as IReview[],
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1
    }
  }

  /**
   * Get course rating statistics
   */
  static async getCourseRatingStats(courseId: string): Promise<{
    averageRating: number
    totalReviews: number
    ratingDistribution: Record<number, number>
  }> {
    // Check if course exists
    const courseExists = await Course.exists({ _id: courseId })
    if (!courseExists) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    const [ratingStats, ratingDistribution] = await Promise.all([
      Review.getAverageRating(new Types.ObjectId(courseId)),
      Review.getRatingDistribution(new Types.ObjectId(courseId))
    ])

    return {
      averageRating: ratingStats.averageRating || 0,
      totalReviews: ratingStats.totalReviews || 0,
      ratingDistribution
    }
  }

  /**
   * Admin: Update review status
   */
  static async updateReviewStatus(reviewId: string, status: 'active' | 'inactive'): Promise<IReview> {
    const review = await Review.findByIdAndUpdate(reviewId, { status }, { new: true, runValidators: true })

    if (!review) {
      throw new NotFoundError('Review not found', ErrorCodes.REVIEW_NOT_FOUND)
    }

    return review
  }
}
