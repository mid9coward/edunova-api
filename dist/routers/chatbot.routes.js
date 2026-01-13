"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const chatbot_controller_1 = require("../controllers/chatbot.controller");
const error_middleware_1 = require("../middlewares/error.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const chatbot_schema_1 = require("../schemas/chatbot.schema");
const router = (0, express_1.Router)();
/**
 * @route POST /chatbot/message
 * @desc Send message to chatbot and get AI response
 * @access Private (requires authentication)
 */
router.post('/message', rate_limit_middleware_1.chatbotRateLimit, auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(chatbot_schema_1.sendMessageSchema), (0, error_middleware_1.asyncHandler)(chatbot_controller_1.CourseChatbotController.sendMessage));
/**
 * @route GET /chatbot/history
 * @desc Get chat history for current user
 * @access Private (requires authentication)
 */
router.get('/history', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(chatbot_schema_1.getChatHistorySchema), (0, error_middleware_1.asyncHandler)(chatbot_controller_1.CourseChatbotController.getChatHistory));
/**
 * @route DELETE /chatbot/history
 * @desc Clear chat history for current user
 * @access Private (requires authentication)
 */
router.delete('/history', auth_middleware_1.authMiddleware, (0, validation_middleware_1.validate)(chatbot_schema_1.clearChatHistorySchema), (0, error_middleware_1.asyncHandler)(chatbot_controller_1.CourseChatbotController.clearChatHistory));
exports.default = router;
