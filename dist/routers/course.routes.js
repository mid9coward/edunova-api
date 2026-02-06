"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const course_controller_1 = require("../controllers/course.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const course_schema_1 = require("../schemas/course.schema");
const router = (0, express_1.Router)();
// Public routes (no authentication required) - only published courses
router.get('/public', (0, validation_middleware_1.validate)(course_schema_1.getCoursesSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getPublicCourses));
// Get free courses (public route)
router.get('/free', (0, validation_middleware_1.validate)(course_schema_1.getCoursesSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getFreeCourses));
// Get course by slug (public route)
router.get('/slug/:slug', (0, validation_middleware_1.validate)(course_schema_1.getCourseBySlugSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getCourseBySlug));
// Get related courses (public route)
router.get('/:courseId/related', (0, validation_middleware_1.validate)(course_schema_1.getRelatedCoursesSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getRelatedCourses));
// Protected routes (authentication required)
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Get all courses (admin/instructor view with unpublished)
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COURSE_READ), (0, validation_middleware_1.validate)(course_schema_1.getCoursesSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getCourses));
// Get current user's courses
router.get('/my-courses', (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getMyCourses));
// Get course completion status for current user
router.get('/:courseId/completion', (0, validation_middleware_1.validate)(course_schema_1.getCourseCompletionSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getCourseCompletion));
// Get course by ID (with permission check)
router.get('/:courseId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COURSE_READ), (0, validation_middleware_1.validate)(course_schema_1.getCourseByIdSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.getCourseById));
// Create new course
router.post('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COURSE_CREATE), (0, validation_middleware_1.validate)(course_schema_1.createCourseSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.createCourse));
// Update course (ownership check would need custom middleware for courses)
router.put('/:courseId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COURSE_UPDATE), (0, validation_middleware_1.validate)(course_schema_1.updateCourseSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.updateCourse));
// Delete course (ownership check would need custom middleware for courses)
router.delete('/:courseId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COURSE_DELETE), (0, validation_middleware_1.validate)(course_schema_1.deleteCourseSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.deleteCourse));
// Chapter management routes have been moved to separate chapter.routes.ts
// No chapter management in course router to avoid duplication
// Enrollment (increment sold count)
router.post('/:courseId/enroll', (0, validation_middleware_1.validate)(course_schema_1.getCourseByIdSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.enrollInCourse));
// Free course enrollment
router.post('/:courseId/enroll-free', (0, validation_middleware_1.validate)(course_schema_1.getCourseByIdSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.enrollInFreeCourse));
// Bulk delete operation (admin only)
router.delete('/bulk/delete', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COURSE_DELETE), (0, validation_middleware_1.validate)(course_schema_1.bulkDeleteSchema), (0, error_middleware_1.asyncHandler)(course_controller_1.CourseController.bulkDelete));
exports.default = router;
