import { Router } from 'express'
import { LessonController } from '../controllers/lesson.controller'
import { SubmissionController } from '../controllers/submission.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { codingRunRateLimit, codingSubmitRateLimit } from '../middlewares/rate-limit.middleware'
import { PERMISSIONS } from '~/configs/permission'
import {
  createLessonSchema,
  updateLessonSchema,
  getLessonsQuerySchema,
  getLessonByIdSchema,
  deleteLessonSchema,
  getCourseLessonsSchema,
  reorderLessonsSchema,
  runCodeSchema,
  submitCodeSchema
} from '../schemas'

const router = Router()

// Public routes for chapter and course lessons
router.get('/chapter/:chapterId', asyncHandler(LessonController.getChapterLessons))

router.get('/course/:courseId', validate(getCourseLessonsSchema), asyncHandler(LessonController.getCourseLessons))

// Protected routes - require authentication
router.use(authMiddleware)

router.use(loadUserPermissions)

// Admin routes - require specific permissions
router.get(
  '/',
  requirePermission(PERMISSIONS.LESSON_READ),
  validate(getLessonsQuerySchema),
  asyncHandler(LessonController.getLessons)
)

// Get lesson by ID (supports ?includeResource=true for resource population)
router.get('/:id', validate(getLessonByIdSchema), asyncHandler(LessonController.getLessonById))

// Run code for coding exercises
router.post('/:id/run', codingRunRateLimit, validate(runCodeSchema), asyncHandler(SubmissionController.run))

// Submit code for grading
router.post('/:id/submit', codingSubmitRateLimit, validate(submitCodeSchema), asyncHandler(SubmissionController.submit))

// Create lesson with resource
router.post(
  '/',
  requirePermission(PERMISSIONS.LESSON_CREATE),
  validate(createLessonSchema),
  asyncHandler(LessonController.createLesson)
)

// Lesson ordering
router.put(
  '/reorder',
  requirePermission(PERMISSIONS.LESSON_UPDATE),
  validate(reorderLessonsSchema),
  asyncHandler(LessonController.reorderLessons)
)

// Update lesson (supports resource data updates)
router.put(
  '/:id',
  requirePermission(PERMISSIONS.LESSON_UPDATE),
  validate(updateLessonSchema),
  asyncHandler(LessonController.updateLesson)
)

// Delete lesson (supports ?cascadeDelete=true for resource deletion)
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.LESSON_DELETE),
  validate(deleteLessonSchema),
  asyncHandler(LessonController.deleteLesson)
)

export default router
