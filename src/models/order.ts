import mongoose, { Document, Schema, model } from 'mongoose'
import { OrderStatus, PaymentMethod } from '../enums'

export interface IOrderItem {
  courseId: mongoose.Types.ObjectId
  title: string
  price: number
  oldPrice?: number
  thumbnail?: string
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId
  code: string
  userId: mongoose.Types.ObjectId
  items: IOrderItem[]
  couponCode?: string // Cart-wide coupon code applied
  subTotal: number
  totalDiscount: number
  totalAmount: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}

const orderItemSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true }, // snapshot title at purchase
  price: { type: Number, required: true }, // original price
  oldPrice: { type: Number }, // old price for reference
  thumbnail: { type: String } // snapshot thumbnail
})

const orderSchema = new Schema<IOrder>(
  {
    code: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Courses purchased
    items: [orderItemSchema],

    couponCode: { type: String },

    // Totals
    subTotal: { type: Number, required: true }, // sum of item prices before discounts
    totalDiscount: { type: Number, default: 0 }, // all discounts combined
    totalAmount: { type: Number, required: true }, // final amount paid

    // Payment info
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true },

    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING }
  },
  {
    timestamps: true // This will add createdAt and updatedAt fields
  }
)

// Create and export the Order model
const Order = model<IOrder>('Order', orderSchema)

export default Order
export { Order, orderSchema, orderItemSchema }
