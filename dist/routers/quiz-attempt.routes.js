"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const quiz_attempt_controller_1 = require("../controllers/quiz-attempt.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const quiz_attempt_schema_1 = require("../schemas/quiz-attempt.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @route   GET /api/quiz-attempts/quiz/:quizId/status
 * @desc    Check quiz status - can user continue existing attempt or start new
 * @access  Private
 */
router.get('/quiz/:quizId/status', quiz_attempt_controller_1.QuizAttemptController.checkQuizAttemptStatus);
/**
 * @route   GET /api/quiz-attempts/quiz/:quizId/questions
 * @desc    Get all questions for a quiz
 * @access  Private
 */
router.get('/quiz/:quizId/questions', quiz_attempt_controller_1.QuizAttemptController.getQuizQuestions);
/**
 * @route   POST /api/quiz-attempts
 * @desc    Start a new quiz attempt
 * @access  Private
 */
router.post('/', (0, validation_middleware_1.validate)(quiz_attempt_schema_1.startQuizAttemptSchema), quiz_attempt_controller_1.QuizAttemptController.startQuizAttempt);
/**
 * @route   POST /api/quiz-attempts/:attemptId/answer
 * @desc    Submit an answer for a quiz attempt
 * @access  Private
 */
router.post('/:attemptId/answer', (0, validation_middleware_1.validate)(quiz_attempt_schema_1.submitAnswerSchema), quiz_attempt_controller_1.QuizAttemptController.submitAnswer);
/**
 * @route   POST /api/quiz-attempts/:attemptId/complete
 * @desc    Complete a quiz attempt
 * @access  Private
 */
router.post('/:attemptId/complete', (0, validation_middleware_1.validate)(quiz_attempt_schema_1.completeQuizAttemptSchema), quiz_attempt_controller_1.QuizAttemptController.completeQuizAttempt);
/**
 * @route   GET /api/quiz-attempts
 * @desc    Get quiz attempts for the authenticated user
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(quiz_attempt_schema_1.getQuizAttemptsQuery), quiz_attempt_controller_1.QuizAttemptController.getQuizAttempts);
/**
 * @route   GET /api/quiz-attempts/:attemptId
 * @desc    Get quiz attempt by ID
 * @access  Private
 */
router.get('/:attemptId', (0, validation_middleware_1.validate)(quiz_attempt_schema_1.getQuizAttemptByIdSchema), quiz_attempt_controller_1.QuizAttemptController.getQuizAttemptById);
/**
 * @route   DELETE /api/quiz-attempts/:attemptId
 * @desc    Delete quiz attempt (only if in progress)
 * @access  Private
 */
router.delete('/:attemptId', (0, validation_middleware_1.validate)(quiz_attempt_schema_1.getQuizAttemptByIdSchema), quiz_attempt_controller_1.QuizAttemptController.deleteQuizAttempt);
exports.default = router;
