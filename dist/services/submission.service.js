"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionService = void 0;
const axios_1 = __importDefault(require("axios"));
const lesson_1 = require("../models/lesson");
const submission_1 = require("../models/submission");
const track_1 = require("../models/track");
const enums_1 = require("../enums");
const errors_1 = require("../utils/errors");
const course_completion_service_1 = require("./course-completion.service");
class SubmissionService {
    static runtimeCache = {
        runtimes: [],
        expiresAt: 0
    };
    static buildPistonClient() {
        const baseURL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';
        const timeout = Number.parseInt(process.env.PISTON_TIMEOUT_MS || '30000', 10);
        return axios_1.default.create({
            baseURL,
            headers: { 'Content-Type': 'application/json' },
            timeout: Number.isNaN(timeout) ? 30000 : timeout
        });
    }
    static async getRuntimes() {
        const now = Date.now();
        if (this.runtimeCache.expiresAt > now && this.runtimeCache.runtimes.length > 0) {
            return this.runtimeCache.runtimes;
        }
        try {
            const client = this.buildPistonClient();
            const response = await client.get('/runtimes');
            const runtimes = Array.isArray(response.data) ? response.data : [];
            this.runtimeCache = {
                runtimes,
                expiresAt: now + 10 * 60 * 1000 // 10 minutes
            };
            return runtimes;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch Piston runtimes';
            throw new errors_1.ExternalServiceError(message);
        }
    }
    static normalizeOutput(value) {
        return (value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    }
    static normalizeLanguage(value) {
        return value.trim().toLowerCase();
    }
    static isRuntimeSupported(language, version, runtimes) {
        const normalizedLanguage = this.normalizeLanguage(language);
        const matchesLanguage = (runtime) => {
            if (this.normalizeLanguage(runtime.language) === normalizedLanguage)
                return true;
            return runtime.aliases?.some((alias) => this.normalizeLanguage(alias) === normalizedLanguage) ?? false;
        };
        if (version === 'latest') {
            return runtimes.some(matchesLanguage);
        }
        return runtimes.some((runtime) => matchesLanguage(runtime) && runtime.version === version);
    }
    static async ensureRuntimeSupported(language, version) {
        const runtimes = await this.getRuntimes();
        if (!this.isRuntimeSupported(language, version, runtimes)) {
            throw new errors_1.ValidationError('Runtime is not supported', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
    }
    static async execute(payload) {
        try {
            const client = this.buildPistonClient();
            const response = await client.post('/execute', payload);
            return response.data;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Piston execute failed';
            throw new errors_1.ExternalServiceError(message);
        }
    }
    static parseExecutionTime(run) {
        if (!run)
            return 0;
        const candidates = [run.time, run.wall_time, run.cpu_time];
        for (const candidate of candidates) {
            if (typeof candidate === 'number')
                return candidate;
            if (typeof candidate === 'string') {
                const parsed = Number.parseFloat(candidate);
                if (!Number.isNaN(parsed))
                    return parsed;
            }
        }
        return 0;
    }
    static isCompileError(result) {
        const compile = result.compile;
        if (!compile)
            return false;
        if (compile.code !== undefined && compile.code !== null && compile.code !== 0)
            return true;
        const stderr = this.normalizeOutput(compile.stderr);
        const output = this.normalizeOutput(compile.output);
        return Boolean(stderr || output);
    }
    static getStdout(result) {
        const run = result.run;
        if (!run)
            return '';
        return (run.stdout ?? run.output ?? '');
    }
    static getStderr(result) {
        const compile = result.compile;
        const run = result.run;
        const compileOutput = this.normalizeOutput(compile?.stderr ?? compile?.output);
        const runOutput = this.normalizeOutput(run?.stderr);
        return [compileOutput, runOutput].filter(Boolean).join('\n');
    }
    static getCompileError(result) {
        const compile = result.compile;
        return this.normalizeOutput(compile?.stderr ?? compile?.output);
    }
    static async getCodingExerciseByLesson(lessonId) {
        const lesson = await lesson_1.Lesson.findById(lessonId);
        if (!lesson)
            throw new errors_1.NotFoundError('Lesson not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        if (lesson.contentType !== 'coding')
            throw new errors_1.ValidationError('Lesson is not a coding exercise', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        const exercise = await lesson_1.CodingExercise.findById(lesson.resourceId);
        if (!exercise)
            throw new errors_1.NotFoundError('Coding exercise not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        return { lesson, exercise };
    }
    /**
     * Run code against custom input (stateless)
     */
    static async runCode(lessonId, payload) {
        const { exercise } = await this.getCodingExerciseByLesson(lessonId);
        if (this.normalizeLanguage(exercise.language) !== this.normalizeLanguage(payload.language) ||
            exercise.version !== payload.version) {
            throw new errors_1.ValidationError('Language does not match this exercise', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        await this.ensureRuntimeSupported(payload.language, payload.version);
        return await this.execute({
            language: payload.language,
            version: payload.version,
            files: [
                {
                    name: 'main',
                    content: payload.sourceCode
                }
            ],
            stdin: payload.stdin ?? ''
        });
    }
    /**
     * Submit code for grading (stateful)
     */
    static async submitCode(lessonId, userId, payload) {
        const { lesson, exercise } = await this.getCodingExerciseByLesson(lessonId);
        if (this.normalizeLanguage(exercise.language) !== this.normalizeLanguage(payload.language) ||
            exercise.version !== payload.version) {
            throw new errors_1.ValidationError('Language does not match this exercise', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        const testCases = exercise.testCases ?? [];
        if (testCases.length === 0) {
            throw new errors_1.ValidationError('No test cases configured', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        await this.ensureRuntimeSupported(payload.language, payload.version);
        const results = [];
        for (const testCase of testCases) {
            const result = await this.execute({
                language: payload.language,
                version: payload.version,
                files: [
                    {
                        name: 'main',
                        content: payload.sourceCode
                    }
                ],
                stdin: testCase.input ?? ''
            });
            results.push(result);
        }
        const perTestResults = results.map((result, index) => {
            const actual = this.normalizeOutput(this.getStdout(result));
            const expected = this.normalizeOutput(testCases[index].expectedOutput);
            return {
                index,
                input: testCases[index].input ?? '',
                expected,
                actual,
                isHidden: testCases[index].isHidden === true,
                passed: actual === expected
            };
        });
        const passedTestCases = perTestResults.filter((entry) => entry.passed).length;
        const totalTestCases = testCases.length;
        const hasCompileError = results.some((result) => this.isCompileError(result));
        let status = enums_1.CodeSubmissionStatus.WRONG_ANSWER;
        if (hasCompileError)
            status = enums_1.CodeSubmissionStatus.COMPILE_ERROR;
        else if (passedTestCases === totalTestCases)
            status = enums_1.CodeSubmissionStatus.ACCEPTED;
        const stdout = results
            .map((result) => this.getStdout(result))
            .join('\n')
            .trim();
        const stderr = results
            .map((result) => this.getStderr(result))
            .filter(Boolean)
            .join('\n')
            .trim();
        const executionTimes = results.map((result) => this.parseExecutionTime(result.run));
        const totalExecutionTime = executionTimes.reduce((sum, value) => sum + value, 0);
        const maxExecutionTime = executionTimes.length > 0 ? Math.max(...executionTimes) : 0;
        const executionTime = totalExecutionTime;
        const runtimeMs = Math.round(maxExecutionTime * 1000);
        const failedVisibleTest = status === enums_1.CodeSubmissionStatus.WRONG_ANSWER
            ? perTestResults.find((entry) => !entry.passed && !entry.isHidden)
            : undefined;
        const compileError = status === enums_1.CodeSubmissionStatus.COMPILE_ERROR
            ? this.getCompileError(results.find((result) => this.isCompileError(result)) ?? {}) || 'Compilation failed'
            : undefined;
        const submission = await submission_1.CodeSubmission.create({
            userId,
            lessonId: lesson._id,
            exerciseId: exercise._id,
            sourceCode: payload.sourceCode,
            language: payload.language,
            version: payload.version,
            status,
            stdout: stdout || undefined,
            stderr: stderr || undefined,
            executionTime,
            passedTestCases,
            totalTestCases
        });
        if (status === enums_1.CodeSubmissionStatus.ACCEPTED) {
            await track_1.Track.updateOne({ userId, courseId: lesson.courseId, lessonId: lesson._id }, { $setOnInsert: { userId, courseId: lesson.courseId, lessonId: lesson._id } }, { upsert: true });
            await course_completion_service_1.CourseCompletionService.syncCompletionForUserCourse(userId, lesson.courseId.toString());
        }
        return {
            submission,
            summary: {
                status,
                passedTestCases,
                totalTestCases,
                runtimeMs,
                memoryKb: null,
                ...(compileError && { compileError }),
                ...(failedVisibleTest && {
                    failedTest: {
                        index: failedVisibleTest.index,
                        input: failedVisibleTest.input,
                        expected: failedVisibleTest.expected,
                        actual: failedVisibleTest.actual
                    }
                })
            }
        };
    }
}
exports.SubmissionService = SubmissionService;
