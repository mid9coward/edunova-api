"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizQuestionService = void 0;
const quiz_question_1 = require("../models/quiz-question");
const lesson_1 = require("../models/lesson");
const errors_1 = require("../utils/errors");
class QuizQuestionService {
    /**
     * Create quiz questions (handles multiple questions)
     */
    static async createQuizQuestion(questionsData, session) {
        // Validate all questions first
        for (const questionData of questionsData) {
            // Verify quiz exists
            const quiz = session
                ? await lesson_1.Quiz.findById(questionData.quizId).session(session)
                : await lesson_1.Quiz.findById(questionData.quizId);
            if (!quiz) {
                throw new errors_1.NotFoundError(`Quiz not found: ${questionData.quizId}`, errors_1.ErrorCodes.QUIZ_NOT_FOUND);
            }
        }
        // Create all questions
        const questions = session
            ? await quiz_question_1.QuizQuestion.insertMany(questionsData, { session })
            : await quiz_question_1.QuizQuestion.insertMany(questionsData);
        return questions;
    }
    /**
     * Get all quiz questions with pagination and filtering
     */
    static async getQuizQuestions(options = {}) {
        const { page = 1, limit = 10, search, type, quizId, sortBy = 'createdAt', sortOrder = 'asc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {};
        if (search) {
            filter.$or = [{ question: { $regex: search, $options: 'i' } }, { explanation: { $regex: search, $options: 'i' } }];
        }
        if (type) {
            filter.type = type;
        }
        if (quizId) {
            filter.quizId = quizId;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [questions, total] = await Promise.all([
            quiz_question_1.QuizQuestion.find(filter).sort(sort).skip(skip).limit(limitNum).populate('quizId', 'description').lean(),
            quiz_question_1.QuizQuestion.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            questions: questions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get questions by quiz ID
     */
    static async getQuestionsByQuiz(quizId, options = {}) {
        // Verify quiz exists
        const quiz = await lesson_1.Quiz.findById(quizId);
        if (!quiz) {
            throw new errors_1.NotFoundError('Quiz not found', errors_1.ErrorCodes.QUIZ_NOT_FOUND);
        }
        return this.getQuizQuestions({ ...options, quizId });
    }
    /**
     * Get quiz question by ID
     */
    static async getQuizQuestionById(questionId) {
        const question = await quiz_question_1.QuizQuestion.findById(questionId).populate('quizId', 'description');
        if (!question) {
            throw new errors_1.NotFoundError('Quiz question not found', errors_1.ErrorCodes.QUIZ_QUESTION_NOT_FOUND);
        }
        return question;
    }
    /**
     * Update quiz question
     */
    static async updateQuizQuestion(questionId, updateData) {
        const question = await quiz_question_1.QuizQuestion.findById(questionId);
        if (!question) {
            throw new errors_1.NotFoundError('Quiz question not found', errors_1.ErrorCodes.QUIZ_QUESTION_NOT_FOUND);
        }
        // If quizId is being updated, verify the new quiz exists
        if (updateData.quizId && updateData.quizId.toString() !== question.quizId.toString()) {
            const quiz = await lesson_1.Quiz.findById(updateData.quizId);
            if (!quiz) {
                throw new errors_1.NotFoundError('Quiz not found', errors_1.ErrorCodes.QUIZ_NOT_FOUND);
            }
        }
        // Validate correct answers if options or correctAnswers are being updated
        const newOptions = updateData.options || question.options;
        const newCorrectAnswers = updateData.correctAnswers || question.correctAnswers;
        const newType = updateData.type || question.type;
        if (updateData.options || updateData.correctAnswers) {
            const maxIndex = newOptions.length - 1;
            const invalidAnswers = newCorrectAnswers.filter((answer) => answer > maxIndex);
            if (invalidAnswers.length > 0) {
                throw new errors_1.ValidationError(`Invalid correct answer indices: ${invalidAnswers.join(', ')}. Must be between 0 and ${maxIndex}`, errors_1.ErrorCodes.INVALID_CORRECT_ANSWER_INDEX);
            }
        }
        // For true_false questions validation
        if (newType === 'true_false') {
            if (newOptions.length !== 2) {
                throw new errors_1.ValidationError('True/false questions must have exactly 2 options', errors_1.ErrorCodes.INVALID_TRUE_FALSE_OPTIONS);
            }
            if (newCorrectAnswers.some((answer) => answer > 1)) {
                throw new errors_1.ValidationError('True/false questions can only have answers 0 or 1', errors_1.ErrorCodes.INVALID_TRUE_FALSE_OPTIONS);
            }
        }
        // For single_choice questions validation
        if (newType === 'single_choice' && newCorrectAnswers.length > 1) {
            throw new errors_1.ValidationError('Single choice questions can only have one correct answer', errors_1.ErrorCodes.INVALID_SINGLE_CHOICE_ANSWERS);
        }
        // Update the question
        Object.assign(question, updateData);
        await question.save();
        return question;
    }
    /**
     * Delete quiz question
     */
    static async deleteQuizQuestion(questionId) {
        const question = await quiz_question_1.QuizQuestion.findById(questionId);
        if (!question) {
            throw new errors_1.NotFoundError('Quiz question not found', errors_1.ErrorCodes.QUIZ_QUESTION_NOT_FOUND);
        }
        await quiz_question_1.QuizQuestion.findByIdAndDelete(questionId);
    }
    /**
     * Bulk delete quiz questions
     */
    static async bulkDeleteQuizQuestions(data) {
        const { questionIds } = data;
        // Remove duplicates
        const uniqueQuestionIds = [...new Set(questionIds)];
        // Validate all questions exist
        const questions = await quiz_question_1.QuizQuestion.find({ _id: { $in: uniqueQuestionIds } });
        const foundQuestionIds = questions.map((q) => q._id.toString());
        const notFoundIds = uniqueQuestionIds.filter((id) => !foundQuestionIds.includes(id));
        if (notFoundIds.length > 0) {
            throw new errors_1.NotFoundError(`Quiz questions not found: ${notFoundIds.join(', ')}`, errors_1.ErrorCodes.QUIZ_QUESTION_NOT_FOUND);
        }
        // Delete all questions
        const result = await quiz_question_1.QuizQuestion.deleteMany({ _id: { $in: uniqueQuestionIds } });
        return {
            deletedCount: result.deletedCount || 0,
            skippedQuestions: []
        };
    }
    /**
     * Get all questions for a specific quiz (no pagination)
     */
    static async getAllQuestionsByQuiz(quizId) {
        // Verify quiz exists
        const quiz = await lesson_1.Quiz.findById(quizId);
        if (!quiz) {
            throw new errors_1.NotFoundError('Quiz not found', errors_1.ErrorCodes.QUIZ_NOT_FOUND);
        }
        const questions = await quiz_question_1.QuizQuestion.find({ quizId }).sort({ createdAt: 1 });
        return questions;
    }
}
exports.QuizQuestionService = QuizQuestionService;
