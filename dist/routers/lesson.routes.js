"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lesson_controller_1 = require("../controllers/lesson.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Public routes for chapter and course lessons
router.get('/chapter/:chapterId', (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.getChapterLessons));
router.get('/course/:courseId', (0, validation_middleware_1.validate)(schemas_1.getCourseLessonsSchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.getCourseLessons));
// Protected routes - require authentication
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Admin routes - require specific permissions
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.LESSON_READ), (0, validation_middleware_1.validate)(schemas_1.getLessonsQuerySchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.getLessons));
// Get lesson by ID (supports ?includeResource=true for resource population)
router.get('/:id', (0, validation_middleware_1.validate)(schemas_1.getLessonByIdSchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.getLessonById));
// Create lesson with resource
router.post('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.LESSON_CREATE), (0, validation_middleware_1.validate)(schemas_1.createLessonSchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.createLesson));
// Lesson ordering
router.put('/reorder', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.LESSON_UPDATE), (0, validation_middleware_1.validate)(schemas_1.reorderLessonsSchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.reorderLessons));
// Update lesson (supports resource data updates)
router.put('/:id', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.LESSON_UPDATE), (0, validation_middleware_1.validate)(schemas_1.updateLessonSchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.updateLesson));
// Delete lesson (supports ?cascadeDelete=true for resource deletion)
router.delete('/:id', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.LESSON_DELETE), (0, validation_middleware_1.validate)(schemas_1.deleteLessonSchema), (0, error_middleware_1.asyncHandler)(lesson_controller_1.LessonController.deleteLesson));
exports.default = router;
