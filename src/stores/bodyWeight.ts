import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BodyWeightLog } from './types'
import { storageService } from '../services/storage'
import { useAuthStore } from './auth'
import { syncUpsertBodyWeightLog, syncDeleteBodyWeightLog } from '../services/cloudSync'

/**
 * Pinia store for the body weight log — separate from workout performance data.
 *
 * State:
 * - `logs`    — reactive array of all logged entries
 * - `loading` — true while an async operation is in progress
 * - `error`   — last error message, or null
 *
 * Actions: `logWeight`, `deleteLog`, `loadLogs`
 * Getters: `allLogs` (chronological, oldest first), `logByDate`
 */
export const useBodyWeightStore = defineStore('bodyWeight', () => {
  const logs = ref<BodyWeightLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** All logged entries, oldest first. */
  const allLogs = computed(() => [...logs.value].sort((a, b) => a.date.localeCompare(b.date)))

  /**
   * Finds the log entry for a specific date.
   * @param date - YYYY-MM-DD date string to look up
   */
  const logByDate = (date: string) => {
    return logs.value.find((l) => l.date === date)
  }

  /**
   * Logs (or overwrites) the body weight entry for a given date, adds it to state,
   * and persists it. Logging again on an already-logged date replaces that entry.
   * @param date - YYYY-MM-DD date string
   * @param weightKg - Canonical weight in kg
   * @returns The saved log entry
   */
  const logWeight = async (date: string, weightKg: number): Promise<BodyWeightLog> => {
    try {
      loading.value = true
      error.value = null

      const existingIndex = logs.value.findIndex((l) => l.date === date)
      const entry: BodyWeightLog = {
        id: existingIndex >= 0 ? logs.value[existingIndex]!.id : crypto.randomUUID(),
        date,
        weightKg,
        createdAt: existingIndex >= 0 ? logs.value[existingIndex]!.createdAt : Date.now(),
        updatedAt: Date.now(),
      }

      if (existingIndex >= 0) {
        logs.value[existingIndex] = entry
      } else {
        logs.value.push(entry)
      }
      await storageService.saveBodyWeightLog(entry)

      const auth = useAuthStore()
      if (auth.user) syncUpsertBodyWeightLog(auth.user.id, entry)

      return entry
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to log body weight'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Removes a log entry from state and deletes it from storage.
   * @param id - ID of the log entry to delete
   */
  const deleteLog = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      logs.value = logs.value.filter((l) => l.id !== id)
      await storageService.deleteBodyWeightLog(id)

      const auth = useAuthStore()
      if (auth.user) syncDeleteBodyWeightLog(auth.user.id, id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete body weight log'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Loads all body weight logs from IndexedDB into the reactive state.
   * Safe to call multiple times — always replaces current state with storage contents.
   */
  const loadLogs = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const loaded = await storageService.getAllBodyWeightLogs()
      logs.value = loaded
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load body weight logs'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    loading,
    error,
    allLogs,
    logByDate,
    logWeight,
    deleteLog,
    loadLogs,
  }
})
