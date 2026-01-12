import { Role, IRole } from '../models/role'
import { User } from '../models/user'
import { Types } from 'mongoose'
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors'
import { Permission } from '~/configs/permission'

interface RoleWithInheritance extends Record<string, unknown> {
  inheritedPermissions: Permission[]
  allPermissions: Permission[]
  hierarchyLevel: number
  totalUsers: number
}

interface RoleWithUserCount extends Record<string, unknown> {
  totalUsers: number
}

interface RoleInput {
  name: string
  permissions: Permission[]
  description?: string
  inherits?: string[]
}

interface UpdateRoleInput {
  name?: string
  permissions?: Permission[]
  description?: string
  inherits?: string[]
}

interface CircularDependencyTracker {
  visiting: Set<string>
  visited: Set<string>
  path: string[]
}

export class RoleService {
  // Create a new role with inheritance validation
  async createRole(roleData: RoleInput): Promise<IRole> {
    const { name, permissions, description, inherits } = roleData

    // Check if role name already exists
    const existingRole = await Role.findOne({ name })
    if (existingRole) {
      throw new ConflictError('Role name already exists')
    }

    // Validate inherited roles exist
    let inheritedRoleIds: Types.ObjectId[] = []
    if (inherits && inherits.length > 0) {
      const inheritedRoles = await Role.find({
        _id: { $in: inherits.map((id) => new Types.ObjectId(id)) }
      })

      if (inheritedRoles.length !== inherits.length) {
        throw new ValidationError('One or more inherited roles do not exist')
      }

      inheritedRoleIds = inheritedRoles.map((role) => role._id as Types.ObjectId)
    }

    // Create new role
    const newRole = new Role({
      name,
      permissions,
      description,
      inherits: inheritedRoleIds
    })

    await newRole.save()

    // Validate no circular inheritance after creation
    await this.validateNoCircularInheritance(newRole._id as Types.ObjectId)

    return newRole
  }

  // Get all roles with optional inheritance information
  async getAllRoles(): Promise<RoleWithUserCount[] | RoleWithInheritance[]> {
    const roles = await Role.find().populate('inherits', 'name permissions inherits')

    const rolesWithUserCount = await Promise.all(
      roles.map(async (role) => {
        const totalUsers = await User.countDocuments({ roles: { $in: [role._id] } })
        return {
          ...role.toObject(),
          totalUsers
        }
      })
    )
    return rolesWithUserCount
  }

  // Get role by ID with inheritance information
  async getRoleById(roleId: string, includeInheritance = false): Promise<IRole | RoleWithInheritance | null> {
    const role = await Role.findById(roleId).populate('inherits', 'name permissions inherits')

    if (!role) {
      throw new NotFoundError('Role not found')
    }

    if (!includeInheritance) {
      return role
    }

    const inheritedPermissions = await this.getInheritedPermissions(role._id as Types.ObjectId)
    const allPermissions = this.mergePermissions(role.permissions, inheritedPermissions)
    const hierarchyLevel = await this.getRoleHierarchyLevel(role._id as Types.ObjectId)

    // Count users assigned to this role
    const totalUsers = await User.countDocuments({ roles: { $in: [role._id] } })

    return {
      ...role.toObject(),
      inheritedPermissions,
      allPermissions,
      hierarchyLevel,
      totalUsers
    }
  }

  // Update role with inheritance validation
  async updateRole(roleId: string, updateData: UpdateRoleInput): Promise<IRole> {
    const role = await Role.findById(roleId)
    if (!role) {
      throw new NotFoundError('Role not found')
    }

    const { name, permissions, description, inherits } = updateData

    // Check name uniqueness if name is being updated
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name })
      if (existingRole) {
        throw new ConflictError('Role name already exists')
      }
    }

    // Validate inherited roles if being updated
    let inheritedRoleIds: Types.ObjectId[] | undefined
    if (inherits !== undefined) {
      if (inherits.length > 0) {
        const inheritedRoles = await Role.find({
          _id: { $in: inherits.map((id) => new Types.ObjectId(id)) }
        })

        if (inheritedRoles.length !== inherits.length) {
          throw new ValidationError('One or more inherited roles do not exist')
        }

        inheritedRoleIds = inheritedRoles.map((role) => role._id as Types.ObjectId)
      } else {
        inheritedRoleIds = []
      }
    }

    // Update role fields
    if (name) role.name = name
    if (permissions) role.permissions = permissions
    if (description !== undefined) role.description = description
    if (inheritedRoleIds !== undefined) role.inherits = inheritedRoleIds

    await role.save()

    // Validate no circular inheritance after update
    if (inheritedRoleIds !== undefined) {
      await this.validateNoCircularInheritance(role._id as Types.ObjectId)
    }

    return role
  }

  // Delete role with dependency checking
  async deleteRole(roleId: string): Promise<void> {
    const role = await Role.findById(roleId)
    if (!role) {
      throw new NotFoundError('Role not found')
    }

    // Check if role is inherited by other roles
    const dependentRoles = await Role.find({
      inherits: { $in: [role._id] }
    })

    if (dependentRoles.length > 0) {
      throw new ConflictError(`Cannot delete role. It is inherited by: ${dependentRoles.map((r) => r.name).join(', ')}`)
    }

    // Check if role is assigned to users
    const usersWithRole = await User.find({ role: role._id })
    if (usersWithRole.length > 0) {
      throw new ConflictError('Cannot delete role. It is assigned to users')
    }

    await Role.findByIdAndDelete(roleId)
  }

  // Get all permissions for a role (including inherited)
  async getAllPermissions(roleId: string): Promise<Permission[]> {
    const role = await Role.findById(roleId)
    if (!role) {
      throw new NotFoundError('Role not found')
    }

    const inheritedPermissions = await this.getInheritedPermissions(role._id as Types.ObjectId)
    return this.mergePermissions(role.permissions, inheritedPermissions)
  }

  // Get user permissions including role inheritance
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await User.findById(userId).populate('roles')
    if (!user || !user.roles || user.roles.length === 0) {
      return []
    }

    // Collect permissions from all user roles
    const allPermissions = new Set<Permission>()

    for (const role of user.roles as unknown as Array<{ _id: string }>) {
      const rolePermissions = await this.getAllPermissions(role._id.toString())
      rolePermissions.forEach((permission) => allPermissions.add(permission))
    }

    return Array.from(allPermissions)
  }

  // PRIVATE HELPER METHODS

  // Recursively get inherited permissions
  private async getInheritedPermissions(
    roleId: Types.ObjectId,
    visited: Set<string> = new Set()
  ): Promise<Permission[]> {
    const roleIdStr = roleId.toString()

    if (visited.has(roleIdStr)) {
      return [] // Circular dependency protection
    }

    visited.add(roleIdStr)

    const role = await Role.findById(roleId).populate('inherits')
    if (!role || !role.inherits.length) {
      return []
    }

    let inheritedPermissions: Permission[] = []

    for (const inheritedRole of role.inherits) {
      const inheritedRoleObj = inheritedRole as unknown as IRole

      // Add direct permissions from inherited role
      inheritedPermissions = this.mergePermissions(inheritedPermissions, inheritedRoleObj.permissions)

      // Recursively get permissions from inherited role's inheritance
      const nestedPermissions = await this.getInheritedPermissions(
        inheritedRoleObj._id as Types.ObjectId,
        new Set(visited)
      )
      inheritedPermissions = this.mergePermissions(inheritedPermissions, nestedPermissions)
    }

    return inheritedPermissions
  }

  // Merge permission arrays and remove duplicates
  private mergePermissions(...permissionArrays: Permission[][]): Permission[] {
    const allPermissions = permissionArrays.flat()
    return [...new Set(allPermissions)]
  }

  // Validate no circular inheritance exists
  private async validateNoCircularInheritance(roleId: Types.ObjectId): Promise<void> {
    const tracker: CircularDependencyTracker = {
      visiting: new Set(),
      visited: new Set(),
      path: []
    }

    await this.checkCircularInheritance(roleId, tracker)
  }

  // Recursively check for circular inheritance
  private async checkCircularInheritance(roleId: Types.ObjectId, tracker: CircularDependencyTracker): Promise<void> {
    const roleIdStr = roleId.toString()

    if (tracker.visiting.has(roleIdStr)) {
      const cycleStart = tracker.path.indexOf(roleIdStr)
      const cycle = [...tracker.path.slice(cycleStart), roleIdStr]
      throw new ValidationError(`Circular inheritance detected: ${cycle.join(' -> ')}`)
    }

    if (tracker.visited.has(roleIdStr)) {
      return // Already processed this branch
    }

    tracker.visiting.add(roleIdStr)
    tracker.path.push(roleIdStr)

    const role = await Role.findById(roleId)
    if (role && role.inherits.length > 0) {
      for (const inheritedRoleId of role.inherits) {
        await this.checkCircularInheritance(inheritedRoleId, tracker)
      }
    }

    tracker.visiting.delete(roleIdStr)
    tracker.visited.add(roleIdStr)
    tracker.path.pop()
  }

  // Get role hierarchy level (depth from root)
  private async getRoleHierarchyLevel(roleId: Types.ObjectId, visited: Set<string> = new Set()): Promise<number> {
    const roleIdStr = roleId.toString()

    if (visited.has(roleIdStr)) {
      return 0 // Circular dependency protection
    }

    visited.add(roleIdStr)

    const role = await Role.findById(roleId)
    if (!role || !role.inherits.length) {
      return 0 // Root level
    }

    let maxLevel = 0
    for (const inheritedRoleId of role.inherits) {
      const level = await this.getRoleHierarchyLevel(inheritedRoleId, new Set(visited))
      maxLevel = Math.max(maxLevel, level + 1)
    }

    return maxLevel
  }
}
