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
    static sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    static getRetryAttempts() {
        const parsed = Number.parseInt(process.env.PISTON_RETRY_ATTEMPTS || '3', 10);
        if (Number.isNaN(parsed))
            return 3;
        return Math.max(1, parsed);
    }
    static getSubmitDelayMs() {
        const parsed = Number.parseInt(process.env.PISTON_SUBMIT_DELAY_MS || '250', 10);
        if (Number.isNaN(parsed))
            return 250;
        return Math.max(0, parsed);
    }
    static getRetryAfterMs(error) {
        const rawRetryAfter = error.response?.headers?.['retry-after'];
        if (!rawRetryAfter)
            return null;
        const normalized = Array.isArray(rawRetryAfter) ? rawRetryAfter[0] : rawRetryAfter;
        const asNumber = Number.parseFloat(normalized);
        if (!Number.isNaN(asNumber)) {
            return Math.max(0, Math.ceil(asNumber * 1000));
        }
        const asDate = Date.parse(normalized);
        if (Number.isNaN(asDate))
            return null;
        return Math.max(0, asDate - Date.now());
    }
    static isRetryablePistonError(error) {
        if (!axios_1.default.isAxiosError(error))
            return false;
        const axiosError = error;
        const status = axiosError.response?.status;
        if (status && [429, 500, 502, 503, 504].includes(status)) {
            return true;
        }
        const code = axiosError.code;
        return (code === 'ECONNABORTED' ||
            code === 'ETIMEDOUT' ||
            code === 'ECONNRESET' ||
            code === 'ENOTFOUND' ||
            code === 'EAI_AGAIN');
    }
    static toExternalErrorMessage(error) {
        if (axios_1.default.isAxiosError(error)) {
            const status = error.response?.status;
            const responseData = error.response?.data;
            const responseMessage = responseData?.message || responseData?.error;
            if (status) {
                return responseMessage ? `Piston error ${status}: ${responseMessage}` : `Piston error ${status}`;
            }
        }
        return error instanceof Error ? error.message : 'Piston request failed';
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
    static async listAvailableRuntimes() {
        const runtimes = await this.getRuntimes();
        const runtimeMap = new Map();
        for (const runtime of runtimes) {
            const normalizedLanguage = this.normalizeLanguage(runtime.language);
            if (!normalizedLanguage)
                continue;
            const existing = runtimeMap.get(normalizedLanguage) ?? {
                language: normalizedLanguage,
                versions: new Set(),
                aliases: new Set()
            };
            const normalizedVersion = runtime.version?.trim();
            if (normalizedVersion) {
                existing.versions.add(normalizedVersion);
            }
            runtime.aliases?.forEach((alias) => {
                const normalizedAlias = this.normalizeLanguage(alias);
                if (normalizedAlias) {
                    existing.aliases.add(normalizedAlias);
                }
            });
            runtimeMap.set(normalizedLanguage, existing);
        }
        const collator = new Intl.Collator(undefined, {
            numeric: true,
            sensitivity: 'base'
        });
        return Array.from(runtimeMap.values())
            .map((entry) => ({
            language: entry.language,
            versions: Array.from(entry.versions).sort((a, b) => collator.compare(b, a)),
            aliases: Array.from(entry.aliases).sort((a, b) => collator.compare(a, b))
        }))
            .filter((entry) => entry.versions.length > 0)
            .sort((a, b) => collator.compare(a.language, b.language));
    }
    static normalizeOutput(value) {
        return (value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    }
    static normalizeLanguage(value) {
        return value.trim().toLowerCase();
    }
    static getCodingResultMode() {
        const mode = (process.env.CODING_RESULT_MODE || 'leetcode').trim().toLowerCase();
        return mode === 'strict' ? 'strict' : 'leetcode';
    }
    static isStrictMode() {
        return this.getCodingResultMode() === 'strict';
    }
    static getExecutionProfile() {
        const mode = (process.env.CODING_EXECUTION_PROFILE || 'learning').trim().toLowerCase();
        return mode === 'judge' ? 'judge' : 'learning';
    }
    static isJudgeProfile() {
        return this.getExecutionProfile() === 'judge';
    }
    static getManagedRuntimeMemoryMultiplier() {
        const parsed = Number.parseFloat(process.env.CODING_ENGINE_MANAGED_MEMORY_MULTIPLIER || '2');
        if (Number.isNaN(parsed))
            return 2;
        return Math.max(1, parsed);
    }
    static getManagedRuntimeMemoryMinMb() {
        const parsed = Number.parseInt(process.env.CODING_ENGINE_MANAGED_MEMORY_MIN_MB || '256', 10);
        if (Number.isNaN(parsed))
            return 256;
        return Math.max(64, parsed);
    }
    static getManagedRuntimeMemoryMaxMb() {
        const raw = process.env.CODING_ENGINE_MANAGED_MEMORY_MAX_MB;
        if (!raw)
            return 1024;
        const parsed = Number.parseInt(raw, 10);
        if (Number.isNaN(parsed) || parsed <= 0)
            return null;
        return Math.max(64, parsed);
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
        try {
            const runtimes = await this.getRuntimes();
            if (!this.isRuntimeSupported(language, version, runtimes)) {
                throw new errors_1.ValidationError('Runtime is not supported', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
            }
        }
        catch (error) {
            // If runtime lookup fails due external transient issues, defer validation to execute call.
            if (error instanceof errors_1.ValidationError) {
                throw error;
            }
        }
    }
    static async execute(payload) {
        const client = this.buildPistonClient();
        const maxAttempts = this.getRetryAttempts();
        let lastError = null;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await client.post('/execute', payload);
                return response.data;
            }
            catch (error) {
                lastError = error;
                const isRetryable = this.isRetryablePistonError(error);
                if (!isRetryable || attempt === maxAttempts) {
                    break;
                }
                let delayMs = 200 * attempt;
                if (axios_1.default.isAxiosError(error)) {
                    const retryAfterMs = this.getRetryAfterMs(error);
                    if (retryAfterMs !== null) {
                        delayMs = retryAfterMs;
                    }
                }
                await this.sleep(delayMs);
            }
        }
        throw new errors_1.ExternalServiceError(this.toExternalErrorMessage(lastError));
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
    static parseMemoryKb(run) {
        if (!run)
            return null;
        const memoryBytesCandidate = run.memory_bytes;
        if (typeof memoryBytesCandidate === 'number' && Number.isFinite(memoryBytesCandidate)) {
            return Math.max(0, Math.round(memoryBytesCandidate / 1024));
        }
        if (typeof memoryBytesCandidate === 'string') {
            const parsed = Number.parseFloat(memoryBytesCandidate);
            if (!Number.isNaN(parsed)) {
                return Math.max(0, Math.round(parsed / 1024));
            }
        }
        const genericMemoryCandidate = run.memory;
        if (typeof genericMemoryCandidate === 'number' && Number.isFinite(genericMemoryCandidate)) {
            if (genericMemoryCandidate > 1024 * 1024) {
                return Math.max(0, Math.round(genericMemoryCandidate / 1024));
            }
            return Math.max(0, Math.round(genericMemoryCandidate));
        }
        if (typeof genericMemoryCandidate === 'string') {
            const parsed = Number.parseFloat(genericMemoryCandidate);
            if (!Number.isNaN(parsed)) {
                if (parsed > 1024 * 1024) {
                    return Math.max(0, Math.round(parsed / 1024));
                }
                return Math.max(0, Math.round(parsed));
            }
        }
        return null;
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
    static resolveExecutionConstraints(exercise) {
        const timeLimitSecondsRaw = exercise.constraints?.timeLimit;
        const memoryLimitMbRaw = exercise.constraints?.memoryLimit;
        const timeLimitSeconds = typeof timeLimitSecondsRaw === 'number' && Number.isFinite(timeLimitSecondsRaw) && timeLimitSecondsRaw > 0
            ? timeLimitSecondsRaw
            : 2;
        const memoryLimitMb = typeof memoryLimitMbRaw === 'number' && Number.isFinite(memoryLimitMbRaw) && memoryLimitMbRaw > 0
            ? memoryLimitMbRaw
            : 128;
        const timeLimitMs = Math.max(1, Math.round(timeLimitSeconds * 1000));
        const memoryLimitKb = Math.max(1, Math.round(memoryLimitMb * 1024));
        const memoryLimitBytes = memoryLimitKb * 1024;
        return {
            timeLimitMs,
            memoryLimitKb,
            memoryLimitBytes
        };
    }
    static buildExecutionPayload(payload, constraints) {
        const compileTimeoutMs = Math.max(constraints.timeLimitMs * 3, 10000);
        const engineMemoryLimit = this.resolveEngineMemoryLimitBytes(payload.language, constraints.memoryLimitBytes);
        return {
            language: payload.language,
            version: payload.version,
            files: [
                {
                    name: 'main',
                    content: payload.sourceCode
                }
            ],
            stdin: payload.stdin ?? '',
            run_timeout: constraints.timeLimitMs,
            compile_timeout: compileTimeoutMs,
            run_memory_limit: engineMemoryLimit,
            compile_memory_limit: engineMemoryLimit
        };
    }
    static isManagedRuntimeLanguage(language) {
        const normalized = this.normalizeLanguage(language);
        return (normalized === 'java' ||
            normalized === 'kotlin' ||
            normalized === 'scala' ||
            normalized === 'csharp' ||
            normalized === 'csharp.net' ||
            normalized === 'fsharp.net' ||
            normalized === 'fsi' ||
            normalized === 'basic.net');
    }
    static resolveEngineMemoryLimitBytes(language, configuredLimitBytes) {
        if (!this.isManagedRuntimeLanguage(language)) {
            return configuredLimitBytes;
        }
        const minBytes = this.getManagedRuntimeMemoryMinMb() * 1024 * 1024;
        const maxMb = this.getManagedRuntimeMemoryMaxMb();
        const maxBytes = maxMb ? maxMb * 1024 * 1024 : null;
        if (this.getExecutionProfile() === 'learning') {
            // Public Piston workers often fail JVM/.NET bootstrap when a positive
            // cgroup memory limit is enforced; keep learning mode stable by using
            // platform default memory policy.
            return -1;
        }
        const multiplier = this.getManagedRuntimeMemoryMultiplier();
        const scaledBytes = Math.round(configuredLimitBytes * multiplier);
        let engineLimitBytes = Math.max(configuredLimitBytes, scaledBytes, minBytes);
        if (maxBytes !== null) {
            engineLimitBytes = Math.min(engineLimitBytes, maxBytes);
        }
        return engineLimitBytes;
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
        const constraints = this.resolveExecutionConstraints(exercise);
        const result = await this.execute(this.buildExecutionPayload(payload, constraints));
        return { result, constraints };
    }
    static toRunResponsePayload(result, constraints) {
        if (this.isStrictMode()) {
            return { status: 'OK' };
        }
        const hasCompileError = this.isCompileError(result);
        const runtimeMs = Math.round(this.parseExecutionTime(result.run) * 1000);
        const memoryKb = this.parseMemoryKb(result.run);
        const exitCode = result.run?.code ?? null;
        const hasTimeLimitExceeded = this.isJudgeProfile() && runtimeMs > constraints.timeLimitMs;
        let status = 'SUCCESS';
        if (hasCompileError)
            status = 'COMPILE_ERROR';
        else if (hasTimeLimitExceeded)
            status = 'TIME_LIMIT_EXCEEDED';
        else if (typeof exitCode === 'number' && exitCode !== 0)
            status = 'RUNTIME_ERROR';
        return {
            status,
            language: result.language || '',
            version: result.version || '',
            runtimeMs,
            timeLimitMs: constraints.timeLimitMs,
            memoryKb,
            memoryLimitKb: constraints.memoryLimitKb,
            stdout: this.normalizeOutput(this.getStdout(result)),
            stderr: this.normalizeOutput(this.getStderr(result)),
            exitCode: typeof exitCode === 'number' ? exitCode : null,
            signal: result.run?.signal ?? null,
            ...(hasCompileError && {
                compileOutput: this.getCompileError(result) || 'Compilation failed'
            })
        };
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
        const constraints = this.resolveExecutionConstraints(exercise);
        const results = [];
        const submitDelayMs = this.getSubmitDelayMs();
        for (let index = 0; index < testCases.length; index++) {
            if (index > 0 && submitDelayMs > 0) {
                await this.sleep(submitDelayMs);
            }
            const testCase = testCases[index];
            const result = await this.execute(this.buildExecutionPayload({
                sourceCode: payload.sourceCode,
                language: payload.language,
                version: payload.version,
                stdin: testCase.input ?? ''
            }, constraints));
            results.push(result);
            if (this.isCompileError(result)) {
                break;
            }
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
        const memoryUsagesKb = results
            .map((result) => this.parseMemoryKb(result.run))
            .filter((value) => typeof value === 'number' && Number.isFinite(value));
        const totalExecutionTime = executionTimes.reduce((sum, value) => sum + value, 0);
        const maxExecutionTime = executionTimes.length > 0 ? Math.max(...executionTimes) : 0;
        const maxMemoryKb = memoryUsagesKb.length > 0 ? Math.max(...memoryUsagesKb) : null;
        const executionTime = totalExecutionTime;
        const runtimeMs = Math.round(maxExecutionTime * 1000);
        const hasTimeLimitExceeded = this.isJudgeProfile() && executionTimes.some((value) => Math.round(value * 1000) > constraints.timeLimitMs);
        if (!hasCompileError && hasTimeLimitExceeded) {
            status = enums_1.CodeSubmissionStatus.TIME_LIMIT_EXCEEDED;
        }
        const failedTest = status === enums_1.CodeSubmissionStatus.WRONG_ANSWER
            ? perTestResults.find((entry) => !entry.passed && (!this.isStrictMode() || !entry.isHidden))
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
                timeLimitMs: constraints.timeLimitMs,
                memoryKb: maxMemoryKb,
                memoryLimitKb: constraints.memoryLimitKb,
                ...(compileError && { compileError }),
                ...(failedTest && {
                    failedTest: {
                        index: failedTest.index,
                        input: failedTest.input,
                        expected: failedTest.expected,
                        actual: failedTest.actual,
                        ...(this.isStrictMode() ? {} : { isHidden: failedTest.isHidden })
                    }
                }),
                ...(!this.isStrictMode() && {
                    stdout: stdout || '',
                    stderr: stderr || '',
                    resultMode: this.getCodingResultMode()
                })
            }
        };
    }
}
exports.SubmissionService = SubmissionService;
