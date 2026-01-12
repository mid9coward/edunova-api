import mongoose from 'mongoose'
import { Chapter, Course, type IChapter } from '../models'
import { ValidationError, NotFoundError, ConflictError, ErrorCodes } from '../utils/errors'
import type { CreateChapterInput, UpdateChapterInput, GetChaptersQuery, ReorderChaptersInput } from '../schemas'

export interface PopulatedChapter {
  _id: string
  title: string
  description?: string
  courseId: string
  lessonIds: string[]
  order: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  course: {
    _id: string
    title: string
    slug: string
    description: string
    isPublished: boolean
  }
  lessons: Array<{
    _id: string
    title: string
    contentType: string
    order: number
    preview: boolean
    isPublished: boolean
    duration?: number
  }>
}

export class ChapterService {
  /**
   * Create a new chapter
   */
  static async createChapter(chapterData: CreateChapterInput): Promise<IChapter> {
    // Check if course exists
    const courseExists = await Course.exists({ _id: chapterData.courseId })
    if (!courseExists) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    // Get the highest order number for this course and increment by 1
    const lastChapter = await Chapter.findOne({ courseId: chapterData.courseId }).sort({ order: -1 })
    const nextOrder = lastChapter ? lastChapter.order + 1 : 1

    const chapter = await Chapter.create({
      title: chapterData.title,
      description: chapterData.description,
      courseId: chapterData.courseId,
      order: nextOrder,
      isPublished: chapterData.isPublished ?? false,
      lessonIds: []
    })

    // Add the new chapter ID to the course's chapterIds array
    await Course.updateOne({ _id: chapterData.courseId }, { $push: { chapterIds: chapter._id } })

    return chapter
  }

  /**
   * Get chapters for a specific course with populated course and lessons data
   */
  static async getChapters(options: GetChaptersQuery): Promise<IChapter[]> {
    const { courseId } = options

    // Check if course exists
    const courseExists = await Course.exists({ _id: courseId })
    if (!courseExists) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    // Use aggregation pipeline to get chapters with populated lessons
    const chapters = await Chapter.aggregate([
      {
        $match: { courseId: new mongoose.Types.ObjectId(courseId) }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessonIds',
          foreignField: '_id',
          as: 'lessons',
          pipeline: [
            {
              $project: {
                title: 1,
                contentType: 1,
                resourceId: 1,
                order: 1,
                preview: 1,
                isPublished: 1,
                duration: 1
              }
            },
            {
              $sort: { order: 1 }
            }
          ]
        }
      },
      {
        $sort: { order: 1 }
      }
    ])

    return chapters
  }

  /**
   * Get chapter by ID
   */
  static async getChapterById(chapterId: string): Promise<IChapter> {
    const chapters = await Chapter.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(chapterId) }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessonIds',
          foreignField: '_id',
          as: 'lessons',
          pipeline: [
            {
              $project: {
                title: 1,
                contentType: 1,
                order: 1,
                preview: 1,
                isPublished: 1,
                duration: 1,
                resourceId: 1
              }
            },
            {
              $sort: { order: 1 }
            }
          ]
        }
      }
    ])

    if (!chapters || chapters.length === 0) {
      throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    return chapters[0] as IChapter
  }

  /**
   * Update chapter
   */
  static async updateChapter(chapterId: string, updateData: UpdateChapterInput): Promise<IChapter> {
    const updatedChapter = await Chapter.findByIdAndUpdate(chapterId, updateData, {
      new: true, // Return updated document
      runValidators: true // Run schema validations
    })

    if (!updatedChapter) {
      throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    return updatedChapter
  }

  /**
   * Delete chapter
   */
  static async deleteChapter(chapterId: string): Promise<void> {
    const chapter = await Chapter.findById(chapterId)
    if (!chapter) {
      throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    // Remove chapter from course's chapterIds array
    await Course.updateOne({ _id: chapter.courseId }, { $pull: { chapterIds: chapterId } })

    await Chapter.findByIdAndDelete(chapterId)
  }

  /**
   * Get chapters for a specific course
   */
  static async getPublicChaptersForCourse(courseId: string): Promise<IChapter[]> {
    // Check if course exists
    const courseExists = await Course.exists({ _id: courseId })
    if (!courseExists) {
      throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
    }

    // Build filter query - only get published chapters
    const matchFilter: Record<string, unknown> = {
      courseId: new mongoose.Types.ObjectId(courseId),
      isPublished: true
    }

    // Execute aggregation pipeline
    const chapters = await Chapter.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessonIds',
          foreignField: '_id',
          as: 'lessons',
          pipeline: [
            {
              $project: {
                title: 1,
                contentType: 1,
                preview: 1,
                duration: 1,
                order: 1
              }
            },
            { $sort: { order: 1 } }
          ]
        }
      },
      { $sort: { order: 1 } }
    ])

    return chapters as IChapter[]
  }

  /**
   * Reorder chapters within a course
   */
  static async reorderChapters(reorderData: ReorderChaptersInput): Promise<IChapter[]> {
    const { chapters } = reorderData

    // Get chapter IDs
    const chapterIds = chapters.map((ch) => ch.id)

    // Check if all chapters exist and belong to the same course
    const existingChapters = await Chapter.find({ _id: { $in: chapterIds } })

    if (existingChapters.length !== chapterIds.length) {
      throw new NotFoundError('One or more chapters not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    // Ensure all chapters belong to the same course
    const courseIds = [...new Set(existingChapters.map((ch) => ch.courseId.toString()))]
    if (courseIds.length > 1) {
      throw new ValidationError('All chapters must belong to the same course', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    // Update orders using bulkWrite (no transaction needed for this use case)
    const bulkOperations = chapters.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order } }
      }
    }))

    // Execute bulk write operation
    await Chapter.bulkWrite(bulkOperations)

    // Return updated chapters
    const updatedChapters = await Chapter.find({ _id: { $in: chapterIds } }).sort({ order: 1 })

    return updatedChapters
  }

  /**
   * Add lesson to chapter
   */
  static async addLessonToChapter(chapterId: string, lessonId: string): Promise<IChapter> {
    const chapter = await Chapter.findById(chapterId)
    if (!chapter) {
      throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    // Check if lesson is already in the chapter
    if (chapter.lessonIds.includes(new mongoose.Types.ObjectId(lessonId))) {
      throw new ConflictError('Lesson already added to chapter', ErrorCodes.DUPLICATE_ENTRY)
    }

    // Add lesson to chapter
    chapter.lessonIds.push(new mongoose.Types.ObjectId(lessonId))
    await chapter.save()

    // Return chapter with populated lessons using aggregation
    const [updatedChapter] = await Chapter.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(chapterId) }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessonIds',
          foreignField: '_id',
          as: 'lessons',
          pipeline: [
            {
              $project: {
                title: 1,
                contentType: 1,
                order: 1,
                preview: 1,
                isPublished: 1,
                duration: 1
              }
            },
            { $sort: { order: 1 } }
          ]
        }
      }
    ])

    return updatedChapter as IChapter
  }

  /**
   * Remove lesson from chapter
   */
  static async removeLessonFromChapter(chapterId: string, lessonId: string): Promise<IChapter> {
    const chapter = await Chapter.findById(chapterId)
    if (!chapter) {
      throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    // Remove lesson from chapter
    chapter.lessonIds = chapter.lessonIds.filter((lesson) => !lesson.equals(new mongoose.Types.ObjectId(lessonId)))
    await chapter.save()

    // Return chapter with populated lessons using aggregation
    const [updatedChapter] = await Chapter.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(chapterId) }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lessonIds',
          foreignField: '_id',
          as: 'lessons',
          pipeline: [
            {
              $project: {
                title: 1,
                contentType: 1,
                order: 1,
                preview: 1,
                isPublished: 1,
                duration: 1
              }
            },
            { $sort: { order: 1 } }
          ]
        }
      }
    ])

    return updatedChapter as IChapter
  }
}
