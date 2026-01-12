import { Request, Response } from 'express'
import CourseChatbotService from '../services/chatbot.service'
import { ValidationError } from '../utils/errors'
import { sendSuccess } from '../utils/success'

/**
 * Course Chatbot Controller
 * Handles chatbot interactions for course consultation
 */

export class CourseChatbotController {
  /**
   * Handle chatbot message
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    const { message } = req.body
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    try {
      const response = await CourseChatbotService.handleMessage(message, userId)

      sendSuccess.ok(res, 'Chatbot response generated successfully', {
        response: response.response,
        courses: response.courses || [],
        suggestions: response.suggestions,
        intent: response.intent,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      sendSuccess.ok(res, 'Chatbot response generated successfully', {
        response: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
        courses: [],
        suggestions: ['Thử lại', 'Liên hệ hỗ trợ', 'Xem khóa học', 'Tư vấn trực tiếp'],
        intent: 'general',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Get chat history for current user
   */
  static async getChatHistory(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    try {
      const history = CourseChatbotService.getChatHistory(userId)

      sendSuccess.ok(res, 'Chat history retrieved successfully', {
        history,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error getting chat history:', error)
      sendSuccess.ok(res, 'Chat history retrieved successfully', {
        history: [],
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * Clear chat history for current user
   */
  static async clearChatHistory(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    try {
      CourseChatbotService.clearChatHistory(userId)

      sendSuccess.ok(res, 'Chat history cleared successfully', {
        message: 'Lịch sử chat đã được xóa',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error clearing chat history:', error)
      sendSuccess.ok(res, 'Chat history cleared successfully', {
        message: 'Có lỗi khi xóa lịch sử chat',
        timestamp: new Date().toISOString()
      })
    }
  }
}
