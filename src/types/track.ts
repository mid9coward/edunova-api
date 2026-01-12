import { Types } from 'mongoose'

/**
 * Track related types
 */

export interface TrackSummary {
  totalLessons: number
  trackedLessons: number
  progressPercentage: number
  userId: Types.ObjectId
  courseId: Types.ObjectId
}

export interface TrackStats {
  totalTracks: number
  uniqueCourses: number
  uniqueLessons: number
  lastTrackedAt: Date
}

export interface CourseProgress {
  courseId: Types.ObjectId
  courseName: string
  totalLessons: number
  trackedLessons: number
  progressPercentage: number
  lastTrackedAt: Date
}
