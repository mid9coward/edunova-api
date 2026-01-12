import mongoose, { Document, Schema } from 'mongoose'
import { UserStatus, UserType } from '../enums'

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  username: string
  email: string
  password: string
  status: UserStatus
  avatar?: string
  courses: mongoose.Types.ObjectId[]
  userType: UserType
  roles: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false // Make password optional for Google users
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.INACTIVE
    },
    avatar: {
      type: String,
      required: false
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    userType: {
      type: String,
      enum: Object.values(UserType),
      default: UserType.DEFAULT
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
      }
    ]
  },
  {
    timestamps: true
  }
)

export const User = mongoose.model<IUser>('User', userSchema)
