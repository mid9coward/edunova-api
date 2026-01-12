import mongoose, { FilterQuery } from 'mongoose'
import { Course, ICourse } from '../models/course'
import { Category } from '../models/category'
import { User } from '../models/user'
import { NotFoundError, ValidationError, ConflictError, ErrorCodes } from '../utils/errors'
import { CreateCourseInput, UpdateCourseInput, GetCoursesQuery } from '../schemas/course.schema'
import { PopulatedCourse, GetCoursesResult } from '../types/course'
import { CourseStatus } from '../enums'

/**
 * Course Management Service
 * Handles CRUD operations and course-related business logic
 */

export class CourseService {
  /**
   * Helper method to get course with aggregation lookup
   */
  private static async getCourseWithLookup(courseId: string): Promise<PopulatedCourse> {
    const courses = await Course.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(courseId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapterIds',
          foreignField: '_id',
          as: 'chapters',
          pipeline: [{ $project: { title: 1, description: 1, order: 1, isPublished: 1 } }]
        }
      },
      {
        $addFields: {
          authorId: '$authorId',
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      }
    ])

    return courses[0]
  }

  /**
   * Create a new course
   */
  static async createCourse(courseData: CreateCourseInput): Promise<ICourse> {
    // Check if slug already exists
    const existingCourse = await Course.findOne({ slug: courseData.slug })
    if (existingCourse) {
      throw new ConflictError('Course with this slug already exists', ErrorCodes.DUPLICATE_ENTRY)
    }

    // Validate category exists
    const category = await Category.findById(courseData.categoryId)
    if (!category) {
      throw new NotFoundError('Category not found', ErrorCodes.CATEGORY_NOT_FOUND)
    }

    const course = new Course({
      ...courseData,
      chapterIds: [],
      view: 0,
      sold: 0
    })

    await course.save()

    return course
  }

  /**
   * Get all courses with filtering, sorting, and pagination
   */
  static async getCourses(options: Partial<GetCoursesQuery> = {}): Promise<GetCoursesResult> {
    const {
      page = 1,
      limit = 10,
      search,
      level,
      status,
      type,
      authorId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: FilterQuery<ICourse> = {}

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ]
    }

    if (level) {
      if (Array.isArray(level)) {
        // Multiple level values
        filter.level = { $in: level }
      } else {
        // Single level value
        filter.level = level
      }
    }

    if (status) {
      if (Array.isArray(status)) {
        // Multiple status values
        filter.status = { $in: status }
      } else {
        // Single status value
        filter.status = status
      }
    }

    if (type) {
      if (Array.isArray(type)) {
        // Multiple type values - handle both 'free' and 'paid'
        const typeConditions: FilterQuery<ICourse>[] = type
          .map((t) => {
            if (t === 'free') {
              return { isFree: true } as FilterQuery<ICourse>
            } else if (t === 'paid') {
              return { isFree: false } as FilterQuery<ICourse>
            }
            return null
          })
          .filter((condition): condition is FilterQuery<ICourse> => condition !== null)

        if (typeConditions.length > 0) {
          if (filter.$or) {
            filter.$or = [...filter.$or, ...typeConditions]
          } else {
            filter.$or = typeConditions
          }
        }
      } else {
        // Single type value
        if (type === 'free') {
          filter.isFree = true
        } else if (type === 'paid') {
          filter.isFree = false
        }
      }
    }

    if (authorId) {
      filter.authorId = authorId
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [courses, total] = await Promise.all([
      Course.aggregate([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
            pipeline: [{ $project: { name: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'chapters',
            localField: 'chapterIds',
            foreignField: '_id',
            as: 'chapters',
            pipeline: [{ $project: { title: 1, description: 1, order: 1, isPublished: 1 } }]
          }
        },
        {
          $addFields: {
            authorId: '$authorId',
            author: { $arrayElemAt: ['$author', 0] },
            category: { $arrayElemAt: ['$category', 0] }
          }
        }
      ]),
      Course.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get public courses (only published courses with advanced filtering)
   */
  static async getPublicCourses(options: Partial<GetCoursesQuery> = {}): Promise<GetCoursesResult> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      level,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build aggregation pipeline
    const pipeline: mongoose.PipelineStage[] = []

    // Step 1: Match published courses only
    const matchStage: Record<string, unknown> = {
      status: CourseStatus.PUBLISHED
    }

    // Search filter - search in title and description
    if (search) {
      matchStage.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ]
    }

    // Category filter
    if (categoryId && categoryId !== 'all') {
      matchStage.categoryId = new mongoose.Types.ObjectId(categoryId)
    }

    // Level filter - support multiple levels
    if (level && level.length > 0) {
      if (Array.isArray(level)) {
        matchStage.level = { $in: level }
      } else if (typeof level === 'string' && level.includes(',')) {
        const levelArray = level.split(',').map((l) => l.trim())
        matchStage.level = { $in: levelArray }
      } else {
        matchStage.level = level
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {}
      if (minPrice !== undefined) priceFilter.$gte = +minPrice
      if (maxPrice !== undefined) priceFilter.$lte = +maxPrice
      matchStage.price = priceFilter
    }

    pipeline.push({ $match: matchStage })

    // Step 2: Lookup related data
    pipeline.push(
      // Lookup author
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                username: 1,
                email: 1,
                avatar: 1,
                firstName: 1,
                lastName: 1
              }
            }
          ]
        }
      },
      // Lookup category
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }]
        }
      },
      // Lookup published lessons
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'courseId',
          as: 'lessons',
          pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
        }
      },
      // Lookup reviews
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'courseId',
          as: 'reviews',
          pipeline: [
            {
              $project: {
                star: 1,
                userId: 1,
                createdAt: 1
              }
            }
          ]
        }
      },
      // Lookup enrolled users
      {
        $lookup: {
          from: 'users',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$courseId', '$courses']
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'enrolledUsers'
        }
      }
    )

    // Step 3: Add computed fields
    pipeline.push({
      $addFields: {
        author: { $arrayElemAt: ['$author', 0] },
        category: { $arrayElemAt: ['$category', 0] },
        // Calculate total duration from all published lessons
        totalDuration: {
          $sum: '$lessons.duration'
        },
        // Calculate lesson count from all published lessons
        totalLessons: {
          $size: '$lessons'
        },
        // Calculate average rating
        averageRating: {
          $cond: {
            if: { $gt: [{ $size: '$reviews' }, 0] },
            then: { $round: [{ $avg: '$reviews.star' }, 2] },
            else: 0
          }
        },
        // Count total reviews
        totalReviews: { $size: '$reviews' },
        // Count enrolled students
        enrolledStudents: { $size: '$enrolledUsers' }
      }
    })

    // Step 4: Filter by rating if specified
    if (minRating && +minRating > 0) {
      pipeline.push({
        $match: {
          averageRating: { $gte: +minRating }
        }
      })
    }

    // Step 5: Build sort object based on sortBy parameter
    const getSortObject = (sortBy: string, sortOrder: string): Record<string, 1 | -1> => {
      const order = sortOrder === 'desc' ? (-1 as const) : (1 as const)

      switch (sortBy) {
        case 'newest':
          return { createdAt: -1 }
        case 'popular':
          return { enrolledStudents: -1, view: -1 }
        case 'rating':
          return { averageRating: -1, totalReviews: -1 }
        case 'price':
          return { price: order }
        case 'alphabetical':
          return { title: 1 }
        case 'createdAt':
        default:
          return { createdAt: order }
      }
    }

    pipeline.push({ $sort: getSortObject(sortBy, sortOrder) })

    // Step 6: Project final fields
    pipeline.push({
      $project: {
        // Course basic info
        _id: 1,
        title: 1,
        description: 1,
        excerpt: 1,
        slug: 1,
        image: 1,
        level: 1,
        price: 1,
        isFree: 1,
        oldPrice: 1,
        originalPrice: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        view: 1,
        sold: 1,

        // Computed fields
        totalDuration: 1,
        totalLessons: 1,
        averageRating: 1,
        totalReviews: 1,
        enrolledStudents: 1,

        // Related data
        author: 1,
        authorId: 1,
        category: 1
      }
    })

    // Execute count pipeline (without pagination)
    const countPipeline = [...pipeline]
    countPipeline.push({ $count: 'total' })

    // Add pagination to main pipeline
    pipeline.push({ $skip: skip }, { $limit: limitNum })

    // Execute both pipelines in parallel
    const [coursesResult, countResult] = await Promise.all([
      Course.aggregate(pipeline),
      Course.aggregate(countPipeline)
    ])

    const total = countResult[0]?.total || 0
    const totalPages = Math.ceil(total / limitNum)

    return {
      courses: coursesResult,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get free courses (only published free courses)
   */
  static async getFreeCourses(options: Partial<GetCoursesQuery> = {}): Promise<GetCoursesResult> {
    const { page = 1, limit = 10, search, categoryId, level, sortBy = 'createdAt', sortOrder = 'desc' } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query - always force published and free courses
    const filter: FilterQuery<ICourse> = {
      status: CourseStatus.PUBLISHED,
      isFree: true
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ]
    }

    if (categoryId && categoryId !== 'all') {
      filter.categoryId = categoryId
    }

    if (level && level.length > 0) {
      if (Array.isArray(level)) {
        filter.level = { $in: level }
      } else {
        filter.level = level
      }
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [courses, total] = await Promise.all([
      Course.aggregate([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
            pipeline: [
              {
                $project: {
                  username: 1,
                  email: 1,
                  avatar: 1,
                  firstName: 1,
                  lastName: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
            pipeline: [{ $project: { name: 1, slug: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'chapters',
            localField: 'chapterIds',
            foreignField: '_id',
            as: 'chapters',
            pipeline: [
              { $match: { isPublished: true } },
              {
                $project: {
                  title: 1,
                  description: 1,
                  order: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'lessons',
            localField: '_id',
            foreignField: 'courseId',
            as: 'lessons',
            pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'courseId',
            as: 'reviews',
            pipeline: [
              {
                $project: {
                  star: 1,
                  userId: 1,
                  createdAt: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'courses',
            as: 'enrolledUsers'
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ['$author', 0] },
            category: { $arrayElemAt: ['$category', 0] },

            // Calculate total duration
            totalDuration: { $sum: '$lessons.duration' },

            // Count total lessons
            totalLessons: { $size: '$lessons' },

            // Calculate average rating
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: '$reviews' }, 0] },
                then: { $avg: '$reviews.star' },
                else: 0
              }
            },

            // Count total reviews
            totalReviews: { $size: '$reviews' },

            // Count enrolled students
            enrolledStudents: { $size: '$enrolledUsers' }
          }
        },
        {
          $project: {
            title: 1,
            slug: 1,
            image: 1,
            description: 1,
            excerpt: 1,
            introUrl: 1,
            price: 1,
            oldPrice: 1,
            originalPrice: 1,
            isFree: 1,
            status: 1,
            level: 1,
            createdAt: 1,
            updatedAt: 1,
            view: 1,
            sold: 1,

            // Computed fields
            totalDuration: 1,
            totalLessons: 1,
            averageRating: 1,
            totalReviews: 1,
            enrolledStudents: 1,

            // Related data
            author: 1,
            authorId: 1,
            category: 1
          }
        }
      ]),
      Course.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      courses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }
  static async getCourseBySlug(slug: string): Promise<PopulatedCourse> {
    const filter: FilterQuery<ICourse> = { slug, status: CourseStatus.PUBLISHED }

    const [course] = await Course.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'courseId',
          as: 'lessons',
          pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'courseId',
          as: 'reviews',
          pipeline: [
            {
              $project: {
                star: 1,
                comment: 1,
                userId: 1,
                createdAt: 1
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$courseId', '$courses']
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'enrolledUsers'
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] },
          // Calculate total duration from all published lessons
          totalDuration: {
            $sum: '$lessons.duration'
          },
          // Calculate lesson count from all published lessons
          totalLessons: {
            $size: '$lessons'
          },
          // Calculate average rating
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.star' }, 2] },
              else: 0
            }
          },
          // Count total reviews
          totalReviews: { $size: '$reviews' },
          // Count enrolled students
          enrolledStudents: { $size: '$enrolledUsers' }
        }
      },
      {
        $project: {
          // Course basic info
          _id: 1,
          title: 1,
          description: 1,
          excerpt: 1,
          slug: 1,
          image: 1,
          level: 1,
          price: 1,
          isFree: 1,
          oldPrice: 1,
          originalPrice: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          view: 1,
          sold: 1,
          info: 1,
          introUrl: 1,

          // Computed fields
          totalDuration: 1,
          totalLessons: 1,
          averageRating: 1,
          totalReviews: 1,
          enrolledStudents: 1,

          // Related data
          author: 1,
          authorId: 1,
          category: 1
        }
      }
    ])

    if (!course) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    return course
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: string, includeUnpublished: boolean = false): Promise<PopulatedCourse> {
    const filter: FilterQuery<ICourse> = { _id: courseId }
    if (!includeUnpublished) {
      filter.status = CourseStatus.PUBLISHED
    }

    const courses = await Course.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapterIds',
          foreignField: '_id',
          as: 'chapters',
          pipeline: [{ $project: { title: 1, description: 1, order: 1, isPublished: 1, duration: 1 } }]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      }
    ])

    if (!courses.length) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    return courses[0]
  }

  /**
   * Update course
   */
  static async updateCourse(courseId: string, updateData: UpdateCourseInput): Promise<PopulatedCourse> {
    const course = await Course.findById(courseId)
    if (!course) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    // Check if slug is being updated and already exists
    if (updateData.slug && updateData.slug !== course.slug) {
      const existingCourse = await Course.findOne({ slug: updateData.slug })
      if (existingCourse) {
        throw new ConflictError('Course with this slug already exists', ErrorCodes.DUPLICATE_ENTRY)
      }
    }

    // Validate author if being updated
    if (updateData.authorId) {
      const author = await User.findById(updateData.authorId)
      if (!author) {
        throw new NotFoundError('Author not found', ErrorCodes.USER_NOT_FOUND)
      }
    }

    // Validate category if being updated
    if (updateData.categoryId) {
      const category = await Category.findById(updateData.categoryId)
      if (!category) {
        throw new NotFoundError('Category not found', ErrorCodes.CATEGORY_NOT_FOUND)
      }
    }

    // Update the course
    Object.assign(course, updateData)
    await course.save()

    // Get course with lookup data
    return await this.getCourseWithLookup(courseId)
  }

  /**
   * Delete course
   */
  static async deleteCourse(courseId: string): Promise<void> {
    const course = await Course.findById(courseId)
    if (!course) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    // Check if course is enrolled by any users
    const enrolledUsers = await User.countDocuments({ courses: courseId })
    if (enrolledUsers > 0) {
      throw new ConflictError(
        `Cannot delete course. It has ${enrolledUsers} enrolled user(s)`,
        ErrorCodes.UNAUTHORIZED_ACTION
      )
    }

    // Remove course from any user's course arrays (just in case)
    await User.updateMany({ courses: courseId }, { $pull: { courses: courseId } })

    // Delete the course
    await Course.findByIdAndDelete(courseId)
  }

  /**
   * Increment course view count
   */
  static async incrementView(courseId: string): Promise<void> {
    await Course.findByIdAndUpdate(courseId, { $inc: { view: 1 } })
  }

  /**
   * Increment course sold count
   */
  static async incrementSold(courseId: string): Promise<void> {
    await Course.findByIdAndUpdate(courseId, { $inc: { sold: 1 } })
  }

  /**
   * Enroll user in free course
   */
  static async enrollInFreeCourse(courseId: string, userId: string): Promise<void> {
    // Check if course exists and is free
    const course = await Course.findById(courseId)
    if (!course) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    if (!course.isFree) {
      throw new ValidationError('This course is not free', ErrorCodes.COUPON_NOT_APPLICABLE)
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ValidationError('Course is not published', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    // Check if user is already enrolled
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    // Check if already enrolled
    const courseObjectId = new mongoose.Types.ObjectId(courseId)
    if (user.courses && user.courses.some((c) => c.toString() === courseId)) {
      throw new ConflictError('Already enrolled in this course', ErrorCodes.DUPLICATE_ENTRY)
    }

    // Add course to user's enrolled courses and increment sold count
    await User.findByIdAndUpdate(userId, { $addToSet: { courses: courseObjectId } })
    await Course.findByIdAndUpdate(courseId, { $inc: { sold: 1 } })
  }

  /**
   * Bulk delete courses
   */
  static async bulkDelete(courseIds: string[]): Promise<void> {
    const validIds = courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
    if (validIds.length !== courseIds.length) {
      throw new ValidationError('Some course IDs are invalid', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Check if any courses have enrolled users
    const enrolledUsersCount = await User.countDocuments({ courses: { $in: validIds } })
    if (enrolledUsersCount > 0) {
      throw new ConflictError('Cannot delete courses that have enrolled users', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    // Remove courses from user arrays
    await User.updateMany({ courses: { $in: validIds } }, { $pull: { courses: { $in: validIds } } })

    // Delete courses
    await Course.deleteMany({ _id: { $in: validIds } })
  }

  /**
   * Get related courses based on category, level, and tags
   */
  static async getRelatedCourses(courseId: string, limit: number = 10): Promise<PopulatedCourse[]> {
    // First get the source course to find related courses
    const sourceCourse = await Course.findById(courseId)
    if (!sourceCourse) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    // Build aggregation pipeline for related courses
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(courseId) }, // Exclude the source course
          status: CourseStatus.PUBLISHED, // Only published courses
          $or: [
            { categoryId: sourceCourse.categoryId }, // Same category
            { level: sourceCourse.level }, // Same level
            { authorId: sourceCourse.authorId } // Same author
          ]
        }
      },
      {
        $addFields: {
          // Calculate relevance score
          relevanceScore: {
            $add: [
              { $cond: [{ $eq: ['$categoryId', sourceCourse.categoryId] }, 3, 0] }, // Category match = 3 points
              { $cond: [{ $eq: ['$level', sourceCourse.level] }, 2, 0] }, // Level match = 2 points
              { $cond: [{ $eq: ['$authorId', sourceCourse.authorId] }, 1, 0] } // Author match = 1 point
            ]
          }
        }
      },
      { $sort: { relevanceScore: -1, sold: -1, view: -1 } }, // Sort by relevance, then popularity
      { $limit: limit },
      // Lookup related data
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'courseId',
          as: 'lessons',
          pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { courseId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$courseId', '$courses']
                }
              }
            },
            { $project: { _id: 1 } }
          ],
          as: 'enrolledUsers'
        }
      },
      {
        $addFields: {
          // Calculate total duration from all published lessons
          totalDuration: {
            $sum: '$lessons.duration'
          },
          // Count enrolled students
          enrolledStudents: { $size: '$enrolledUsers' }
        }
      },
      {
        $unwind: { path: '$author', preserveNullAndEmptyArrays: true }
      },
      {
        $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          image: 1,
          description: 1,
          excerpt: 1,
          price: 1,
          oldPrice: 1,
          originalPrice: 1,
          isFree: 1,
          status: 1,
          view: 1,
          sold: 1,
          level: 1,
          totalDuration: 1,
          enrolledStudents: 1,
          author: 1,
          category: 1,
          createdAt: 1,
          updatedAt: 1,
          relevanceScore: 1
        }
      }
    ]

    const courses = await Course.aggregate(pipeline)

    return courses as PopulatedCourse[]
  }

  /**
   * Get courses that a user is enrolled in
   */
  static async getMyCourses(userId: string): Promise<PopulatedCourse[]> {
    // Validate user exists
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    // If user has no enrolled courses, return empty array
    if (!user.courses || user.courses.length === 0) {
      return []
    }

    // Get enrolled courses with only needed information
    const courses = await Course.aggregate([
      {
        $match: {
          _id: { $in: user.courses }
        }
      },
      // Lookup lessons for count
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: 'courseId',
          as: 'lessons',
          pipeline: [{ $match: { isPublished: true } }, { $project: { _id: 1 } }]
        }
      },
      // Lookup user's lesson progress from tracks
      {
        $lookup: {
          from: 'tracks',
          let: { courseId: '$_id', userId: new mongoose.Types.ObjectId(userId) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$courseId', '$$courseId'] }]
                }
              }
            },
            {
              $project: {
                lessonId: 1
              }
            }
          ],
          as: 'completedTracks'
        }
      },
      // Lookup reviews for rating
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'courseId',
          as: 'reviews',
          pipeline: [{ $project: { star: 1 } }]
        }
      },
      // Add computed fields
      {
        $addFields: {
          // Calculate lesson count from all published lessons
          totalLessons: {
            $size: '$lessons'
          },

          // Calculate completed lessons from tracks
          completedLessons: {
            $size: '$completedTracks'
          },

          // Calculate average rating
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.star' }, 2] },
              else: 0
            }
          },

          // Count total reviews
          totalReviews: { $size: '$reviews' }
        }
      },
      // Sort by creation date
      {
        $sort: { createdAt: -1 }
      },
      // Project only needed fields
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          description: 1,
          excerpt: 1,
          image: 1,
          level: 1,
          totalLessons: 1,
          completedLessons: 1,
          averageRating: 1,
          totalReviews: 1
        }
      }
    ])

    return courses as PopulatedCourse[]
  }
}
