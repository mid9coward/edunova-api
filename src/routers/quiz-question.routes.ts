import { Router } from 'express'
import { QuizQuestionController } from '../controllers/quiz-question.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'

import {
  createQuizQuestionSchema,
  updateQuizQuestionSchema,
  getQuizQuestionsQuerySchema,
  getQuizQuestionByIdSchema,
  deleteQuizQuestionSchema,
  getQuestionsByQuizSchema,
  bulkDeleteQuizQuestionsSchema
} from '../schemas/quiz-question.schema'
import { PERMISSIONS } from '~/configs/permission'

const router = Router()

/**
 * Public Routes (if any)
 */

// Get quiz questions with pagination and filtering (might be public for quizzes)
router.get('/', validate(getQuizQuestionsQuerySchema), asyncHandler(QuizQuestionController.getQuizQuestions))

// Get questions by quiz ID with pagination
router.get('/quiz/:quizId', validate(getQuestionsByQuizSchema), asyncHandler(QuizQuestionController.getQuestionsByQuiz))

// Get all questions by quiz ID (no pagination)
router.get('/quiz/:quizId/all', asyncHandler(QuizQuestionController.getAllQuestionsByQuiz))

/**
 * Protected Routes (require authentication and proper permissions)
 */
router.use(authMiddleware)
router.use(loadUserPermissions)

// Bulk delete quiz questions - MOVED BEFORE parameterized routes
router.delete(
  '/bulk-delete',
  requirePermission([PERMISSIONS.QUIZ_QUESTION_DELETE]),
  validate(bulkDeleteQuizQuestionsSchema),
  asyncHandler(QuizQuestionController.bulkDeleteQuizQuestions)
)

// Create quiz question (supports both single and bulk)
router.post(
  '/',
  requirePermission([PERMISSIONS.QUIZ_QUESTION_CREATE]),
  validate(createQuizQuestionSchema),
  asyncHandler(QuizQuestionController.createQuizQuestion)
)

// Update quiz question
router.put(
  '/:id',
  requirePermission([PERMISSIONS.QUIZ_QUESTION_UPDATE]),
  validate(updateQuizQuestionSchema),
  asyncHandler(QuizQuestionController.updateQuizQuestion)
)

// Delete quiz question
router.delete(
  '/:id',
  requirePermission([PERMISSIONS.QUIZ_QUESTION_DELETE]),
  validate(deleteQuizQuestionSchema),
  asyncHandler(QuizQuestionController.deleteQuizQuestion)
)

// Get quiz question by ID - MOVED AFTER other routes to avoid conflicts
router.get('/:id', validate(getQuizQuestionByIdSchema), asyncHandler(QuizQuestionController.getQuizQuestionById))

export default router
