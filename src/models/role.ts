import mongoose, { Document, Schema } from 'mongoose'
import { Permission } from '~/configs/permission'

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  permissions: Permission[]
  inherits: mongoose.Types.ObjectId[] // Array of role ObjectIds this role inherits from
  createdAt: Date
  updatedAt: Date
}

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    permissions: [
      {
        type: String,
        required: true
      }
    ],
    inherits: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Role'
      }
    ]
  },
  {
    timestamps: true
  }
)

// Indexes for better performance
// Note: name field already has unique: true which creates an index automatically

export const Role = mongoose.model<IRole>('Role', roleSchema)
