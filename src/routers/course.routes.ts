import { Router } from 'express'
import { CourseController } from '../controllers/course.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { PERMISSIONS } from '~/configs/permission'
import {
  createCourseSchema,
  updateCourseSchema,
  getCourseByIdSchema,
  getCourseBySlugSchema,
  getCoursesSchema,
  deleteCourseSchema,
  bulkDeleteSchema,
  getRelatedCoursesSchema
} from '../schemas/course.schema'

const router = Router()

// Public routes (no authentication required) - only published courses
router.get('/public', validate(getCoursesSchema), asyncHandler(CourseController.getPublicCourses))

// Get free courses (public route)
router.get('/free', validate(getCoursesSchema), asyncHandler(CourseController.getFreeCourses))

// Get course by slug (public route)
router.get('/slug/:slug', validate(getCourseBySlugSchema), asyncHandler(CourseController.getCourseBySlug))

// Get related courses (public route)
router.get('/:courseId/related', validate(getRelatedCoursesSchema), asyncHandler(CourseController.getRelatedCourses))

// Protected routes (authentication required)
router.use(authMiddleware)
router.use(loadUserPermissions)

// Get all courses (admin/instructor view with unpublished)
router.get(
  '/',
  requirePermission(PERMISSIONS.COURSE_READ),
  validate(getCoursesSchema),
  asyncHandler(CourseController.getCourses)
)

// Get current user's courses
router.get('/my-courses', asyncHandler(CourseController.getMyCourses))

// Get course by ID (with permission check)
router.get(
  '/:courseId',
  requirePermission(PERMISSIONS.COURSE_READ),
  validate(getCourseByIdSchema),
  asyncHandler(CourseController.getCourseById)
)

// Create new course
router.post(
  '/',
  requirePermission(PERMISSIONS.COURSE_CREATE),
  validate(createCourseSchema),
  asyncHandler(CourseController.createCourse)
)

// Update course (ownership check would need custom middleware for courses)
router.put(
  '/:courseId',
  requirePermission(PERMISSIONS.COURSE_UPDATE),
  validate(updateCourseSchema),
  asyncHandler(CourseController.updateCourse)
)

// Delete course (ownership check would need custom middleware for courses)
router.delete(
  '/:courseId',
  requirePermission(PERMISSIONS.COURSE_DELETE),
  validate(deleteCourseSchema),
  asyncHandler(CourseController.deleteCourse)
)

// Chapter management routes have been moved to separate chapter.routes.ts
// No chapter management in course router to avoid duplication

// Enrollment (increment sold count)
router.post('/:courseId/enroll', validate(getCourseByIdSchema), asyncHandler(CourseController.enrollInCourse))

// Free course enrollment
router.post('/:courseId/enroll-free', validate(getCourseByIdSchema), asyncHandler(CourseController.enrollInFreeCourse))

// Bulk delete operation (admin only)
router.delete(
  '/bulk/delete',
  requirePermission(PERMISSIONS.COURSE_DELETE),
  validate(bulkDeleteSchema),
  asyncHandler(CourseController.bulkDelete)
)

export default router
