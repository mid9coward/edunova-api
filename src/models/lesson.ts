import mongoose, { Document, Schema } from 'mongoose'
import { LessonContentType } from '../enums'

/**
 * Lesson Interface
 */
export interface ILesson extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  chapterId: mongoose.Types.ObjectId
  courseId: mongoose.Types.ObjectId
  resourceId: mongoose.Types.ObjectId
  contentType: LessonContentType
  order: number
  preview: boolean
  isPublished: boolean
  duration: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Video Resource Interface
 */
export interface IVideo extends Document {
  _id: mongoose.Types.ObjectId
  url: string
  description: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Article Resource Interface
 */
export interface IArticle extends Document {
  _id: mongoose.Types.ObjectId
  description: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Quiz Resource Interface
 */
export interface IQuiz extends Document {
  _id: mongoose.Types.ObjectId
  totalAttemptsAllowed: number
  passingScorePercentage: number
  duration?: number // Duration in minutes for the quiz time limit (0 = unlimited)
  description: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Coding Exercise Resource Interfaces
 */
export interface ICodingExerciseTestCase {
  input: string
  expectedOutput: string
  isHidden: boolean
}

export interface ICodingExerciseConstraints {
  timeLimit: number
  memoryLimit: number
}

export interface ICodingExercise extends Document {
  _id: mongoose.Types.ObjectId
  title: string
  language: string
  version: string
  problemStatement: string
  starterCode: string
  solutionCode: string
  testCases: ICodingExerciseTestCase[]
  constraints: ICodingExerciseConstraints
  createdAt: Date
  updatedAt: Date
}

/**
 * Lesson Schema
 */
const lessonSchema = new Schema<ILesson>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    contentType: {
      type: String,
      enum: Object.values(LessonContentType),
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    preview: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

/**
 * Video Resource Schema
 */
const videoSchema = new Schema<IVideo>(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

/**
 * Article Resource Schema
 */
const articleSchema = new Schema<IArticle>(
  {
    description: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

/**
 * Quiz Resource Schema
 */
const quizSchema = new Schema<IQuiz>(
  {
    totalAttemptsAllowed: {
      type: Number,
      min: 1,
      max: 10
    },
    passingScorePercentage: {
      type: Number,
      min: 1,
      max: 100
    },
    duration: {
      type: Number,
      min: 0,
      default: 0 // 0 means unlimited time
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
)

/**
 * Coding Exercise Resource Schema
 */
const codingTestCaseSchema = new Schema<ICodingExerciseTestCase>(
  {
    input: {
      type: String,
      default: ''
    },
    expectedOutput: {
      type: String,
      required: true
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  {}
)

const codingConstraintsSchema = new Schema<ICodingExerciseConstraints>(
  {
    timeLimit: {
      type: Number,
      default: 2,
      min: 0
    },
    memoryLimit: {
      type: Number,
      default: 128,
      min: 0
    }
  },
  {
    _id: false
  }
)

const codingExerciseSchema = new Schema<ICodingExercise>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    language: {
      type: String,
      required: true,
      trim: true
    },
    version: {
      type: String,
      required: true,
      trim: true
    },
    problemStatement: {
      type: String,
      required: true
    },
    starterCode: {
      type: String,
      required: true
    },
    solutionCode: {
      type: String,
      required: true,
      select: false
    },
    testCases: {
      type: [codingTestCaseSchema],
      required: true,
      validate: {
        validator: (value: ICodingExerciseTestCase[]) => Array.isArray(value) && value.length > 0,
        message: 'At least one test case is required'
      }
    },
    constraints: {
      type: codingConstraintsSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
)

// Lesson Indexes
lessonSchema.index({ chapterId: 1, order: 1 })
lessonSchema.index({ courseId: 1, order: 1 })
lessonSchema.index({ courseId: 1, isPublished: 1 })
lessonSchema.index({ chapterId: 1, isPublished: 1 })

// Resource Indexes
videoSchema.index({ createdAt: -1 })
articleSchema.index({ createdAt: -1 })
quizSchema.index({ createdAt: -1 })
codingExerciseSchema.index({ createdAt: -1 })

// Model Exports
export const Lesson = mongoose.model<ILesson>('Lesson', lessonSchema)
export const Video = mongoose.model<IVideo>('Video', videoSchema)
export const Article = mongoose.model<IArticle>('Article', articleSchema)
export const Quiz = mongoose.model<IQuiz>('Quiz', quizSchema)
export const CodingExercise = mongoose.model<ICodingExercise>('CodingExercise', codingExerciseSchema)
