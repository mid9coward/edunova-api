"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseChatbotController = void 0;
const chatbot_service_1 = __importDefault(require("../services/chatbot.service"));
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
/**
 * Course Chatbot Controller
 * Handles chatbot interactions for course consultation
 */
class CourseChatbotController {
    /**
     * Handle chatbot message
     */
    static async sendMessage(req, res) {
        const { message } = req.body;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        try {
            const response = await chatbot_service_1.default.handleMessage(message, userId);
            success_1.sendSuccess.ok(res, 'Chatbot response generated successfully', {
                response: response.response,
                courses: response.courses || [],
                suggestions: response.suggestions,
                intent: response.intent,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            success_1.sendSuccess.ok(res, 'Chatbot response generated successfully', {
                response: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
                courses: [],
                suggestions: ['Thử lại', 'Liên hệ hỗ trợ', 'Xem khóa học', 'Tư vấn trực tiếp'],
                intent: 'general',
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Get chat history for current user
     */
    static async getChatHistory(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        try {
            const history = chatbot_service_1.default.getChatHistory(userId);
            success_1.sendSuccess.ok(res, 'Chat history retrieved successfully', {
                history,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error getting chat history:', error);
            success_1.sendSuccess.ok(res, 'Chat history retrieved successfully', {
                history: [],
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Clear chat history for current user
     */
    static async clearChatHistory(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        try {
            chatbot_service_1.default.clearChatHistory(userId);
            success_1.sendSuccess.ok(res, 'Chat history cleared successfully', {
                message: 'Lịch sử chat đã được xóa',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error clearing chat history:', error);
            success_1.sendSuccess.ok(res, 'Chat history cleared successfully', {
                message: 'Có lỗi khi xóa lịch sử chat',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.CourseChatbotController = CourseChatbotController;
