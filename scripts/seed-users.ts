/**
 * Script to seed sample users with different roles
 * Usage: npm run seed:users
 */

import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { User, Role } from '../src/models'
import DatabaseConnection from '../src/db/connection'
import { UserStatus, UserType } from '../src/enums'

// Load environment variables
dotenv.config()

const usersData = [
  {
    username: 'alice_student',
    email: 'alice.cooper@student.com',
    password: 'Student@123',
    status: UserStatus.ACTIVE,
    userType: UserType.DEFAULT,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    roleName: 'Student'
  },
  {
    username: 'bob_student',
    email: 'bob.smith@student.com',
    password: 'Student@123',
    status: UserStatus.ACTIVE,
    userType: UserType.DEFAULT,
    avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop&crop=face',
    roleName: 'Student'
  },
  {
    username: 'carol_student',
    email: 'carol.davis@student.com',
    password: 'Student@123',
    status: UserStatus.ACTIVE,
    userType: UserType.DEFAULT,
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    roleName: 'Student'
  },
  {
    username: 'david_student',
    email: 'david.wilson@student.com',
    password: 'Student@123',
    status: UserStatus.ACTIVE,
    userType: UserType.DEFAULT,
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=400&h=400&fit=crop&crop=face',
    roleName: 'Student'
  },
  {
    username: 'guest_user',
    email: 'guest@edunova.com',
    password: 'Guest@123',
    status: UserStatus.ACTIVE,
    userType: UserType.DEFAULT,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
    roleName: 'Guest'
  }
]

async function seedUsers() {
  try {
    console.log('🚀 Starting users seeding...')

    // Connect to database
    await DatabaseConnection.connect()

    // Get all roles
    const roles = await Role.find({})
    const roleMap = new Map(roles.map((role) => [role.name, role._id]))

    // Clear existing users (except admin)
    await User.deleteMany({ email: { $ne: 'admin@edunova.com' } })
    console.log('🗑️  Cleared existing users (except admin)')

    // Create users
    const createdUsers: any[] = []
    for (const userData of usersData) {
      const roleId = roleMap.get(userData.roleName)
      if (!roleId) {
        console.log(`⚠️  Role '${userData.roleName}' not found for user ${userData.username}`)
        continue
      }

      // Hash password if provided
      let hashedPassword: string | null = null
      if (userData.password) {
        hashedPassword = await bcrypt.hash(userData.password, 12)
      }

      const user = await User.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        status: userData.status,
        userType: userData.userType,
        avatar: userData.avatar,
        roles: [roleId]
      })

      createdUsers.push(user)
      console.log(`✅ Created user: ${user.username} (${userData.roleName}) - ${user.email}`)
    }

    console.log('🎉 Users seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Total users created: ${createdUsers.length}`)

    // Display users by role
    const usersByRole = createdUsers.reduce(
      (acc, user) => {
        const userData = usersData.find((u) => u.email === user.email)
        const roleName = userData?.roleName || 'unknown'
        acc[roleName] = (acc[roleName] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`   - ${role}: ${count} users`)
    })

    console.log('\n🔑 Default passwords:')
    console.log('   - Students: Student@123')
    console.log('   - Guests: Guest@123')
  } catch (error) {
    console.error('❌ Error seeding users:', error)
  } finally {
    await DatabaseConnection.disconnect()
    process.exit(0)
  }
}

// Run the function
seedUsers()
