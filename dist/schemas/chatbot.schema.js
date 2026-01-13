"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatusSchema = exports.getSuggestionsSchema = exports.clearChatHistorySchema = exports.getChatHistorySchema = exports.sendMessageSchema = void 0;
const zod_1 = require("zod");
/**
 * Chatbot Schema Validation
 */
exports.sendMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z
            .string({
            message: 'Message is required'
        })
            .min(1, 'Message cannot be empty')
            .max(1000, 'Message too long')
    })
});
exports.getChatHistorySchema = zod_1.z.object({});
exports.clearChatHistorySchema = zod_1.z.object({});
exports.getSuggestionsSchema = zod_1.z.object({
    query: zod_1.z
        .object({
        category: zod_1.z.string().optional(),
        level: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        limit: zod_1.z
            .string()
            .transform((val) => parseInt(val))
            .pipe(zod_1.z.number().min(1).max(20))
            .optional()
    })
        .optional()
});
exports.getStatusSchema = zod_1.z.object({});
