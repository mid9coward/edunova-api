import mongoose, { FilterQuery } from 'mongoose'
import { Comment, IComment, ReactionType } from '../models/comment'
import { User } from '../models/user'
import { Lesson } from '../models/lesson'
import { ValidationError, NotFoundError, ErrorCodes } from '../utils/errors'
import {
  CreateCommentInput,
  UpdateCommentInput,
  GetCommentsQuery,
  GetLessonCommentsQuery,
  GetUserCommentsQuery,
  GetCommentRepliesQuery,
  AddReactionInput,
  RemoveReactionInput,
  GetCommentReactionsQuery
} from '../schemas/comment.schema'
import { CommentStatus } from '~/enums'

interface CommentsResult {
  comments: IComment[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export class CommentService {
  /**
   * Create a new comment
   */
  static async createComment(userId: string, commentData: CreateCommentInput): Promise<IComment> {
    // Validate lesson exists
    const lesson = await Lesson.findById(commentData.lessonId)
    if (!lesson) {
      throw new NotFoundError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    let level = 1

    // If parentId provided, validate parent comment exists and calculate level
    if (commentData.parentId) {
      const parentComment = await Comment.findById(commentData.parentId)
      if (!parentComment) {
        throw new NotFoundError('Parent comment not found', ErrorCodes.LESSON_NOT_FOUND)
      }

      // Calculate level (parent level + 1)
      level = parentComment.level + 1

      // Prevent nesting beyond 5 levels
      if (level > 5) {
        throw new ValidationError('Cannot reply beyond 5 levels of nesting', ErrorCodes.INVALID_INPUT_FORMAT)
      }
    }

    // Validate mentioned users exist
    if (commentData.mentions && commentData.mentions.length > 0) {
      const mentionedUsers = await User.find({ _id: { $in: commentData.mentions } })
      if (mentionedUsers.length !== commentData.mentions.length) {
        throw new ValidationError('Some mentioned users do not exist', ErrorCodes.USER_NOT_FOUND)
      }
    }

    const comment = new Comment({
      ...commentData,
      userId,
      level,
      status: CommentStatus.APPROVED,
      reactions: [] // Initialize empty reactions array
    })

    await comment.save()

    // Use aggregation to get the same structure as getLessonComments
    const result = await Comment.aggregate([
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
    ])

    return result[0] as IComment
  }

  /**
   * Get comment by ID
   */
  static async getCommentById(commentId: string): Promise<IComment> {
    const comment = await Comment.findById(commentId)
      .populate('userId', 'username email avatar')
      .populate('lessonId', 'title')

    if (!comment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    return comment
  }

  /**
   * Get comments for a specific lesson with aggregation
   */
  static async getLessonComments(lessonId: string, options: GetLessonCommentsQuery): Promise<CommentsResult> {
    const { page = 1, limit = 10 } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Validate lesson exists
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      throw new NotFoundError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    const matchStage: FilterQuery<IComment> = {
      lessonId: new mongoose.Types.ObjectId(lessonId),
      parentId: null, // Only get top-level comments
      status: CommentStatus.APPROVED // Only approved comments
    }

    const pipeline: mongoose.PipelineStage[] = [
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
    ]

    const result = await Comment.aggregate(pipeline)

    const { totalCount, paginatedResults } = result[0]
    const total = totalCount[0]?.count || 0
    const comments = paginatedResults

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
    }
  }

  /**
   * Get user's comments
   */
  static async getUserComments(userId: string, options: GetUserCommentsQuery): Promise<CommentsResult> {
    const { page = 1, limit = 10 } = options
    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    const matchStage: FilterQuery<IComment> = { userId: new mongoose.Types.ObjectId(userId) }

    const sortOption: Record<string, 1 | -1> = { createdAt: -1 }

    const pipeline: mongoose.PipelineStage[] = [
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
    ]

    const result = await Comment.aggregate(pipeline)
    const { totalCount, paginatedResults } = result[0]
    const total = totalCount[0]?.count || 0

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
    }
  }

  /**
   * Get all comments (admin function)
   */
  static async getComments(options: GetCommentsQuery): Promise<CommentsResult> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = options
    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    const matchStage: FilterQuery<IComment> = {}

    if (status) {
      if (Array.isArray(status)) {
        // Multiple status values
        matchStage.status = { $in: status }
      } else {
        // Single status value
        matchStage.status = status
      }
    }
    if (search) matchStage.content = { $regex: search, $options: 'i' }

    const sortOption: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

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
    ]

    const result = await Comment.aggregate(pipeline)
    const { totalCount, paginatedResults } = result[0]
    const total = totalCount[0]?.count || 0

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
    }
  }

  /**
   * Update comment (only by author)
   */
  static async updateComment(commentId: string, userId: string, updateData: UpdateCommentInput): Promise<IComment> {
    const comment = await Comment.findById(commentId)
    if (!comment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    // Only author can update
    if (comment.userId.toString() !== userId) {
      throw new ValidationError('You can only update your own comments', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    // Reset to pending if content changes
    comment.content = updateData.content

    await comment.save()

    // Use aggregation to get the same structure as createComment
    const result = await Comment.aggregate([
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
    ])

    return result[0] as IComment
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string, userId: string, deleteReplies: boolean = false): Promise<void> {
    const comment = await Comment.findById(commentId)
    if (!comment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    // Only author can delete (or admin, but that should be handled by permissions)
    if (comment.userId.toString() !== userId) {
      throw new ValidationError('You can only delete your own comments', ErrorCodes.UNAUTHORIZED_ACTION)
    }

    if (deleteReplies) {
      // Delete comment and all its replies
      await Comment.deleteMany({ $or: [{ _id: commentId }, { parentId: commentId }] })
    } else {
      // Just delete the comment
      await Comment.findByIdAndDelete(commentId)
    }
  }

  /**
   * Get comment replies
   */
  static async getCommentReplies(
    commentId: string,
    options: GetCommentRepliesQuery
  ): Promise<{ comments: IComment[] }> {
    const { status, maxLevel = '5', sortBy = 'createdAt', sortOrder = 'desc' } = options
    // Convert string to number using + operator
    const maxLevelNum = +maxLevel

    // Validate parent comment exists
    const parentComment = await Comment.findById(commentId)
    if (!parentComment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    const matchStage: FilterQuery<IComment> = {
      parentId: new mongoose.Types.ObjectId(commentId),
      level: { $lte: maxLevelNum }
    }
    if (status) {
      matchStage.status = status
    }

    const sortOption: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 }

    const pipeline: mongoose.PipelineStage[] = [
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
    ]

    const comments = await Comment.aggregate(pipeline)

    return {
      comments
    }
  }

  /**
   * Toggle a reaction on a comment (add if not exists, remove if exists)
   */
  static async toggleReaction(commentId: string, userId: string, reactionData: AddReactionInput): Promise<IComment> {
    const comment = await Comment.findById(commentId)
    if (!comment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    // Check if user already reacted with this type
    const existingReactionIndex = comment.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId && reaction.type === reactionData.type
    )

    if (existingReactionIndex !== -1) {
      // Remove the existing reaction if it's the same type
      comment.reactions.splice(existingReactionIndex, 1)
    } else {
      // Remove any existing reaction from this user (only one reaction type per user)
      comment.reactions = comment.reactions.filter((reaction) => reaction.userId.toString() !== userId)

      // Add new reaction
      comment.reactions.push({
        userId: new mongoose.Types.ObjectId(userId),
        type: reactionData.type as ReactionType
      })
    }

    await comment.save()

    // Use aggregation to get the same structure as createComment
    const result = await Comment.aggregate([
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
    ])

    return result[0] as IComment
  }

  /**
   * Remove a reaction from a comment
   */
  static async removeReaction(commentId: string, userId: string, reactionData: RemoveReactionInput): Promise<IComment> {
    const comment = await Comment.findById(commentId)
    if (!comment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    // Find and remove the reaction
    const reactionIndex = comment.reactions.findIndex(
      (reaction) => reaction.userId.toString() === userId && reaction.type === reactionData.type
    )

    if (reactionIndex === -1) {
      throw new NotFoundError('Reaction not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    comment.reactions.splice(reactionIndex, 1)

    await comment.save()

    // Use aggregation to get the same structure as createComment
    const result = await Comment.aggregate([
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
    ])

    return result[0] as IComment
  }

  /**
   * Update comment status (admin function)
   */
  static async updateCommentStatus(commentId: string, status: CommentStatus): Promise<IComment> {
    const comment = await Comment.findById(commentId)
    if (!comment) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    comment.status = status
    await comment.save()

    // Use aggregation to get the same structure as other methods
    const result = await Comment.aggregate([
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
    ])

    return result[0] as IComment
  }

  /**
   * Get comment reactions with optional filtering
   */
  static async getCommentReactions(
    commentId: string,
    options: GetCommentReactionsQuery
  ): Promise<{
    reactions: Array<{
      userId: mongoose.Types.ObjectId
      type: string
      userDetails?: { username: string; email: string; avatar?: string }
    }>
    summary: Record<string, number>
  }> {
    const { type } = options

    const pipeline: mongoose.PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(commentId) } },
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
    ]

    const result = await Comment.aggregate(pipeline)

    if (!result[0]) {
      throw new NotFoundError('Comment not found', ErrorCodes.LESSON_NOT_FOUND)
    }

    const { reactions, summary } = result[0]

    return {
      reactions: reactions.map(
        (reaction: {
          userId: mongoose.Types.ObjectId
          type: string
          userDetails?: { username: string; email: string; avatar?: string }
        }) => ({
          userId: reaction.userId,
          type: reaction.type,
          userDetails: reaction.userDetails || undefined
        })
      ),
      summary: summary[0] || {}
    }
  }
}
