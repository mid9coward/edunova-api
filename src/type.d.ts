import { Permission } from './constants/permissions'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        roles?: string[]
      }
      userPermissions?: Permission[]
      userRoles?: string[]
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime?: Date
      }
    }
  }
}
