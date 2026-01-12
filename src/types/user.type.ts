import { UserStatus, UserType } from '../enums'

/**
 * User-related type definitions and interfaces
 */

export interface UpdateProfileData {
  username?: string
  email?: string
  password?: string
  avatar?: string
}

export interface UpdateUserData {
  roles?: string[]
  status?: UserStatus
}

export interface GetUsersOptions {
  page?: number
  limit?: number
  status?: UserStatus
  userType?: UserType
  roles?: string[]
  search?: string // Search in username or email
}
