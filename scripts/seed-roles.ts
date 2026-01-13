/**
 * Script to seed roles with permissions
 * Usage: npm run seed:roles
 */

import dotenv from 'dotenv'
import { Role } from '../src/models'
import DatabaseConnection from '../src/db/connection'
import { PERMISSIONS, ALL_PERMISSIONS, SYSTEM_ROLE_NAMES } from '../src/configs/permission'

// Load environment variables
dotenv.config()

const rolesData = [
  {
    name: SYSTEM_ROLE_NAMES.SUPER_ADMIN,
    description: 'Ultimate system administrator with all permissions and system access',
    permissions: ALL_PERMISSIONS,
    inherits: []
  },
  {
    name: SYSTEM_ROLE_NAMES.ADMIN,
    description: 'System administrator with comprehensive management permissions',
    permissions: [
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      PERMISSIONS.COURSE_CREATE,
      PERMISSIONS.COURSE_READ,
      PERMISSIONS.COURSE_UPDATE,
      PERMISSIONS.COURSE_DELETE,
      PERMISSIONS.CHAPTER_CREATE,
      PERMISSIONS.CHAPTER_READ,
      PERMISSIONS.CHAPTER_UPDATE,
      PERMISSIONS.CHAPTER_DELETE,
      PERMISSIONS.LESSON_CREATE,
      PERMISSIONS.LESSON_READ,
      PERMISSIONS.LESSON_UPDATE,
      PERMISSIONS.LESSON_DELETE,
      PERMISSIONS.CATEGORY_CREATE,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.CATEGORY_UPDATE,
      PERMISSIONS.CATEGORY_DELETE,
      PERMISSIONS.COUPON_CREATE,
      PERMISSIONS.COUPON_READ,
      PERMISSIONS.COUPON_UPDATE,
      PERMISSIONS.COUPON_DELETE,
      PERMISSIONS.REVIEW_READ,
      PERMISSIONS.REVIEW_UPDATE,
      PERMISSIONS.REVIEW_DELETE,
      PERMISSIONS.COMMENT_READ,
      PERMISSIONS.COMMENT_UPDATE,
      PERMISSIONS.COMMENT_DELETE,
      PERMISSIONS.BLOG_CREATE,
      PERMISSIONS.BLOG_READ,
      PERMISSIONS.BLOG_UPDATE,
      PERMISSIONS.BLOG_DELETE,
      PERMISSIONS.ORDER_READ,
      PERMISSIONS.ORDER_UPDATE,
      PERMISSIONS.ORDER_MODERATE,
      PERMISSIONS.STATS_READ
    ],
    inherits: []
  },
  {
    name: SYSTEM_ROLE_NAMES.STUDENT,
    description: 'Regular student who can enroll in courses and interact with content',
    permissions: [
      PERMISSIONS.COURSE_READ,
      PERMISSIONS.CHAPTER_READ,
      PERMISSIONS.LESSON_READ,
      PERMISSIONS.CATEGORY_READ,
      PERMISSIONS.REVIEW_CREATE,
      PERMISSIONS.REVIEW_READ,
      PERMISSIONS.COMMENT_CREATE,
      PERMISSIONS.COMMENT_READ,
      PERMISSIONS.BLOG_READ,
      PERMISSIONS.ORDER_CREATE,
      PERMISSIONS.ORDER_READ
    ],
    inherits: []
  },
  {
    name: SYSTEM_ROLE_NAMES.GUEST,
    description: 'Guest user with limited read-only access to public content',
    permissions: [PERMISSIONS.COURSE_READ, PERMISSIONS.CATEGORY_READ, PERMISSIONS.BLOG_READ, PERMISSIONS.REVIEW_READ],
    inherits: []
  }
]

async function seedRoles() {
  try {
    console.log('🚀 Starting roles seeding...')

    // Connect to database
    await DatabaseConnection.connect()

    // Clear existing roles
    await Role.deleteMany({})
    console.log('🗑️  Cleared existing roles')

    // Create roles
    const createdRoles: any[] = []
    for (const roleData of rolesData) {
      const role = await Role.create(roleData)
      createdRoles.push(role)
      console.log(`✅ Created role: ${role.name} (${role.permissions.length} permissions)`)
    }

    console.log('🎉 Roles seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Total roles created: ${createdRoles.length}`)

    // Display role summary
    for (const role of createdRoles) {
      console.log(`   - ${role.name}: ${role.permissions.length} permissions`)
    }
  } catch (error) {
    console.error('❌ Error seeding roles:', error)
  } finally {
    await DatabaseConnection.disconnect()
    process.exit(0)
  }
}

// Run the function
seedRoles()
