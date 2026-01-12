import { Router } from 'express'
import { QuizAttemptController } from '../controllers/quiz-attempt.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validation.middleware'
import {
  startQuizAttemptSchema,
  submitAnswerSchema,
  completeQuizAttemptSchema,
  getQuizAttemptsQuery,
  getQuizAttemptByIdSchema
} from '../schemas/quiz-attempt.schema'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

/**
 * @route   GET /api/quiz-attempts/quiz/:quizId/status
 * @desc    Check quiz status - can user continue existing attempt or start new
 * @access  Private
 */
router.get('/quiz/:quizId/status', QuizAttemptController.checkQuizAttemptStatus)

/**
 * @route   GET /api/quiz-attempts/quiz/:quizId/questions
 * @desc    Get all questions for a quiz
 * @access  Private
 */
router.get('/quiz/:quizId/questions', QuizAttemptController.getQuizQuestions)

/**
 * @route   POST /api/quiz-attempts
 * @desc    Start a new quiz attempt
 * @access  Private
 */
router.post('/', validate(startQuizAttemptSchema), QuizAttemptController.startQuizAttempt)

/**
 * @route   POST /api/quiz-attempts/:attemptId/answer
 * @desc    Submit an answer for a quiz attempt
 * @access  Private
 */
router.post('/:attemptId/answer', validate(submitAnswerSchema), QuizAttemptController.submitAnswer)

/**
 * @route   POST /api/quiz-attempts/:attemptId/complete
 * @desc    Complete a quiz attempt
 * @access  Private
 */
router.post('/:attemptId/complete', validate(completeQuizAttemptSchema), QuizAttemptController.completeQuizAttempt)

/**
 * @route   GET /api/quiz-attempts
 * @desc    Get quiz attempts for the authenticated user
 * @access  Private
 */
router.get('/', validate(getQuizAttemptsQuery), QuizAttemptController.getQuizAttempts)

/**
 * @route   GET /api/quiz-attempts/:attemptId
 * @desc    Get quiz attempt by ID
 * @access  Private
 */
router.get('/:attemptId', validate(getQuizAttemptByIdSchema), QuizAttemptController.getQuizAttemptById)

/**
 * @route   DELETE /api/quiz-attempts/:attemptId
 * @desc    Delete quiz attempt (only if in progress)
 * @access  Private
 */
router.delete('/:attemptId', validate(getQuizAttemptByIdSchema), QuizAttemptController.deleteQuizAttempt)

export default router
