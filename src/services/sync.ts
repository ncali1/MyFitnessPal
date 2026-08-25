import { watch, type Ref } from 'vue'
import { storageService } from './storage'
import type { Exercise, Routine, WorkoutSession, BodyWeightLog } from '../stores/types'

const DEBOUNCE_DELAY = 1000 // 1 second debounce

/**
 * Configuration options for sync watcher functions.
 */
interface SyncOptions {
  /** How long to wait (ms) after the last change before persisting. Defaults to 1000 ms. */
  debounceDelay?: number
  /** Optional callback invoked when a persist operation fails after all retries. */
  onError?: (error: Error) => void
}

/**
 * Creates a debounced sync function that persists changes to storage.
 * Each call resets the timer; the persist function only runs once the timer expires.
 *
 * @param persistFn - Async function that writes the data to storage
 * @param delay - Debounce delay in milliseconds (default: 1000)
 * @returns An async function that accepts the data to persist
 */
function createDebouncedSync<T>(
  persistFn: (data: T) => Promise<void>,
  delay: number = DEBOUNCE_DELAY
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastError: Error | null = null

  return async (data: T) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    return new Promise<void>((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          await persistFn(data)
          lastError = null
          resolve()
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          reject(lastError)
        }
      }, delay)
    })
  }
}

/**
 * Sets up a deep watcher on the exercises array and debounces writes to storage.
 * Each individual exercise is saved separately via `storageService.saveExercise`.
 *
 * @param exercisesRef - Reactive ref holding the exercises array from the Pinia store
 * @param options - Optional debounce delay and error callback
 * @returns A stop function that removes the watcher when called
 */
export function syncExercises(
  exercisesRef: Ref<Exercise[]>,
  options: SyncOptions = {}
) {
  const { debounceDelay = DEBOUNCE_DELAY, onError } = options

  const debouncedSync = createDebouncedSync(
    async (exercises: Exercise[]) => {
      // Save each exercise individually
      for (const exercise of exercises) {
        await storageService.saveExercise(exercise)
      }
    },
    debounceDelay
  )

  return watch(
    exercisesRef,
    async (newExercises) => {
      try {
        await debouncedSync(newExercises)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error)
      }
    },
    { deep: true }
  )
}

/**
 * Sets up a deep watcher on the routines array and debounces writes to storage.
 * Each routine is saved individually via `storageService.saveRoutine`.
 *
 * @param routinesRef - Reactive ref holding the routines array from the Pinia store
 * @param options - Optional debounce delay and error callback
 * @returns A stop function that removes the watcher when called
 */
export function syncRoutines(
  routinesRef: Ref<Routine[]>,
  options: SyncOptions = {}
) {
  const { debounceDelay = DEBOUNCE_DELAY, onError } = options

  const debouncedSync = createDebouncedSync(
    async (routines: Routine[]) => {
      for (const routine of routines) {
        await storageService.saveRoutine(routine)
      }
    },
    debounceDelay
  )

  return watch(
    routinesRef,
    async (newRoutines) => {
      try {
        await debouncedSync(newRoutines)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error)
      }
    },
    { deep: true }
  )
}

/**
 * Sets up a deep watcher on the workout sessions array and debounces writes to storage.
 * Each session is saved individually via `storageService.saveWorkoutSession`.
 *
 * @param sessionsRef - Reactive ref holding the sessions array from the Pinia store
 * @param options - Optional debounce delay and error callback
 * @returns A stop function that removes the watcher when called
 */
export function syncWorkoutSessions(
  sessionsRef: Ref<WorkoutSession[]>,
  options: SyncOptions = {}
) {
  const { debounceDelay = DEBOUNCE_DELAY, onError } = options

  const debouncedSync = createDebouncedSync(
    async (sessions: WorkoutSession[]) => {
      // Save each session individually
      for (const session of sessions) {
        await storageService.saveWorkoutSession(session)
      }
    },
    debounceDelay
  )

  return watch(
    sessionsRef,
    async (newSessions) => {
      try {
        await debouncedSync(newSessions)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error)
      }
    },
    { deep: true }
  )
}

/**
 * Sets up a deep watcher on the body weight logs array and debounces writes to storage.
 * Each entry is saved individually via `storageService.saveBodyWeightLog`.
 *
 * @param logsRef - Reactive ref holding the body weight logs array from the Pinia store
 * @param options - Optional debounce delay and error callback
 * @returns A stop function that removes the watcher when called
 */
export function syncBodyWeightLogs(
  logsRef: Ref<BodyWeightLog[]>,
  options: SyncOptions = {}
) {
  const { debounceDelay = DEBOUNCE_DELAY, onError } = options

  const debouncedSync = createDebouncedSync(
    async (logs: BodyWeightLog[]) => {
      for (const log of logs) {
        await storageService.saveBodyWeightLog(log)
      }
    },
    debounceDelay
  )

  return watch(
    logsRef,
    async (newLogs) => {
      try {
        await debouncedSync(newLogs)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error)
      }
    },
    { deep: true }
  )
}

/**
 * Starts all four synchronization watchers (exercises, routine, sessions, body weight
 * logs) at once.
 *
 * @param exercisesRef - Reactive ref for the exercises array
 * @param routinesRef - Reactive ref for the routines array
 * @param sessionsRef - Reactive ref for the sessions array
 * @param bodyWeightLogsRef - Reactive ref for the body weight logs array
 * @param options - Optional shared debounce delay and error callback
 * @returns A single stop function that tears down all four watchers
 */
export function initializeSync(
  exercisesRef: Ref<Exercise[]>,
  routinesRef: Ref<Routine[]>,
  sessionsRef: Ref<WorkoutSession[]>,
  bodyWeightLogsRef: Ref<BodyWeightLog[]>,
  options: SyncOptions = {}
) {
  const stopExercisesSync = syncExercises(exercisesRef, options)
  const stopRoutineSync = syncRoutines(routinesRef, options)
  const stopSessionsSync = syncWorkoutSessions(sessionsRef, options)
  const stopBodyWeightLogsSync = syncBodyWeightLogs(bodyWeightLogsRef, options)

  return () => {
    stopExercisesSync()
    stopRoutineSync()
    stopSessionsSync()
    stopBodyWeightLogsSync()
  }
}
