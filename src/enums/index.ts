export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

export enum UserType {
  FACEBOOK = 'facebook',
  GOOGLE = 'google',
  DEFAULT = 'default'
}

export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum CourseType {
  FREE = 'free',
  PAID = 'paid'
}

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum CommentStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}

export enum QuizAttemptStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum QuizResult {
  PASS = 'pass',
  FAIL = 'fail'
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  BANK_TRANSFER = 'bank_transfer'
}

export enum LessonContentType {
  VIDEO = 'video',
  QUIZ = 'quiz',
  ARTICLE = 'article',
  CODING = 'coding'
}

export enum CodeSubmissionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  COMPILE_ERROR = 'COMPILE_ERROR',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED'
}

export enum ReviewStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

export enum Role {
  ADMIN = 'admin',
  INSTRUCTOR = 'instructor',
  STUDENT = 'student',
  USER = 'user'
}

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum CouponDiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed'
}
