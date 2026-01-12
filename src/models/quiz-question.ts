import mongoose, { Document, Schema } from 'mongoose'

/**
 * Quiz Question Interface
 */
export interface IQuizQuestion extends Document {
  _id: mongoose.Types.ObjectId
  quizId: mongoose.Types.ObjectId
  question: string
  explanation: string
  type: 'multiple_choice' | 'true_false' | 'single_choice'
  options: string[]
  correctAnswers: number[]
  point: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Quiz Question Schema
 */
const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    question: {
      type: String,
      required: true,
      trim: true
    },
    explanation: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'true_false', 'single_choice'],
      required: true
    },
    options: [
      {
        type: String,
        required: true,
        trim: true
      }
    ],
    correctAnswers: [
      {
        type: Number,
        required: true
      }
    ],
    point: {
      type: Number,
      required: true,
      min: 1,
      max: 100
    }
  },
  {
    timestamps: true
  }
)

// Indexes
quizQuestionSchema.index({ quizId: 1 })
quizQuestionSchema.index({ createdAt: -1 })
quizQuestionSchema.index({ type: 1 })

export const QuizQuestion = mongoose.model<IQuizQuestion>('QuizQuestion', quizQuestionSchema)
