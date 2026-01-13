"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizAttemptService = void 0;
const quiz_attempt_1 = require("../models/quiz-attempt");
const lesson_1 = require("../models/lesson");
const quiz_question_1 = require("../models/quiz-question");
const user_1 = require("../models/user");
const errors_1 = require("../utils/errors");
const mongoose_1 = __importDefault(require("mongoose"));
const enums_1 = require("../enums");
/**
 * Quiz Attempt Management Service
 */
class QuizAttemptService {
    /**
     * Calculate attempt duration in milliseconds
     */
    static calculateDuration(startedAt, finishedAt) {
        if (finishedAt) {
            return finishedAt.getTime() - startedAt.getTime();
        }
        return null;
    }
    /**
     * Check if attempt is passed based on quiz's passing score percentage and total possible points
     */
    static isPassed(earnedPoints, totalPossiblePoints, passingScorePercentage = 60) {
        if (totalPossiblePoints === 0)
            return false;
        const percentage = (earnedPoints / totalPossiblePoints) * 100;
        return percentage >= passingScorePercentage;
    }
    /**
     * Check if attempt has exceeded the quiz time limit
     */
    static isTimeExpired(startedAt, quizDurationSeconds) {
        // If duration is 0 or undefined, quiz has unlimited time
        if (!quizDurationSeconds || quizDurationSeconds === 0) {
            return false;
        }
        const now = new Date();
        const timeElapsedMs = now.getTime() - startedAt.getTime();
        const timeElapsedSeconds = timeElapsedMs / 1000;
        return timeElapsedSeconds > quizDurationSeconds;
    }
    /**
     * Calculate remaining time in seconds for an active attempt
     */
    static getRemainingTime(startedAt, quizDurationSeconds) {
        // If duration is 0 or undefined, quiz has unlimited time
        if (!quizDurationSeconds || quizDurationSeconds === 0) {
            return null; // null indicates unlimited time
        }
        const now = new Date();
        const timeElapsedMs = now.getTime() - startedAt.getTime();
        const timeElapsedSeconds = timeElapsedMs / 1000;
        const remainingSeconds = quizDurationSeconds - timeElapsedSeconds;
        return Math.max(0, Math.ceil(remainingSeconds));
    }
    /**
     * Set finishedAt when completing attempt
     */
    static setFinishedAt(attempt) {
        if (attempt.status === enums_1.QuizAttemptStatus.COMPLETED && !attempt.finishedAt) {
            attempt.finishedAt = new Date();
        }
    }
    /**
     * Check if user can continue an existing quiz attempt or should start new
     * Simple method to determine quiz continuity state
     */
    static async checkQuizAttemptStatus(userId, quizId) {
        const activeAttempt = await quiz_attempt_1.QuizAttempt.findOne({
            userId,
            quizId,
            status: enums_1.QuizAttemptStatus.IN_PROGRESS
        }).populate('quizId', 'duration');
        if (!activeAttempt) {
            return {
                canContinue: false,
                attemptId: null,
                startedAt: null
            };
        }
        // Check if quiz has time limit and if expired
        const quiz = activeAttempt.quizId;
        // If quiz has time limit, check if expired
        if (quiz.duration && quiz.duration > 0) {
            const isExpired = this.isTimeExpired(activeAttempt.startedAt, quiz.duration);
            if (isExpired) {
                // Auto-complete expired attempt
                const totalQuestions = activeAttempt.answers.length;
                const correctAnswers = activeAttempt.answers.filter((answer) => answer.isCorrect).length;
                const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                activeAttempt.status = enums_1.QuizAttemptStatus.COMPLETED;
                activeAttempt.score = score;
                this.setFinishedAt(activeAttempt);
                await activeAttempt.save();
                return {
                    canContinue: false,
                    attemptId: null,
                    startedAt: null
                };
            }
        }
        // Active and not expired (or unlimited time)
        return {
            canContinue: true,
            attemptId: activeAttempt._id.toString(),
            startedAt: activeAttempt.startedAt
        };
    }
    /**
     * Start a new quiz attempt
     */
    static async startQuizAttempt(attemptData, userId) {
        // Validate user exists
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Validate quiz exists
        const quiz = await lesson_1.Quiz.findById(attemptData.quizId);
        if (!quiz) {
            throw new errors_1.AppError('Quiz not found', 404);
        }
        // Check if user has an active attempt for this quiz
        const existingAttempt = await quiz_attempt_1.QuizAttempt.findOne({
            userId,
            quizId: attemptData.quizId,
            status: enums_1.QuizAttemptStatus.IN_PROGRESS
        });
        if (existingAttempt) {
            throw new errors_1.AppError('You already have an active attempt for this quiz', 400);
        }
        // Create new attempt
        const attempt = new quiz_attempt_1.QuizAttempt({
            userId,
            quizId: attemptData.quizId,
            startedAt: new Date(),
            status: enums_1.QuizAttemptStatus.IN_PROGRESS,
            score: 0,
            answers: []
        });
        await attempt.save();
        return attempt;
    }
    /**
     * Get all questions for a quiz
     * Only allowed if user has an active quiz attempt
     */
    static async getQuizQuestions(quizId, userId) {
        // Validate quiz exists
        const quiz = await lesson_1.Quiz.findById(quizId);
        if (!quiz) {
            throw new errors_1.AppError('Quiz not found', 404);
        }
        // Check if user has an active attempt for this quiz
        const activeAttempt = await quiz_attempt_1.QuizAttempt.findOne({
            userId,
            quizId,
            status: enums_1.QuizAttemptStatus.IN_PROGRESS
        });
        if (!activeAttempt) {
            throw new errors_1.AppError('No active quiz attempt found. Please start the quiz first.', 403);
        }
        // Get all questions for this quiz but exclude correctAnswers for security
        const questions = await quiz_question_1.QuizQuestion.find({ quizId }).select('-correctAnswers').lean();
        return questions;
    }
    /**
     * Submit an answer for a quiz attempt
     */
    static async submitAnswer(attemptId, answerData, userId) {
        // Find the attempt
        const attempt = await quiz_attempt_1.QuizAttempt.findOne({
            _id: attemptId,
            userId,
            status: enums_1.QuizAttemptStatus.IN_PROGRESS
        }).populate('quizId', 'duration');
        if (!attempt) {
            throw new errors_1.AppError('Quiz attempt not found or already completed', 404);
        }
        // Check if time limit has been exceeded
        const quiz = attempt.quizId;
        if (quiz && quiz.duration && quiz.duration > 0 && this.isTimeExpired(attempt.startedAt, quiz.duration)) {
            // Auto-complete the attempt due to time expiry
            attempt.status = enums_1.QuizAttemptStatus.COMPLETED;
            this.setFinishedAt(attempt);
            await attempt.save();
            throw new errors_1.AppError('Quiz time limit has been exceeded. The attempt has been automatically completed.', 400);
        }
        // Check if answer for this question already exists
        const existingAnswerIndex = attempt.answers.findIndex((answer) => answer.questionId.toString() === answerData.questionId);
        const newAnswer = {
            questionId: new mongoose_1.default.Types.ObjectId(answerData.questionId),
            selectedOptionIndexes: answerData.selectedOptionIndexes,
            isCorrect: false // Will be determined when quiz is completed
        };
        if (existingAnswerIndex >= 0) {
            // Update existing answer
            attempt.answers[existingAnswerIndex] = newAnswer;
        }
        else {
            // Add new answer
            attempt.answers.push(newAnswer);
        }
        await attempt.save();
        return attempt;
    }
    /**
     * Complete a quiz attempt and calculate score
     */
    static async completeQuizAttempt(attemptId, completeData, userId) {
        // Find the attempt
        const attempt = await quiz_attempt_1.QuizAttempt.findOne({
            _id: attemptId,
            userId,
            status: enums_1.QuizAttemptStatus.IN_PROGRESS
        }).populate('quizId', 'duration');
        if (!attempt) {
            throw new errors_1.AppError('Quiz attempt not found or already completed', 404);
        }
        // Check if time limit has been exceeded
        const quiz = attempt.quizId;
        if (quiz && quiz.duration && quiz.duration > 0 && this.isTimeExpired(attempt.startedAt, quiz.duration)) {
            // Get all quiz questions to calculate point-based score
            const questions = await quiz_question_1.QuizQuestion.find({ quizId: attempt.quizId }).lean();
            const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
            // Auto-complete with current answers only and calculate point-based score
            let totalEarnedPoints = 0;
            let totalPossiblePoints = 0;
            for (const question of questions) {
                totalPossiblePoints += question.point || 1; // Default to 1 point if not specified
                // Find if this question was answered correctly
                const userAnswer = attempt.answers.find((a) => a.questionId.toString() === question._id.toString());
                if (userAnswer && userAnswer.isCorrect) {
                    totalEarnedPoints += question.point || 1;
                }
            }
            const score = totalEarnedPoints; // Use raw points instead of percentage
            attempt.status = enums_1.QuizAttemptStatus.COMPLETED;
            attempt.score = score;
            this.setFinishedAt(attempt);
            await attempt.save();
            return attempt;
        }
        // Get all quiz questions with correct answers to validate user answers
        const questions = await quiz_question_1.QuizQuestion.find({ quizId: attempt.quizId }).lean();
        const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));
        // Update answers with provided data and calculate correctness
        attempt.answers = (completeData?.answers ?? []).map((answer) => {
            const question = questionMap.get(answer.questionId);
            let isCorrect = false;
            if (question && question.correctAnswers) {
                // Compare user's selected options with correct answers
                // Sort both arrays to ensure proper comparison
                const userAnswers = [...answer.selectedOptionIndexes].sort();
                const correctAnswers = [...question.correctAnswers].sort();
                // Check if arrays are equal (same length and same elements)
                isCorrect =
                    userAnswers.length === correctAnswers.length &&
                        userAnswers.every((val, index) => val === correctAnswers[index]);
            }
            return {
                questionId: new mongoose_1.default.Types.ObjectId(answer.questionId),
                selectedOptionIndexes: answer.selectedOptionIndexes,
                isCorrect
            };
        });
        // Calculate score based on points
        let totalEarnedPoints = 0;
        let totalPossiblePoints = 0;
        // Calculate total possible points and earned points
        for (const answer of attempt.answers) {
            const question = questionMap.get(answer.questionId.toString());
            if (question) {
                const questionPoints = question.point || 1; // Default to 1 point if not specified
                totalPossiblePoints += questionPoints;
                if (answer.isCorrect) {
                    totalEarnedPoints += questionPoints;
                }
            }
        }
        const score = totalEarnedPoints; // Use raw points instead of percentage
        // Complete the attempt
        attempt.status = enums_1.QuizAttemptStatus.COMPLETED;
        attempt.score = score;
        // Set finishedAt using service method
        this.setFinishedAt(attempt);
        await attempt.save();
        return attempt;
    }
    /**
     * Get quiz attempts history for a user with summary statistics
     * Returns data formatted for frontend history table
     */
    static async getQuizAttempts(userId, options = {}) {
        const { quizId, status, sortBy = 'startedAt', sortOrder = 'desc' } = options;
        // Build filter query
        const filter = { userId };
        if (quizId) {
            filter.quizId = quizId;
        }
        if (status) {
            filter.status = status;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute query (not using lean() to allow saving modified documents)
        const attempts = await quiz_attempt_1.QuizAttempt.find(filter)
            .sort(sort)
            .populate('quizId', 'description totalAttemptsAllowed passingScorePercentage duration');
        // Process each attempt and auto-complete expired ones
        const processedAttempts = [];
        let totalScore = 0;
        let passedCount = 0;
        let highestScore = 0;
        for (const attempt of attempts) {
            let wasAutoCompleted = false;
            // Auto-complete if expired and still in progress
            if (attempt.status === enums_1.QuizAttemptStatus.IN_PROGRESS) {
                const quiz = attempt.quizId;
                if (quiz && quiz.duration && quiz.duration > 0 && this.isTimeExpired(attempt.startedAt, quiz.duration)) {
                    // Get all quiz questions to calculate point-based score
                    const questions = await quiz_question_1.QuizQuestion.find({ quizId: attempt.quizId }).lean();
                    // Auto-complete the expired attempt with point-based scoring
                    let totalEarnedPoints = 0;
                    let totalPossiblePoints = 0;
                    for (const question of questions) {
                        const questionPoints = question.point || 1; // Default to 1 point if not specified
                        totalPossiblePoints += questionPoints;
                        // Find if this question was answered correctly
                        const userAnswer = attempt.answers.find((a) => a.questionId.toString() === question._id.toString());
                        if (userAnswer && userAnswer.isCorrect) {
                            totalEarnedPoints += questionPoints;
                        }
                    }
                    const score = totalEarnedPoints; // Use raw points instead of percentage
                    attempt.status = enums_1.QuizAttemptStatus.COMPLETED;
                    attempt.score = score;
                    this.setFinishedAt(attempt);
                    await attempt.save();
                    wasAutoCompleted = true;
                }
            }
            // Calculate attempt details
            const quiz = attempt.quizId;
            const passingScore = quiz?.passingScorePercentage || 60;
            const totalQuestions = attempt.answers.length;
            const correctAnswers = attempt.answers.filter((answer) => answer.isCorrect).length;
            const wrongAnswers = totalQuestions - correctAnswers;
            // Calculate total possible points for this attempt to determine if passed
            const questions = await quiz_question_1.QuizQuestion.find({ quizId: attempt.quizId }).lean();
            const totalPossiblePoints = questions.reduce((sum, q) => sum + (q.point || 1), 0);
            const isPassed = this.isPassed(attempt.score, totalPossiblePoints, passingScore);
            // Calculate duration
            const durationMs = this.calculateDuration(attempt.startedAt, attempt.finishedAt);
            const durationSeconds = durationMs ? Math.round(durationMs / 1000) : null;
            // Update summary statistics
            if (attempt.status === enums_1.QuizAttemptStatus.COMPLETED) {
                totalScore += attempt.score;
                if (isPassed)
                    passedCount++;
                if (attempt.score > highestScore)
                    highestScore = attempt.score;
            }
            processedAttempts.push({
                _id: attempt._id.toString(),
                startedAt: attempt.startedAt,
                totalQuestions,
                correctAnswers,
                wrongAnswers,
                earnedPoints: attempt.score,
                totalPoints: totalPossiblePoints,
                duration: durationSeconds,
                result: isPassed ? enums_1.QuizResult.PASS : enums_1.QuizResult.FAIL,
                status: attempt.status === enums_1.QuizAttemptStatus.COMPLETED ? enums_1.QuizAttemptStatus.COMPLETED : enums_1.QuizAttemptStatus.IN_PROGRESS,
                wasAutoCompleted
            });
        }
        // Calculate summary
        const completedAttempts = processedAttempts.filter((a) => a.status === enums_1.QuizAttemptStatus.COMPLETED);
        const averageScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0;
        return {
            attempts: processedAttempts,
            summary: {
                highestScore,
                averageScore,
                passedAttempts: passedCount,
                totalAttempts: processedAttempts.length
            }
        };
    }
    /**
     * Get quiz attempt by ID with calculated fields
     * Automatically handles expired attempts
     */
    static async getQuizAttemptById(attemptId, userId) {
        const attempt = await quiz_attempt_1.QuizAttempt.findOne({ _id: attemptId, userId })
            .populate('quizId', 'description totalAttemptsAllowed passingScorePercentage duration')
            .populate('userId', 'username email');
        if (!attempt) {
            throw new errors_1.AppError('Quiz attempt not found', 404);
        }
        // Get all questions for this quiz but exclude correctAnswers for security
        const questions = await quiz_question_1.QuizQuestion.find({ quizId: attempt.quizId }).select('-correctAnswers').lean();
        let wasAutoCompleted = false;
        // Auto-complete if expired and still in progress
        if (attempt.status === enums_1.QuizAttemptStatus.IN_PROGRESS) {
            const quiz = attempt.quizId;
            if (quiz && quiz.duration && quiz.duration > 0 && this.isTimeExpired(attempt.startedAt, quiz.duration)) {
                // Auto-complete the expired attempt
                const totalQuestions = attempt.answers.length;
                const correctAnswers = attempt.answers.filter((answer) => answer.isCorrect).length;
                const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
                attempt.status = enums_1.QuizAttemptStatus.COMPLETED;
                attempt.score = score;
                this.setFinishedAt(attempt);
                await attempt.save();
                wasAutoCompleted = true;
            }
        }
        // Add calculated fields
        const duration = this.calculateDuration(attempt.startedAt, attempt.finishedAt);
        const durationSeconds = duration ? Math.round(duration / 1000) : null;
        const quiz = attempt.quizId;
        const passingScore = quiz?.passingScorePercentage || 60;
        // Calculate total possible points to determine if passed (using existing questions variable)
        const totalPossiblePoints = questions.reduce((sum, q) => sum + (q.point || 1), 0);
        const isPassed = this.isPassed(attempt.score, totalPossiblePoints, passingScore);
        const result = {
            attempt,
            duration: durationSeconds,
            isPassed,
            wasAutoCompleted,
            questions: questions
        };
        // Add time-related info if quiz is still in progress
        if (attempt.status === enums_1.QuizAttemptStatus.IN_PROGRESS) {
            const quiz = attempt.quizId;
            if (quiz && quiz.duration && quiz.duration > 0) {
                result.isTimeExpired = this.isTimeExpired(attempt.startedAt, quiz.duration);
                result.remainingTime = this.getRemainingTime(attempt.startedAt, quiz.duration);
            }
            else {
                // Quiz has unlimited time
                result.isTimeExpired = false;
                result.remainingTime = null;
            }
        }
        return result;
    }
    /**
     * Delete quiz attempt (only if in progress)
     */
    static async deleteQuizAttempt(attemptId, userId) {
        const attempt = await quiz_attempt_1.QuizAttempt.findOne({
            _id: attemptId,
            userId,
            status: enums_1.QuizAttemptStatus.IN_PROGRESS
        });
        if (!attempt) {
            throw new errors_1.AppError('Quiz attempt not found or already completed', 404);
        }
        await quiz_attempt_1.QuizAttempt.findByIdAndDelete(attemptId);
    }
}
exports.QuizAttemptService = QuizAttemptService;
