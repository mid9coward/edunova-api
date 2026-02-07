"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionController = void 0;
const submission_service_1 = require("../services/submission.service");
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
/**
 * Submission Controller
 */
class SubmissionController {
    /**
     * List coding runtimes for authoring forms
     */
    static async getRuntimes(_req, res) {
        const runtimes = await submission_service_1.SubmissionService.listAvailableRuntimes();
        success_1.sendSuccess.ok(res, 'Coding runtimes retrieved successfully', runtimes);
    }
    /**
     * Run code with custom input (stateless)
     */
    static async run(req, res) {
        const { id } = req.params;
        const payload = req.body;
        const { result, constraints } = await submission_service_1.SubmissionService.runCode(id, payload);
        const responsePayload = submission_service_1.SubmissionService.toRunResponsePayload(result, constraints);
        success_1.sendSuccess.ok(res, 'Code executed successfully', responsePayload);
    }
    /**
     * Submit code for grading (stateful)
     */
    static async submit(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { id } = req.params;
        const payload = req.body;
        const result = await submission_service_1.SubmissionService.submitCode(id, userId, payload);
        success_1.sendSuccess.created(res, 'Code submitted successfully', result.summary);
    }
}
exports.SubmissionController = SubmissionController;
