"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkDeleteQuizQuestionsSchema = exports.getQuestionsByQuizSchema = exports.deleteQuizQuestionSchema = exports.getQuizQuestionByIdSchema = exports.getQuizQuestionsQuerySchema = exports.updateQuizQuestionSchema = exports.createQuizQuestionSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
/**
 * Quiz Question Validation Schemas
 */
// Individual question object schema
const questionObjectSchema = zod_1.z.object({
    quizId: common_schema_1.objectIdSchema,
    question: zod_1.z.string().min(1, 'Question is required').max(1000, 'Question too long').trim(),
    explanation: zod_1.z.string().min(1, 'Explanation is required').max(2000, 'Explanation too long').trim(),
    type: zod_1.z.enum(['multiple_choice', 'true_false', 'single_choice']),
    options: zod_1.z
        .array(zod_1.z.string().min(1, 'Option cannot be empty').trim())
        .min(2, 'At least 2 options required')
        .max(6, 'Maximum 6 options allowed'),
    correctAnswers: zod_1.z
        .array(zod_1.z.number().int().min(0, 'Answer index must be non-negative'))
        .min(1, 'At least one correct answer required'),
    point: zod_1.z.number().int().min(1, 'Point must be at least 1').max(100, 'Point cannot exceed 100')
});
// Create quiz question schema
exports.createQuizQuestionSchema = zod_1.z.object({
    body: zod_1.z.object({
        questions: zod_1.z.array(questionObjectSchema).min(1, 'At least one question is required')
    })
});
// Update quiz question schema
exports.updateQuizQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z
        .object({
        quizId: common_schema_1.objectIdSchema.optional(),
        question: zod_1.z.string().min(1, 'Question is required').max(1000, 'Question too long').trim().optional(),
        explanation: zod_1.z.string().min(1, 'Explanation is required').max(2000, 'Explanation too long').trim().optional(),
        type: zod_1.z.enum(['multiple_choice', 'true_false', 'single_choice']).optional(),
        options: zod_1.z
            .array(zod_1.z.string().min(1, 'Option cannot be empty').trim())
            .min(2, 'At least 2 options required')
            .max(6, 'Maximum 6 options allowed')
            .optional(),
        correctAnswers: zod_1.z
            .array(zod_1.z.number().int().min(0, 'Answer index must be non-negative'))
            .min(1, 'At least one correct answer required')
            .optional(),
        point: zod_1.z.number().int().min(1, 'Point must be at least 1').max(100, 'Point cannot exceed 100').optional()
    })
        .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
});
// Get quiz questions query schema
exports.getQuizQuestionsQuerySchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        quizId: common_schema_1.objectIdSchema.optional(),
        type: zod_1.z.enum(['multiple_choice', 'true_false', 'single_choice']).optional(),
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['question', 'point', 'createdAt']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc')
    })
});
// Get quiz question by ID schema
exports.getQuizQuestionByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Delete quiz question schema
exports.deleteQuizQuestionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Get questions by quiz ID schema
exports.getQuestionsByQuizSchema = zod_1.z.object({
    params: zod_1.z.object({
        quizId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        type: zod_1.z.enum(['multiple_choice', 'true_false', 'single_choice']).optional(),
        sortBy: zod_1.z.enum(['question', 'point', 'createdAt']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc')
    })
});
// Bulk delete quiz questions schema
exports.bulkDeleteQuizQuestionsSchema = zod_1.z.object({
    body: zod_1.z.object({
        questionIds: zod_1.z.array(common_schema_1.objectIdSchema).min(1, 'At least one question ID is required')
    })
});
