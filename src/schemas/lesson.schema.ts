import { z } from 'zod'
import { objectIdSchema, paginationSchema } from './common.schema'

/**
 * Lesson and Resource Validation Schemas
 */

const codingTestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().optional().default(false)
})

const codingConstraintsSchema = z
  .object({
    timeLimit: z.number().min(0).default(2),
    memoryLimit: z.number().min(0).default(128)
  })
  .default({})

const codingExerciseBodySchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    language: z.string().min(1, 'Language is required').trim(),
    version: z.string().min(1, 'Version is required').trim(),
    problemStatement: z.string().min(1, 'Problem statement is required'),
    starterCode: z.string().min(1, 'Starter code is required'),
    solutionCode: z.string().min(1, 'Solution code is required'),
    testCases: z.array(codingTestCaseSchema).min(1, 'At least one test case is required'),
    constraints: codingConstraintsSchema
  })

// Create coding exercise schema
export const createCodingExerciseSchema = z.object({
  body: codingExerciseBodySchema
})

// Create lesson schema (supports both resource and resourceId)
export const createLessonSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
      chapterId: objectIdSchema,
      courseId: objectIdSchema,
      contentType: z.enum(['video', 'quiz', 'article', 'coding']),
      preview: z.boolean().optional().default(false),
      isPublished: z.boolean().optional().default(false),
      duration: z.number().int().optional(),
      // Either provide resourceId (existing resource) OR resource (create new resource)
      resourceId: objectIdSchema.optional(),
      resource: z.record(z.string(), z.any()).optional()
    })
    .superRefine((data, ctx) => {
      if (!data.resourceId && !data.resource) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Either resourceId or resource must be provided',
          path: ['resourceId']
        })
      }

      if (data.contentType === 'coding' && data.resource) {
        const parsed = codingExerciseBodySchema.safeParse(data.resource)
        if (!parsed.success) {
          parsed.error.issues.forEach((issue) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ['resource', ...issue.path]
            })
          })
        }
      }
    })
})

// Update lesson schema (with optional resource data)
export const updateLessonSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
      chapterId: objectIdSchema.optional(),
      order: z.number().int().min(1, 'Order must be at least 1').optional(),
      preview: z.boolean().optional(),
      isPublished: z.boolean().optional(),
      duration: z.number().int().min(0, 'Duration must be 0 or greater (0 = unlimited)').optional(),
      resource: z.record(z.string(), z.any()).optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get lessons query schema (requires chapterId)
export const getLessonsQuerySchema = z.object({
  query: z.object({
    chapterId: objectIdSchema
  })
})

// Get lesson by ID schema
export const getLessonByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete lesson schema
export const deleteLessonSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Get chapter lessons schema
export const getChapterLessonsSchema = z.object({
  params: z.object({
    chapterId: objectIdSchema
  }),
  query: paginationSchema.extend({
    contentType: z.enum(['video', 'quiz', 'article', 'coding']).optional(),
    isPublished: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z.enum(['title', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
})

// Get course lessons schema
export const getCourseLessonsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema
  }),
  query: paginationSchema.extend({
    chapterId: objectIdSchema.optional(),
    contentType: z.enum(['video', 'quiz', 'article', 'coding']).optional(),
    isPublished: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z.enum(['title', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
})

// Reorder lessons schema
export const reorderLessonsSchema = z.object({
  body: z.object({
    lessons: z
      .array(
        z.object({
          id: objectIdSchema,
          order: z.number().min(0, 'Order must be non-negative')
        })
      )
      .min(1, 'At least one lesson is required')
  })
})

/**
 * Coding submission schemas
 */

export const runCodeSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    sourceCode: z.string().min(1, 'Source code is required'),
    language: z.string().min(1, 'Language is required'),
    version: z.string().min(1, 'Version is required'),
    stdin: z.string().optional()
  })
})

export const submitCodeSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z.object({
    sourceCode: z.string().min(1, 'Source code is required'),
    language: z.string().min(1, 'Language is required'),
    version: z.string().min(1, 'Version is required')
  })
})

/**
 * Video Resource Validation Schemas
 */

// Create video schema
export const createVideoSchema = z.object({
  body: z.object({
    url: z.string().url('Invalid URL format').min(1, 'URL is required'),
    description: z.string().min(1, 'Description is required').max(1000, 'Description too long').trim()
  })
})

// Update video schema
export const updateVideoSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      url: z.string().url('Invalid URL format').min(1, 'URL is required').optional(),
      description: z.string().min(1, 'Description is required').max(1000, 'Description too long').trim().optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get videos query schema
export const getVideosQuerySchema = z.object({
  query: paginationSchema.extend({
    search: z.string().optional(),
    sortBy: z.enum(['url', 'description', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get video by ID schema
export const getVideoByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete video schema
export const deleteVideoSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Bulk delete videos schema
export const bulkDeleteVideosSchema = z.object({
  body: z.object({
    videoIds: z.array(objectIdSchema).min(1, 'At least one video ID is required')
  })
})

/**
 * Article Resource Validation Schemas
 */

// Create article schema
export const createArticleSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    description: z.string().min(1, 'Description is required').max(5000, 'Description too long').trim()
  })
})

// Update article schema
export const updateArticleSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
      description: z.string().min(1, 'Description is required').max(5000, 'Description too long').trim().optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get articles query schema
export const getArticlesQuerySchema = z.object({
  query: paginationSchema.extend({
    search: z.string().optional(),
    sortBy: z.enum(['title', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get article by ID schema
export const getArticleByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete article schema
export const deleteArticleSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

/**
 * Quiz Resource Validation Schemas
 */

// Create quiz schema
export const createQuizSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim(),
    totalAttemptsAllowed: z
      .number()
      .int()
      .min(1, 'Total attempts must be at least 1')
      .max(10, 'Total attempts cannot exceed 10'),
    passingScorePercentage: z
      .number()
      .int()
      .min(1, 'Passing score must be at least 1%')
      .max(100, 'Passing score cannot exceed 100%'),
    description: z.string().trim().optional()
  })
})

// Update quiz schema
export const updateQuizSchema = z.object({
  params: z.object({
    id: objectIdSchema
  }),
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(200, 'Title too long').trim().optional(),
      totalAttemptsAllowed: z
        .number()
        .int()
        .min(1, 'Total attempts must be at least 1')
        .max(10, 'Total attempts cannot exceed 10')
        .optional(),
      passingScorePercentage: z
        .number()
        .int()
        .min(1, 'Passing score must be at least 1%')
        .max(100, 'Passing score cannot exceed 100%')
        .optional(),
      description: z.string().trim().optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided for update')
})

// Get quizzes query schema
export const getQuizzesQuerySchema = z.object({
  query: paginationSchema.extend({
    search: z.string().optional(),
    sortBy: z.enum(['title', 'duration', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc')
  })
})

// Get quiz by ID schema
export const getQuizByIdSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Delete quiz schema
export const deleteQuizSchema = z.object({
  params: z.object({
    id: objectIdSchema
  })
})

// Type exports for the schemas
export type CreateLessonInput = z.infer<typeof createLessonSchema>['body']
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>['body']
export type GetLessonsQuery = z.infer<typeof getLessonsQuerySchema>['query']
export type GetChapterLessonsQuery = z.infer<typeof getChapterLessonsSchema>['query']
export type GetCourseLessonsQuery = z.infer<typeof getCourseLessonsSchema>['query']
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>['body']
export type CreateCodingExerciseInput = z.infer<typeof createCodingExerciseSchema>['body']
export type RunCodeInput = z.infer<typeof runCodeSchema>['body']
export type SubmitCodeInput = z.infer<typeof submitCodeSchema>['body']

// Video type exports
export type CreateVideoInput = z.infer<typeof createVideoSchema>['body']
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>['body']
export type GetVideosQuery = z.infer<typeof getVideosQuerySchema>['query']

// Article type exports
export type CreateArticleInput = z.infer<typeof createArticleSchema>['body']
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>['body']
export type GetArticlesQuery = z.infer<typeof getArticlesQuerySchema>['query']

// Quiz type exports
export type CreateQuizInput = z.infer<typeof createQuizSchema>['body']
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>['body']
export type GetQuizzesQuery = z.infer<typeof getQuizzesQuerySchema>['query']
