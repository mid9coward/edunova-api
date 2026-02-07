import axios, { AxiosError, AxiosInstance } from 'axios'
import { Lesson, CodingExercise } from '../models/lesson'
import { CodeSubmission } from '../models/submission'
import { Track } from '../models/track'
import { CodeSubmissionStatus } from '../enums'
import { ErrorCodes, ExternalServiceError, NotFoundError, ValidationError } from '../utils/errors'
import { CourseCompletionService } from './course-completion.service'

type PistonRuntime = {
  language: string
  version: string
  aliases?: string[]
}

type PistonExecuteRequest = {
  language: string
  version: string
  files: Array<{
    name: string
    content: string
  }>
  stdin?: string
  compile_timeout?: number
  run_timeout?: number
  compile_memory_limit?: number
  run_memory_limit?: number
}

type PistonRunResult = {
  stdout?: string | null
  stderr?: string | null
  output?: string | null
  code?: number | null
  signal?: string | null
  time?: number | string | null
  [key: string]: unknown
}

type PistonExecuteResponse = {
  language?: string
  version?: string
  run?: PistonRunResult
  compile?: PistonRunResult
}

type CodingResultMode = 'strict' | 'leetcode'
type CodingExecutionProfile = 'learning' | 'judge'

type ExecutionConstraints = {
  timeLimitMs: number
  memoryLimitKb: number
  memoryLimitBytes: number
}

export type CodingRuntimeOption = {
  language: string
  versions: string[]
  aliases: string[]
}

export type RunCodeResponsePayload =
  | {
      status: 'OK'
    }
  | {
      status: 'SUCCESS' | 'RUNTIME_ERROR' | 'COMPILE_ERROR' | 'TIME_LIMIT_EXCEEDED'
      language: string
      version: string
      runtimeMs: number
      timeLimitMs: number
      memoryKb: number | null
      memoryLimitKb: number
      stdout: string
      stderr: string
      exitCode: number | null
      signal: string | null
      compileOutput?: string
    }

export class SubmissionService {
  private static runtimeCache: { runtimes: PistonRuntime[]; expiresAt: number } = {
    runtimes: [],
    expiresAt: 0
  }

  private static buildPistonClient(): AxiosInstance {
    const baseURL = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston'
    const timeout = Number.parseInt(process.env.PISTON_TIMEOUT_MS || '30000', 10)

    return axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json' },
      timeout: Number.isNaN(timeout) ? 30000 : timeout
    })
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private static getRetryAttempts(): number {
    const parsed = Number.parseInt(process.env.PISTON_RETRY_ATTEMPTS || '3', 10)
    if (Number.isNaN(parsed)) return 3
    return Math.max(1, parsed)
  }

  private static getSubmitDelayMs(): number {
    const parsed = Number.parseInt(process.env.PISTON_SUBMIT_DELAY_MS || '250', 10)
    if (Number.isNaN(parsed)) return 250
    return Math.max(0, parsed)
  }

  private static getRetryAfterMs(error: AxiosError): number | null {
    const rawRetryAfter = error.response?.headers?.['retry-after']
    if (!rawRetryAfter) return null

    const normalized = Array.isArray(rawRetryAfter) ? rawRetryAfter[0] : rawRetryAfter
    const asNumber = Number.parseFloat(normalized)
    if (!Number.isNaN(asNumber)) {
      return Math.max(0, Math.ceil(asNumber * 1000))
    }

    const asDate = Date.parse(normalized)
    if (Number.isNaN(asDate)) return null
    return Math.max(0, asDate - Date.now())
  }

  private static isRetryablePistonError(error: unknown): boolean {
    if (!axios.isAxiosError(error)) return false

    const axiosError = error as AxiosError
    const status = axiosError.response?.status
    if (status && [429, 500, 502, 503, 504].includes(status)) {
      return true
    }

    const code = axiosError.code
    return (
      code === 'ECONNABORTED' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNRESET' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN'
    )
  }

  private static toExternalErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const responseData = error.response?.data as
        | {
            message?: string
            error?: string
          }
        | undefined
      const responseMessage = responseData?.message || responseData?.error
      if (status) {
        return responseMessage ? `Piston error ${status}: ${responseMessage}` : `Piston error ${status}`
      }
    }
    return error instanceof Error ? error.message : 'Piston request failed'
  }

  private static async getRuntimes(): Promise<PistonRuntime[]> {
    const now = Date.now()
    if (this.runtimeCache.expiresAt > now && this.runtimeCache.runtimes.length > 0) {
      return this.runtimeCache.runtimes
    }

    try {
      const client = this.buildPistonClient()
      const response = await client.get<PistonRuntime[]>('/runtimes')
      const runtimes = Array.isArray(response.data) ? response.data : []

      this.runtimeCache = {
        runtimes,
        expiresAt: now + 10 * 60 * 1000 // 10 minutes
      }

      return runtimes
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch Piston runtimes'
      throw new ExternalServiceError(message)
    }
  }

  static async listAvailableRuntimes(): Promise<CodingRuntimeOption[]> {
    const runtimes = await this.getRuntimes()
    const runtimeMap = new Map<
      string,
      {
        language: string
        versions: Set<string>
        aliases: Set<string>
      }
    >()

    for (const runtime of runtimes) {
      const normalizedLanguage = this.normalizeLanguage(runtime.language)
      if (!normalizedLanguage) continue

      const existing = runtimeMap.get(normalizedLanguage) ?? {
        language: normalizedLanguage,
        versions: new Set<string>(),
        aliases: new Set<string>()
      }

      const normalizedVersion = runtime.version?.trim()
      if (normalizedVersion) {
        existing.versions.add(normalizedVersion)
      }

      runtime.aliases?.forEach((alias) => {
        const normalizedAlias = this.normalizeLanguage(alias)
        if (normalizedAlias) {
          existing.aliases.add(normalizedAlias)
        }
      })

      runtimeMap.set(normalizedLanguage, existing)
    }

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base'
    })

    return Array.from(runtimeMap.values())
      .map((entry) => ({
        language: entry.language,
        versions: Array.from(entry.versions).sort((a, b) => collator.compare(b, a)),
        aliases: Array.from(entry.aliases).sort((a, b) => collator.compare(a, b))
      }))
      .filter((entry) => entry.versions.length > 0)
      .sort((a, b) => collator.compare(a.language, b.language))
  }

  private static normalizeOutput(value?: string | null): string {
    return (value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  }

  private static normalizeLanguage(value: string): string {
    return value.trim().toLowerCase()
  }

  private static getCodingResultMode(): CodingResultMode {
    const mode = (process.env.CODING_RESULT_MODE || 'leetcode').trim().toLowerCase()
    return mode === 'strict' ? 'strict' : 'leetcode'
  }

  private static isStrictMode(): boolean {
    return this.getCodingResultMode() === 'strict'
  }

  private static getExecutionProfile(): CodingExecutionProfile {
    const mode = (process.env.CODING_EXECUTION_PROFILE || 'learning').trim().toLowerCase()
    return mode === 'judge' ? 'judge' : 'learning'
  }

  private static isJudgeProfile(): boolean {
    return this.getExecutionProfile() === 'judge'
  }

  private static getManagedRuntimeMemoryMultiplier(): number {
    const parsed = Number.parseFloat(process.env.CODING_ENGINE_MANAGED_MEMORY_MULTIPLIER || '2')
    if (Number.isNaN(parsed)) return 2
    return Math.max(1, parsed)
  }

  private static getManagedRuntimeMemoryMinMb(): number {
    const parsed = Number.parseInt(process.env.CODING_ENGINE_MANAGED_MEMORY_MIN_MB || '256', 10)
    if (Number.isNaN(parsed)) return 256
    return Math.max(64, parsed)
  }

  private static getManagedRuntimeMemoryMaxMb(): number | null {
    const raw = process.env.CODING_ENGINE_MANAGED_MEMORY_MAX_MB
    if (!raw) return 1024
    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed) || parsed <= 0) return null
    return Math.max(64, parsed)
  }

  private static getManagedRuntimeLearningMemoryMb(): number {
    const parsed = Number.parseInt(process.env.CODING_ENGINE_MANAGED_MEMORY_LEARNING_MB || '768', 10)
    if (Number.isNaN(parsed)) return 768
    return Math.max(256, parsed)
  }

  private static isRuntimeSupported(language: string, version: string, runtimes: PistonRuntime[]): boolean {
    const normalizedLanguage = this.normalizeLanguage(language)

    const matchesLanguage = (runtime: PistonRuntime) => {
      if (this.normalizeLanguage(runtime.language) === normalizedLanguage) return true
      return runtime.aliases?.some((alias) => this.normalizeLanguage(alias) === normalizedLanguage) ?? false
    }

    if (version === 'latest') {
      return runtimes.some(matchesLanguage)
    }

    return runtimes.some((runtime) => matchesLanguage(runtime) && runtime.version === version)
  }

  private static async ensureRuntimeSupported(language: string, version: string): Promise<void> {
    try {
      const runtimes = await this.getRuntimes()
      if (!this.isRuntimeSupported(language, version, runtimes)) {
        throw new ValidationError('Runtime is not supported', ErrorCodes.INVALID_INPUT_FORMAT)
      }
    } catch (error) {
      // If runtime lookup fails due external transient issues, defer validation to execute call.
      if (error instanceof ValidationError) {
        throw error
      }
    }
  }

  private static async execute(payload: PistonExecuteRequest): Promise<PistonExecuteResponse> {
    const client = this.buildPistonClient()
    const maxAttempts = this.getRetryAttempts()
    let lastError: unknown = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await client.post<PistonExecuteResponse>('/execute', payload)
        return response.data
      } catch (error) {
        lastError = error
        const isRetryable = this.isRetryablePistonError(error)
        if (!isRetryable || attempt === maxAttempts) {
          break
        }

        let delayMs = 200 * attempt
        if (axios.isAxiosError(error)) {
          const retryAfterMs = this.getRetryAfterMs(error)
          if (retryAfterMs !== null) {
            delayMs = retryAfterMs
          }
        }

        await this.sleep(delayMs)
      }
    }

    throw new ExternalServiceError(this.toExternalErrorMessage(lastError))
  }

  private static parseExecutionTime(run?: PistonRunResult): number {
    if (!run) return 0
    const candidates = [run.time, (run as { wall_time?: unknown }).wall_time, (run as { cpu_time?: unknown }).cpu_time]
    for (const candidate of candidates) {
      if (typeof candidate === 'number') return candidate
      if (typeof candidate === 'string') {
        const parsed = Number.parseFloat(candidate)
        if (!Number.isNaN(parsed)) return parsed
      }
    }
    return 0
  }

  private static parseMemoryKb(run?: PistonRunResult): number | null {
    if (!run) return null

    const memoryBytesCandidate = (run as { memory_bytes?: unknown }).memory_bytes
    if (typeof memoryBytesCandidate === 'number' && Number.isFinite(memoryBytesCandidate)) {
      return Math.max(0, Math.round(memoryBytesCandidate / 1024))
    }
    if (typeof memoryBytesCandidate === 'string') {
      const parsed = Number.parseFloat(memoryBytesCandidate)
      if (!Number.isNaN(parsed)) {
        return Math.max(0, Math.round(parsed / 1024))
      }
    }

    const genericMemoryCandidate = (run as { memory?: unknown }).memory
    if (typeof genericMemoryCandidate === 'number' && Number.isFinite(genericMemoryCandidate)) {
      if (genericMemoryCandidate > 1024 * 1024) {
        return Math.max(0, Math.round(genericMemoryCandidate / 1024))
      }
      return Math.max(0, Math.round(genericMemoryCandidate))
    }
    if (typeof genericMemoryCandidate === 'string') {
      const parsed = Number.parseFloat(genericMemoryCandidate)
      if (!Number.isNaN(parsed)) {
        if (parsed > 1024 * 1024) {
          return Math.max(0, Math.round(parsed / 1024))
        }
        return Math.max(0, Math.round(parsed))
      }
    }

    return null
  }

  private static isCompileError(result: PistonExecuteResponse): boolean {
    const compile = result.compile
    if (!compile) return false
    if (compile.code !== undefined && compile.code !== null && compile.code !== 0) return true
    const stderr = this.normalizeOutput(compile.stderr)
    const output = this.normalizeOutput(compile.output)
    return Boolean(stderr || output)
  }

  private static getStdout(result: PistonExecuteResponse): string {
    const run = result.run
    if (!run) return ''
    return (run.stdout ?? run.output ?? '') as string
  }

  private static getStderr(result: PistonExecuteResponse): string {
    const compile = result.compile
    const run = result.run
    const compileOutput = this.normalizeOutput(compile?.stderr ?? compile?.output)
    const runOutput = this.normalizeOutput(run?.stderr)
    return [compileOutput, runOutput].filter(Boolean).join('\n')
  }

  private static getCompileError(result: PistonExecuteResponse): string {
    const compile = result.compile
    return this.normalizeOutput(compile?.stderr ?? compile?.output)
  }

  private static resolveExecutionConstraints(exercise: { constraints?: { timeLimit?: number; memoryLimit?: number } }): ExecutionConstraints {
    const timeLimitSecondsRaw = exercise.constraints?.timeLimit
    const memoryLimitMbRaw = exercise.constraints?.memoryLimit

    const timeLimitSeconds =
      typeof timeLimitSecondsRaw === 'number' && Number.isFinite(timeLimitSecondsRaw) && timeLimitSecondsRaw > 0
        ? timeLimitSecondsRaw
        : 2
    const memoryLimitMb =
      typeof memoryLimitMbRaw === 'number' && Number.isFinite(memoryLimitMbRaw) && memoryLimitMbRaw > 0
        ? memoryLimitMbRaw
        : 128

    const timeLimitMs = Math.max(1, Math.round(timeLimitSeconds * 1000))
    const memoryLimitKb = Math.max(1, Math.round(memoryLimitMb * 1024))
    const memoryLimitBytes = memoryLimitKb * 1024

    return {
      timeLimitMs,
      memoryLimitKb,
      memoryLimitBytes
    }
  }

  private static buildExecutionPayload(
    payload: { sourceCode: string; language: string; version: string; stdin?: string },
    constraints: ExecutionConstraints
  ): PistonExecuteRequest {
    const compileTimeoutMs = Math.max(constraints.timeLimitMs * 3, 10000)
    const engineMemoryLimit = this.resolveEngineMemoryLimitBytes(payload.language, constraints.memoryLimitBytes)

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
    }
  }

  private static isManagedRuntimeLanguage(language: string): boolean {
    const normalized = this.normalizeLanguage(language)
    return (
      normalized === 'java' ||
      normalized === 'kotlin' ||
      normalized === 'scala' ||
      normalized === 'csharp' ||
      normalized === 'csharp.net' ||
      normalized === 'fsharp.net' ||
      normalized === 'fsi' ||
      normalized === 'basic.net'
    )
  }

  private static resolveEngineMemoryLimitBytes(language: string, configuredLimitBytes: number): number {
    if (!this.isManagedRuntimeLanguage(language)) {
      return configuredLimitBytes
    }

    const minBytes = this.getManagedRuntimeMemoryMinMb() * 1024 * 1024
    const maxMb = this.getManagedRuntimeMemoryMaxMb()
    const maxBytes = maxMb ? maxMb * 1024 * 1024 : null

    if (this.getExecutionProfile() === 'learning') {
      // Learning mode: prioritize stability for JVM/.NET using explicit larger memory
      // instead of relying on platform defaults.
      const learningBytes = this.getManagedRuntimeLearningMemoryMb() * 1024 * 1024
      let engineLimitBytes = Math.max(learningBytes, minBytes)
      if (maxBytes !== null) {
        engineLimitBytes = Math.min(engineLimitBytes, maxBytes)
      }
      return engineLimitBytes
    }

    const multiplier = this.getManagedRuntimeMemoryMultiplier()

    const scaledBytes = Math.round(configuredLimitBytes * multiplier)
    let engineLimitBytes = Math.max(configuredLimitBytes, scaledBytes, minBytes)
    if (maxBytes !== null) {
      engineLimitBytes = Math.min(engineLimitBytes, maxBytes)
    }

    return engineLimitBytes
  }

  private static async getCodingExerciseByLesson(lessonId: string) {
    const lesson = await Lesson.findById(lessonId)
    if (!lesson) throw new NotFoundError('Lesson not found', ErrorCodes.LESSON_NOT_FOUND)
    if (lesson.contentType !== 'coding')
      throw new ValidationError('Lesson is not a coding exercise', ErrorCodes.INVALID_INPUT_FORMAT)

    const exercise = await CodingExercise.findById(lesson.resourceId)
    if (!exercise) throw new NotFoundError('Coding exercise not found', ErrorCodes.LESSON_NOT_FOUND)

    return { lesson, exercise }
  }

  /**
   * Run code against custom input (stateless)
   */
  static async runCode(
    lessonId: string,
    payload: { sourceCode: string; language: string; version: string; stdin?: string }
  ): Promise<{ result: PistonExecuteResponse; constraints: ExecutionConstraints }> {
    const { exercise } = await this.getCodingExerciseByLesson(lessonId)

    if (
      this.normalizeLanguage(exercise.language) !== this.normalizeLanguage(payload.language) ||
      exercise.version !== payload.version
    ) {
      throw new ValidationError('Language does not match this exercise', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    await this.ensureRuntimeSupported(payload.language, payload.version)

    const constraints = this.resolveExecutionConstraints(exercise)
    const result = await this.execute(this.buildExecutionPayload(payload, constraints))

    return { result, constraints }
  }

  static toRunResponsePayload(result: PistonExecuteResponse, constraints: ExecutionConstraints): RunCodeResponsePayload {
    if (this.isStrictMode()) {
      return { status: 'OK' }
    }

    const hasCompileError = this.isCompileError(result)
    const runtimeMs = Math.round(this.parseExecutionTime(result.run) * 1000)
    const memoryKb = this.parseMemoryKb(result.run)
    const exitCode = result.run?.code ?? null
    const hasTimeLimitExceeded = this.isJudgeProfile() && runtimeMs > constraints.timeLimitMs

    let status: 'SUCCESS' | 'RUNTIME_ERROR' | 'COMPILE_ERROR' | 'TIME_LIMIT_EXCEEDED' = 'SUCCESS'
    if (hasCompileError) status = 'COMPILE_ERROR'
    else if (hasTimeLimitExceeded) status = 'TIME_LIMIT_EXCEEDED'
    else if (typeof exitCode === 'number' && exitCode !== 0) status = 'RUNTIME_ERROR'

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
      signal: (result.run?.signal as string | null | undefined) ?? null,
      ...(hasCompileError && {
        compileOutput: this.getCompileError(result) || 'Compilation failed'
      })
    }
  }

  /**
   * Submit code for grading (stateful)
   */
  static async submitCode(
    lessonId: string,
    userId: string,
    payload: { sourceCode: string; language: string; version: string }
  ) {
    const { lesson, exercise } = await this.getCodingExerciseByLesson(lessonId)

    if (
      this.normalizeLanguage(exercise.language) !== this.normalizeLanguage(payload.language) ||
      exercise.version !== payload.version
    ) {
      throw new ValidationError('Language does not match this exercise', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    const testCases = exercise.testCases ?? []
    if (testCases.length === 0) {
      throw new ValidationError('No test cases configured', ErrorCodes.INVALID_INPUT_FORMAT)
    }

    await this.ensureRuntimeSupported(payload.language, payload.version)
    const constraints = this.resolveExecutionConstraints(exercise)

    const results: PistonExecuteResponse[] = []

    const submitDelayMs = this.getSubmitDelayMs()

    for (let index = 0; index < testCases.length; index++) {
      if (index > 0 && submitDelayMs > 0) {
        await this.sleep(submitDelayMs)
      }

      const testCase = testCases[index]
      const result = await this.execute(
        this.buildExecutionPayload(
          {
            sourceCode: payload.sourceCode,
            language: payload.language,
            version: payload.version,
            stdin: testCase.input ?? ''
          },
          constraints
        )
      )
      results.push(result)

      if (this.isCompileError(result)) {
        break
      }
    }

    const perTestResults = results.map((result, index) => {
      const actual = this.normalizeOutput(this.getStdout(result))
      const expected = this.normalizeOutput(testCases[index].expectedOutput)
      return {
        index,
        input: testCases[index].input ?? '',
        expected,
        actual,
        isHidden: testCases[index].isHidden === true,
        passed: actual === expected
      }
    })

    const passedTestCases = perTestResults.filter((entry) => entry.passed).length
    const totalTestCases = testCases.length
    const hasCompileError = results.some((result) => this.isCompileError(result))

    let status = CodeSubmissionStatus.WRONG_ANSWER
    if (hasCompileError) status = CodeSubmissionStatus.COMPILE_ERROR
    else if (passedTestCases === totalTestCases) status = CodeSubmissionStatus.ACCEPTED

    const stdout = results
      .map((result) => this.getStdout(result))
      .join('\n')
      .trim()
    const stderr = results
      .map((result) => this.getStderr(result))
      .filter(Boolean)
      .join('\n')
      .trim()
    const executionTimes = results.map((result) => this.parseExecutionTime(result.run))
    const memoryUsagesKb = results
      .map((result) => this.parseMemoryKb(result.run))
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    const totalExecutionTime = executionTimes.reduce((sum, value) => sum + value, 0)
    const maxExecutionTime = executionTimes.length > 0 ? Math.max(...executionTimes) : 0
    const maxMemoryKb = memoryUsagesKb.length > 0 ? Math.max(...memoryUsagesKb) : null
    const executionTime = totalExecutionTime
    const runtimeMs = Math.round(maxExecutionTime * 1000)
    const hasTimeLimitExceeded =
      this.isJudgeProfile() && executionTimes.some((value) => Math.round(value * 1000) > constraints.timeLimitMs)

    if (!hasCompileError && hasTimeLimitExceeded) {
      status = CodeSubmissionStatus.TIME_LIMIT_EXCEEDED
    }

    const failedTest =
      status === CodeSubmissionStatus.WRONG_ANSWER
        ? perTestResults.find((entry) => !entry.passed && (!this.isStrictMode() || !entry.isHidden))
        : undefined

    const compileError =
      status === CodeSubmissionStatus.COMPILE_ERROR
        ? this.getCompileError(results.find((result) => this.isCompileError(result)) ?? {}) || 'Compilation failed'
        : undefined

    const submission = await CodeSubmission.create({
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
    })

    if (status === CodeSubmissionStatus.ACCEPTED) {
      await Track.updateOne(
        { userId, courseId: lesson.courseId, lessonId: lesson._id },
        { $setOnInsert: { userId, courseId: lesson.courseId, lessonId: lesson._id } },
        { upsert: true }
      )
      await CourseCompletionService.syncCompletionForUserCourse(userId, lesson.courseId.toString())
    }

    return {
      submission,
      summary: {
        status,
        passedTestCases,
        totalTestCases,
        runtimeMs,
        timeLimitMs: constraints.timeLimitMs,
        memoryKb: maxMemoryKb as number | null,
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
    }
  }
}
