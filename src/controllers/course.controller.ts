import { Request, Response } from 'express'
import { CourseService } from '../services/course.service'
import { CourseCompletionService } from '../services/course-completion.service'
import { sendSuccess } from '../utils/success'
import { AuthenticationError, ValidationError, ErrorCodes } from '../utils/errors'
import { CourseStatus } from '../enums'

/**
 * Course Management Controllers
 */

export class CourseController {
  /**
   * Create a new course
   */
  static async createCourse(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    const courseData = {
      ...req.body,
      authorId: userId
    }

    const course = await CourseService.createCourse(courseData)
    sendSuccess.created(res, 'Course created successfully', { course })
  }

  /**
   * Get all courses with pagination and filtering
   */
  static async getCourses(req: Request, res: Response): Promise<void> {
    const result = await CourseService.getCourses(req.query)
    sendSuccess.ok(res, 'Courses retrieved successfully', result)
  }

  /**
   * Get public courses (only published courses)
   */
  static async getPublicCourses(req: Request, res: Response): Promise<void> {
    const result = await CourseService.getPublicCourses(req.query)
    sendSuccess.ok(res, 'Public courses retrieved successfully', result)
  }

  /**
   * Get free courses (only published free courses)
   */
  static async getFreeCourses(req: Request, res: Response): Promise<void> {
    const result = await CourseService.getFreeCourses(req.query)
    sendSuccess.ok(res, 'Free courses retrieved successfully', result)
  }

  /**
   * Get course by ID
   */
  static async getCourseById(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params

    // Allow access to unpublished courses for authors and admins
    const canViewUnpublished =
      req.userPermissions?.includes('course:update') || req.userPermissions?.includes('admin:access')

    const course = await CourseService.getCourseById(courseId as string, canViewUnpublished)

    // Increment view count for published courses only
    if (course.status === CourseStatus.PUBLISHED) {
      CourseService.incrementView(courseId as string)
    }

    sendSuccess.ok(res, 'Course retrieved successfully', { course })
  }

  /**
   * Get course by slug
   */
  static async getCourseBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params

    const course = await CourseService.getCourseBySlug(slug as string)

    // Increment view count for published courses only
    if (course.status === CourseStatus.PUBLISHED) {
      CourseService.incrementView(course._id.toString())
    }

    sendSuccess.ok(res, 'Course retrieved successfully', course)
  }

  /**
   * Update course
   */
  static async updateCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params
    const course = await CourseService.updateCourse(courseId as string, req.body)
    sendSuccess.ok(res, 'Course updated successfully', { course })
  }

  /**
   * Delete course
   */
  static async deleteCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params
    await CourseService.deleteCourse(courseId as string)
    sendSuccess.ok(res, 'Course deleted successfully')
  }

  /**
   * Get current user's courses
   */
  static async getMyCourses(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new AuthenticationError('User not authenticated', ErrorCodes.INVALID_CREDENTIALS)
    }
    const courses = await CourseService.getMyCourses(userId)

    sendSuccess.ok(res, 'Your courses retrieved successfully', courses)
  }

  /**
   * Get course completion status for current user
   */
  static async getCourseCompletion(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AuthenticationError('User not authenticated', ErrorCodes.INVALID_CREDENTIALS)
    }

    const { courseId } = req.params
    const completion = await CourseCompletionService.getCompletionStatus(userId, courseId as string)

    sendSuccess.ok(res, 'Course completion retrieved successfully', completion)
  }

  /**
   * Search courses
   */
  static async searchCourses(req: Request, res: Response): Promise<void> {
    const { q: search } = req.query

    if (!search || typeof search !== 'string') {
      throw new ValidationError('Search query is required', ErrorCodes.REQUIRED_FIELD_MISSING)
    }

    const result = await CourseService.getCourses({
      search,
      status: CourseStatus.PUBLISHED, // Only search published courses for public
      page: '1',
      limit: '10',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })

    sendSuccess.ok(res, 'Course search completed', result)
  }

  /**
   * Get featured courses
   */
  static async getFeaturedCourses(req: Request, res: Response): Promise<void> {
    const result = await CourseService.getCourses({
      status: CourseStatus.PUBLISHED,
      sortBy: 'popular',
      sortOrder: 'desc',
      limit: '10',
      page: '1'
    })

    sendSuccess.ok(res, 'Featured courses retrieved successfully', result)
  }

  /**
   * Get popular courses
   */
  static async getPopularCourses(req: Request, res: Response): Promise<void> {
    const result = await CourseService.getCourses({
      status: CourseStatus.PUBLISHED,
      sortBy: 'popular',
      sortOrder: 'desc',
      limit: '10',
      page: '1'
    })

    sendSuccess.ok(res, 'Popular courses retrieved successfully', result)
  }

  /**
   * Get latest courses
   */
  static async getLatestCourses(req: Request, res: Response): Promise<void> {
    const result = await CourseService.getCourses({
      status: CourseStatus.PUBLISHED,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: '10',
      page: '1'
    })

    sendSuccess.ok(res, 'Latest courses retrieved successfully', result)
  }

  /**
   * Bulk delete courses
   */
  static async bulkDelete(req: Request, res: Response): Promise<void> {
    const { courseIds } = req.body

    await CourseService.bulkDelete(courseIds)
    sendSuccess.ok(res, 'Courses deleted successfully')
  }

  /**
   * Enroll in course (increment sold count)
   */
  static async enrollInCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params

    await CourseService.incrementSold(courseId as string)
    sendSuccess.ok(res, 'Successfully enrolled in course')
  }

  /**
   * Enroll in free course
   */
  static async enrollInFreeCourse(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      throw new AuthenticationError('User authentication required', ErrorCodes.INVALID_CREDENTIALS)
    }

    await CourseService.enrollInFreeCourse(courseId as string, userId)
    sendSuccess.ok(res, 'Successfully enrolled in free course')
  }

  /**
   * Get related courses for a specific course
   */
  static async getRelatedCourses(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params
    const limit = parseInt(req.query.limit as string) || 5

    const result = await CourseService.getRelatedCourses(courseId as string, limit)
    sendSuccess.ok(res, 'Related courses retrieved successfully', result)
  }
}
