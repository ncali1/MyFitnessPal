import { db } from './database'
import type { Exercise, Routine, WorkoutSession, BodyWeightLog } from '../stores/types'

const MAX_RETRIES = 3
const RETRY_DELAYS = [100, 500, 1000]

/**
 * Deep-clones a value into a plain, structured-clone-safe object via a JSON
 * round-trip. This strips Vue reactivity Proxies (which some IndexedDB
 * implementations refuse to structured-clone with a DataCloneError) from any
 * object before it's written to IndexedDB. Safe here because Exercise,
 * Routine, and WorkoutSession are plain data (strings, numbers, arrays,
 * nested plain objects) with no functions, Dates, or circular references.
 */
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/**
 * Thrown when IndexedDB storage quota is exceeded.
 * Callers should notify the user to free space — retrying will not help.
 */
export class StorageQuotaError extends Error {
  constructor(message = 'Storage limit reached. Please delete old data or clear browser cache') {
    super(message)
    this.name = 'StorageQuotaError'
  }
}

/**
 * Returns true when the given error represents a browser storage-quota violation.
 * @param err - Unknown error value caught in a catch block
 */
function isQuotaError(err: unknown): boolean {
  if (err instanceof Error) {
    return (
      err.name === 'QuotaExceededError' ||
      err.message.toLowerCase().includes('quota')
    )
  }
  return false
}

/**
 * Retries an async operation up to MAX_RETRIES times with exponential back-off.
 * Quota errors are re-thrown immediately without retrying.
 *
 * @param operation     - Async function to attempt
 * @param operationName - Human-readable name used in error messages
 * @returns The resolved value of `operation` on success
 * @throws StorageQuotaError if a quota error is detected
 * @throws Error with attempt summary if all retries are exhausted
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation()
    } catch (err) {
      // Quota errors should not be retried — throw immediately
      if (isQuotaError(err)) {
        throw new StorageQuotaError()
      }

      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt]
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`${operationName} failed after ${MAX_RETRIES} attempts: ${lastError?.message}`)
}

/**
 * Provides CRUD operations for exercises, routines, and workout sessions backed
 * by IndexedDB (via Dexie). All methods automatically retry transient failures
 * with exponential back-off and throw {@link StorageQuotaError} on quota violations.
 */
export const storageService = {
  // ── Exercise operations ───────────────────────────────────────────────────

  /**
   * Persists an exercise to IndexedDB, inserting or replacing by primary key.
   * @param exercise - Exercise object to save
   */
  async saveExercise(exercise: Exercise): Promise<void> {
    return retryOperation(
      () => db.exercises.put(toPlain(exercise)),
      'Save exercise'
    ).then(() => {})
  },

  /**
   * Retrieves a single exercise by its ID.
   * @param id - Exercise ID to look up
   * @returns The matching exercise, or `undefined` if not found
   */
  async getExercise(id: string): Promise<Exercise | undefined> {
    return retryOperation(() => db.exercises.get(id), 'Get exercise')
  },

  /**
   * Returns all exercises stored in IndexedDB.
   */
  async getAllExercises(): Promise<Exercise[]> {
    return retryOperation(() => db.exercises.toArray(), 'Get all exercises')
  },

  /**
   * Deletes an exercise from IndexedDB by its ID.
   * @param id - ID of the exercise to delete
   */
  async deleteExercise(id: string): Promise<void> {
    return retryOperation(
      () => db.exercises.delete(id),
      'Delete exercise'
    ).then(() => {})
  },

  // Routine operations
  /**
   * Persists a routine to IndexedDB, inserting or replacing by primary key.
   * @param routine - The routine object to save
   */
  async saveRoutine(routine: Routine): Promise<void> {
    return retryOperation(
      () => db.routine.put(toPlain(routine)),
      'Save routine'
    ).then(() => {})
  },

  /**
   * Retrieves all saved routines from IndexedDB.
   */
  async getAllRoutines(): Promise<Routine[]> {
    return retryOperation(() => db.routine.toArray(), 'Get all routines')
  },

  /**
   * Deletes a routine from IndexedDB by its ID.
   * @param id - ID of the routine to delete
   */
  async deleteRoutine(id: string): Promise<void> {
    return retryOperation(
      () => db.routine.delete(id),
      'Delete routine'
    ).then(() => {})
  },

  // Workout Session operations
  /**
   * Persists a workout session to IndexedDB, inserting or replacing by primary key.
   * @param session - The session object to save
   */
  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    return retryOperation(
      () => db.workoutSessions.put(toPlain(session)),
      'Save workout session'
    ).then(() => {})
  },

  /**
   * Retrieves a single workout session by its ID.
   * @param id - Session ID to look up
   * @returns The matching session, or `undefined` if not found
   */
  async getWorkoutSession(id: string): Promise<WorkoutSession | undefined> {
    return retryOperation(() => db.workoutSessions.get(id), 'Get workout session')
  },

  /**
   * Retrieves the workout session for a specific date.
   * @param date - YYYY-MM-DD date string to look up
   * @returns The matching session, or `undefined` if none exists for that date
   */
  async getWorkoutSessionByDate(date: string): Promise<WorkoutSession | undefined> {
    return retryOperation(
      () => db.workoutSessions.where('date').equals(date).first(),
      'Get workout session by date'
    )
  },

  /**
   * Returns all workout sessions stored in IndexedDB.
   */
  async getAllWorkoutSessions(): Promise<WorkoutSession[]> {
    return retryOperation(() => db.workoutSessions.toArray(), 'Get all workout sessions')
  },

  /**
   * Deletes a workout session from IndexedDB by its ID.
   * @param id - ID of the session to delete
   */
  async deleteWorkoutSession(id: string): Promise<void> {
    return retryOperation(
      () => db.workoutSessions.delete(id),
      'Delete workout session'
    ).then(() => {})
  },

  // ── Body weight log operations ──────────────────────────────────────────────

  /**
   * Persists a body weight log entry to IndexedDB. Logging again on the same date
   * overwrites that date's entry rather than creating a duplicate.
   * @param log - Body weight log entry to save
   */
  async saveBodyWeightLog(log: BodyWeightLog): Promise<void> {
    return retryOperation(
      async () => {
        const existing = await db.bodyWeightLogs.where('date').equals(log.date).first()
        const plain = toPlain(existing ? { ...log, id: existing.id } : log)
        await db.bodyWeightLogs.put(plain)
      },
      'Save body weight log'
    ).then(() => {})
  },

  /**
   * Returns all body weight log entries stored in IndexedDB.
   */
  async getAllBodyWeightLogs(): Promise<BodyWeightLog[]> {
    return retryOperation(() => db.bodyWeightLogs.toArray(), 'Get all body weight logs')
  },

  /**
   * Deletes a body weight log entry from IndexedDB by its ID.
   * @param id - ID of the log entry to delete
   */
  async deleteBodyWeightLog(id: string): Promise<void> {
    return retryOperation(
      () => db.bodyWeightLogs.delete(id),
      'Delete body weight log'
    ).then(() => {})
  },

  // Bulk operations
  /**
   * Deletes all exercises, routines, workout sessions, and body weight logs from
   * IndexedDB. Intended for use in tests or when the user requests a full data reset.
   */
  async clearAllData(): Promise<void> {
    return retryOperation(
      async () => {
        await db.exercises.clear()
        await db.routine.clear()
        await db.workoutSessions.clear()
        await db.bodyWeightLogs.clear()
      },
      'Clear all data'
    ).then(() => {})
  },
}
