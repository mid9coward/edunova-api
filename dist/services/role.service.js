"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
const role_1 = require("../models/role");
const user_1 = require("../models/user");
const mongoose_1 = require("mongoose");
const errors_1 = require("../utils/errors");
class RoleService {
    // Create a new role with inheritance validation
    async createRole(roleData) {
        const { name, permissions, description, inherits } = roleData;
        // Check if role name already exists
        const existingRole = await role_1.Role.findOne({ name });
        if (existingRole) {
            throw new errors_1.ConflictError('Role name already exists');
        }
        // Validate inherited roles exist
        let inheritedRoleIds = [];
        if (inherits && inherits.length > 0) {
            const inheritedRoles = await role_1.Role.find({
                _id: { $in: inherits.map((id) => new mongoose_1.Types.ObjectId(id)) }
            });
            if (inheritedRoles.length !== inherits.length) {
                throw new errors_1.ValidationError('One or more inherited roles do not exist');
            }
            inheritedRoleIds = inheritedRoles.map((role) => role._id);
        }
        // Create new role
        const newRole = new role_1.Role({
            name,
            permissions,
            description,
            inherits: inheritedRoleIds
        });
        await newRole.save();
        // Validate no circular inheritance after creation
        await this.validateNoCircularInheritance(newRole._id);
        return newRole;
    }
    // Get all roles with optional inheritance information
    async getAllRoles() {
        const roles = await role_1.Role.find().populate('inherits', 'name permissions inherits');
        const rolesWithUserCount = await Promise.all(roles.map(async (role) => {
            const totalUsers = await user_1.User.countDocuments({ roles: { $in: [role._id] } });
            return {
                ...role.toObject(),
                totalUsers
            };
        }));
        return rolesWithUserCount;
    }
    // Get role by ID with inheritance information
    async getRoleById(roleId, includeInheritance = false) {
        const role = await role_1.Role.findById(roleId).populate('inherits', 'name permissions inherits');
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        if (!includeInheritance) {
            return role;
        }
        const inheritedPermissions = await this.getInheritedPermissions(role._id);
        const allPermissions = this.mergePermissions(role.permissions, inheritedPermissions);
        const hierarchyLevel = await this.getRoleHierarchyLevel(role._id);
        // Count users assigned to this role
        const totalUsers = await user_1.User.countDocuments({ roles: { $in: [role._id] } });
        return {
            ...role.toObject(),
            inheritedPermissions,
            allPermissions,
            hierarchyLevel,
            totalUsers
        };
    }
    // Update role with inheritance validation
    async updateRole(roleId, updateData) {
        const role = await role_1.Role.findById(roleId);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        const { name, permissions, description, inherits } = updateData;
        // Check name uniqueness if name is being updated
        if (name && name !== role.name) {
            const existingRole = await role_1.Role.findOne({ name });
            if (existingRole) {
                throw new errors_1.ConflictError('Role name already exists');
            }
        }
        // Validate inherited roles if being updated
        let inheritedRoleIds;
        if (inherits !== undefined) {
            if (inherits.length > 0) {
                const inheritedRoles = await role_1.Role.find({
                    _id: { $in: inherits.map((id) => new mongoose_1.Types.ObjectId(id)) }
                });
                if (inheritedRoles.length !== inherits.length) {
                    throw new errors_1.ValidationError('One or more inherited roles do not exist');
                }
                inheritedRoleIds = inheritedRoles.map((role) => role._id);
            }
            else {
                inheritedRoleIds = [];
            }
        }
        // Update role fields
        if (name)
            role.name = name;
        if (permissions)
            role.permissions = permissions;
        if (description !== undefined)
            role.description = description;
        if (inheritedRoleIds !== undefined)
            role.inherits = inheritedRoleIds;
        await role.save();
        // Validate no circular inheritance after update
        if (inheritedRoleIds !== undefined) {
            await this.validateNoCircularInheritance(role._id);
        }
        return role;
    }
    // Delete role with dependency checking
    async deleteRole(roleId) {
        const role = await role_1.Role.findById(roleId);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        // Check if role is inherited by other roles
        const dependentRoles = await role_1.Role.find({
            inherits: { $in: [role._id] }
        });
        if (dependentRoles.length > 0) {
            throw new errors_1.ConflictError(`Cannot delete role. It is inherited by: ${dependentRoles.map((r) => r.name).join(', ')}`);
        }
        // Check if role is assigned to users
        const usersWithRole = await user_1.User.find({ role: role._id });
        if (usersWithRole.length > 0) {
            throw new errors_1.ConflictError('Cannot delete role. It is assigned to users');
        }
        await role_1.Role.findByIdAndDelete(roleId);
    }
    // Get all permissions for a role (including inherited)
    async getAllPermissions(roleId) {
        const role = await role_1.Role.findById(roleId);
        if (!role) {
            throw new errors_1.NotFoundError('Role not found');
        }
        const inheritedPermissions = await this.getInheritedPermissions(role._id);
        return this.mergePermissions(role.permissions, inheritedPermissions);
    }
    // Get user permissions including role inheritance
    async getUserPermissions(userId) {
        const user = await user_1.User.findById(userId).populate('roles');
        if (!user || !user.roles || user.roles.length === 0) {
            return [];
        }
        // Collect permissions from all user roles
        const allPermissions = new Set();
        for (const role of user.roles) {
            const rolePermissions = await this.getAllPermissions(role._id.toString());
            rolePermissions.forEach((permission) => allPermissions.add(permission));
        }
        return Array.from(allPermissions);
    }
    // PRIVATE HELPER METHODS
    // Recursively get inherited permissions
    async getInheritedPermissions(roleId, visited = new Set()) {
        const roleIdStr = roleId.toString();
        if (visited.has(roleIdStr)) {
            return []; // Circular dependency protection
        }
        visited.add(roleIdStr);
        const role = await role_1.Role.findById(roleId).populate('inherits');
        if (!role || !role.inherits.length) {
            return [];
        }
        let inheritedPermissions = [];
        for (const inheritedRole of role.inherits) {
            const inheritedRoleObj = inheritedRole;
            // Add direct permissions from inherited role
            inheritedPermissions = this.mergePermissions(inheritedPermissions, inheritedRoleObj.permissions);
            // Recursively get permissions from inherited role's inheritance
            const nestedPermissions = await this.getInheritedPermissions(inheritedRoleObj._id, new Set(visited));
            inheritedPermissions = this.mergePermissions(inheritedPermissions, nestedPermissions);
        }
        return inheritedPermissions;
    }
    // Merge permission arrays and remove duplicates
    mergePermissions(...permissionArrays) {
        const allPermissions = permissionArrays.flat();
        return [...new Set(allPermissions)];
    }
    // Validate no circular inheritance exists
    async validateNoCircularInheritance(roleId) {
        const tracker = {
            visiting: new Set(),
            visited: new Set(),
            path: []
        };
        await this.checkCircularInheritance(roleId, tracker);
    }
    // Recursively check for circular inheritance
    async checkCircularInheritance(roleId, tracker) {
        const roleIdStr = roleId.toString();
        if (tracker.visiting.has(roleIdStr)) {
            const cycleStart = tracker.path.indexOf(roleIdStr);
            const cycle = [...tracker.path.slice(cycleStart), roleIdStr];
            throw new errors_1.ValidationError(`Circular inheritance detected: ${cycle.join(' -> ')}`);
        }
        if (tracker.visited.has(roleIdStr)) {
            return; // Already processed this branch
        }
        tracker.visiting.add(roleIdStr);
        tracker.path.push(roleIdStr);
        const role = await role_1.Role.findById(roleId);
        if (role && role.inherits.length > 0) {
            for (const inheritedRoleId of role.inherits) {
                await this.checkCircularInheritance(inheritedRoleId, tracker);
            }
        }
        tracker.visiting.delete(roleIdStr);
        tracker.visited.add(roleIdStr);
        tracker.path.pop();
    }
    // Get role hierarchy level (depth from root)
    async getRoleHierarchyLevel(roleId, visited = new Set()) {
        const roleIdStr = roleId.toString();
        if (visited.has(roleIdStr)) {
            return 0; // Circular dependency protection
        }
        visited.add(roleIdStr);
        const role = await role_1.Role.findById(roleId);
        if (!role || !role.inherits.length) {
            return 0; // Root level
        }
        let maxLevel = 0;
        for (const inheritedRoleId of role.inherits) {
            const level = await this.getRoleHierarchyLevel(inheritedRoleId, new Set(visited));
            maxLevel = Math.max(maxLevel, level + 1);
        }
        return maxLevel;
    }
}
exports.RoleService = RoleService;
