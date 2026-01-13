import bodyParser from 'body-parser'
import cors from 'cors'
import express, { Request, Response } from 'express' // Thêm type Request, Response
import helmet from 'helmet'

import compression from 'compression'

import dotenv from 'dotenv'
import { DatabaseConnection } from './db'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'
import { defaultRateLimit } from './middlewares/rate-limit.middleware'
import apiRoutes from './routers'

dotenv.config()
const app = express()

app.use(helmet())
app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

// --- GLOBAL ROUTES

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  })
})

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to EduNova API',
    version: '1.0.0',
    health_check: '/health',
    api_endpoint: '/api/v1'
  })
})

// --- API ROUTES

// Apply default rate limiting to all API routes
app.use('/api/v1', defaultRateLimit)

// Main API routes
app.use('/api/v1', apiRoutes)

// 404 handler - must be after all routes
app.use(notFoundHandler)

// Error handler - must be last middleware
app.use(errorHandler)

const startServer = async () => {
  try {
    // Connect to MongoDB
    await DatabaseConnection.connect()

    // Start the server
    const port = process.env.PORT || 8888
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...')
  await DatabaseConnection.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  await DatabaseConnection.disconnect()
  process.exit(0)
})

startServer()
