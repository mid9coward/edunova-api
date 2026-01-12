import { Request, Response } from 'express'
import { ChapterService } from '../services'
import { sendSuccess } from '../utils/success'
import type { CreateChapterInput, UpdateChapterInput, GetChaptersQuery, ReorderChaptersInput } from '../schemas'

export class ChapterController {
  /**
   * Create a new chapter
   */
  static async createChapter(req: Request, res: Response): Promise<void> {
    const chapterData: CreateChapterInput = req.body

    const chapter = await ChapterService.createChapter(chapterData)

    sendSuccess.created(res, 'Chapter created successfully', chapter)
  }

  /**
   * Get chapters for a specific course
   */
  static async getChapters(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetChaptersQuery

    const chapters = await ChapterService.getChapters(query)

    sendSuccess.ok(res, 'Chapters retrieved successfully', chapters)
  }

  /**
   * Get chapter by ID
   */
  static async getChapterById(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const chapter = await ChapterService.getChapterById(id)

    sendSuccess.ok(res, 'Chapter retrieved successfully', { chapter })
  }

  /**
   * Update chapter
   */
  static async updateChapter(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const updateData: UpdateChapterInput = req.body

    const chapter = await ChapterService.updateChapter(id, updateData)

    sendSuccess.ok(res, 'Chapter updated successfully', { chapter })
  }

  /**
   * Delete chapter
   */
  static async deleteChapter(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    await ChapterService.deleteChapter(id)

    sendSuccess.ok(res, 'Chapter deleted successfully')
  }

  /**
   * Get chapters for a specific course
   */
  static async getCourseChapters(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params

    const chapters = await ChapterService.getPublicChaptersForCourse(courseId)

    sendSuccess.ok(res, 'Course chapters retrieved successfully', { chapters })
  }

  /**
   * Reorder chapters within a course
   */
  static async reorderChapters(req: Request, res: Response): Promise<void> {
    const reorderData: ReorderChaptersInput = req.body

    const chapters = await ChapterService.reorderChapters(reorderData)

    sendSuccess.ok(res, 'Chapters reordered successfully', { chapters })
  }

  /**
   * Add lesson to chapter
   */
  static async addLessonToChapter(req: Request, res: Response): Promise<void> {
    const { chapterId, lessonId } = req.params

    const chapter = await ChapterService.addLessonToChapter(chapterId, lessonId)

    sendSuccess.ok(res, 'Lesson added to chapter successfully', { chapter })
  }

  /**
   * Remove lesson from chapter
   */
  static async removeLessonFromChapter(req: Request, res: Response): Promise<void> {
    const { chapterId, lessonId } = req.params

    const chapter = await ChapterService.removeLessonFromChapter(chapterId, lessonId)

    sendSuccess.ok(res, 'Lesson removed from chapter successfully', { chapter })
  }
}
