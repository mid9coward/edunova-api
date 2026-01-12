import mongoose, { FilterQuery } from 'mongoose'
import { UserStatus, UserType } from '../enums'
import { Role } from '../models/role'
import { IUser, User } from '../models/user'
import { GetUsersOptions, UpdateProfileData, UpdateUserData } from '../types/user.type'
import { ConflictError, ErrorCodes, NotFoundError, ValidationError } from '../utils/errors'

/**
 * User Management Service
 * Handles CRUD operations and user-related business logic
 */

interface GetUsersResult {
  users: IUser[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export class UserService {
  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(options: GetUsersOptions = {}): Promise<GetUsersResult> {
    const { page = 1, limit = 10, search, status, userType, roles } = options

    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter object
    const filter: FilterQuery<IUser> = {}

    if (search) {
      filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }]
    }

    if (status) {
      if (Array.isArray(status)) {
        // Multiple status values
        filter.status = { $in: status }
      } else if (typeof status === 'string' && status.includes(',')) {
        // Comma-separated string
        const statusArray = status.split(',').map((s) => s.trim())
        filter.status = { $in: statusArray }
      } else {
        // Single status value
        filter.status = status
      }
    }

    if (userType) {
      if (Array.isArray(userType)) {
        // Multiple userType values
        filter.userType = { $in: userType }
      } else if (typeof userType === 'string' && userType.includes(',')) {
        // Comma-separated string
        const userTypeArray = userType.split(',').map((s) => s.trim())
        filter.userType = { $in: userTypeArray }
      } else {
        // Single userType value
        filter.userType = userType
      }
    }

    if (roles && roles.length > 0) {
      // Find roles by ID or name
      const roleIds = []
      for (const roleData of roles) {
        let role
        if (mongoose.Types.ObjectId.isValid(roleData)) {
          role = await Role.findById(roleData)
        } else {
          role = await Role.findOne({ name: roleData })
        }
        if (role) {
          roleIds.push(role._id)
        }
      }
      if (roleIds.length > 0) {
        filter.roles = { $in: roleIds }
      }
    }

    // Build sort object - default to createdAt desc
    const sort: Record<string, 1 | -1> = { createdAt: -1 }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('roles', 'name description')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .select('-password')
        .lean(),
      User.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      users: users as IUser[],
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser> {
    const user = await User.findById(userId)
      .populate('roles', 'name description permissions')
      .populate('courses', 'title description')
      .select('-password')

    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    return user
  }

  /**
   * Update user profile (for user-owned updates)
   */
  static async updateProfile(userId: string, updateData: UpdateProfileData): Promise<IUser> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    // Check if username is being updated and is unique
    if (updateData.username && updateData.username !== user.username) {
      const existingUsername = await User.findOne({
        username: updateData.username,
        _id: { $ne: userId }
      })
      if (existingUsername) {
        throw new ConflictError('Username already exists', ErrorCodes.USERNAME_TAKEN)
      }
      user.username = updateData.username
    }

    // Check if email is being updated and is unique
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId }
      })
      if (existingEmail) {
        throw new ConflictError('Email already exists', ErrorCodes.EMAIL_ALREADY_REGISTERED)
      }
      user.email = updateData.email
    }

    // Update avatar if provided
    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar
    }

    await user.save()

    return user
  }

  /**
   * Update user (for admin-level updates)
   */
  static async updateUser(userId: string, updateData: UpdateUserData): Promise<IUser> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    // Update roles if provided
    if (updateData.roles && updateData.roles.length > 0) {
      const roles = []
      for (const roleData of updateData.roles) {
        let role
        if (mongoose.Types.ObjectId.isValid(roleData)) {
          role = await Role.findById(roleData)
        } else {
          role = await Role.findOne({ name: roleData })
        }

        if (!role) {
          throw new NotFoundError(`Role not found: ${roleData}`, ErrorCodes.ROLE_NOT_FOUND)
        }
        roles.push(role._id)
      }
      user.roles = roles
    }

    // Update status if provided
    if (updateData.status) {
      user.status = updateData.status
    }

    await user.save()

    return user
  }

  /**
   * Delete user (soft delete by setting status to DELETED)
   */
  static async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId)
    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    await User.findByIdAndDelete(userId)
  }
}
