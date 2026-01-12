import express from 'express'
import authRoutes from './auth.routes'
import roleRoutes from './role.routes'
import userRoutes from './user.routes'
import courseRoutes from './course.routes'
import categoryRoutes from './category.routes'
import chapterRoutes from './chapter.routes'
import lessonRoutes from './lesson.routes'
import trackRoutes from './track.routes'
import couponRoutes from './coupon.routes'
import reviewRoutes from './review.routes'
import commentRoutes from './comment.routes'
import blogRoutes from './blog.routes'
import quizQuestionRoutes from './quiz-question.routes'
import quizAttemptRoutes from './quiz-attempt.routes'
import cartRoutes from './cart.routes'
import orderRoutes from './order.routes'
import paymentRoutes from './payment.routes'
import chatbotRoutes from './chatbot.routes'
import searchRoutes from './search.routes'
import statsRoutes from './stats.routes'

const router = express.Router()

// API routes
router.use('/auth', authRoutes)
router.use('/roles', roleRoutes)
router.use('/users', userRoutes)
router.use('/courses', courseRoutes)
router.use('/categories', categoryRoutes)
router.use('/chapters', chapterRoutes)
router.use('/lessons', lessonRoutes)
router.use('/tracks', trackRoutes)
router.use('/coupons', couponRoutes)
router.use('/reviews', reviewRoutes)
router.use('/comments', commentRoutes)
router.use('/blogs', blogRoutes)
router.use('/quiz-questions', quizQuestionRoutes)
router.use('/quiz-attempts', quizAttemptRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/payment', paymentRoutes)
router.use('/chatbot', chatbotRoutes)
router.use('/search', searchRoutes)
router.use('/stats', statsRoutes)

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  })
})

export default router
