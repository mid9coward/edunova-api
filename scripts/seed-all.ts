/**
 * Master seeding script to run all seeds in the correct order
 * Usage: npm run seed:all
 */

import dotenv from 'dotenv'
import { execSync } from 'child_process'
import DatabaseConnection from '../src/db/connection'

// Load environment variables
dotenv.config()

const seedScripts = [
  {
    name: 'Roles',
    script: 'npx ts-node scripts/seed-roles.ts',
    description: 'Creating system roles with permissions'
  },
  {
    name: 'Categories',
    script: 'npx ts-node scripts/seed-categories.ts',
    description: 'Creating course categories'
  },
  {
    name: 'Users',
    script: 'npx ts-node scripts/seed-users.ts',
    description: 'Creating sample users with different roles'
  },
  {
    name: 'Admin User',
    script: 'npx ts-node scripts/create-admin-user.ts',
    description: 'Creating admin user account'
  },
  {
    name: 'Courses',
    script: 'npx ts-node scripts/seed-courses.ts',
    description: 'Creating comprehensive courses with content'
  }
]

async function runSeedScript(name: string, script: string, description: string): Promise<boolean> {
  try {
    console.log(`\n🔄 ${description}...`)
    console.log(`📝 Running: ${name}`)

    execSync(script, {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    console.log(`✅ ${name} completed successfully`)
    return true
  } catch (error) {
    console.error(`❌ ${name} failed:`, error)
    return false
  }
}

async function seedAll() {
  console.log('🚀 Starting complete database seeding...')
  console.log('='.repeat(60))

  const startTime = Date.now()
  let successCount = 0
  let failureCount = 0

  try {
    // Test database connection
    console.log('🔌 Testing database connection...')
    await DatabaseConnection.connect()
    await DatabaseConnection.disconnect()
    console.log('✅ Database connection successful')

    // Run all seed scripts in order
    for (const seedScript of seedScripts) {
      const success = await runSeedScript(seedScript.name, seedScript.script, seedScript.description)

      if (success) {
        successCount++
      } else {
        failureCount++
        console.log(`\n⚠️  Continuing with remaining scripts...`)
      }
    }

    // Summary
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 Database seeding completed!')
    console.log(`📊 Summary:`)
    console.log(`   - Total scripts: ${seedScripts.length}`)
    console.log(`   - Successful: ${successCount}`)
    console.log(`   - Failed: ${failureCount}`)
    console.log(`   - Duration: ${duration} seconds`)

    if (failureCount === 0) {
      console.log('\n✨ All seeds completed successfully!')
      console.log('🚀 Your EduNova LMS is ready to use!')
      console.log('\n📋 Next steps:')
      console.log('   1. Start your development server: npm run dev')
      console.log('   2. Login with admin credentials:')
      console.log('      Email: admin@edunova.com')
      console.log('      Password: Admin@123456')
      console.log('   3. Explore the seeded data in your application')
    } else {
      console.log(`\n⚠️  ${failureCount} script(s) failed. Please check the errors above.`)
    }
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error)
    failureCount++
  }

  console.log('\n' + '='.repeat(60))
  process.exit(failureCount > 0 ? 1 : 0)
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Seeding interrupted by user')
  process.exit(1)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Seeding terminated')
  process.exit(1)
})

// Run the master seeding function
seedAll()
