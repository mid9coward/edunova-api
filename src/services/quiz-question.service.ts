import mongoose from 'mongoose'
import { QuizQuestion, IQuizQuestion } from '../models/quiz-question'
import { Quiz } from '../models/lesson'
import { NotFoundError, ValidationError, ErrorCodes } from '../utils/errors'
import {
  QuizQuestionData,
  UpdateQuizQuestionInput,
  GetQuizQuestionsQuery,
  GetQuestionsByQuizQuery
} from '../schemas/quiz-question.schema'

/**
 * Quiz Question Management Service
 * CRUD operations for quiz questions
 */

interface GetQuizQuestionsResult {
  questions: IQuizQuestion[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export class QuizQuestionService {
  /**
   * Create quiz questions (handles multiple questions)
   */
  static async createQuizQuestion(
    questionsData: QuizQuestionData[],
    session?: mongoose.ClientSession
  ): Promise<IQuizQuestion[]> {
    // Validate all questions first
    for (const questionData of questionsData) {
      // Verify quiz exists
      const quiz = session
        ? await Quiz.findById(questionData.quizId).session(session)
        : await Quiz.findById(questionData.quizId)
      if (!quiz) {
        throw new NotFoundError(`Quiz not found: ${questionData.quizId}`, ErrorCodes.QUIZ_NOT_FOUND)
      }
    }

    // Create all questions
    const questions = session
      ? await QuizQuestion.insertMany(questionsData, { session })
      : await QuizQuestion.insertMany(questionsData)
    return questions as unknown as IQuizQuestion[]
  }

  /**
   * Get all quiz questions with pagination and filtering
   */
  static async getQuizQuestions(options: Partial<GetQuizQuestionsQuery> = {}): Promise<GetQuizQuestionsResult> {
    const { page = 1, limit = 10, search, type, quizId, sortBy = 'createdAt', sortOrder = 'asc' } = options
    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = {}

    if (search) {
      filter.$or = [{ question: { $regex: search, $options: 'i' } }, { explanation: { $regex: search, $options: 'i' } }]
    }

    if (type) {
      filter.type = type
    }

    if (quizId) {
      filter.quizId = quizId
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [questions, total] = await Promise.all([
      QuizQuestion.find(filter).sort(sort).skip(skip).limit(limitNum).populate('quizId', 'description').lean(),
      QuizQuestion.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      questions: questions as unknown as IQuizQuestion[],
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get questions by quiz ID
   */
  static async getQuestionsByQuiz(
    quizId: string,
    options: Partial<GetQuestionsByQuizQuery> = {}
  ): Promise<GetQuizQuestionsResult> {
    // Verify quiz exists
    const quiz = await Quiz.findById(quizId)
    if (!quiz) {
      throw new NotFoundError('Quiz not found', ErrorCodes.QUIZ_NOT_FOUND)
    }

    return this.getQuizQuestions({ ...options, quizId })
  }

  /**
   * Get quiz question by ID
   */
  static async getQuizQuestionById(questionId: string): Promise<IQuizQuestion> {
    const question = await QuizQuestion.findById(questionId).populate('quizId', 'description')

    if (!question) {
      throw new NotFoundError('Quiz question not found', ErrorCodes.QUIZ_QUESTION_NOT_FOUND)
    }

    return question
  }

  /**
   * Update quiz question
   */
  static async updateQuizQuestion(questionId: string, updateData: UpdateQuizQuestionInput): Promise<IQuizQuestion> {
    const question = await QuizQuestion.findById(questionId)
    if (!question) {
      throw new NotFoundError('Quiz question not found', ErrorCodes.QUIZ_QUESTION_NOT_FOUND)
    }

    // If quizId is being updated, verify the new quiz exists
    if (updateData.quizId && updateData.quizId.toString() !== question.quizId.toString()) {
      const quiz = await Quiz.findById(updateData.quizId)
      if (!quiz) {
        throw new NotFoundError('Quiz not found', ErrorCodes.QUIZ_NOT_FOUND)
      }
    }

    // Validate correct answers if options or correctAnswers are being updated
    const newOptions = updateData.options || question.options
    const newCorrectAnswers = updateData.correctAnswers || question.correctAnswers
    const newType = updateData.type || question.type

    if (updateData.options || updateData.correctAnswers) {
      const maxIndex = newOptions.length - 1
      const invalidAnswers = newCorrectAnswers.filter((answer) => answer > maxIndex)
      if (invalidAnswers.length > 0) {
        throw new ValidationError(
          `Invalid correct answer indices: ${invalidAnswers.join(', ')}. Must be between 0 and ${maxIndex}`,
          ErrorCodes.INVALID_CORRECT_ANSWER_INDEX
        )
      }
    }

    // For true_false questions validation
    if (newType === 'true_false') {
      if (newOptions.length !== 2) {
        throw new ValidationError(
          'True/false questions must have exactly 2 options',
          ErrorCodes.INVALID_TRUE_FALSE_OPTIONS
        )
      }
      if (newCorrectAnswers.some((answer) => answer > 1)) {
        throw new ValidationError(
          'True/false questions can only have answers 0 or 1',
          ErrorCodes.INVALID_TRUE_FALSE_OPTIONS
        )
      }
    }

    // For single_choice questions validation
    if (newType === 'single_choice' && newCorrectAnswers.length > 1) {
      throw new ValidationError(
        'Single choice questions can only have one correct answer',
        ErrorCodes.INVALID_SINGLE_CHOICE_ANSWERS
      )
    }

    // Update the question
    Object.assign(question, updateData)
    await question.save()

    return question
  }

  /**
   * Delete quiz question
   */
  static async deleteQuizQuestion(questionId: string): Promise<void> {
    const question = await QuizQuestion.findById(questionId)
    if (!question) {
      throw new NotFoundError('Quiz question not found', ErrorCodes.QUIZ_QUESTION_NOT_FOUND)
    }

    await QuizQuestion.findByIdAndDelete(questionId)
  }

  /**
   * Bulk delete quiz questions
   */
  static async bulkDeleteQuizQuestions(data: { questionIds: string[] }): Promise<{
    deletedCount: number
    skippedQuestions: { id: string; question: string; reason: string }[]
  }> {
    const { questionIds } = data

    // Remove duplicates
    const uniqueQuestionIds = [...new Set(questionIds)]

    // Validate all questions exist
    const questions = await QuizQuestion.find({ _id: { $in: uniqueQuestionIds } })
    const foundQuestionIds = questions.map((q) => q._id.toString())
    const notFoundIds = uniqueQuestionIds.filter((id) => !foundQuestionIds.includes(id))

    if (notFoundIds.length > 0) {
      throw new NotFoundError(`Quiz questions not found: ${notFoundIds.join(', ')}`, ErrorCodes.QUIZ_QUESTION_NOT_FOUND)
    }

    // Delete all questions
    const result = await QuizQuestion.deleteMany({ _id: { $in: uniqueQuestionIds } })

    return {
      deletedCount: result.deletedCount || 0,
      skippedQuestions: []
    }
  }

  /**
   * Get all questions for a specific quiz (no pagination)
   */
  static async getAllQuestionsByQuiz(quizId: string): Promise<IQuizQuestion[]> {
    // Verify quiz exists
    const quiz = await Quiz.findById(quizId)
    if (!quiz) {
      throw new NotFoundError('Quiz not found', ErrorCodes.QUIZ_NOT_FOUND)
    }

    const questions = await QuizQuestion.find({ quizId }).sort({ createdAt: 1 })
    return questions
  }
}
