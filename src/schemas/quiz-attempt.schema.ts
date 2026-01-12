import { z } from 'zod'
import { objectIdSchema } from './common.schema'
import { QuizAttemptStatus } from '../enums'

/**
 * Quiz Attempt Schemas
 */

// Quiz attempt answer schema (for completion from frontend)
export const quizAttemptAnswerSchema = z.object({
  questionId: objectIdSchema,
  selectedOptionIndexes: z.array(z.number().min(0)).min(1)
  // Note: isCorrect is calculated on the backend, not provided by frontend
})

// Internal quiz attempt answer schema (with isCorrect calculated)
export const quizAttemptAnswerWithResultSchema = z.object({
  questionId: objectIdSchema,
  selectedOptionIndexes: z.array(z.number().min(0)).min(1),
  isCorrect: z.boolean()
})

// Start quiz attempt
export const startQuizAttemptSchema = z.object({
  body: z.object({
    quizId: objectIdSchema
  })
})

// Submit quiz attempt answer
export const submitAnswerSchema = z.object({
  body: z.object({
    questionId: objectIdSchema,
    selectedOptionIndexes: z.array(z.number().min(0)).min(1)
  }),
  params: z.object({
    attemptId: objectIdSchema
  })
})

// Complete quiz attempt
export const completeQuizAttemptSchema = z.object({
  body: z.object({
    answers: z.array(quizAttemptAnswerSchema).optional() // Optional, in case user wants to complete without answering all
  }),
  params: z.object({
    attemptId: objectIdSchema
  })
})

// Get quiz attempts query
export const getQuizAttemptsQuery = z.object({
  query: z.object({
    quizId: objectIdSchema.optional(),
    status: z.nativeEnum(QuizAttemptStatus).optional(),
    sortBy: z.enum(['startedAt', 'finishedAt', 'score']).optional().default('startedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
})

// Get quiz attempt by ID
export const getQuizAttemptByIdSchema = z.object({
  params: z.object({
    attemptId: objectIdSchema
  })
})

// Export types
export type QuizAttemptAnswerInput = z.infer<typeof quizAttemptAnswerSchema>
export type QuizAttemptAnswerWithResult = z.infer<typeof quizAttemptAnswerWithResultSchema>
export type StartQuizAttemptInput = z.infer<typeof startQuizAttemptSchema>['body']
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>['body']
export type CompleteQuizAttemptInput = z.infer<typeof completeQuizAttemptSchema>['body']
export type GetQuizAttemptsQuery = z.infer<typeof getQuizAttemptsQuery>['query']
