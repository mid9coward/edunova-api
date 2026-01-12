import mongoose, { Document, Schema } from 'mongoose'
import { CategoryStatus } from '../enums'

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  status: CategoryStatus
  createdAt: Date
  updatedAt: Date
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(CategoryStatus),
      default: CategoryStatus.ACTIVE
    }
  },
  {
    timestamps: true
  }
)

export const Category = mongoose.model<ICategory>('Category', categorySchema)
