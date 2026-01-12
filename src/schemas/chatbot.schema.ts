import { z } from 'zod'

/**
 * Chatbot Schema Validation
 */

export const sendMessageSchema = z.object({
  body: z.object({
    message: z
      .string({
        message: 'Message is required'
      })
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message too long')
  })
})

export const getChatHistorySchema = z.object({})

export const clearChatHistorySchema = z.object({})

export const getSuggestionsSchema = z.object({
  query: z
    .object({
      category: z.string().optional(),
      level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      limit: z
        .string()
        .transform((val) => parseInt(val))
        .pipe(z.number().min(1).max(20))
        .optional()
    })
    .optional()
})

export const getStatusSchema = z.object({})

export type SendMessageInput = z.infer<typeof sendMessageSchema>['body']
export type GetSuggestionsInput = z.infer<typeof getSuggestionsSchema>['query']
