import { z } from 'zod'
import { ALL_PERMISSIONS } from '~/configs/permission'

/**
 * Role validation schemas
 */

// Create role schema
export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Role name can only contain letters and spaces'),
    description: z
      .string()
      .min(5, 'Description must be at least 5 characters')
      .max(200, 'Description must not exceed 200 characters')
      .optional(),
    permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).optional(),
    inherits: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')).optional()
  })
})

// Update role schema
export const updateRoleSchema = z.object({
  params: z.object({
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Role name can only contain letters and spaces')
      .optional(),
    description: z
      .string()
      .min(5, 'Description must be at least 5 characters')
      .max(200, 'Description must not exceed 200 characters')
      .optional(),
    permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).optional(),
    inherits: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')).optional()
  })
})

// Get role by ID schema
export const getRoleByIdSchema = z.object({
  params: z.object({
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')
  }),
  query: z.object({
    includeInheritance: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || val === 'true' || val === 'false',
        'includeInheritance must be true or false'
      )
  })
})

// Delete role schema
export const deleteRoleSchema = z.object({
  params: z.object({
    roleId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid role ID format')
  })
})

// Get roles query schema
export const getRolesSchema = z.object({
  query: z.object({
    includeInheritance: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || val === 'true' || val === 'false',
        'includeInheritance must be true or false'
      )
  })
})

// Get user permissions schema
export const getUserPermissionsSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
  })
})
