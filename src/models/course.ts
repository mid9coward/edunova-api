import mongoose, { Document, Schema } from 'mongoose'
import { CourseLevel, CourseStatus } from '../enums'

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  slug: string
  image?: string
  description: string
  excerpt?: string
  introUrl?: string
  price: number
  oldPrice?: number
  originalPrice?: number
  isFree?: boolean
  status: CourseStatus
  authorId: mongoose.Types.ObjectId
  chapterIds: mongoose.Types.ObjectId[]
  categoryId: mongoose.Types.ObjectId
  view: number
  sold: number
  level: CourseLevel
  info?: {
    requirements: string[]
    benefits: string[]
    techniques: string[]
    documents: string[]
    qa: {
      question: string
      answer: string
    }[]
  }
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    image: {
      type: String
    },
    description: {
      type: String
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500
    },
    introUrl: {
      type: String
    },
    price: {
      type: Number,
      min: 0
    },
    oldPrice: {
      type: Number,
      min: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    },
    isFree: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: Object.values(CourseStatus),
      default: CourseStatus.DRAFT
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    chapterIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Chapter'
      }
    ],
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    view: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    level: {
      type: String,
      enum: Object.values(CourseLevel),
      required: true
    },
    info: {
      requirements: [
        {
          type: String,
          trim: true
        }
      ],
      benefits: [
        {
          type: String,
          trim: true
        }
      ],
      techniques: [
        {
          type: String,
          trim: true
        }
      ],
      documents: [
        {
          type: String,
          trim: true
        }
      ],
      qa: [
        {
          question: {
            type: String,
            trim: true
          },
          answer: {
            type: String,
            trim: true
          }
        }
      ]
    }
  },
  {
    timestamps: true
  }
)

// Indexes for better performance
courseSchema.index({ authorId: 1 })
courseSchema.index({ categoryId: 1 })
courseSchema.index({ status: 1 })
courseSchema.index({ level: 1 })
// Note: slug unique index is already defined in schema field definition
courseSchema.index({ createdAt: -1 })
courseSchema.index({ view: -1 })
courseSchema.index({ sold: -1 })
courseSchema.index({ title: 'text', description: 'text', excerpt: 'text' })

export const Course = mongoose.model<ICourse>('Course', courseSchema)
