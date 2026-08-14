import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Routine, RoutineAssignment } from './types'
import { storageService } from '../services/storage'
import { useWorkoutSessionsStore } from './workoutSessions'
import { useAuthStore } from './auth'
import { syncUpsertRoutine } from '../services/cloudSync'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/**
 * Pinia store for managing the weekly routine.
 *
 * State:
 * - `routine`  — the single Routine document, or null before first load
 * - `loading`  — true while an async operation is in progress
 * - `error`    — last error message, or null
 *
 * Actions: `assignExercise`, `removeExercise`, `loadRoutine`, `saveRoutine`
 * Getters: `routineForDay`, `allAssignments`
 */
export const useRoutineStore = defineStore('routine', () => {
  const routine = ref<Routine | null>(null)
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

  /**
   * Returns the exercise IDs assigned to the given day.
   * @param day - Lowercase day name (e.g. `"monday"`)
   * @returns Array of exercise IDs, or `[]` if the routine is not loaded
   */
  const routineForDay = (day: string) => {
    if (!routine.value) return []
    return routine.value.weeklyAssignments[day.toLowerCase()] || []
  }

  /** Reactive map of all day → exerciseId[] assignments. */
  const allAssignments = computed(() => routine.value?.weeklyAssignments || {})

  /**
   * Assigns an exercise to a day and persists the routine.
   * Creates a new empty routine document if none exists yet.
   * @param day - Lowercase day name (e.g. `"monday"`)
   * @param exerciseId - ID of the exercise to assign
   */
  const assignExercise = async (day: string, exerciseId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (!routine.value) {
        routine.value = {
          id: crypto.randomUUID(),
          weeklyAssignments: initializeRoutine(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
      }

      const dayLower = day.toLowerCase()
      if (!routine.value.weeklyAssignments[dayLower]) {
        routine.value.weeklyAssignments[dayLower] = []
      }

      if (!routine.value.weeklyAssignments[dayLower].includes(exerciseId)) {
        routine.value.weeklyAssignments[dayLower].push(exerciseId)
        routine.value.updatedAt = Date.now()
        await storageService.saveRoutine(routine.value)
        useWorkoutSessionsStore().invalidateCache()

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, routine.value)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to assign exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Removes an exercise from a day and persists the routine.
   * @param day - Lowercase day name
   * @param exerciseId - ID of the exercise to remove
   */
  const removeExercise = async (day: string, exerciseId: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (!routine.value) return

      const dayLower = day.toLowerCase()
      if (routine.value.weeklyAssignments[dayLower]) {
        routine.value.weeklyAssignments[dayLower] = routine.value.weeklyAssignments[
          dayLower
        ].filter((id) => id !== exerciseId)
        routine.value.updatedAt = Date.now()
        await storageService.saveRoutine(routine.value)
        useWorkoutSessionsStore().invalidateCache()

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, routine.value)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to remove exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Loads the routine from IndexedDB.
   * Creates and initialises a new empty routine if none exists.
   */
  const loadRoutine = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const loaded = await storageService.getRoutine()
      routine.value = loaded || {
        id: crypto.randomUUID(),
        weeklyAssignments: initializeRoutine(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Persists the current routine state to IndexedDB.
   * No-op when `routine` is null.
   */
  const saveRoutine = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      if (routine.value) {
        routine.value.updatedAt = Date.now()
        await storageService.saveRoutine(routine.value)

        const auth = useAuthStore()
        if (auth.user) syncUpsertRoutine(auth.user.id, routine.value)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to save routine'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    routine,
    loading,
    error,
    routineForDay,
    allAssignments,
    assignExercise,
    removeExercise,
    loadRoutine,
    saveRoutine,
  }
})
