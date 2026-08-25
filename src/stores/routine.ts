import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Routine, RoutineAssignment } from './types'
import { storageService } from '../services/storage'
import { useWorkoutSessionsStore } from './workoutSessions'
import { useAuthStore } from './auth'
import { syncUpsertRoutine, syncDeleteRoutine } from '../services/cloudSync'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/**
 * Pinia store for managing saved routines/programs (e.g. push/pull/legs, 5x5) — one of
 * which is "active" at a time and drives the daily checklist, weekly summary, and
 * progress graphs.
 *
 * State:
 * - `routines` — all saved routines
 * - `loading`  — true while an async operation is in progress
 * - `error`    — last error message, or null
 *
 * Getters:
 * - `activeRoutine` — the routine currently marked active (falls back to the first
 *   routine if none is flagged, which shouldn't normally happen)
 * - `routine` — alias for `activeRoutine`, kept for backward compatibility with
 *   consumers (WeeklySummary, ProgressGraphs, calculations.ts) that only know about
 *   "the" routine and have no need to be aware multiple routines exist
 * - `routineForDay`, `allAssignments` — read through the active routine
 *
 * Actions: `assignExercise`, `removeExercise` (operate on the active routine),
 * `createRoutine`, `renameRoutine`, `deleteRoutine`, `setActiveRoutine`,
 * `loadRoutines`, `saveRoutine`
 */
export const useRoutineStore = defineStore('routine', () => {
  const routines = ref<Routine[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Builds an empty weekly-assignments object with all seven days initialised to `[]`.
   */
  const initializeRoutine = () => {
    const assignments: RoutineAssignment = {}
    DAYS.forEach((day) => {
      assignments[day] = []
    })
    return assignments
  }

  /** The routine currently marked active, or the first routine as a fallback. */
  const activeRoutine = computed(() => routines.value.find((r) => r.isActive) ?? routines.value[0] ?? null)

  /** Alias for `activeRoutine` — see module doc comment. */
  const routine = computed(() => activeRoutine.value)

  /**
   * Returns the exercise IDs assigned to the given day in the active routine.
   * @param day - Lowercase day name (e.g. `"monday"`)
   * @returns Array of exercise IDs, or `[]` if there's no active routine
   */
  const routineForDay = (day: string) => {
    if (!activeRoutine.value) return []
    return activeRoutine.value.weeklyAssignments[day.toLowerCase()] || []
  }

  /** Reactive map of all day → exerciseId[] assignments for the active routine. */
  const allAssignments = computed(() => activeRoutine.value?.weeklyAssignments || {})

  /**
   * Lazily creates the first routine (named "My Routine", marked active) if none
   * exist yet, mirroring the original single-routine lazy-init behavior.
   */
  const ensureActiveRoutine = (): Routine => {
    if (!activeRoutine.value) {
      const created: Routine = {
        id: crypto.randomUUID(),
        name: 'My Routine',
        isActive: true,
        weeklyAssignments: initializeRoutine(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      routines.value.push(created)
    }
    return activeRoutine.value!
  }

  /**
   * Assigns an exercise to a day in the active routine and persists it.
   * Creates a new empty routine if none exists yet.
   * @param day - Lowercase day name (e.g. `"monday"`)
   * @param exerciseId - ID of the exercise to assign
   */
  const assignExercise = async (day: string, exerciseId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const target = ensureActiveRoutine()
      const dayLower = day.toLowerCase()
      if (!target.weeklyAssignments[dayLower]) {
        target.weeklyAssignments[dayLower] = []
      }

      if (!target.weeklyAssignments[dayLower].includes(exerciseId)) {
        target.weeklyAssignments[dayLower].push(exerciseId)
        target.updatedAt = Date.now()
        await storageService.saveRoutine(target)
        useWorkoutSessionsStore().invalidateCache()

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, target)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to assign exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Removes an exercise from a day in the active routine and persists it.
   * @param day - Lowercase day name
   * @param exerciseId - ID of the exercise to remove
   */
  const removeExercise = async (day: string, exerciseId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const target = activeRoutine.value
      if (!target) return

      const dayLower = day.toLowerCase()
      if (target.weeklyAssignments[dayLower]) {
        target.weeklyAssignments[dayLower] = target.weeklyAssignments[dayLower].filter(
          (id) => id !== exerciseId
        )
        target.updatedAt = Date.now()
        await storageService.saveRoutine(target)
        useWorkoutSessionsStore().invalidateCache()

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, target)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Creates a new, initially-inactive routine with the given name.
   * @param name - Display name for the new routine
   * @returns The newly created routine
   */
  const createRoutine = async (name: string): Promise<Routine> => {
    try {
      loading.value = true
      error.value = null

      const created: Routine = {
        id: crypto.randomUUID(),
        name,
        isActive: false,
        weeklyAssignments: initializeRoutine(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      routines.value.push(created)
      await storageService.saveRoutine(created)

      const auth = useAuthStore()
      if (auth.user) syncUpsertRoutine(auth.user.id, created)

      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Renames an existing routine.
   * @param id - ID of the routine to rename
   * @param name - New display name
   */
  const renameRoutine = async (id: string, name: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const target = routines.value.find((r) => r.id === id)
      if (!target) return

      target.name = name
      target.updatedAt = Date.now()
      await storageService.saveRoutine(target)

      const auth = useAuthStore()
      if (auth.user) syncUpsertRoutine(auth.user.id, target)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to rename routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Deletes a routine. Refuses to delete the last remaining routine. If the active
   * routine is deleted, another routine (the most recently updated remaining one) is
   * automatically activated in its place.
   * @param id - ID of the routine to delete
   */
  const deleteRoutine = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (routines.value.length <= 1) {
        throw new Error('Cannot delete the last remaining routine')
      }

      const wasActive = routines.value.find((r) => r.id === id)?.isActive ?? false
      routines.value = routines.value.filter((r) => r.id !== id)

      if (wasActive && routines.value.length > 0) {
        const next = [...routines.value].sort((a, b) => b.updatedAt - a.updatedAt)[0]!
        next.isActive = true
        next.updatedAt = Date.now()
        await storageService.saveRoutine(next)
        useWorkoutSessionsStore().invalidateCache()

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, next)
      }

      await storageService.deleteRoutine(id)

      const auth = useAuthStore()
      if (auth.user) syncDeleteRoutine(auth.user.id, id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Switches the active routine. Flips `isActive` on both the previously-active
   * routine and the target, persists both, and invalidates the workout-sessions
   * store's weekly-summary/progress caches — those are keyed by date range only, not
   * by routine, so a switch would otherwise leak stale computed data from the
   * previous routine's assignments.
   * @param id - ID of the routine to activate
   */
  const setActiveRoutine = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const target = routines.value.find((r) => r.id === id)
      if (!target || target.isActive) return

      const previous = activeRoutine.value
      if (previous) {
        previous.isActive = false
        previous.updatedAt = Date.now()
        await storageService.saveRoutine(previous)
      }

      target.isActive = true
      target.updatedAt = Date.now()
      await storageService.saveRoutine(target)

      useWorkoutSessionsStore().invalidateCache()

      const auth = useAuthStore()
      if (auth.user) {
        if (previous) syncUpsertRoutine(auth.user.id, previous)
        syncUpsertRoutine(auth.user.id, target)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to switch routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Loads all routines from IndexedDB.
   * Creates and initialises a new empty routine in memory if none exist yet.
   */
  const loadRoutines = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const loaded = await storageService.getAllRoutines()
      routines.value =
        loaded.length > 0
          ? loaded
          : [
              {
                id: crypto.randomUUID(),
                name: 'My Routine',
                isActive: true,
                weeklyAssignments: initializeRoutine(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load routines'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Persists the active routine's current state to IndexedDB.
   * No-op when there's no active routine.
   */
  const saveRoutine = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const target = activeRoutine.value
      if (target) {
        target.updatedAt = Date.now()
        await storageService.saveRoutine(target)

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, target)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    routines,
    routine,
    activeRoutine,
    loading,
    error,
    routineForDay,
    allAssignments,
    assignExercise,
    removeExercise,
    createRoutine,
    renameRoutine,
    deleteRoutine,
    setActiveRoutine,
    loadRoutines,
    saveRoutine,
  }
})
