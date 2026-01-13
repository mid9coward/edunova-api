/**
 * Script to seed sample courses
 * Usage: npm run seed:courses
 */

import dotenv from 'dotenv'
import { Course, Category, User } from '../src/models'
import DatabaseConnection from '../src/db/connection'
import { CourseLevel, CourseStatus } from '../src/enums'

// Load environment variables
dotenv.config()

const coursesData = [
  {
    title: 'Complete React.js Development Bootcamp',
    slug: 'complete-react-js-development-bootcamp',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    description:
      'Master React.js from beginner to advanced level. Learn hooks, context, state management, routing, and build real-world projects.',
    excerpt: 'Complete guide to React.js development with hands-on projects and modern best practices.',
    introUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: 2490000,
    oldPrice: 3490000,
    originalPrice: 4990000,
    isFree: false,
    status: CourseStatus.PUBLISHED,
    categorySlug: 'web-development',
    level: CourseLevel.INTERMEDIATE,
    info: {
      requirements: ['Basic HTML, CSS, and JavaScript knowledge', 'Node.js installed'],
      benefits: ['Build modern React applications', 'Master React hooks and context'],
      techniques: ['Functional components', 'React hooks', 'State management'],
      documents: ['React documentation', 'Course source code'],
      qa: [
        {
          question: 'Do I need prior React experience?',
          answer: 'No, this course starts from the basics.'
        }
      ]
    }
  },
  {
    title: 'Python for Data Science Masterclass',
    slug: 'python-for-data-science-masterclass',
    image: 'https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=800&h=400&fit=crop',
    description:
      'Learn Python programming for data science with pandas, numpy, matplotlib, and machine learning libraries.',
    excerpt: 'Complete Python data science course covering analysis, visualization, and machine learning.',
    introUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: 1990000,
    oldPrice: 2990000,
    originalPrice: 3990000,
    isFree: false,
    status: CourseStatus.PUBLISHED,
    categorySlug: 'data-science',
    level: CourseLevel.BEGINNER,
    info: {
      requirements: ['Basic programming knowledge', 'High school mathematics'],
      benefits: ['Master Python for data analysis', 'Learn pandas and numpy'],
      techniques: ['Data manipulation with pandas', 'Data visualization'],
      documents: ['Python cheat sheets', 'Dataset collections'],
      qa: [
        {
          question: 'Do I need math background?',
          answer: 'Basic high school math is sufficient.'
        }
      ]
    }
  },
  {
    title: 'UI/UX Design Fundamentals',
    slug: 'ui-ux-design-fundamentals',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=400&fit=crop',
    description:
      'Learn the principles of user interface and user experience design. Master design tools and create beautiful, functional designs.',
    excerpt: 'Complete guide to UI/UX design with practical projects and industry best practices.',
    introUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: 0,
    oldPrice: 0,
    originalPrice: 2190000,
    isFree: true,
    status: CourseStatus.PUBLISHED,
    categorySlug: 'ui-ux-design',
    level: CourseLevel.BEGINNER,
    info: {
      requirements: ['No prior design experience needed', 'Figma account (free)'],
      benefits: ['Understand design principles', 'Master Figma design tool'],
      techniques: ['Design thinking methodology', 'User research and personas'],
      documents: ['Design templates', 'Typography guides'],
      qa: [
        {
          question: 'Do I need design software?',
          answer: 'We use Figma which is free.'
        }
      ]
    }
  },
  {
    title: 'Mobile App Development with Flutter',
    slug: 'mobile-app-development-with-flutter',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop',
    description:
      'Build beautiful, native mobile applications for iOS and Android using Flutter and Dart programming language.',
    excerpt: 'Complete Flutter development course for building cross-platform mobile applications.',
    introUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: 3190000,
    oldPrice: 4490000,
    originalPrice: 5690000,
    isFree: false,
    status: CourseStatus.PUBLISHED,
    categorySlug: 'mobile-development',
    level: CourseLevel.INTERMEDIATE,
    info: {
      requirements: ['Basic programming knowledge', 'Flutter SDK installed'],
      benefits: ['Build cross-platform mobile apps', 'Master Flutter framework'],
      techniques: ['Flutter widgets and layouts', 'State management'],
      documents: ['Flutter documentation', 'Widget catalog'],
      qa: [
        {
          question: 'Can I develop for both iOS and Android?',
          answer: 'Yes! Flutter allows you to write once and deploy to both platforms.'
        }
      ]
    }
  },
  {
    title: 'Machine Learning with Python',
    slug: 'machine-learning-with-python',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=400&fit=crop',
    description:
      'Comprehensive machine learning course covering algorithms, implementation, and real-world applications using Python.',
    excerpt: 'Learn machine learning from scratch with hands-on Python projects and real datasets.',
    introUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    price: 3690000,
    oldPrice: 4990000,
    originalPrice: 7490000,
    isFree: false,
    status: CourseStatus.DRAFT,
    categorySlug: 'machine-learning',
    level: CourseLevel.ADVANCED,
    info: {
      requirements: ['Strong Python programming skills', 'Linear algebra knowledge'],
      benefits: ['Understand ML algorithms deeply', 'Build predictive models'],
      techniques: ['Supervised learning algorithms', 'Deep learning with TensorFlow'],
      documents: ['Algorithm notebooks', 'Dataset preprocessing'],
      qa: [
        {
          question: 'How much math do I need?',
          answer: 'You need solid understanding of linear algebra and statistics.'
        }
      ]
    }
  }
]

async function seedCourses() {
  try {
    console.log('🚀 Starting courses seeding...')

    // Connect to database
    await DatabaseConnection.connect()

    // Get categories and instructors
    const categories = await Category.find({})
    const categoryMap = new Map(categories.map((cat) => [cat.slug, cat._id]))

    // Get admin user to assign as course author
    const adminUser = await User.findOne({ email: 'admin@edunova.com' })

    if (!adminUser) {
      console.log('❌ Admin user not found! Please run seed:admin first')
      return
    }

    // Clear existing courses
    await Course.deleteMany({})
    console.log('🗑️  Cleared existing courses')

    // Create courses
    let courseCount = 0

    for (const courseData of coursesData) {
      const categoryId = categoryMap.get(courseData.categorySlug)
      if (!categoryId) {
        console.log(`⚠️  Category '${courseData.categorySlug}' not found for course ${courseData.title}`)
        continue
      }

      // Assign admin as course author

      // Create course
      const course = await Course.create({
        title: courseData.title,
        slug: courseData.slug,
        image: courseData.image,
        description: courseData.description,
        excerpt: courseData.excerpt,
        introUrl: courseData.introUrl,
        price: courseData.price,
        oldPrice: courseData.oldPrice,
        originalPrice: courseData.originalPrice,
        isFree: courseData.isFree,
        status: courseData.status,
        authorId: adminUser._id,
        categoryId: categoryId,
        level: courseData.level,
        info: courseData.info,
        view: Math.floor(Math.random() * 1000) + 100,
        sold: Math.floor(Math.random() * 50) + 10,
        chapterIds: []
      })

      courseCount++
      console.log(`✅ Created course: ${course.title}`)
    }

    console.log('🎉 Courses seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Total courses created: ${courseCount}`)

    // Display courses by status
    const publishedCourses = await Course.countDocuments({ status: CourseStatus.PUBLISHED })
    const draftCourses = await Course.countDocuments({ status: CourseStatus.DRAFT })
    console.log(`   - Published courses: ${publishedCourses}`)
    console.log(`   - Draft courses: ${draftCourses}`)
  } catch (error) {
    console.error('❌ Error seeding courses:', error)
  } finally {
    await DatabaseConnection.disconnect()
    process.exit(0)
  }
}

// Run the function
seedCourses()
