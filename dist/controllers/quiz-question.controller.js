"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizQuestionController = void 0;
const quiz_question_service_1 = require("../services/quiz-question.service");
const success_1 = require("../utils/success");
/**
 * Quiz Question Controller
 * CRUD operations for quiz questions
 */
class QuizQuestionController {
    /**
     * Create new quiz questions
     */
    static async createQuizQuestion(req, res) {
        const { questions } = req.body;
        const createdQuestions = await quiz_question_service_1.QuizQuestionService.createQuizQuestion(questions);
        success_1.sendSuccess.created(res, 'Quiz questions created successfully', { questions: createdQuestions });
    }
    /**
     * Get all quiz questions with pagination and filtering
     */
    static async getQuizQuestions(req, res) {
        const query = req.query;
        const result = await quiz_question_service_1.QuizQuestionService.getQuizQuestions(query);
        success_1.sendSuccess.ok(res, 'Quiz questions fetched successfully', result);
    }
    /**
     * Get questions by quiz ID
     */
    static async getQuestionsByQuiz(req, res) {
        const { quizId } = req.params;
        const query = req.query;
        const result = await quiz_question_service_1.QuizQuestionService.getQuestionsByQuiz(quizId, query);
        success_1.sendSuccess.ok(res, 'Quiz questions fetched successfully', result);
    }
    /**
     * Get all questions by quiz ID (no pagination)
     */
    static async getAllQuestionsByQuiz(req, res) {
        const { quizId } = req.params;
        const questions = await quiz_question_service_1.QuizQuestionService.getAllQuestionsByQuiz(quizId);
        success_1.sendSuccess.ok(res, 'Quiz questions fetched successfully', { questions });
    }
    /**
     * Get quiz question by ID
     */
    static async getQuizQuestionById(req, res) {
        const { id } = req.params;
        const question = await quiz_question_service_1.QuizQuestionService.getQuizQuestionById(id);
        success_1.sendSuccess.ok(res, 'Quiz question fetched successfully', { question });
    }
    /**
     * Update quiz question
     */
    static async updateQuizQuestion(req, res) {
        const { id } = req.params;
        const updateData = req.body;
        const question = await quiz_question_service_1.QuizQuestionService.updateQuizQuestion(id, updateData);
        success_1.sendSuccess.ok(res, 'Quiz question updated successfully', { question });
    }
    /**
     * Delete quiz question
     */
    static async deleteQuizQuestion(req, res) {
        const { id } = req.params;
        await quiz_question_service_1.QuizQuestionService.deleteQuizQuestion(id);
        success_1.sendSuccess.ok(res, 'Quiz question deleted successfully');
    }
    /**
     * Bulk delete quiz questions
     */
    static async bulkDeleteQuizQuestions(req, res) {
        const bulkDeleteData = req.body;
        const result = await quiz_question_service_1.QuizQuestionService.bulkDeleteQuizQuestions(bulkDeleteData);
        success_1.sendSuccess.ok(res, 'Quiz questions deleted successfully', result);
    }
}
exports.QuizQuestionController = QuizQuestionController;
