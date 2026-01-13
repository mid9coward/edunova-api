import { Request, Response } from 'express'
import { ValidationError } from '~/utils/errors'
import type {
  AddReactionInput,
  CreateCommentInput,
  GetCommentReactionsQuery,
  GetCommentRepliesQuery,
  GetCommentsQuery,
  GetLessonCommentsQuery,
  GetUserCommentsQuery,
  ModerateCommentInput,
  RemoveReactionInput,
  UpdateCommentInput
} from '../schemas/comment.schema'
import { CommentService } from '../services/comment.service'
import { sendSuccess } from '../utils/success'

export class CommentController {
  /**
   * Create a new comment
   */
  static async createComment(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const commentData: CreateCommentInput = req.body

    const comment = await CommentService.createComment(userId, commentData)

    sendSuccess.created(res, 'Comment created successfully', comment)
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(req: Request, res: Response): Promise<void> {
    const { id } = req.params

    const comment = await CommentService.getCommentById(id as string)

    sendSuccess.ok(res, 'Comment retrieved successfully', { comment })
  }

  /**
   * Get comments for a specific lesson
   */
  static async getLessonComments(req: Request, res: Response): Promise<void> {
    const { lessonId } = req.params
    const query = req.query as unknown as GetLessonCommentsQuery

    const result = await CommentService.getLessonComments(lessonId as string, query)

    sendSuccess.ok(res, 'Lesson comments retrieved successfully', result)
  }

  /**
   * Get user's comments
   */
  static async getUserComments(req: Request, res: Response): Promise<void> {
    const { userId } = req.params
    const query = req.query as unknown as GetUserCommentsQuery

    const result = await CommentService.getUserComments(userId as string, query)

    sendSuccess.ok(res, 'User comments retrieved successfully', result)
  }

  /**
   * Get current user's comments
   */
  static async getMyComments(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const query = req.query as unknown as GetUserCommentsQuery

    const result = await CommentService.getUserComments(userId, query)

    sendSuccess.ok(res, 'Your comments retrieved successfully', result)
  }

  /**
   * Get all comments (admin only)
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as GetCommentsQuery

    const result = await CommentService.getComments(query)

    sendSuccess.ok(res, 'Comments retrieved successfully', result)
  }

  /**
   * Update comment
   */
  static async updateComment(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user?.userId
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }

    const updateData: UpdateCommentInput = req.body

    const comment = await CommentService.updateComment(id as string, userId, updateData)

    sendSuccess.ok(res, 'Comment updated successfully', comment)
  }

  /**
   * Delete comment
   */
  static async deleteComment(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const { deleteReplies } = req.query

    await CommentService.deleteComment(id as string, userId, deleteReplies === 'true')

    const message =
      deleteReplies === 'true' ? 'Comment and replies deleted successfully' : 'Comment deleted successfully'

    sendSuccess.ok(res, message)
  }

  /**
   * Get comment replies
   */
  static async getCommentReplies(req: Request, res: Response): Promise<void> {
    const { commentId } = req.params
    const query = req.query as unknown as GetCommentRepliesQuery

    const result = await CommentService.getCommentReplies(commentId as string, query)

    sendSuccess.ok(res, 'Comment replies retrieved successfully', result)
  }

  /**
   * Toggle reaction on comment (add if not exists, remove if exists)
   */
  static async addReaction(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const reactionData: AddReactionInput = req.body

    const comment = await CommentService.toggleReaction(id as string, userId, reactionData)

    sendSuccess.ok(res, 'Reaction toggled successfully', comment)
  }

  /**
   * Remove reaction from comment
   */
  static async removeReaction(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const reactionData: RemoveReactionInput = req.body

    const comment = await CommentService.removeReaction(id as string, userId, reactionData)

    sendSuccess.ok(res, 'Reaction removed successfully', { comment })
  }

  /**
   * Update comment status (admin only)
   */
  static async updateCommentStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const { status } = req.body

    const comment = await CommentService.updateCommentStatus(id as string, status)

    sendSuccess.ok(res, `Comment ${status} successfully`, comment)
  }

  /**
   * Get comment reactions
   */
  static async getCommentReactions(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const query = req.query as unknown as GetCommentReactionsQuery

    const result = await CommentService.getCommentReactions(id as string, query)

    sendSuccess.ok(res, 'Comment reactions retrieved successfully', result)
  }
}
