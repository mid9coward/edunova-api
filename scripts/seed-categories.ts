/**
 * Script to seed course categories
 * Usage: npm run seed:categories
 */

import dotenv from 'dotenv'
import { Category } from '../src/models'
import DatabaseConnection from '../src/db/connection'
import { CategoryStatus } from '../src/enums'

// Load environment variables
dotenv.config()

const categoriesData = [
  {
    name: 'Web Development',
    slug: 'web-development',
    status: CategoryStatus.ACTIVE
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    status: CategoryStatus.ACTIVE
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    status: CategoryStatus.ACTIVE
  },
  {
    name: 'Machine Learning',
    slug: 'machine-learning',
    status: CategoryStatus.ACTIVE
  },
  {
    name: 'UI/UX Design',
    slug: 'ui-ux-design',
    status: CategoryStatus.ACTIVE
  }
]

async function seedCategories() {
  try {
    console.log('🚀 Starting categories seeding...')

    // Connect to database
    await DatabaseConnection.connect()

    // Clear existing categories
    await Category.deleteMany({})
    console.log('🗑️  Cleared existing categories')

    // Create categories
    const createdCategories: any[] = []
    for (const categoryData of categoriesData) {
      const category = await Category.create(categoryData)
      createdCategories.push(category)
      console.log(`✅ Created category: ${category.name} (${category.slug})`)
    }

    console.log('🎉 Categories seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Total categories created: ${createdCategories.length}`)

    // Display categories by status
    const activeCategories = createdCategories.filter((cat) => cat.status === CategoryStatus.ACTIVE)
    console.log(`   - Active categories: ${activeCategories.length}`)
  } catch (error) {
    console.error('❌ Error seeding categories:', error)
  } finally {
    await DatabaseConnection.disconnect()
    process.exit(0)
  }
}

// Run the function
seedCategories()
