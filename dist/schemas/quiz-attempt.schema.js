"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizAttemptByIdSchema = exports.getQuizAttemptsQuery = exports.completeQuizAttemptSchema = exports.submitAnswerSchema = exports.startQuizAttemptSchema = exports.quizAttemptAnswerWithResultSchema = exports.quizAttemptAnswerSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
const enums_1 = require("../enums");
/**
 * Quiz Attempt Schemas
 */
// Quiz attempt answer schema (for completion from frontend)
exports.quizAttemptAnswerSchema = zod_1.z.object({
    questionId: common_schema_1.objectIdSchema,
    selectedOptionIndexes: zod_1.z.array(zod_1.z.number().min(0)).min(1)
    // Note: isCorrect is calculated on the backend, not provided by frontend
});
// Internal quiz attempt answer schema (with isCorrect calculated)
exports.quizAttemptAnswerWithResultSchema = zod_1.z.object({
    questionId: common_schema_1.objectIdSchema,
    selectedOptionIndexes: zod_1.z.array(zod_1.z.number().min(0)).min(1),
    isCorrect: zod_1.z.boolean()
});
// Start quiz attempt
exports.startQuizAttemptSchema = zod_1.z.object({
    body: zod_1.z.object({
        quizId: common_schema_1.objectIdSchema
    })
});
// Submit quiz attempt answer
exports.submitAnswerSchema = zod_1.z.object({
    body: zod_1.z.object({
        questionId: common_schema_1.objectIdSchema,
        selectedOptionIndexes: zod_1.z.array(zod_1.z.number().min(0)).min(1)
    }),
    params: zod_1.z.object({
        attemptId: common_schema_1.objectIdSchema
    })
});
// Complete quiz attempt
exports.completeQuizAttemptSchema = zod_1.z.object({
    body: zod_1.z.object({
        answers: zod_1.z.array(exports.quizAttemptAnswerSchema).optional() // Optional, in case user wants to complete without answering all
    }),
    params: zod_1.z.object({
        attemptId: common_schema_1.objectIdSchema
    })
});
// Get quiz attempts query
exports.getQuizAttemptsQuery = zod_1.z.object({
    query: zod_1.z.object({
        quizId: common_schema_1.objectIdSchema.optional(),
        status: zod_1.z.nativeEnum(enums_1.QuizAttemptStatus).optional(),
        sortBy: zod_1.z.enum(['startedAt', 'finishedAt', 'score']).optional().default('startedAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc')
    })
});
// Get quiz attempt by ID
exports.getQuizAttemptByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        attemptId: common_schema_1.objectIdSchema
    })
});
