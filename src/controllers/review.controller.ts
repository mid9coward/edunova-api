import { Request, Response } from 'express'
import { ReviewService } from '../services'
import { sendSuccess } from '../utils/success'
import type {
  CreateReviewInput,
  UpdateReviewInput,
  GetReviewsQuery,
  GetCourseReviewsQuery,
  GetUserReviewsQuery
} from '../schemas'

export class ReviewController {
  /**
   * Create a new review
   */
  static async createReview(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId
    const reviewData: CreateReviewInput = req.body

    const review = await ReviewService.createReview(userId, reviewData)

    sendSuccess.created(res, 'Review created successfully', { review })
  }

  /**
   * Get all reviews with pagination and filtering
   */
  static async getReviews(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetReviewsQuery

    const result = await ReviewService.getReviews(query)

    sendSuccess.ok(res, 'Reviews retrieved successfully', result)
  }

  /**
   * Get review by ID
   */
  static async getReviewById(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const review = await ReviewService.getReviewById(id as string)

    sendSuccess.ok(res, 'Review retrieved successfully', { review })
  }

  /**
   * Update review
   */
  static async updateReview(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user!.userId
    const updateData: UpdateReviewInput = req.body

    const review = await ReviewService.updateReview(id as string, userId, updateData)

    sendSuccess.ok(res, 'Review updated successfully', { review })
  }

  /**
   * Delete review
   */
  static async deleteReview(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user!.userId

    await ReviewService.deleteReview(id as string, userId)

    sendSuccess.ok(res, 'Review deleted successfully')
  }

  /**
   * Get reviews for a specific course
   */
  static async getCourseReviews(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params
    const query = req.query as unknown as GetCourseReviewsQuery

    const result = await ReviewService.getCourseReviews(courseId as string, query)

    sendSuccess.ok(res, 'Course reviews retrieved successfully', result)
  }

  /**
   * Get reviews by a specific user
   */
  static async getUserReviews(req: Request, res: Response): Promise<void> {
    const { userId } = req.params
    const query = req.query as unknown as GetUserReviewsQuery

    const result = await ReviewService.getUserReviews(userId as string, query)

    sendSuccess.ok(res, 'User reviews retrieved successfully', result)
  }

  /**
   * Get course rating statistics
   */
  static async getCourseRatingStats(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params

    const stats = await ReviewService.getCourseRatingStats(courseId as string)

    sendSuccess.ok(res, 'Course rating statistics retrieved successfully', stats)
  }

  /**
   * Admin: Update review status
   */
  static async updateReviewStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { status } = req.body

    const review = await ReviewService.updateReviewStatus(id as string, status)

    sendSuccess.ok(res, 'Review status updated successfully', { review })
  }
}
