import { Schema, model, Document, Types } from 'mongoose'
import { BlogStatus } from '../enums'

export interface IBlog extends Document {
  _id: Types.ObjectId
  title: string
  slug: string
  content: string
  excerpt: string
  thumbnail: string
  authorId: Types.ObjectId
  author?: {
    _id: Types.ObjectId
    name: string
    email: string
  }
  status: BlogStatus
  publishedAt?: Date
  categoryId?: Types.ObjectId
  category?: {
    _id: Types.ObjectId
    name: string
    slug: string
  }
  createdAt: Date
  updatedAt: Date
}

const blogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 200
    },
    content: {
      type: String,
      required: true
    },
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    thumbnail: {
      type: String,
      required: false,
      trim: true
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(BlogStatus),
      default: BlogStatus.DRAFT
    },
    publishedAt: {
      type: Date
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    }
  },
  {
    timestamps: true
  }
)

// Indexes
blogSchema.index({ authorId: 1 })
blogSchema.index({ status: 1 })
blogSchema.index({ publishedAt: -1 })
blogSchema.index({ categoryId: 1 })
blogSchema.index({ title: 'text', content: 'text' })

export const Blog = model<IBlog>('Blog', blogSchema)
