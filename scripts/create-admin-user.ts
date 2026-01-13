/**
 * Script to create admin user
 * Usage: npm run seed:admin
 */

import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { User, Role } from '../src/models'
import DatabaseConnection from '../src/db/connection'
import { UserStatus, UserType } from '../src/enums'
import { SYSTEM_ROLE_NAMES } from '../src/configs/permission'

// Load environment variables
dotenv.config()

async function createAdminUser() {
  try {
    console.log('🚀 Starting admin user creation...')

    // Connect to database
    await DatabaseConnection.connect()

    // Admin user data
    const adminData = {
      username: 'admin',
      email: 'admin@edunova.com',
      password: 'Admin@123456',
      status: UserStatus.ACTIVE,
      userType: UserType.DEFAULT,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email })

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!')
      console.log(`📧 Email: ${adminData.email}`)
      console.log('🔑 Password: (keeping existing password)')
      return
    }

    // Find admin role
    const adminRole = await Role.findOne({ name: SYSTEM_ROLE_NAMES.SUPER_ADMIN })
    if (!adminRole) {
      console.log(`❌ Admin role '${SYSTEM_ROLE_NAMES.SUPER_ADMIN}' not found! Please run seed:roles first`)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 12)

    // Create admin user
    const adminUser = await User.create({
      ...adminData,
      password: hashedPassword,
      roles: [adminRole._id]
    })

    console.log('✅ Admin user created successfully!')
    console.log(`📧 Email: ${adminData.email}`)
    console.log(`🔑 Password: ${adminData.password}`)
    console.log(`👤 Username: ${adminData.username}`)
    console.log(`🆔 User ID: ${adminUser._id}`)
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await DatabaseConnection.disconnect()
    process.exit(0)
  }
}

// Run the function
createAdminUser()
