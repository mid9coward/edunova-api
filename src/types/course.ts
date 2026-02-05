import { CourseLevel, CourseStatus } from '../enums'

/**
 * Course-related interfaces and types
 */

export interface PopulatedCourse {
  _id: string
  title: string
  slug: string
  image?: string
  description: string
  excerpt?: string
  introUrl?: string
  price: number
  originalPrice?: number
  oldPrice?: number
  isFree?: boolean
  status: CourseStatus
  authorId: string
  categoryId: string
  chapterIds: string[]
  view: number
  sold: number
  level: CourseLevel
  info?: {
    requirements: string[]
    benefits: string[]
    techniques: string[]
    documents: string[]
    qa: Array<{
      question: string
      answer: string
    }>
  }
  // Computed fields from aggregation
  totalDuration?: number
  formattedDuration?: string
  totalLessons?: number
  averageRating?: number
  totalReviews?: number
  enrolledStudents?: number
  discountPercentage?: number

  // Progress fields (for enrolled courses)
  completedLessons?: number
  progressPercentage?: number
  progressPercent?: number
  isCompleted?: boolean
  completedAt?: Date
  progress?: Array<{
    lessonId: string
    isCompleted: boolean
    completedAt?: Date
    watchedDuration?: number
  }>

  // Populated fields
  author: {
    _id: string
    username: string
    email: string
    avatar?: string
    firstName?: string
    lastName?: string
  }
  category: {
    _id: string
    name: string
    slug?: string
  }
  chapters?: Array<{
    _id: string
    title: string
    description?: string
    order: number
    isPublished: boolean
    duration?: number
    lessonIds?: string[]
  }>
  createdAt: Date
  updatedAt: Date
}

export interface GetCoursesResult {
  courses: PopulatedCourse[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface CourseAnalytics {
  totalViews: number
  totalSales: number
  conversionRate: number
  revenue: number
  averageRating?: number
  enrollmentTrend: Array<{
    date: string
    enrollments: number
  }>
}
