import mongoose, { Document, Schema } from 'mongoose'
import { QuizAttemptStatus } from '../enums'

/**
 * Quiz Attempt Answer Interface
 */
export interface IQuizAttemptAnswer {
  questionId: mongoose.Types.ObjectId
  selectedOptionIndexes: number[]
  isCorrect: boolean
}

/**
 * Quiz Attempt Interface
 */
export interface IQuizAttempt extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  quizId: mongoose.Types.ObjectId
  startedAt: Date
  finishedAt?: Date
  status: QuizAttemptStatus
  score: number
  answers: IQuizAttemptAnswer[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Quiz Attempt Answer Schema
 */
const quizAttemptAnswerSchema = new Schema<IQuizAttemptAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'QuizQuestion',
      required: true
    },
    selectedOptionIndexes: [
      {
        type: Number,
        required: true
      }
    ],
    isCorrect: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  { _id: false }
)

/**
 * Quiz Attempt Schema
 */
const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    finishedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: Object.values(QuizAttemptStatus),
      default: QuizAttemptStatus.IN_PROGRESS,
      required: true
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    answers: [quizAttemptAnswerSchema]
  },
  {
    timestamps: true
  }
)

// Indexes for better query performance
quizAttemptSchema.index({ userId: 1, quizId: 1 })
quizAttemptSchema.index({ userId: 1, status: 1 })
quizAttemptSchema.index({ quizId: 1, status: 1 })
quizAttemptSchema.index({ startedAt: -1 })
quizAttemptSchema.index({ finishedAt: -1 })

export const QuizAttempt = mongoose.model<IQuizAttempt>('QuizAttempt', quizAttemptSchema)
