import { Request, Response } from 'express'
import { QuizQuestionService } from '../services/quiz-question.service'
import { sendSuccess } from '../utils/success'
import {
  CreateQuizQuestionInput,
  UpdateQuizQuestionInput,
  GetQuizQuestionsQuery,
  GetQuestionsByQuizQuery
} from '../schemas/quiz-question.schema'

/**
 * Quiz Question Controller
 * CRUD operations for quiz questions
 */

export class QuizQuestionController {
  /**
   * Create new quiz questions
   */
  static async createQuizQuestion(req: Request, res: Response): Promise<void> {
    const { questions }: CreateQuizQuestionInput = req.body
    const createdQuestions = await QuizQuestionService.createQuizQuestion(questions)

    sendSuccess.created(res, 'Quiz questions created successfully', { questions: createdQuestions })
  }

  /**
   * Get all quiz questions with pagination and filtering
   */
  static async getQuizQuestions(req: Request, res: Response): Promise<void> {
    const query: Partial<GetQuizQuestionsQuery> = req.query
    const result = await QuizQuestionService.getQuizQuestions(query)

    sendSuccess.ok(res, 'Quiz questions fetched successfully', result)
  }

  /**
   * Get questions by quiz ID
   */
  static async getQuestionsByQuiz(req: Request, res: Response): Promise<void> {
    const { quizId } = req.params
    const query: Partial<GetQuestionsByQuizQuery> = req.query
    const result = await QuizQuestionService.getQuestionsByQuiz(quizId, query)

    sendSuccess.ok(res, 'Quiz questions fetched successfully', result)
  }

  /**
   * Get all questions by quiz ID (no pagination)
   */
  static async getAllQuestionsByQuiz(req: Request, res: Response): Promise<void> {
    const { quizId } = req.params
    const questions = await QuizQuestionService.getAllQuestionsByQuiz(quizId)

    sendSuccess.ok(res, 'Quiz questions fetched successfully', { questions })
  }

  /**
   * Get quiz question by ID
   */
  static async getQuizQuestionById(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const question = await QuizQuestionService.getQuizQuestionById(id)

    sendSuccess.ok(res, 'Quiz question fetched successfully', { question })
  }

  /**
   * Update quiz question
   */
  static async updateQuizQuestion(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const updateData: UpdateQuizQuestionInput = req.body
    const question = await QuizQuestionService.updateQuizQuestion(id, updateData)

    sendSuccess.ok(res, 'Quiz question updated successfully', { question })
  }

  /**
   * Delete quiz question
   */
  static async deleteQuizQuestion(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    await QuizQuestionService.deleteQuizQuestion(id)

    sendSuccess.ok(res, 'Quiz question deleted successfully')
  }

  /**
   * Bulk delete quiz questions
   */
  static async bulkDeleteQuizQuestions(req: Request, res: Response): Promise<void> {
    const bulkDeleteData: { questionIds: string[] } = req.body
    const result = await QuizQuestionService.bulkDeleteQuizQuestions(bulkDeleteData)

    sendSuccess.ok(res, 'Quiz questions deleted successfully', result)
  }
}
