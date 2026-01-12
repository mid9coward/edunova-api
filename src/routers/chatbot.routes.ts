import { Router } from 'express'
import { authMiddleware } from '~/middlewares/auth.middleware'
import { CourseChatbotController } from '../controllers/chatbot.controller'
import { asyncHandler } from '../middlewares/error.middleware'
import { chatbotRateLimit } from '../middlewares/rate-limit.middleware'
import { validate } from '../middlewares/validation.middleware'
import { clearChatHistorySchema, getChatHistorySchema, sendMessageSchema } from '../schemas/chatbot.schema'

const router = Router()

/**
 * @route POST /chatbot/message
 * @desc Send message to chatbot and get AI response
 * @access Private (requires authentication)
 */
router.post(
  '/message',
  chatbotRateLimit,
  authMiddleware,
  validate(sendMessageSchema),
  asyncHandler(CourseChatbotController.sendMessage)
)

/**
 * @route GET /chatbot/history
 * @desc Get chat history for current user
 * @access Private (requires authentication)
 */
router.get(
  '/history',
  authMiddleware,
  validate(getChatHistorySchema),
  asyncHandler(CourseChatbotController.getChatHistory)
)

/**
 * @route DELETE /chatbot/history
 * @desc Clear chat history for current user
 * @access Private (requires authentication)
 */
router.delete(
  '/history',
  authMiddleware,
  validate(clearChatHistorySchema),
  asyncHandler(CourseChatbotController.clearChatHistory)
)

export default router
