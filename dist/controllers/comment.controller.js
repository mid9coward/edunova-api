"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentController = void 0;
const errors_1 = require("../utils/errors");
const comment_service_1 = require("../services/comment.service");
const success_1 = require("../utils/success");
class CommentController {
    /**
     * Create a new comment
     */
    static async createComment(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const commentData = req.body;
        const comment = await comment_service_1.CommentService.createComment(userId, commentData);
        success_1.sendSuccess.created(res, 'Comment created successfully', comment);
    }
    /**
     * Get comment by ID
     */
    static async getCommentById(req, res) {
        const { id } = req.params;
        const comment = await comment_service_1.CommentService.getCommentById(id);
        success_1.sendSuccess.ok(res, 'Comment retrieved successfully', { comment });
    }
    /**
     * Get comments for a specific lesson
     */
    static async getLessonComments(req, res) {
        const { lessonId } = req.params;
        const query = req.query;
        const result = await comment_service_1.CommentService.getLessonComments(lessonId, query);
        success_1.sendSuccess.ok(res, 'Lesson comments retrieved successfully', result);
    }
    /**
     * Get user's comments
     */
    static async getUserComments(req, res) {
        const { userId } = req.params;
        const query = req.query;
        const result = await comment_service_1.CommentService.getUserComments(userId, query);
        success_1.sendSuccess.ok(res, 'User comments retrieved successfully', result);
    }
    /**
     * Get current user's comments
     */
    static async getMyComments(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const query = req.query;
        const result = await comment_service_1.CommentService.getUserComments(userId, query);
        success_1.sendSuccess.ok(res, 'Your comments retrieved successfully', result);
    }
    /**
     * Get all comments (admin only)
     */
    static async getComments(req, res) {
        const query = req.query;
        const result = await comment_service_1.CommentService.getComments(query);
        success_1.sendSuccess.ok(res, 'Comments retrieved successfully', result);
    }
    /**
     * Update comment
     */
    static async updateComment(req, res) {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const updateData = req.body;
        const comment = await comment_service_1.CommentService.updateComment(id, userId, updateData);
        success_1.sendSuccess.ok(res, 'Comment updated successfully', comment);
    }
    /**
     * Delete comment
     */
    static async deleteComment(req, res) {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const { deleteReplies } = req.query;
        await comment_service_1.CommentService.deleteComment(id, userId, deleteReplies === 'true');
        const message = deleteReplies === 'true' ? 'Comment and replies deleted successfully' : 'Comment deleted successfully';
        success_1.sendSuccess.ok(res, message);
    }
    /**
     * Get comment replies
     */
    static async getCommentReplies(req, res) {
        const { commentId } = req.params;
        const query = req.query;
        const result = await comment_service_1.CommentService.getCommentReplies(commentId, query);
        success_1.sendSuccess.ok(res, 'Comment replies retrieved successfully', result);
    }
    /**
     * Toggle reaction on comment (add if not exists, remove if exists)
     */
    static async addReaction(req, res) {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const reactionData = req.body;
        const comment = await comment_service_1.CommentService.toggleReaction(id, userId, reactionData);
        success_1.sendSuccess.ok(res, 'Reaction toggled successfully', comment);
    }
    /**
     * Remove reaction from comment
     */
    static async removeReaction(req, res) {
        const { id } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const reactionData = req.body;
        const comment = await comment_service_1.CommentService.removeReaction(id, userId, reactionData);
        success_1.sendSuccess.ok(res, 'Reaction removed successfully', { comment });
    }
    /**
     * Update comment status (admin only)
     */
    static async updateCommentStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const comment = await comment_service_1.CommentService.updateCommentStatus(id, status);
        success_1.sendSuccess.ok(res, `Comment ${status} successfully`, comment);
    }
    /**
     * Get comment reactions
     */
    static async getCommentReactions(req, res) {
        const { id } = req.params;
        const query = req.query;
        const result = await comment_service_1.CommentService.getCommentReactions(id, query);
        success_1.sendSuccess.ok(res, 'Comment reactions retrieved successfully', result);
    }
}
exports.CommentController = CommentController;
