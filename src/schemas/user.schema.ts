import { z } from 'zod'
import { UserStatus, UserType } from '../enums'
import { paginationSchema } from './common.schema'
import mongoose from 'mongoose'

// Base user data schema
const userDataSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  email: z.string().email('Invalid email address'),
  userType: z.nativeEnum(UserType).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal(''))
})

// Update user schema
export const updateUserSchema = z.object({
  params: z.object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid user ID format'
    })
  }),
  body: userDataSchema
    .extend({
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must not exceed 100 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        )
        .optional(),
      role: z.string().optional()
    })
    .partial()
})

// Profile update schema (for user-owned updates)
export const updateProfileSchema = z.object({
  body: z
    .object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
        .optional(),
      email: z.string().email('Invalid email address').optional(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must not exceed 100 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one lowercase letter, one uppercase letter, and one number'
        )
        .optional(),
      avatar: z.string().url('Invalid avatar URL').optional().or(z.literal(''))
    })
    .refine(
      (data) => {
        // At least one field must be provided
        return Object.keys(data).length > 0
      },
      {
        message: 'At least one field must be provided'
      }
    )
})

// Admin update user schema (for admin-level updates)
export const adminUpdateUserSchema = z.object({
  params: z.object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid user ID format'
    })
  }),
  body: z
    .object({
      roles: z.array(z.string()).optional(),
      status: z.nativeEnum(UserStatus).optional()
    })
    .refine(
      (data) => {
        // At least one field must be provided
        return data.roles !== undefined || data.status !== undefined
      },
      {
        message: 'At least one field (roles or status) must be provided'
      }
    )
})

// Get users schema
export const getUsersSchema = z.object({
  query: paginationSchema.extend({
    status: z
      .union([
        z.nativeEnum(UserStatus),
        z.array(z.nativeEnum(UserStatus)),
        z.string().transform((val) => {
          // Handle comma-separated values or multiple query params
          if (val.includes(',')) {
            return val.split(',').map((s) => s.trim())
          }
          return val
        })
      ])
      .optional(),
    userType: z
      .union([
        z.nativeEnum(UserType),
        z.array(z.nativeEnum(UserType)),
        z.string().transform((val) => {
          // Handle comma-separated values or multiple query params
          if (val.includes(',')) {
            return val.split(',').map((s) => s.trim())
          }
          return val
        })
      ])
      .optional(),
    role: z.string().optional(),
    search: z.string().optional()
  })
})

// Get user by ID schema
export const getUserByIdSchema = z.object({
  params: z.object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid user ID format'
    })
  })
})

// Delete user schema
export const deleteUserSchema = z.object({
  params: z.object({
    userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid user ID format'
    })
  })
})

// Type exports for use in controllers
export type UpdateUserParams = z.infer<typeof updateUserSchema>['params']
export type UpdateUserBody = z.infer<typeof updateUserSchema>['body']
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>['body']
export type AdminUpdateUserParams = z.infer<typeof adminUpdateUserSchema>['params']
export type AdminUpdateUserBody = z.infer<typeof adminUpdateUserSchema>['body']
export type GetUsersQuery = z.infer<typeof getUsersSchema>['query']
export type GetUserByIdParams = z.infer<typeof getUserByIdSchema>['params']
export type DeleteUserParams = z.infer<typeof deleteUserSchema>['params']
