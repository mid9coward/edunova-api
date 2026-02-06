import { Request, Response } from 'express'
import { LessonService } from '../services'
import { sendSuccess } from '../utils/success'
import type { CreateLessonInput, UpdateLessonInput, GetCourseLessonsQuery, ReorderLessonsInput } from '../schemas'

export class LessonController {
  /**
   * Create a new lesson with resource
   */
  static async createLesson(req: Request, res: Response): Promise<void> {
    const lessonData: CreateLessonInput = req.body

    const result = await LessonService.createLesson(lessonData)

    sendSuccess.created(res, 'Lesson created successfully', result)
  }

  /**
   * Get lessons for a specific chapter
   */
  static async getLessons(req: Request, res: Response): Promise<void> {
    const { chapterId } = req.query as { chapterId: string }

    const result = await LessonService.getLessons(chapterId)

    sendSuccess.ok(res, 'Lessons retrieved successfully', result)
  }

  /**
   * Get lesson by ID with optional resource population
   */
  static async getLessonById(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { includeQuestions } = req.query

    const lesson = await LessonService.getLessonById(id as string, includeQuestions === 'true')

    if (lesson.contentType === 'coding' && lesson.resource) {
      const resource = lesson.resource as unknown as {
        solutionCode?: string
        testCases?: Array<{ _id?: unknown; input?: string; expectedOutput?: string; isHidden?: boolean }>
        [key: string]: unknown
      }

      const sanitizedResource: Record<string, unknown> = { ...resource }
      delete sanitizedResource.solutionCode

      if (Array.isArray(resource.testCases)) {
        sanitizedResource.testCases = resource.testCases.map((testCase) => {
          if (testCase?.isHidden) {
            const hidden: { _id?: string; isHidden: true } = { isHidden: true }
            if (testCase._id !== undefined) {
              hidden._id = String(testCase._id)
            }
            return hidden
          }
          const visible: { _id?: string; input?: string; expectedOutput?: string; isHidden?: boolean } = {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            isHidden: testCase.isHidden
          }
          if (testCase._id !== undefined) {
            visible._id = String(testCase._id)
          }
          return visible
        })
      }

      lesson.resource = sanitizedResource as unknown as typeof lesson.resource
    }

    sendSuccess.ok(res, 'Lesson retrieved successfully', lesson)
  }

  /**
   * Update lesson (supports resource data updates)
   */
  static async updateLesson(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const updateData: UpdateLessonInput = req.body

    const lesson = await LessonService.updateLesson(id as string, updateData)

    sendSuccess.ok(res, 'Lesson updated successfully', lesson)
  }

  /**
   * Delete lesson (supports cascade delete of resources)
   */
  static async deleteLesson(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    await LessonService.deleteLesson(id as string)

    sendSuccess.ok(res, 'Lesson deleted successfully')
  }

  /**
   * Get lessons for a specific chapter
   */
  static async getChapterLessons(req: Request, res: Response): Promise<void> {
    const { chapterId } = req.params

    const result = await LessonService.getLessons(chapterId as string)

    sendSuccess.ok(res, 'Chapter lessons retrieved successfully', { lessons: result })
  }

  /**
   * Get lessons for a specific course
   */
  static async getCourseLessons(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params
    const query = req.query as unknown as GetCourseLessonsQuery

    const result = await LessonService.getCourseLessons(courseId as string, query)

    sendSuccess.ok(res, 'Course lessons retrieved successfully', result)
  }

  /**
   * Reorder lessons within a chapter
   */
  static async reorderLessons(req: Request, res: Response): Promise<void> {
    const reorderData: ReorderLessonsInput = req.body

    const lessons = await LessonService.reorderLessons(reorderData)

    sendSuccess.ok(res, 'Lessons reordered successfully', { lessons })
  }
}
