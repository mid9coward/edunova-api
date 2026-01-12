/**
 * Lesson-related interfaces and types
 */

import { LessonContentType } from '../enums'

export interface PopulatedLesson {
  _id: string
  title: string
  chapterId: string
  courseId: string
  resourceId: string
  contentType: LessonContentType
  order: number
  preview: boolean
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  // Populated fields
  chapter: {
    _id: string
    title: string
    description?: string
    courseId: string
    isPublished: boolean
  }
  course: {
    _id: string
    title: string
  }
  resource: {
    _id: string
    [key: string]: unknown // Dynamic based on content type
  }
}

export interface GetLessonsWithLookupResult {
  lessons: PopulatedLesson[]
  total: number
}
