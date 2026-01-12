import mongoose, { Document, Schema } from 'mongoose'

export interface IChapter extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  courseId: mongoose.Types.ObjectId
  lessonIds: mongoose.Types.ObjectId[]
  order: number
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

const chapterSchema = new Schema<IChapter>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    lessonIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lesson'
      }
    ],
    order: {
      type: Number,
      required: true
    },
    isPublished: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

// Indexes
chapterSchema.index({ courseId: 1, order: 1 })
chapterSchema.index({ courseId: 1, isPublished: 1 })

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema)
