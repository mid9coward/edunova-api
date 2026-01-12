import { z } from 'zod'
import { emailSchema, passwordSchema, usernameSchema } from './common.schema'

// Auth request schemas
export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required')
  })
})

export const updateProfileSchema = z.object({
  body: z.object({
    username: usernameSchema.optional(),
    avatar: z.string().optional()
  })
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema
  })
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema
  })
})

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordSchema
  })
})

export const googleRegisterSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required')
  })
})

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, 'Google ID token is required')
  })
})

export const facebookRegisterSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, 'Facebook access token is required')
  })
})

export const facebookLoginSchema = z.object({
  body: z.object({
    accessToken: z.string().min(1, 'Facebook access token is required')
  })
})

// Auth response types (inferred from schemas)
export type RegisterRequest = z.infer<typeof registerSchema>
export type LoginRequest = z.infer<typeof loginSchema>
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>
export type GoogleRegisterRequest = z.infer<typeof googleRegisterSchema>
export type GoogleLoginRequest = z.infer<typeof googleLoginSchema>
export type FacebookRegisterRequest = z.infer<typeof facebookRegisterSchema>
export type FacebookLoginRequest = z.infer<typeof facebookLoginSchema>
