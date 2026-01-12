import mongoose from 'mongoose'
import { ReactionType } from '../models/comment'
import { CommentStatus } from '~/enums'

/**
 * Comment Type Definitions
 */

// Comment reaction interface
export interface ICommentReaction {
  userId: mongoose.Types.ObjectId
  type: ReactionType
  userDetails?: {
    username: string
    email: string
    avatar?: string
  }
}

// Comment with nested replies interface
export interface ICommentWithReplies {
  _id: mongoose.Types.ObjectId
  content: string
  lessonId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  status: CommentStatus
  parentId?: mongoose.Types.ObjectId
  level: number
  mentions?: mongoose.Types.ObjectId[]
  reactions: ICommentReaction[]
  replies?: ICommentWithReplies[]
  userDetails?: {
    username: string
    email: string
    avatar?: string
  }
  lessonDetails?: {
    title: string
  }
  createdAt: Date
  updatedAt: Date
}

// Comment reaction summary
export interface ICommentReactionSummary {
  [ReactionType.LIKE]: number
  [ReactionType.LOVE]: number
  [ReactionType.CARE]: number
  [ReactionType.FUN]: number
  [ReactionType.WOW]: number
  [ReactionType.SAD]: number
  [ReactionType.ANGRY]: number
}

// Comment statistics
export interface ICommentStats {
  totalComments: number
  approvedComments: number
  pendingComments: number
  rejectedComments: number
  totalReactions: number
  reactionsByType: ICommentReactionSummary
  averageLevel: number
  maxLevel: number
}

// Comment moderation result
export interface ICommentModerationResult {
  commentId: string
  previousStatus: string
  newStatus: string
  moderatedAt: Date
  reason?: string
}
