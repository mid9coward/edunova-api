"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const role_routes_1 = __importDefault(require("./role.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const course_routes_1 = __importDefault(require("./course.routes"));
const category_routes_1 = __importDefault(require("./category.routes"));
const chapter_routes_1 = __importDefault(require("./chapter.routes"));
const lesson_routes_1 = __importDefault(require("./lesson.routes"));
const track_routes_1 = __importDefault(require("./track.routes"));
const coupon_routes_1 = __importDefault(require("./coupon.routes"));
const review_routes_1 = __importDefault(require("./review.routes"));
const comment_routes_1 = __importDefault(require("./comment.routes"));
const blog_routes_1 = __importDefault(require("./blog.routes"));
const quiz_question_routes_1 = __importDefault(require("./quiz-question.routes"));
const quiz_attempt_routes_1 = __importDefault(require("./quiz-attempt.routes"));
const cart_routes_1 = __importDefault(require("./cart.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const chatbot_routes_1 = __importDefault(require("./chatbot.routes"));
const search_routes_1 = __importDefault(require("./search.routes"));
const stats_routes_1 = __importDefault(require("./stats.routes"));
const router = express_1.default.Router();
// API routes
router.use('/auth', auth_routes_1.default);
router.use('/roles', role_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/courses', course_routes_1.default);
router.use('/categories', category_routes_1.default);
router.use('/chapters', chapter_routes_1.default);
router.use('/lessons', lesson_routes_1.default);
router.use('/tracks', track_routes_1.default);
router.use('/coupons', coupon_routes_1.default);
router.use('/reviews', review_routes_1.default);
router.use('/comments', comment_routes_1.default);
router.use('/blogs', blog_routes_1.default);
router.use('/quiz-questions', quiz_question_routes_1.default);
router.use('/quiz-attempts', quiz_attempt_routes_1.default);
router.use('/cart', cart_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/payment', payment_routes_1.default);
router.use('/chatbot', chatbot_routes_1.default);
router.use('/search', search_routes_1.default);
router.use('/stats', stats_routes_1.default);
// Health check
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
