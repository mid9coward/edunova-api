import jwt, { JwtPayload } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

export const generateToken = (userId: string): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key'
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']

  return jwt.sign({ userId }, secret, { expiresIn })
}

export const generateVerificationToken = (userId: string): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key'
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']

  return jwt.sign({ userId, type: 'email_verification' }, secret, { expiresIn })
}

export const generatePasswordResetToken = (userId: string): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key'
  const expiresIn = '1h' // Password reset token expires in 1 hour

  return jwt.sign({ userId, type: 'password_reset' }, secret, { expiresIn })
}

export const verifyToken = (token: string): string | JwtPayload => {
  const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key'
  return jwt.verify(token, secret)
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}
