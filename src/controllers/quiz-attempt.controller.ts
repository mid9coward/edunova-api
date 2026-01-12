import { Request, Response } from 'express'
import { QuizAttemptService } from '../services/quiz-attempt.service'
import { AppError } from '../utils/errors'
import { sendSuccess } from '../utils/success'

/**
 * Quiz Attempt Controller
 * Handles quiz attempt operations
 */
export class QuizAttemptController {
  /**
   * Check quiz continuity for a specific quiz (simple check)
   */
  static async checkQuizAttemptStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { quizId } = req.params
    const result = await QuizAttemptService.checkQuizAttemptStatus(userId, quizId)

    sendSuccess.ok(res, 'Quiz continuity check completed', result)
  }

  /**
   * Start a new quiz attempt
   */
  static async startQuizAttempt(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const attempt = await QuizAttemptService.startQuizAttempt(req.body, userId)

    sendSuccess.created(res, 'Quiz attempt started successfully', { attempt })
  }

  /**
   * Get all questions for a quiz
   */
  static async getQuizQuestions(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { quizId } = req.params
    const questions = await QuizAttemptService.getQuizQuestions(quizId, userId)

    sendSuccess.ok(res, 'Quiz questions retrieved successfully', questions)
  }

  /**
   * Submit an answer for a quiz attempt
   */
  static async submitAnswer(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { attemptId } = req.params
    const attempt = await QuizAttemptService.submitAnswer(attemptId, req.body, userId)

    sendSuccess.ok(res, 'Answer submitted successfully', attempt)
  }

  /**
   * Complete a quiz attempt
   */
  static async completeQuizAttempt(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { attemptId } = req.params
    const attempt = await QuizAttemptService.completeQuizAttempt(attemptId, req.body, userId)

    sendSuccess.ok(res, 'Quiz attempt completed successfully', attempt)
  }

  /**
   * Get quiz attempts for the authenticated user
   */
  static async getQuizAttempts(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const result = await QuizAttemptService.getQuizAttempts(userId, req.query)

    sendSuccess.ok(res, 'Quiz attempts retrieved successfully', {
      attempts: result.attempts,
      summary: result.summary
    })
  }

  /**
   * Get quiz attempt by ID
   */
  static async getQuizAttemptById(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { attemptId } = req.params
    const result = await QuizAttemptService.getQuizAttemptById(attemptId, userId)

    sendSuccess.ok(res, 'Quiz attempt retrieved successfully', {
      ...result.attempt.toObject(),
      duration: result.duration,
      isPassed: result.isPassed,
      ...(result.remainingTime !== undefined && { remainingTime: result.remainingTime }),
      ...(result.isTimeExpired !== undefined && { isTimeExpired: result.isTimeExpired })
    })
  }

  /**
   * Delete quiz attempt (only if in progress)
   */
  static async deleteQuizAttempt(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { attemptId } = req.params
    await QuizAttemptService.deleteQuizAttempt(attemptId, userId)

    sendSuccess.ok(res, 'Quiz attempt deleted successfully')
  }
}
