import { db } from './database'
import type { Exercise, Routine, WorkoutSession } from '../stores/types'

const MAX_RETRIES = 3
const RETRY_DELAYS = [100, 500, 1000]

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
      () => db.exercises.put(exercise),
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
   * Persists the routine document to IndexedDB. Replaces any existing routine (only one is stored).
   * @param routine - The routine object to save
   */
  async saveRoutine(routine: Routine): Promise<void> {
    return retryOperation(
      async () => {
        const existing = await db.routine.toArray()
        if (existing.length > 0 && existing[0]) {
          const id = existing[0].id
          await db.routine.delete(id)
          await db.routine.add(routine)
        } else {
          await db.routine.add(routine)
        }
      },
      'Save routine'
    ).then(() => {})
  },

  /**
   * Retrieves the single routine document from IndexedDB.
   * @returns The routine, or `undefined` if none has been saved yet
   */
  async getRoutine(): Promise<Routine | undefined> {
    return retryOperation(async () => {
      const routines = await db.routine.toArray()
      return routines.length > 0 ? routines[0] : undefined
    }, 'Get routine')
  },

  // Workout Session operations
  /**
   * Persists a workout session to IndexedDB, inserting or replacing by primary key.
   * @param session - The session object to save
   */
  async saveWorkoutSession(session: WorkoutSession): Promise<void> {
    return retryOperation(
      () => db.workoutSessions.put(session),
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

  // Bulk operations
  /**
   * Deletes all exercises, routines, and workout sessions from IndexedDB.
   * Intended for use in tests or when the user requests a full data reset.
   */
  async clearAllData(): Promise<void> {
    return retryOperation(
      async () => {
        await db.exercises.clear()
        await db.routine.clear()
        await db.workoutSessions.clear()
      },
      'Clear all data'
    ).then(() => {})
  },
}
