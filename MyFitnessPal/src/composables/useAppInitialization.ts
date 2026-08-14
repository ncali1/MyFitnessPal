import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useExercisesStore } from '../stores/exercises'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { storageService, StorageQuotaError } from '../services/storage'
import { initializeSync } from '../services/sync'

/**
 * Composable that manages the application's startup sequence and reset logic.
 *
 * On mount, call `initializeApp` to load all persisted data from IndexedDB into
 * the Pinia stores and start the background sync watchers. Call `resetApp` to wipe
 * all stored data and return the stores to their initial empty state.
 *
 * @returns Reactive refs (`isLoading`, `error`, `isInitialized`, `isReady`,
 *   `hasDataError`) and action functions (`initializeApp`, `resetApp`).
 */
export function useAppInitialization() {
  const exercisesStore = useExercisesStore()
  const routineStore = useRoutineStore()
  const sessionsStore = useWorkoutSessionsStore()

  const { exercises } = storeToRefs(exercisesStore)
  const { routine } = storeToRefs(routineStore)
  const { sessions } = storeToRefs(sessionsStore)

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  const isReady = computed(() => isInitialized.value && !isLoading.value)
  const hasDataError = computed(() => error.value !== null)

  /**
   * Loads all data from storage and initializes the app
   */
  const initializeApp = async () => {
    if (isInitialized.value) {
      return
    }

    try {
      isLoading.value = true
      error.value = null

      // Load exercises — graceful degradation on failure
      try {
        await exercisesStore.loadExercises()
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          error.value = err.message
        } else {
          console.error('Failed to load exercises, continuing with empty state:', err)
        }
      }

      // Load routine — graceful degradation on failure
      try {
        await routineStore.loadRoutine()
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          error.value = err.message
        } else {
          console.error('Failed to load routine, continuing with empty state:', err)
        }
      }

      // Load workout sessions — graceful degradation on failure
      try {
        await sessionsStore.loadSessions()
      } catch (err) {
        if (err instanceof StorageQuotaError) {
          error.value = err.message
        } else {
          console.error('Failed to load sessions, continuing with empty state:', err)
        }
      }

      // Initialize synchronization watchers
      initializeSync(
        exercises,
        routine,
        sessions,
        {
          onError: (err) => {
            console.error('Sync error:', err)
            error.value = `Sync failed: ${err.message}`
          },
        }
      )

      isInitialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Resets the app state (useful for testing or clearing data)
   */
  const resetApp = async () => {
    try {
      isLoading.value = true
      error.value = null

      await storageService.clearAllData()
      exercisesStore.$reset()
      routineStore.$reset()
      sessionsStore.$reset()

      isInitialized.value = false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset app'
      error.value = errorMessage
      console.error('App reset error:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    isInitialized,
    isReady,
    hasDataError,
    initializeApp,
    resetApp,
  }
}
