import { Request, Response } from 'express'
import { SubmissionService } from '../services/submission.service'
import { AppError } from '../utils/errors'
import { sendSuccess } from '../utils/success'
import type { RunCodeInput, SubmitCodeInput } from '../schemas/lesson.schema'

/**
 * Submission Controller
 */
export class SubmissionController {
  /**
   * List coding runtimes for authoring forms
   */
  static async getRuntimes(_req: Request, res: Response): Promise<void> {
    const runtimes = await SubmissionService.listAvailableRuntimes()
    sendSuccess.ok(res, 'Coding runtimes retrieved successfully', runtimes)
  }

  /**
   * Run code with custom input (stateless)
   */
  static async run(req: Request, res: Response): Promise<void> {
    const { id } = req.params
    const payload: RunCodeInput = req.body

    const { result, constraints } = await SubmissionService.runCode(id as string, payload)
    const responsePayload = SubmissionService.toRunResponsePayload(result, constraints)

    sendSuccess.ok(res, 'Code executed successfully', responsePayload)
  }

  /**
   * Submit code for grading (stateful)
   */
  static async submit(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { id } = req.params
    const payload: SubmitCodeInput = req.body

    const result = await SubmissionService.submitCode(id as string, userId, payload)

    sendSuccess.created(res, 'Code submitted successfully', result.summary)
  }
}
