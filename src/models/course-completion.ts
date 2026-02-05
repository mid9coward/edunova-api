import mongoose, { Document, Schema } from 'mongoose'

/**
 * Course Completion Interface
 */
export interface ICourseCompletion extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  completedAt: Date
  totalLessons: number
  completedLessons: number
  progressPercent?: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Course Completion Schema
 */
const courseCompletionSchema = new Schema<ICourseCompletion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    completedAt: {
      type: Date,
      required: true,
      default: () => new Date()
    },
    totalLessons: {
      type: Number,
      required: true,
      min: 0
    },
    completedLessons: {
      type: Number,
      required: true,
      min: 0
    },
    progressPercent: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
)

courseCompletionSchema.index({ userId: 1, courseId: 1 }, { unique: true })
courseCompletionSchema.index({ courseId: 1, completedAt: -1 })

export const CourseCompletion = mongoose.model<ICourseCompletion>('CourseCompletion', courseCompletionSchema)
