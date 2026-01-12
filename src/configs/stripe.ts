import Stripe from 'stripe'
import { AppError } from '../utils/errors'
import dotenv from 'dotenv'
dotenv.config()
/**
 * Stripe Configuration
 */

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new AppError('STRIPE_SECRET_KEY environment variable is required', 500)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil', // Latest available API version
  typescript: true
})

// Webhook endpoint secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Currency configuration
export const STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || 'usd'

export default stripe
