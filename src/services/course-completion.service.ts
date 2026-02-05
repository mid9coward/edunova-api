import mongoose from 'mongoose'
import { CourseCompletion } from '../models/course-completion'
import { Lesson } from '../models/lesson'
import { Track } from '../models/track'

type CompletionStatus = {
  completed: boolean
  completedAt?: Date | null
  totalLessons: number
  completedLessons: number
  progressPercent: number
}

export class CourseCompletionService {
  static async syncCompletionForUserCourse(userId: string, courseId: string): Promise<CompletionStatus> {
    const courseObjectId = new mongoose.Types.ObjectId(courseId)

    const publishedLessons = await Lesson.find({ courseId: courseObjectId, isPublished: true })
      .select('_id')
      .lean()

    const totalLessons = publishedLessons.length
    const publishedLessonIds = publishedLessons.map((lesson) => lesson._id)

    if (totalLessons === 0) {
      await CourseCompletion.deleteOne({ userId, courseId })
      return {
        completed: false,
        completedAt: null,
        totalLessons: 0,
        completedLessons: 0,
        progressPercent: 0
      }
    }

    const completedLessons = await Track.countDocuments({
      userId,
      courseId,
      lessonId: { $in: publishedLessonIds }
    })

    const progressPercent = Math.round((completedLessons / totalLessons) * 100)

    if (completedLessons === totalLessons) {
      const existingCompletion = await CourseCompletion.findOne({ userId, courseId })

      let completedAt = existingCompletion?.completedAt
      if (!completedAt) {
        const latestTrack = await Track.findOne({
          userId,
          courseId,
          lessonId: { $in: publishedLessonIds }
        })
          .sort({ createdAt: -1 })
          .select('createdAt')
          .lean()

        completedAt = latestTrack?.createdAt ?? new Date()
      }

      const completion = await CourseCompletion.findOneAndUpdate(
        { userId, courseId },
        {
          $setOnInsert: { completedAt },
          $set: {
            totalLessons,
            completedLessons,
            progressPercent
          }
        },
        { upsert: true, new: true }
      )

      return {
        completed: true,
        completedAt: completion?.completedAt ?? null,
        totalLessons,
        completedLessons,
        progressPercent
      }
    }

    await CourseCompletion.deleteOne({ userId, courseId })

    return {
      completed: false,
      completedAt: null,
      totalLessons,
      completedLessons,
      progressPercent
    }
  }

  static async getCompletionStatus(userId: string, courseId: string): Promise<CompletionStatus> {
    return this.syncCompletionForUserCourse(userId, courseId)
  }
}
