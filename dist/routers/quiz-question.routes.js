"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quiz_question_controller_1 = require("../controllers/quiz-question.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const quiz_question_schema_1 = require("../schemas/quiz-question.schema");
const permission_1 = require("../configs/permission");
const router = (0, express_1.Router)();
/**
 * Public Routes (if any)
 */
// Get quiz questions with pagination and filtering (might be public for quizzes)
router.get('/', (0, validation_middleware_1.validate)(quiz_question_schema_1.getQuizQuestionsQuerySchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.getQuizQuestions));
// Get questions by quiz ID with pagination
router.get('/quiz/:quizId', (0, validation_middleware_1.validate)(quiz_question_schema_1.getQuestionsByQuizSchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.getQuestionsByQuiz));
// Get all questions by quiz ID (no pagination)
router.get('/quiz/:quizId/all', (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.getAllQuestionsByQuiz));
/**
 * Protected Routes (require authentication and proper permissions)
 */
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Bulk delete quiz questions - MOVED BEFORE parameterized routes
router.delete('/bulk-delete', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.QUIZ_QUESTION_DELETE]), (0, validation_middleware_1.validate)(quiz_question_schema_1.bulkDeleteQuizQuestionsSchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.bulkDeleteQuizQuestions));
// Create quiz question (supports both single and bulk)
router.post('/', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.QUIZ_QUESTION_CREATE]), (0, validation_middleware_1.validate)(quiz_question_schema_1.createQuizQuestionSchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.createQuizQuestion));
// Update quiz question
router.put('/:id', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.QUIZ_QUESTION_UPDATE]), (0, validation_middleware_1.validate)(quiz_question_schema_1.updateQuizQuestionSchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.updateQuizQuestion));
// Delete quiz question
router.delete('/:id', (0, rbac_middleware_1.requirePermission)([permission_1.PERMISSIONS.QUIZ_QUESTION_DELETE]), (0, validation_middleware_1.validate)(quiz_question_schema_1.deleteQuizQuestionSchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.deleteQuizQuestion));
// Get quiz question by ID - MOVED AFTER other routes to avoid conflicts
router.get('/:id', (0, validation_middleware_1.validate)(quiz_question_schema_1.getQuizQuestionByIdSchema), (0, error_middleware_1.asyncHandler)(quiz_question_controller_1.QuizQuestionController.getQuizQuestionById));
exports.default = router;
