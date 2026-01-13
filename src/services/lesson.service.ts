import mongoose, { FilterQuery } from 'mongoose'
import { Lesson, ILesson, Video, IVideo, Article, IArticle, Quiz, IQuiz } from '../models/lesson'
import { QuizQuestion } from '../models/quiz-question'
import { Chapter } from '../models/chapter'
import { Course } from '../models/course'
import { ValidationError, NotFoundError, DatabaseError, ErrorCodes } from '../utils/errors'
import { CreateLessonInput, UpdateLessonInput, ReorderLessonsInput } from '../schemas/lesson.schema'

/**
 * Lesson Service with unified CRUD operations
 */

// Helper function to convert select array to object
const getSelectData = (select: string[]) => {
  return Object.fromEntries(select.map((item) => [item, 1]))
}

type VideoResource = {
  url: string
  description: string
}

type ArticleResource = {
  description: string
}

type QuizResource = {
  totalAttemptsAllowed: number
  passingScorePercentage: number
  description: string
  questions?: {
    question: string
    explanation: string
    type: 'multiple_choice' | 'true_false' | 'single_choice'
    options: string[]
    correctAnswers: number[]
    point: number
  }[]
}

type VideoUpdateData = Partial<VideoResource>
type ArticleUpdateData = Partial<ArticleResource>
type QuizUpdateData = Partial<QuizResource>
type UpdateResource = VideoUpdateData | ArticleUpdateData | QuizUpdateData

type CreatedResource = IVideo | IArticle | IQuiz

// Extended Quiz interface that includes totalQuestions count and optionally questions
type IQuizWithQuestions = IQuiz & {
  totalQuestions?: number
  questions?: {
    question: string
    explanation: string
    type: 'multiple_choice' | 'true_false' | 'single_choice'
    options: string[]
    correctAnswers: number[]
    point: number
  }[]
}

interface LessonWithResource {
  _id: mongoose.Types.ObjectId
  title: string
  chapterId: mongoose.Types.ObjectId | { title: string; courseId: mongoose.Types.ObjectId }
  courseId: mongoose.Types.ObjectId
  resourceId: mongoose.Types.ObjectId
  contentType: 'video' | 'quiz' | 'article'
  order: number
  preview: boolean
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
  resource: IVideo | IArticle | IQuizWithQuestions | null
}

interface CourseLessonsResult {
  lessons: ILesson[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

interface CourseLessonsOptions {
  page?: number
  limit?: number
  search?: string
  preview?: string
  isPublished?: boolean
  sortBy?: 'title' | 'order' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export class LessonService {
  /**
   * Create a new lesson with resource
   */
  static async createLesson(lessonData: CreateLessonInput): Promise<ILesson> {
    // Validate that resource is provided
    if (!lessonData.resource) {
      throw new ValidationError('resource is required', ErrorCodes.REQUIRED_FIELD_MISSING)
    }
    const session = await mongoose.startSession()

    try {
      const result = await session.withTransaction(async () => {
        const [chapter, course] = await Promise.all([
          Chapter.findById(lessonData.chapterId).session(session),
          Course.findById(lessonData.courseId).session(session)
        ])

        if (!chapter) {
          throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
        }

        if (!course) {
          throw new NotFoundError('Course not found', ErrorCodes.COURSE_NOT_FOUND)
        }

        if (chapter.courseId.toString() !== lessonData.courseId.toString()) {
          throw new ValidationError('Chapter does not belong to the specified course', ErrorCodes.INVALID_INPUT_FORMAT)
        }

        let createdResources: CreatedResource[]

        switch (lessonData.contentType) {
          case 'video': {
            const videoData = lessonData.resource as VideoResource
            createdResources = await Video.create([videoData], { session, ordered: true })
            break
          }
          case 'article': {
            const articleData = lessonData.resource as ArticleResource
            createdResources = await Article.create([articleData], { session, ordered: true })
            break
          }
          case 'quiz': {
            const quizData = lessonData.resource as QuizResource
            // Create quiz without questions first
            const { questions, ...quizCreateData } = quizData

            // Add duration from lessonData to quiz (default to 0 if not provided)
            const quizDataWithDuration = {
              ...quizCreateData,
              duration: lessonData.duration || 0
            }

            createdResources = await Quiz.create([quizDataWithDuration], { session, ordered: true })

            // If questions are provided, create them directly
            if (questions && questions.length > 0) {
              const quizId = createdResources[0]._id.toString()
              const questionsWithQuizId = questions.map((question) => ({
                ...question,
                quizId: quizId
              }))
              // Create questions directly using QuizQuestion model
              await QuizQuestion.insertMany(questionsWithQuizId, { session })
            }
            break
          }
          default:
            throw new ValidationError('Invalid content type', ErrorCodes.INVALID_INPUT_FORMAT)
        }

        const lastLesson = await Lesson.findOne({ chapterId: lessonData.chapterId })
          .sort({ order: -1 })
          .session(session)
        const order = lastLesson ? lastLesson.order + 1 : 1

        // Create lesson with resourceId
        const createdLessons = await Lesson.create(
          [
            {
              title: lessonData.title,
              chapterId: lessonData.chapterId,
              courseId: lessonData.courseId,
              resourceId: createdResources[0]._id,
              contentType: lessonData.contentType,
              order: order,
              preview: lessonData.preview || false,
              isPublished: lessonData.isPublished || false,
              duration: lessonData.duration
            }
          ],
          { session, ordered: true }
        )

        // Add lesson ID to chapter's lessonIds array
        await Chapter.findByIdAndUpdate(
          lessonData.chapterId,
          { $push: { lessonIds: createdLessons[0]._id } },
          { session }
        )

        return createdLessons[0]
      })

      return result
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to create lesson',
        ErrorCodes.DB_OPERATION_FAILED
      )
    } finally {
      await session.endSession()
    }
  }

  /**
   * Get lesson by ID
   */
  static async getLessonById(lessonId: string, includeQuestions: boolean = false): Promise<LessonWithResource> {
    const lesson = await Lesson.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(lessonId) } },
      {
        $lookup: {
          from: 'chapters',
          localField: 'chapterId',
          foreignField: '_id',
          as: 'chapter',
          pipeline: [{ $project: { title: 1, courseId: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
          pipeline: [{ $project: { title: 1, slug: 1 } }]
        }
      },
      { $unwind: '$chapter' },
      { $unwind: '$course' }
    ])

    if (!lesson || lesson.length === 0) {
      throw new NotFoundError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    const lessonData = lesson[0]

    // Get resource data based on content type with direct logic
    let resource: IVideo | IArticle | IQuizWithQuestions | null = null

    switch (lessonData.contentType) {
      case 'video': {
        resource = (await Video.findById(lessonData.resourceId).lean()) as unknown as IVideo
        break
      }
      case 'article': {
        resource = (await Article.findById(lessonData.resourceId).lean()) as unknown as IArticle
        break
      }
      case 'quiz': {
        // Get quiz resource and its questions count
        const quizResource = await Quiz.findById(lessonData.resourceId).lean()
        if (quizResource) {
          // Get total questions count for this quiz
          const totalQuestions = await QuizQuestion.countDocuments({ quizId: lessonData.resourceId })

          // Optionally include full questions
          let questions = undefined
          if (includeQuestions) {
            questions = await QuizQuestion.find({ quizId: lessonData.resourceId })
              .select('question explanation type options correctAnswers point')
              .lean()
          }

          // Add totalQuestions and optionally questions to the quiz resource
          resource = {
            ...quizResource,
            totalQuestions,
            ...(questions && { questions })
          } as unknown as IQuizWithQuestions
        }
        break
      }
      default:
        throw new ValidationError('Invalid content type', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    return {
      ...lessonData,
      resource
    }
  }

  /**
   * Update lesson (supports resource data updates)
   */
  static async updateLesson(lessonId: string, updateData: UpdateLessonInput): Promise<ILesson> {
    // If resource is provided, use transaction
    if (updateData.resource) {
      const session = await mongoose.startSession()

      try {
        const result = await session.withTransaction(async () => {
          const lesson = await Lesson.findById(lessonId).session(session)
          if (!lesson) {
            throw new NotFoundError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND)
          }

          if (updateData.resource) {
            await this.updateResourceByType(
              lesson.contentType,
              lesson.resourceId,
              updateData.resource,
              session,
              updateData.duration
            )
          }

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { resource: _, ...lessonUpdateData } = updateData

          // If chapterId is being updated, validate the new chapter exists
          if (lessonUpdateData.chapterId && lessonUpdateData.chapterId !== lesson.chapterId.toString()) {
            const chapter = await Chapter.findById(lessonUpdateData.chapterId).session(session)
            if (!chapter) {
              throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
            }

            // Remove lesson from old chapter's lessonIds array
            await Chapter.findByIdAndUpdate(lesson.chapterId, { $pull: { lessonIds: lessonId } }, { session })

            // Add lesson to new chapter's lessonIds array
            await Chapter.findByIdAndUpdate(lessonUpdateData.chapterId, { $push: { lessonIds: lessonId } }, { session })

            // If moving to a different chapter, set order to last
            const lastLessonInNewChapter = await Lesson.findOne({ chapterId: lessonUpdateData.chapterId })
              .sort({ order: -1 })
              .session(session)
            lessonUpdateData.order = lastLessonInNewChapter ? lastLessonInNewChapter.order + 1 : 1
          }

          const updatedLesson = await Lesson.findByIdAndUpdate(lessonId, lessonUpdateData, { new: true, session })
          if (!updatedLesson) {
            throw new DatabaseError('Failed to update lesson', ErrorCodes.DB_OPERATION_FAILED)
          }

          return updatedLesson
        })

        return result!
      } catch (error) {
        throw new DatabaseError(
          error instanceof Error ? error.message : 'Failed to update lesson',
          ErrorCodes.DB_OPERATION_FAILED
        )
      } finally {
        await session.endSession()
      }
    }

    throw new ValidationError('resource is required for lesson updates', ErrorCodes.REQUIRED_FIELD_MISSING)
  }

  /**
   * Delete lesson (supports cascade delete of resources)
   */
  static async deleteLesson(lessonId: string): Promise<void> {
    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        const lesson = await Lesson.findById(lessonId).session(session)
        if (!lesson) {
          throw new NotFoundError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND)
        }

        const chapterId = lesson.chapterId
        const order = lesson.order

        // Delete associated resource and related data
        await this.deleteResourceByType(lesson.contentType, lesson.resourceId, session)

        // Remove lesson ID from chapter's lessonIds array
        await Chapter.findByIdAndUpdate(chapterId, { $pull: { lessonIds: lessonId } }, { session })

        // Delete lesson
        await Lesson.findByIdAndDelete(lessonId, { session })

        // Update orders of remaining lessons in the same chapter
        await Lesson.updateMany({ chapterId, order: { $gt: order } }, { $inc: { order: -1 } }, { session })
      })
    } catch (error) {
      throw new DatabaseError(
        error instanceof Error ? error.message : 'Failed to delete lesson',
        ErrorCodes.DB_OPERATION_FAILED
      )
    } finally {
      await session.endSession()
    }
  }

  /**
   * Reorder lessons
   */
  static async reorderLessons(reorderData: ReorderLessonsInput): Promise<ILesson[]> {
    const { lessons } = reorderData

    // Update each lesson's order
    const updatePromises = lessons.map(({ id, order }) => Lesson.findByIdAndUpdate(id, { order }, { new: true }))

    const updatedLessons = await Promise.all(updatePromises)

    // Filter out null values and return
    return updatedLessons.filter((lesson) => lesson !== null)
  }

  /**
   * Get lessons for a specific course with pagination
   */
  static async getCourseLessons(courseId: string, options: CourseLessonsOptions = {}): Promise<CourseLessonsResult> {
    const { page = 1, limit = 10, search, preview, isPublished, sortBy = 'order', sortOrder = 'asc' } = options
    const skip = (page - 1) * limit

    const filter: FilterQuery<ILesson> = { courseId }
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }]
    if (preview !== undefined) filter.preview = preview === 'true'
    if (isPublished !== undefined) filter.isPublished = isPublished

    const sortOption: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const [lessons, total] = await Promise.all([
      Lesson.find(filter).populate('chapterId', 'title courseId').sort(sortOption).skip(skip).limit(limit),
      Lesson.countDocuments(filter)
    ])

    return {
      lessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    }
  }

  /**
   * Get lessons for a specific chapter with resource data
   */
  static async getLessons(chapterId: string): Promise<LessonWithResource[]> {
    // Validate chapter exists
    const chapter = await Chapter.findById(chapterId)
    if (!chapter) {
      throw new NotFoundError('Chapter not found', ErrorCodes.CHAPTER_NOT_FOUND)
    }

    const lessons = await Lesson.find({ chapterId }).sort({ order: 1 })

    // Get resource data for each lesson (only description)
    const lessonsWithResources = await Promise.all(
      lessons.map(async (lesson) => {
        const selectFields: string[] = ['description']

        const resource = await this.getResourceByType(lesson.contentType, lesson.resourceId, selectFields)
        return {
          ...lesson.toObject(),
          resource
        }
      })
    )

    return lessonsWithResources
  }

  /**
   * Helper method to get resource by type
   */
  private static async getResourceByType(
    contentType: string,
    resourceId: mongoose.Types.ObjectId,
    selectFields?: string | string[]
  ): Promise<IVideo | IArticle | IQuiz | null> {
    // Convert array to object if needed
    const selectQuery = Array.isArray(selectFields) ? getSelectData(selectFields) : selectFields

    switch (contentType) {
      case 'video': {
        const query = Video.findById(resourceId)
        const result = selectQuery ? await query.select(selectQuery).lean() : await query.lean()
        return result as unknown as IVideo
      }
      case 'article': {
        const query = Article.findById(resourceId)
        const result = selectQuery ? await query.select(selectQuery).lean() : await query.lean()
        return result as unknown as IArticle
      }
      case 'quiz': {
        const query = Quiz.findById(resourceId)
        const result = selectQuery ? await query.select(selectQuery).lean() : await query.lean()
        return result as unknown as IQuiz
      }
      default:
        throw new ValidationError('Invalid content type', ErrorCodes.INVALID_INPUT_FORMAT)
    }
  }

  /**
   * Helper method to update resource by type
   */
  private static async updateResourceByType(
    contentType: string,
    resourceId: mongoose.Types.ObjectId,
    resource: UpdateResource,
    session: mongoose.ClientSession,
    lessonDuration?: number
  ): Promise<CreatedResource | null> {
    switch (contentType) {
      case 'video': {
        const videoData = resource as VideoUpdateData
        return await Video.findByIdAndUpdate(resourceId, videoData, { session, new: true })
      }
      case 'article': {
        const articleData = resource as ArticleUpdateData
        return await Article.findByIdAndUpdate(resourceId, articleData, { session, new: true })
      }
      case 'quiz': {
        const quizData = resource as QuizUpdateData
        // Handle questions separately if provided
        if (quizData.questions) {
          // Update quiz questions - first delete existing ones, then create new ones
          await QuizQuestion.deleteMany({ quizId: resourceId }, { session })
          const questionsWithQuizId = quizData.questions.map((question) => ({
            ...question,
            quizId: resourceId.toString()
          }))
          // Create questions directly using QuizQuestion model
          await QuizQuestion.insertMany(questionsWithQuizId, { session })
        }

        // Update quiz data (excluding questions)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { questions, ...quizUpdateData } = quizData

        // Add duration from lesson if provided, otherwise keep existing duration
        const finalUpdateData = {
          ...quizUpdateData,
          ...(lessonDuration !== undefined && { duration: lessonDuration })
        }

        const updatedQuiz = await Quiz.findByIdAndUpdate(resourceId, finalUpdateData, { session, new: true })
        return updatedQuiz
      }
      default:
        throw new ValidationError('Invalid content type', ErrorCodes.INVALID_INPUT_FORMAT)
    }
  }

  /**
   * Helper method to delete resource by type
   */
  private static async deleteResourceByType(
    contentType: string,
    resourceId: mongoose.Types.ObjectId,
    session: mongoose.ClientSession
  ): Promise<void> {
    switch (contentType) {
      case 'video': {
        const deletedVideo = await Video.findByIdAndDelete(resourceId, { session })
        if (!deletedVideo) {
          throw new NotFoundError('Video resource not found', ErrorCodes.LESSON_NOT_FOUND)
        }
        break
      }
      case 'article': {
        const deletedArticle = await Article.findByIdAndDelete(resourceId, { session })
        if (!deletedArticle) {
          throw new NotFoundError('Article resource not found', ErrorCodes.LESSON_NOT_FOUND)
        }
        break
      }
      case 'quiz': {
        // Delete quiz questions first, then quiz
        await QuizQuestion.deleteMany({ quizId: resourceId }, { session })
        const deletedQuiz = await Quiz.findByIdAndDelete(resourceId, { session })
        if (!deletedQuiz) {
          throw new NotFoundError('Quiz resource not found', ErrorCodes.LESSON_NOT_FOUND)
        }
        break
      }
      default:
        throw new ValidationError('Invalid content type', ErrorCodes.INVALID_INPUT_FORMAT)
    }
  }
}
