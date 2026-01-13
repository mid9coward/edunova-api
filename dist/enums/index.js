"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponDiscountType = exports.BlogStatus = exports.Role = exports.Gender = exports.ReviewStatus = exports.LessonContentType = exports.PaymentMethod = exports.OrderStatus = exports.QuizResult = exports.QuizAttemptStatus = exports.CommentStatus = exports.CategoryStatus = exports.CourseType = exports.CourseStatus = exports.CourseLevel = exports.UserType = exports.UserStatus = void 0;
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["BANNED"] = "banned";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var UserType;
(function (UserType) {
    UserType["FACEBOOK"] = "facebook";
    UserType["GOOGLE"] = "google";
    UserType["DEFAULT"] = "default";
})(UserType || (exports.UserType = UserType = {}));
var CourseLevel;
(function (CourseLevel) {
    CourseLevel["BEGINNER"] = "beginner";
    CourseLevel["INTERMEDIATE"] = "intermediate";
    CourseLevel["ADVANCED"] = "advanced";
})(CourseLevel || (exports.CourseLevel = CourseLevel = {}));
var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "draft";
    CourseStatus["PUBLISHED"] = "published";
})(CourseStatus || (exports.CourseStatus = CourseStatus = {}));
var CourseType;
(function (CourseType) {
    CourseType["FREE"] = "free";
    CourseType["PAID"] = "paid";
})(CourseType || (exports.CourseType = CourseType = {}));
var CategoryStatus;
(function (CategoryStatus) {
    CategoryStatus["ACTIVE"] = "active";
    CategoryStatus["INACTIVE"] = "inactive";
})(CategoryStatus || (exports.CategoryStatus = CategoryStatus = {}));
var CommentStatus;
(function (CommentStatus) {
    CommentStatus["APPROVED"] = "approved";
    CommentStatus["PENDING"] = "pending";
    CommentStatus["REJECTED"] = "rejected";
})(CommentStatus || (exports.CommentStatus = CommentStatus = {}));
var QuizAttemptStatus;
(function (QuizAttemptStatus) {
    QuizAttemptStatus["IN_PROGRESS"] = "in_progress";
    QuizAttemptStatus["COMPLETED"] = "completed";
})(QuizAttemptStatus || (exports.QuizAttemptStatus = QuizAttemptStatus = {}));
var QuizResult;
(function (QuizResult) {
    QuizResult["PASS"] = "pass";
    QuizResult["FAIL"] = "fail";
})(QuizResult || (exports.QuizResult = QuizResult = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["STRIPE"] = "stripe";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var LessonContentType;
(function (LessonContentType) {
    LessonContentType["VIDEO"] = "video";
    LessonContentType["QUIZ"] = "quiz";
    LessonContentType["ARTICLE"] = "article";
})(LessonContentType || (exports.LessonContentType = LessonContentType = {}));
var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["ACTIVE"] = "active";
    ReviewStatus["INACTIVE"] = "inactive";
})(ReviewStatus || (exports.ReviewStatus = ReviewStatus = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "male";
    Gender["FEMALE"] = "female";
    Gender["OTHER"] = "other";
})(Gender || (exports.Gender = Gender = {}));
var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["INSTRUCTOR"] = "instructor";
    Role["STUDENT"] = "student";
    Role["USER"] = "user";
})(Role || (exports.Role = Role = {}));
var BlogStatus;
(function (BlogStatus) {
    BlogStatus["DRAFT"] = "draft";
    BlogStatus["PUBLISHED"] = "published";
})(BlogStatus || (exports.BlogStatus = BlogStatus = {}));
var CouponDiscountType;
(function (CouponDiscountType) {
    CouponDiscountType["PERCENT"] = "percent";
    CouponDiscountType["FIXED"] = "fixed";
})(CouponDiscountType || (exports.CouponDiscountType = CouponDiscountType = {}));
