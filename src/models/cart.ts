import mongoose, { Document, Schema } from 'mongoose'

export interface ICartItem {
  courseId: mongoose.Types.ObjectId
  title: string
  price: number
  oldPrice?: number
  thumbnail?: string
  addedAt: Date
}

export interface ICart extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  items: ICartItem[]
  totalPrice: number
  createdAt: Date
  updatedAt: Date
}

const cartItemSchema = new Schema<ICartItem>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    oldPrice: {
      type: Number,
      min: 0
    },
    thumbnail: {
      type: String,
      trim: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false // Disable auto-generated _id for subdocuments
  }
)

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // One cart per user
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
)

// Index for efficient lookups
cartSchema.index({ 'items.courseId': 1 })

export const Cart = mongoose.model<ICart>('Cart', cartSchema)
