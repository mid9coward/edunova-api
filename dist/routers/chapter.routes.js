"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chapter_controller_1 = require("../controllers/chapter.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const permission_1 = require("../configs/permission");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Public routes for course chapters
router.get('/course/:courseId', (0, validation_middleware_1.validate)(schemas_1.getCourseChaptersSchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.getCourseChapters));
// Protected routes - require authentication
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Admin routes - require specific permissions
router.get('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_READ), (0, validation_middleware_1.validate)(schemas_1.getChaptersQuerySchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.getChapters));
router.get('/:id', (0, validation_middleware_1.validate)(schemas_1.getChapterByIdSchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.getChapterById));
router.post('/', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_CREATE), (0, validation_middleware_1.validate)(schemas_1.createChapterSchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.createChapter));
// Chapter ordering - must come before /:id routes
router.put('/reorder', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_UPDATE), (0, validation_middleware_1.validate)(schemas_1.reorderChaptersSchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.reorderChapters));
router.put('/:id', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_UPDATE), (0, validation_middleware_1.validate)(schemas_1.updateChapterSchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.updateChapter));
router.delete('/:id', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_DELETE), (0, validation_middleware_1.validate)(schemas_1.deleteChapterSchema), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.deleteChapter));
// Lesson management within chapters
router.put('/:chapterId/lessons/:lessonId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_UPDATE), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.addLessonToChapter));
router.delete('/:chapterId/lessons/:lessonId', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.CHAPTER_UPDATE), (0, error_middleware_1.asyncHandler)(chapter_controller_1.ChapterController.removeLessonFromChapter));
exports.default = router;
