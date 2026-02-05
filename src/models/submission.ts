import mongoose, { Document, Schema } from 'mongoose'
import { CodeSubmissionStatus } from '../enums'

/**
 * Code Submission Interface
 */
export interface ICodeSubmission extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  lessonId: mongoose.Types.ObjectId
  exerciseId: mongoose.Types.ObjectId
  sourceCode: string
  language: string
  version: string
  status: CodeSubmissionStatus
  stdout?: string
  stderr?: string
  executionTime?: number
  passedTestCases: number
  totalTestCases: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Code Submission Schema
 */
const codeSubmissionSchema = new Schema<ICodeSubmission>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'CodingExercise',
      required: true
    },
    sourceCode: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    version: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(CodeSubmissionStatus),
      default: CodeSubmissionStatus.PENDING
    },
    stdout: {
      type: String
    },
    stderr: {
      type: String
    },
    executionTime: {
      type: Number,
      default: 0
    },
    passedTestCases: {
      type: Number,
      default: 0
    },
    totalTestCases: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

codeSubmissionSchema.index({ userId: 1, lessonId: 1 })
codeSubmissionSchema.index({ lessonId: 1, createdAt: -1 })

export const CodeSubmission = mongoose.model<ICodeSubmission>('CodeSubmission', codeSubmissionSchema)
