import { Router } from 'express'
import { ChapterController } from '../controllers/chapter.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '~/configs/permission'
import {
  createChapterSchema,
  updateChapterSchema,
  getChaptersQuerySchema,
  getChapterByIdSchema,
  deleteChapterSchema,
  getCourseChaptersSchema,
  reorderChaptersSchema
} from '../schemas'

const router = Router()

// Public routes for course chapters
router.get('/course/:courseId', validate(getCourseChaptersSchema), asyncHandler(ChapterController.getCourseChapters))

// Protected routes - require authentication
router.use(authMiddleware)
router.use(loadUserPermissions)

// Admin routes - require specific permissions
router.get(
  '/',
  requirePermission(PERMISSIONS.CHAPTER_READ),
  validate(getChaptersQuerySchema),
  asyncHandler(ChapterController.getChapters)
)

router.get('/:id', validate(getChapterByIdSchema), asyncHandler(ChapterController.getChapterById))

router.post(
  '/',
  requirePermission(PERMISSIONS.CHAPTER_CREATE),
  validate(createChapterSchema),
  asyncHandler(ChapterController.createChapter)
)

// Chapter ordering - must come before /:id routes
router.put(
  '/reorder',
  requirePermission(PERMISSIONS.CHAPTER_UPDATE),
  validate(reorderChaptersSchema),
  asyncHandler(ChapterController.reorderChapters)
)

router.put(
  '/:id',
  requirePermission(PERMISSIONS.CHAPTER_UPDATE),
  validate(updateChapterSchema),
  asyncHandler(ChapterController.updateChapter)
)

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CHAPTER_DELETE),
  validate(deleteChapterSchema),
  asyncHandler(ChapterController.deleteChapter)
)

// Lesson management within chapters
router.put(
  '/:chapterId/lessons/:lessonId',
  requirePermission(PERMISSIONS.CHAPTER_UPDATE),
  asyncHandler(ChapterController.addLessonToChapter)
)

router.delete(
  '/:chapterId/lessons/:lessonId',
  requirePermission(PERMISSIONS.CHAPTER_UPDATE),
  asyncHandler(ChapterController.removeLessonFromChapter)
)

export default router
