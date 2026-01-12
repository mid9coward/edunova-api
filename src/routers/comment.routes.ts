import { Router } from 'express'
import { PERMISSIONS } from '~/configs/permission'
import { CommentController } from '../controllers/comment.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { uploadRateLimit } from '../middlewares/rate-limit.middleware'
import { loadUserPermissions, requirePermission } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import {
  addReactionSchema,
  createCommentSchema,
  deleteCommentSchema,
  getCommentByIdSchema,
  getCommentReactionsSchema,
  getCommentRepliesSchema,
  getCommentsSchema,
  getLessonCommentsSchema,
  getUserCommentsSchema,
  moderateCommentSchema,
  removeReactionSchema,
  updateCommentSchema
} from '../schemas/comment.schema'

const router = Router()

// Public routes - get lesson comments (approved only)
router.get('/lesson/:lessonId', validate(getLessonCommentsSchema), asyncHandler(CommentController.getLessonComments))

// Public routes - get comment by ID
router.get('/:id', validate(getCommentByIdSchema), asyncHandler(CommentController.getCommentById))

// Public routes - get comment replies
router.get('/:commentId/replies', validate(getCommentRepliesSchema), asyncHandler(CommentController.getCommentReplies))

// Public routes - get comment reactions
router.get('/:id/reactions', validate(getCommentReactionsSchema), asyncHandler(CommentController.getCommentReactions))

// Protected routes - require authentication
router.use(authMiddleware)
router.use(loadUserPermissions)

// User routes - authenticated users
router.post('/', uploadRateLimit, validate(createCommentSchema), asyncHandler(CommentController.createComment))

router.put('/:id', uploadRateLimit, validate(updateCommentSchema), asyncHandler(CommentController.updateComment))

router.delete('/:id', validate(deleteCommentSchema), asyncHandler(CommentController.deleteComment))

// Reaction routes
router.post('/:id/reactions', uploadRateLimit, validate(addReactionSchema), asyncHandler(CommentController.addReaction))

router.delete('/:id/reactions', validate(removeReactionSchema), asyncHandler(CommentController.removeReaction))

// Get current user's comments
router.get('/user/me', asyncHandler(CommentController.getMyComments))

// Get specific user's comments (public profiles)
router.get('/user/:userId', validate(getUserCommentsSchema), asyncHandler(CommentController.getUserComments))

// Admin/Moderator routes - require specific permissions
router.get(
  '/admin/all',
  requirePermission(PERMISSIONS.COMMENT_READ),
  validate(getCommentsSchema),
  asyncHandler(CommentController.getComments)
)

// Update comment status (admin only)
router.patch(
  '/admin/:id/status',
  requirePermission(PERMISSIONS.COMMENT_UPDATE),
  validate(moderateCommentSchema),
  asyncHandler(CommentController.updateCommentStatus)
)

export default router
