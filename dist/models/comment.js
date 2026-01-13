"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comment = exports.ReactionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../enums");
/**
 * Reaction types enum
 */
var ReactionType;
(function (ReactionType) {
    ReactionType["LIKE"] = "like";
    ReactionType["LOVE"] = "love";
    ReactionType["CARE"] = "care";
    ReactionType["FUN"] = "fun";
    ReactionType["WOW"] = "wow";
    ReactionType["SAD"] = "sad";
    ReactionType["ANGRY"] = "angry";
})(ReactionType || (exports.ReactionType = ReactionType = {}));
/**
 * Comment Schema
 */
const commentSchema = new mongoose_1.Schema({
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        maxlength: [2000, 'Comment content cannot exceed 2000 characters']
    },
    lessonId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: [true, 'Lesson ID is required']
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    status: {
        type: String,
        enum: {
            values: Object.values(enums_1.CommentStatus),
            message: 'Status must be approved, pending, or rejected'
        },
        default: enums_1.CommentStatus.APPROVED
    },
    parentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    level: {
        type: Number,
        default: 1,
        min: [1, 'Level must be at least 1'],
        max: [5, 'Level cannot exceed 5']
    },
    mentions: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    reactions: [
        {
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            type: {
                type: String,
                enum: {
                    values: Object.values(ReactionType),
                    message: 'Invalid reaction type'
                },
                required: true
            }
        }
    ]
}, {
    timestamps: true
});
// Indexes for performance
commentSchema.index({ lessonId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ parentId: 1 });
commentSchema.index({ status: 1 });
commentSchema.index({ level: 1 });
exports.Comment = mongoose_1.default.model('Comment', commentSchema);
