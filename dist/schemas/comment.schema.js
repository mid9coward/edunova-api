"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentReactionsSchema = exports.getCommentRepliesSchema = exports.bulkModerateCommentsSchema = exports.deleteCommentSchema = exports.moderateCommentSchema = exports.getCommentsSchema = exports.getUserCommentsSchema = exports.getLessonCommentsSchema = exports.getCommentByIdSchema = exports.updateCommentSchema = exports.removeReactionSchema = exports.addReactionSchema = exports.createCommentSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
const enums_1 = require("../enums");
/**
 * Comment Validation Schemas
 */
// Reaction type enum validation
const reactionTypeSchema = zod_1.z.enum(['like', 'love', 'care', 'fun', 'wow', 'sad', 'angry']);
// Create comment schema
exports.createCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Content is required').max(2000, 'Content too long').trim(),
        lessonId: common_schema_1.objectIdSchema,
        parentId: zod_1.z.union([common_schema_1.objectIdSchema, zod_1.z.null()]).optional(), // For replies - allow null or valid ObjectId
        mentions: zod_1.z.array(common_schema_1.objectIdSchema).optional() // Mentioned users
    })
});
// Add reaction schema
exports.addReactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z.object({
        type: reactionTypeSchema
    })
});
// Remove reaction schema
exports.removeReactionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z.object({
        type: reactionTypeSchema
    })
});
// Update comment schema
exports.updateCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z.object({
        content: zod_1.z.string().min(1, 'Content is required').max(2000, 'Content too long').trim()
    })
});
// Get comment by ID schema
exports.getCommentByIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    })
});
// Get lesson comments schema
exports.getLessonCommentsSchema = zod_1.z.object({
    params: zod_1.z.object({
        lessonId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        status: zod_1.z.nativeEnum(enums_1.CommentStatus).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'status']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get user comments schema
exports.getUserCommentsSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        status: zod_1.z.nativeEnum(enums_1.CommentStatus).optional(),
        sortBy: zod_1.z.enum(['createdAt', 'status']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Get all comments schema (for admin)
exports.getCommentsSchema = zod_1.z.object({
    query: common_schema_1.paginationSchema.extend({
        lessonId: common_schema_1.objectIdSchema.optional(),
        userId: common_schema_1.objectIdSchema.optional(),
        status: zod_1.z
            .union([
            zod_1.z.nativeEnum(enums_1.CommentStatus),
            zod_1.z.array(zod_1.z.nativeEnum(enums_1.CommentStatus)),
            zod_1.z.string().transform((val) => {
                // Handle comma-separated values or multiple query params
                if (val.includes(',')) {
                    return val.split(',').map((s) => s.trim());
                }
                return val;
            })
        ])
            .optional(),
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['createdAt', 'status', 'content']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc')
    })
});
// Moderate comment schema (approve/reject)
exports.moderateCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum([enums_1.CommentStatus.APPROVED, enums_1.CommentStatus.REJECTED]),
        reason: zod_1.z.string().optional() // Optional moderation reason
    })
});
// Delete comment schema
exports.deleteCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    query: zod_1.z.object({
        deleteReplies: zod_1.z
            .string()
            .regex(/^(true|false)$/)
            .optional()
            .default('false')
    })
});
// Bulk moderate comments schema
exports.bulkModerateCommentsSchema = zod_1.z.object({
    body: zod_1.z.object({
        commentIds: zod_1.z.array(common_schema_1.objectIdSchema).min(1, 'At least one comment ID is required'),
        status: zod_1.z.enum([enums_1.CommentStatus.APPROVED, enums_1.CommentStatus.REJECTED]),
        reason: zod_1.z.string().optional()
    })
});
// Get comment replies schema
exports.getCommentRepliesSchema = zod_1.z.object({
    params: zod_1.z.object({
        commentId: common_schema_1.objectIdSchema
    }),
    query: common_schema_1.paginationSchema.extend({
        status: zod_1.z.nativeEnum(enums_1.CommentStatus).optional(),
        maxLevel: zod_1.z
            .string()
            .regex(/^[1-5]$/)
            .optional()
            .default('5'), // Maximum nesting level to fetch
        sortBy: zod_1.z.enum(['createdAt']).default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).default('asc') // Replies usually asc
    })
});
// Get comment reactions schema
exports.getCommentReactionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: common_schema_1.objectIdSchema
    }),
    query: zod_1.z.object({
        type: reactionTypeSchema.optional() // Filter by reaction type
    })
});
