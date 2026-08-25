import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { WorkoutSession, ExercisePerformance } from './types'
import { storageService } from '../services/storage'
import { useComputedCache } from '../composables/useComputedCache'
import { calculateWeeklySummary, aggregateProgressData, getExerciseHistory } from '../utils/calculations'
import type { ExerciseHistoryEntry } from '../utils/calculations'
import type { WeeklySummary, ProgressData } from '../models/types'
import type { Routine } from './types'
import { useAuthStore } from './auth'
import { syncUpsertSession } from '../services/cloudSync'

/**
 * Pinia store for workout sessions and performance logging.
 *
 * State:
 * - `sessions`        — all loaded workout sessions
 * - `currentSession`  — the most recently created/active session
 * - `loading`         — true while an async operation is in progress
 * - `error`           — last error message, or null
 *
 * Cached getters:
 * - `getCachedWeeklySummary`  — memoised weekly summary calculation
 * - `getCachedProgressData`   — memoised progress data aggregation
 * - `getCachedExerciseHistory` — memoised chronological history for one exercise
 *
 * Actions: `createSession`, `updateSession`, `logPerformance`, `loadSessions`
 * Getters: `allSessions`, `sessionByDate`, `performanceByExercise`
 */
export const useWorkoutSessionsStore = defineStore('workoutSessions', () => {
  const sessions = ref<WorkoutSession[]>([])
  const currentSession = ref<WorkoutSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Caches ────────────────────────────────────────────────────────────────
  const weeklySummaryCache = useComputedCache<WeeklySummary>()
  const progressDataCache = useComputedCache<ProgressData>()
  const historyCache = useComputedCache<ExerciseHistoryEntry[]>()

  /** Invalidate all caches whenever sessions change. */
  watch(
    sessions,
    () => {
      weeklySummaryCache.invalidate()
      progressDataCache.invalidate()
      historyCache.invalidate()
    },
    { deep: true }
  )

  // ── Cached getters ────────────────────────────────────────────────────────

  /**
   * Returns the weekly summary for the given Monday date string.
   * Result is cached; cache is invalidated when sessions change.
   */
  function getCachedWeeklySummary(weekStartStr: string, routine: Routine): WeeklySummary {
    const key = weekStartStr
    if (weeklySummaryCache.has(key)) {
      return weeklySummaryCache.get(key)!
    }
    const result = calculateWeeklySummary(weekStartStr, routine, sessions.value)
    weeklySummaryCache.set(key, result)
    return result
  }

  /**
   * Returns aggregated progress data for an exercise over a date range.
   * Result is cached; cache is invalidated when sessions change.
   */
  function getCachedProgressData(
    exerciseId: string,
    exerciseName: string,
    startStr: string,
    endStr: string,
    routine: Routine
  ): ProgressData {
    const key = `${exerciseId}|${startStr}|${endStr}`
    if (progressDataCache.has(key)) {
      return progressDataCache.get(key)!
    }
    const result = aggregateProgressData(exerciseId, exerciseName, startStr, endStr, sessions.value, routine)
    progressDataCache.set(key, result)
    return result
  }

  /**
   * Returns every logged instance of an exercise across all sessions, newest first.
   * Result is cached; cache is invalidated when sessions change.
   */
  function getCachedExerciseHistory(exerciseId: string): ExerciseHistoryEntry[] {
    const key = exerciseId
    if (historyCache.has(key)) {
      return historyCache.get(key)!
    }
    const result = getExerciseHistory(exerciseId, sessions.value)
    historyCache.set(key, result)
    return result
  }

  // ── Existing store members ────────────────────────────────────────────────

  /** All sessions in the store, reactive. */
  const allSessions = computed(() => sessions.value)

  /**
   * Finds a session by its date string.
   * @param date - YYYY-MM-DD date string
   * @returns The matching session, or `undefined`
   */
  const sessionByDate = (date: string) => {
    return sessions.value.find((s) => s.date === date)
  }

  /**
   * Returns all logged performance entries for the given exercise across all sessions.
   * @param exerciseId - ID of the exercise to look up
   * @returns Array of performance entries (may be empty)
   */
  const performanceByExercise = (exerciseId: string) => {
    const performances: ExercisePerformance[] = []
    sessions.value.forEach((session) => {
      const perf = session.exercises.find((e) => e.exerciseId === exerciseId)
      if (perf) {
        performances.push(perf)
      }
    })
    return performances
  }

  /**
   * Creates a new workout session for the given date, adds it to state, and persists it.
   * @param date - YYYY-MM-DD date string for the session
   * @returns The newly created session
   */
  const createSession = async (date: string): Promise<WorkoutSession> => {
    try {
      loading.value = true
      error.value = null

      const session: WorkoutSession = {
        id: crypto.randomUUID(),
        date,
        exercises: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      sessions.value.push(session)
      currentSession.value = session
      await storageService.saveWorkoutSession(session)

      const auth = useAuthStore()
      if (auth.user) syncUpsertSession(auth.user.id, session)

      return session
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create session'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Applies partial updates to an existing session in state and persists the change.
   * @param id - ID of the session to update
   * @param updates - Partial session fields to apply (cannot change `id` or `createdAt`)
   * @returns The updated session
   * @throws {Error} when the session is not found
   */
  const updateSession = async (
    id: string,
    updates: Partial<Omit<WorkoutSession, 'id' | 'createdAt'>>
  ): Promise<WorkoutSession> => {
    try {
      loading.value = true
      error.value = null

      const index = sessions.value.findIndex((s) => s.id === id)
      if (index === -1) {
        throw new Error('Session not found')
      }

      const existing = sessions.value[index]!
      const updated: WorkoutSession = {
        id: existing.id,
        date: updates.date ?? existing.date,
        exercises: updates.exercises ?? existing.exercises,
        createdAt: existing.createdAt,
        updatedAt: Date.now(),
      }

      sessions.value[index] = updated
      if (currentSession.value?.id === id) {
        currentSession.value = updated
      }
      await storageService.saveWorkoutSession(updated)

      const auth = useAuthStore()
      if (auth.user) syncUpsertSession(auth.user.id, updated)

      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update session'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Logs or updates performance data for a specific exercise within a session.
   * If the exercise already has a performance entry, it is replaced; otherwise a new one is appended.
   * @param sessionId - ID of the workout session
   * @param exerciseId - ID of the exercise being logged
   * @param performance - Performance fields (completed, actualSets, actualReps, weight, difficultyLevel)
   * @throws {Error} when the session is not found
   */
  const logPerformance = async (
    sessionId: string,
    exerciseId: string,
    performance: Omit<ExercisePerformance, 'exerciseId' | 'timestamp'>
  ): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const session = sessions.value.find((s) => s.id === sessionId)
      if (!session) {
        throw new Error('Session not found')
      }

      const existingIndex = session.exercises.findIndex((e) => e.exerciseId === exerciseId)
      const newPerformance: ExercisePerformance = {
        ...performance,
        exerciseId,
        timestamp: Date.now(),
      }

      if (existingIndex >= 0) {
        session.exercises[existingIndex] = newPerformance
      } else {
        session.exercises.push(newPerformance)
      }

      session.updatedAt = Date.now()
      await storageService.saveWorkoutSession(session)

      const auth = useAuthStore()
      if (auth.user) syncUpsertSession(auth.user.id, session)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to log performance'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Loads all workout sessions from IndexedDB into the reactive state.
   * Safe to call multiple times — always replaces current state with storage contents.
   */
  const loadSessions = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const loaded = await storageService.getAllWorkoutSessions()
      sessions.value = loaded
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load sessions'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    sessions,
    currentSession,
    loading,
    error,
    allSessions,
    sessionByDate,
    performanceByExercise,
    createSession,
    updateSession,
    logPerformance,
    loadSessions,
    getCachedWeeklySummary,
    getCachedProgressData,
    getCachedExerciseHistory,
    /** Manually invalidate all caches (call when routine changes) */
    invalidateCache: () => {
      weeklySummaryCache.invalidate()
      progressDataCache.invalidate()
      historyCache.invalidate()
    },
  }
})
