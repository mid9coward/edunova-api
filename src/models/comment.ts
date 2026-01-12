import mongoose, { Document, Schema } from 'mongoose'
import { CommentStatus } from '../enums'

/**
 * Reaction types enum
 */
export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  CARE = 'care',
  FUN = 'fun',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry'
}

/**
 * Comment Interface
 */
export interface IComment extends Document {
  _id: mongoose.Types.ObjectId
  content: string
  lessonId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  status: CommentStatus
  parentId?: mongoose.Types.ObjectId // For nested replies
  level: number // Nesting level (1-5)
  mentions?: mongoose.Types.ObjectId[] // Users mentioned in comment
  reactions: Array<{
    userId: mongoose.Types.ObjectId
    type: ReactionType
  }>
  createdAt: Date
  updatedAt: Date
}

/**
 * Comment Schema
 */
const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [2000, 'Comment content cannot exceed 2000 characters']
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson ID is required']
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    status: {
      type: String,
      enum: {
        values: Object.values(CommentStatus),
        message: 'Status must be approved, pending, or rejected'
      },
      default: CommentStatus.APPROVED
    },
    parentId: {
      type: Schema.Types.ObjectId,
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
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    reactions: [
      {
        userId: {
          type: Schema.Types.ObjectId,
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
  },
  {
    timestamps: true
  }
)

// Indexes for performance
commentSchema.index({ lessonId: 1, createdAt: -1 })
commentSchema.index({ userId: 1 })
commentSchema.index({ parentId: 1 })
commentSchema.index({ status: 1 })
commentSchema.index({ level: 1 })

export const Comment = mongoose.model<IComment>('Comment', commentSchema)
