/**
 * Role-related type definitions
 */

export interface CreateRoleData {
  name: string
  description: string
  permissions: string[]
  isActive?: boolean
}

export interface UpdateRoleData {
  name?: string
  description?: string
  permissions?: string[]
  isActive?: boolean
}

export interface GetRolesOptions {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}
