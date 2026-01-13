"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const comment_1 = require("../models/comment");
const user_1 = require("../models/user");
const lesson_1 = require("../models/lesson");
const errors_1 = require("../utils/errors");
const enums_1 = require("../enums");
class CommentService {
    /**
     * Create a new comment
     */
    static async createComment(userId, commentData) {
        // Validate lesson exists
        const lesson = await lesson_1.Lesson.findById(commentData.lessonId);
        if (!lesson) {
            throw new errors_1.NotFoundError('Lesson not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        let level = 1;
        // If parentId provided, validate parent comment exists and calculate level
        if (commentData.parentId) {
            const parentComment = await comment_1.Comment.findById(commentData.parentId);
            if (!parentComment) {
                throw new errors_1.NotFoundError('Parent comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
            }
            // Calculate level (parent level + 1)
            level = parentComment.level + 1;
            // Prevent nesting beyond 5 levels
            if (level > 5) {
                throw new errors_1.ValidationError('Cannot reply beyond 5 levels of nesting', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
            }
        }
        // Validate mentioned users exist
        if (commentData.mentions && commentData.mentions.length > 0) {
            const mentionedUsers = await user_1.User.find({ _id: { $in: commentData.mentions } });
            if (mentionedUsers.length !== commentData.mentions.length) {
                throw new errors_1.ValidationError('Some mentioned users do not exist', errors_1.ErrorCodes.USER_NOT_FOUND);
            }
        }
        const comment = new comment_1.Comment({
            ...commentData,
            userId,
            level,
            status: enums_1.CommentStatus.APPROVED,
            reactions: [] // Initialize empty reactions array
        });
        await comment.save();
        // Use aggregation to get the same structure as getLessonComments
        const result = await comment_1.Comment.aggregate([
            { $match: { _id: comment._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    replies: [] // New comments always have empty replies array
                }
            }
        ]);
        return result[0];
    }
    /**
     * Get comment by ID
     */
    static async getCommentById(commentId) {
        const comment = await comment_1.Comment.findById(commentId)
            .populate('userId', 'username email avatar')
            .populate('lessonId', 'title');
        if (!comment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        return comment;
    }
    /**
     * Get comments for a specific lesson with aggregation
     */
    static async getLessonComments(lessonId, options) {
        const { page = 1, limit = 10 } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Validate lesson exists
        const lesson = await lesson_1.Lesson.findById(lessonId);
        if (!lesson) {
            throw new errors_1.NotFoundError('Lesson not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        const matchStage = {
            lessonId: new mongoose_1.default.Types.ObjectId(lessonId),
            parentId: null, // Only get top-level comments
            status: enums_1.CommentStatus.APPROVED // Only approved comments
        };
        const pipeline = [
            { $match: matchStage },
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    paginatedResults: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user',
                                pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                            }
                        },
                        {
                            $unwind: {
                                path: '$user',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'comments',
                                localField: '_id',
                                foreignField: 'parentId',
                                as: 'replyCountLookup'
                            }
                        },
                        {
                            $addFields: {
                                replyCount: { $size: '$replyCountLookup' },
                                replies: [] // Set replies to empty array
                            }
                        },
                        {
                            $project: {
                                replyCountLookup: 0 // Remove the temporary lookup array
                            }
                        },
                        { $sort: { createdAt: -1 } }, // Sort parent comments by newest first
                        { $skip: skip },
                        { $limit: limitNum }
                    ]
                }
            }
        ];
        const result = await comment_1.Comment.aggregate(pipeline);
        const { totalCount, paginatedResults } = result[0];
        const total = totalCount[0]?.count || 0;
        const comments = paginatedResults;
        return {
            comments,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get user's comments
     */
    static async getUserComments(userId, options) {
        const { page = 1, limit = 10 } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        const matchStage = { userId: new mongoose_1.default.Types.ObjectId(userId) };
        const sortOption = { createdAt: -1 };
        const pipeline = [
            { $match: matchStage },
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    paginatedResults: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user',
                                pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                            }
                        },
                        {
                            $unwind: {
                                path: '$user',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $lookup: {
                                from: 'lessons',
                                localField: 'lessonId',
                                foreignField: '_id',
                                as: 'lesson',
                                pipeline: [{ $project: { title: 1 } }]
                            }
                        },
                        {
                            $unwind: {
                                path: '$lesson',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        { $sort: sortOption },
                        { $skip: skip },
                        { $limit: limitNum }
                    ]
                }
            }
        ];
        const result = await comment_1.Comment.aggregate(pipeline);
        const { totalCount, paginatedResults } = result[0];
        const total = totalCount[0]?.count || 0;
        return {
            comments: paginatedResults,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get all comments (admin function)
     */
    static async getComments(options) {
        const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        const matchStage = {};
        if (status) {
            if (Array.isArray(status)) {
                // Multiple status values
                matchStage.status = { $in: status };
            }
            else {
                // Single status value
                matchStage.status = status;
            }
        }
        if (search)
            matchStage.content = { $regex: search, $options: 'i' };
        const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const pipeline = [
            { $match: matchStage },
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    paginatedResults: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'userId',
                                foreignField: '_id',
                                as: 'user',
                                pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                            }
                        },
                        {
                            $unwind: {
                                path: '$user',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        { $sort: sortOption },
                        { $skip: skip },
                        { $limit: limitNum }
                    ]
                }
            }
        ];
        const result = await comment_1.Comment.aggregate(pipeline);
        const { totalCount, paginatedResults } = result[0];
        const total = totalCount[0]?.count || 0;
        return {
            comments: paginatedResults,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum < Math.ceil(total / limitNum),
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Update comment (only by author)
     */
    static async updateComment(commentId, userId, updateData) {
        const comment = await comment_1.Comment.findById(commentId);
        if (!comment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        // Only author can update
        if (comment.userId.toString() !== userId) {
            throw new errors_1.ValidationError('You can only update your own comments', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        // Reset to pending if content changes
        comment.content = updateData.content;
        await comment.save();
        // Use aggregation to get the same structure as createComment
        const result = await comment_1.Comment.aggregate([
            { $match: { _id: comment._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    replies: [] // Add empty replies array for consistency
                }
            }
        ]);
        return result[0];
    }
    /**
     * Delete comment
     */
    static async deleteComment(commentId, userId, deleteReplies = false) {
        const comment = await comment_1.Comment.findById(commentId);
        if (!comment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        // Only author can delete (or admin, but that should be handled by permissions)
        if (comment.userId.toString() !== userId) {
            throw new errors_1.ValidationError('You can only delete your own comments', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        if (deleteReplies) {
            // Delete comment and all its replies
            await comment_1.Comment.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] });
        }
        else {
            // Just delete the comment
            await comment_1.Comment.findByIdAndDelete(commentId);
        }
    }
    /**
     * Get comment replies
     */
    static async getCommentReplies(commentId, options) {
        const { status, maxLevel = '5', sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const maxLevelNum = +maxLevel;
        // Validate parent comment exists
        const parentComment = await comment_1.Comment.findById(commentId);
        if (!parentComment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        const matchStage = {
            parentId: new mongoose_1.default.Types.ObjectId(commentId),
            level: { $lte: maxLevelNum }
        };
        if (status) {
            matchStage.status = status;
        }
        const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'parentId',
                    as: 'replyCountLookup'
                }
            },
            {
                $addFields: {
                    replyCount: { $size: '$replyCountLookup' },
                    replies: [] // Set replies to empty array
                }
            },
            {
                $project: {
                    replyCountLookup: 0 // Remove the temporary lookup array
                }
            },
            {
                $sort: sortOption
            }
        ];
        const comments = await comment_1.Comment.aggregate(pipeline);
        return {
            comments
        };
    }
    /**
     * Toggle a reaction on a comment (add if not exists, remove if exists)
     */
    static async toggleReaction(commentId, userId, reactionData) {
        const comment = await comment_1.Comment.findById(commentId);
        if (!comment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        // Check if user already reacted with this type
        const existingReactionIndex = comment.reactions.findIndex((reaction) => reaction.userId.toString() === userId && reaction.type === reactionData.type);
        if (existingReactionIndex !== -1) {
            // Remove the existing reaction if it's the same type
            comment.reactions.splice(existingReactionIndex, 1);
        }
        else {
            // Remove any existing reaction from this user (only one reaction type per user)
            comment.reactions = comment.reactions.filter((reaction) => reaction.userId.toString() !== userId);
            // Add new reaction
            comment.reactions.push({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                type: reactionData.type
            });
        }
        await comment.save();
        // Use aggregation to get the same structure as createComment
        const result = await comment_1.Comment.aggregate([
            { $match: { _id: comment._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    replies: [] // Add empty replies array for consistency
                }
            }
        ]);
        return result[0];
    }
    /**
     * Remove a reaction from a comment
     */
    static async removeReaction(commentId, userId, reactionData) {
        const comment = await comment_1.Comment.findById(commentId);
        if (!comment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        // Find and remove the reaction
        const reactionIndex = comment.reactions.findIndex((reaction) => reaction.userId.toString() === userId && reaction.type === reactionData.type);
        if (reactionIndex === -1) {
            throw new errors_1.NotFoundError('Reaction not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        comment.reactions.splice(reactionIndex, 1);
        await comment.save();
        // Use aggregation to get the same structure as createComment
        const result = await comment_1.Comment.aggregate([
            { $match: { _id: comment._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $addFields: {
                    replies: [] // Add empty replies array for consistency
                }
            }
        ]);
        return result[0];
    }
    /**
     * Update comment status (admin function)
     */
    static async updateCommentStatus(commentId, status) {
        const comment = await comment_1.Comment.findById(commentId);
        if (!comment) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        comment.status = status;
        await comment.save();
        // Use aggregation to get the same structure as other methods
        const result = await comment_1.Comment.aggregate([
            { $match: { _id: comment._id } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonId',
                    foreignField: '_id',
                    as: 'lesson',
                    pipeline: [{ $project: { title: 1 } }]
                }
            },
            {
                $unwind: {
                    path: '$lesson',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);
        return result[0];
    }
    /**
     * Get comment reactions with optional filtering
     */
    static async getCommentReactions(commentId, options) {
        const { type } = options;
        const pipeline = [
            { $match: { _id: new mongoose_1.default.Types.ObjectId(commentId) } },
            {
                $facet: {
                    reactions: [
                        { $unwind: '$reactions' },
                        ...(type ? [{ $match: { 'reactions.type': type } }] : []),
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'reactions.userId',
                                foreignField: '_id',
                                as: 'userDetails',
                                pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                            }
                        },
                        {
                            $addFields: {
                                'reactions.userDetails': { $arrayElemAt: ['$userDetails', 0] }
                            }
                        },
                        {
                            $replaceRoot: { newRoot: '$reactions' }
                        }
                    ],
                    summary: [
                        { $unwind: '$reactions' },
                        {
                            $group: {
                                _id: '$reactions.type',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                summary: {
                                    $push: {
                                        k: '$_id',
                                        v: '$count'
                                    }
                                }
                            }
                        },
                        {
                            $replaceRoot: {
                                newRoot: { $arrayToObject: '$summary' }
                            }
                        }
                    ]
                }
            }
        ];
        const result = await comment_1.Comment.aggregate(pipeline);
        if (!result[0]) {
            throw new errors_1.NotFoundError('Comment not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        const { reactions, summary } = result[0];
        return {
            reactions: reactions.map((reaction) => ({
                userId: reaction.userId,
                type: reaction.type,
                userDetails: reaction.userDetails || undefined
            })),
            summary: summary[0] || {}
        };
    }
}
exports.CommentService = CommentService;
