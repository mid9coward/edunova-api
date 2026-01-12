import { z } from 'zod'
import { objectIdSchema, paginationSchema } from './common.schema'

/**
 * Quiz Question Validation Schemas
 */

// Individual question object schema
const questionObjectSchema = z.object({
  quizId: objectIdSchema,
  question: z.string().min(1, 'Question is required').max(1000, 'Question too long').trim(),
  explanation: z.string().min(1, 'Explanation is required').max(2000, 'Explanation too long').trim(),
  type: z.enum(['multiple_choice', 'true_false', 'single_choice']),
  options: z
    .array(z.string().min(1, 'Option cannot be empty').trim())
    .min(2, 'At least 2 options required')
    .max(6, 'Maximum 6 options allowed'),
  correctAnswers: z
    .array(z.number().int().min(0, 'Answer index must be non-negative'))
    .min(1, 'At least one correct answer required'),
  point: z.number().int().min(1, 'Point must be at least 1').max(100, 'Point cannot exceed 100')
})

// Create quiz question schema
export const createQuizQuestionSchema = z.object({
  body: z.object({
    questions: z.array(questionObjectSchema).min(1, 'At least one question is required')
  })
})

// Update quiz question schema
export const updateQuizQuestionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      quizId: objectIdSchema.optional(),
      question: z.string().min(1, 'Question is required').max(1000, 'Question too long').trim().optional(),
      explanation: z.string().min(1, 'Explanation is required').max(2000, 'Explanation too long').trim().optional(),
      type: z.enum(['multiple_choice', 'true_false', 'single_choice']).optional(),
      options: z
        .array(z.string().min(1, 'Option cannot be empty').trim())
        .min(2, 'At least 2 options required')
        .max(6, 'Maximum 6 options allowed')
        .optional(),
      correctAnswers: z
        .array(z.number().int().min(0, 'Answer index must be non-negative'))
        .min(1, 'At least one correct answer required')
        .optional(),
      point: z.number().int().min(1, 'Point must be at least 1').max(100, 'Point cannot exceed 100').optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get quiz questions query schema
export const getQuizQuestionsQuerySchema = z.object({
  query: paginationSchema.extend({
    quizId: objectIdSchema.optional(),
    type: z.enum(['multiple_choice', 'true_false', 'single_choice']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['question', 'point', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
})

// Get quiz question by ID schema
export const getQuizQuestionByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete quiz question schema
export const deleteQuizQuestionSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Get questions by quiz ID schema
export const getQuestionsByQuizSchema = z.object({
  params: z.object({
    quizId: objectIdSchema
  }),
  query: paginationSchema.extend({
    type: z.enum(['multiple_choice', 'true_false', 'single_choice']).optional(),
    sortBy: z.enum(['question', 'point', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
})

// Bulk delete quiz questions schema
export const bulkDeleteQuizQuestionsSchema = z.object({
  body: z.object({
    questionIds: z.array(objectIdSchema).min(1, 'At least one question ID is required')
  })
})

// Type exports for the schemas
export type QuizQuestionData = z.infer<typeof questionObjectSchema>
export type CreateQuizQuestionInput = z.infer<typeof createQuizQuestionSchema>['body']
export type UpdateQuizQuestionInput = z.infer<typeof updateQuizQuestionSchema>['body']
export type GetQuizQuestionsQuery = z.infer<typeof getQuizQuestionsQuerySchema>['query']
export type GetQuestionsByQuizQuery = z.infer<typeof getQuestionsByQuizSchema>['query']
