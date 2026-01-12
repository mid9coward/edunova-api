import mongoose, { Document, Schema } from 'mongoose'

/**
 * Track Interface
 */
export interface ITrack extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  lessonId: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

/**
 * Track Schema
 */
const trackSchema = new Schema<ITrack>(
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
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes for better query performance
trackSchema.index({ userId: 1, courseId: 1 })
trackSchema.index({ userId: 1, lessonId: 1 })
trackSchema.index({ courseId: 1, lessonId: 1 })
trackSchema.index({ userId: 1, courseId: 1, lessonId: 1 }, { unique: true })

export const Track = mongoose.model<ITrack>('Track', trackSchema)
