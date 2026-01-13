"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizAttemptController = void 0;
const quiz_attempt_service_1 = require("../services/quiz-attempt.service");
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
/**
 * Quiz Attempt Controller
 * Handles quiz attempt operations
 */
class QuizAttemptController {
    /**
     * Check quiz continuity for a specific quiz (simple check)
     */
    static async checkQuizAttemptStatus(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { quizId } = req.params;
        const result = await quiz_attempt_service_1.QuizAttemptService.checkQuizAttemptStatus(userId, quizId);
        success_1.sendSuccess.ok(res, 'Quiz continuity check completed', result);
    }
    /**
     * Start a new quiz attempt
     */
    static async startQuizAttempt(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const attempt = await quiz_attempt_service_1.QuizAttemptService.startQuizAttempt(req.body, userId);
        success_1.sendSuccess.created(res, 'Quiz attempt started successfully', { attempt });
    }
    /**
     * Get all questions for a quiz
     */
    static async getQuizQuestions(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { quizId } = req.params;
        const questions = await quiz_attempt_service_1.QuizAttemptService.getQuizQuestions(quizId, userId);
        success_1.sendSuccess.ok(res, 'Quiz questions retrieved successfully', questions);
    }
    /**
     * Submit an answer for a quiz attempt
     */
    static async submitAnswer(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { attemptId } = req.params;
        const attempt = await quiz_attempt_service_1.QuizAttemptService.submitAnswer(attemptId, req.body, userId);
        success_1.sendSuccess.ok(res, 'Answer submitted successfully', attempt);
    }
    /**
     * Complete a quiz attempt
     */
    static async completeQuizAttempt(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { attemptId } = req.params;
        const attempt = await quiz_attempt_service_1.QuizAttemptService.completeQuizAttempt(attemptId, req.body, userId);
        success_1.sendSuccess.ok(res, 'Quiz attempt completed successfully', attempt);
    }
    /**
     * Get quiz attempts for the authenticated user
     */
    static async getQuizAttempts(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const result = await quiz_attempt_service_1.QuizAttemptService.getQuizAttempts(userId, req.query);
        success_1.sendSuccess.ok(res, 'Quiz attempts retrieved successfully', {
            attempts: result.attempts,
            summary: result.summary
        });
    }
    /**
     * Get quiz attempt by ID
     */
    static async getQuizAttemptById(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { attemptId } = req.params;
        const result = await quiz_attempt_service_1.QuizAttemptService.getQuizAttemptById(attemptId, userId);
        success_1.sendSuccess.ok(res, 'Quiz attempt retrieved successfully', {
            ...result.attempt.toObject(),
            duration: result.duration,
            isPassed: result.isPassed,
            ...(result.remainingTime !== undefined && { remainingTime: result.remainingTime }),
            ...(result.isTimeExpired !== undefined && { isTimeExpired: result.isTimeExpired })
        });
    }
    /**
     * Delete quiz attempt (only if in progress)
     */
    static async deleteQuizAttempt(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { attemptId } = req.params;
        await quiz_attempt_service_1.QuizAttemptService.deleteQuizAttempt(attemptId, userId);
        success_1.sendSuccess.ok(res, 'Quiz attempt deleted successfully');
    }
}
exports.QuizAttemptController = QuizAttemptController;
