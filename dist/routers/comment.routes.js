"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const permission_1 = require("../configs/permission");
const comment_controller_1 = require("../controllers/comment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const comment_schema_1 = require("../schemas/comment.schema");
const router = (0, express_1.Router)();
// Public routes - get lesson comments (approved only)
router.get('/lesson/:lessonId', (0, validation_middleware_1.validate)(comment_schema_1.getLessonCommentsSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getLessonComments));
// Public routes - get comment by ID
router.get('/:id', (0, validation_middleware_1.validate)(comment_schema_1.getCommentByIdSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getCommentById));
// Public routes - get comment replies
router.get('/:commentId/replies', (0, validation_middleware_1.validate)(comment_schema_1.getCommentRepliesSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getCommentReplies));
// Public routes - get comment reactions
router.get('/:id/reactions', (0, validation_middleware_1.validate)(comment_schema_1.getCommentReactionsSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getCommentReactions));
// Protected routes - require authentication
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// User routes - authenticated users
router.post('/', rate_limit_middleware_1.uploadRateLimit, (0, validation_middleware_1.validate)(comment_schema_1.createCommentSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.createComment));
router.put('/:id', rate_limit_middleware_1.uploadRateLimit, (0, validation_middleware_1.validate)(comment_schema_1.updateCommentSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.updateComment));
router.delete('/:id', (0, validation_middleware_1.validate)(comment_schema_1.deleteCommentSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.deleteComment));
// Reaction routes
router.post('/:id/reactions', rate_limit_middleware_1.uploadRateLimit, (0, validation_middleware_1.validate)(comment_schema_1.addReactionSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.addReaction));
router.delete('/:id/reactions', (0, validation_middleware_1.validate)(comment_schema_1.removeReactionSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.removeReaction));
// Get current user's comments
router.get('/user/me', (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getMyComments));
// Get specific user's comments (public profiles)
router.get('/user/:userId', (0, validation_middleware_1.validate)(comment_schema_1.getUserCommentsSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getUserComments));
// Admin/Moderator routes - require specific permissions
router.get('/admin/all', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COMMENT_READ), (0, validation_middleware_1.validate)(comment_schema_1.getCommentsSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.getComments));
// Update comment status (admin only)
router.patch('/admin/:id/status', (0, rbac_middleware_1.requirePermission)(permission_1.PERMISSIONS.COMMENT_UPDATE), (0, validation_middleware_1.validate)(comment_schema_1.moderateCommentSchema), (0, error_middleware_1.asyncHandler)(comment_controller_1.CommentController.updateCommentStatus));
exports.default = router;
