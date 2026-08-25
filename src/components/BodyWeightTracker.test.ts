/**
 * Unit tests for the bodyWeight store: upsert-by-date logging, deletion, and loading.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBodyWeightStore } from '../stores/bodyWeight'

vi.mock('../services/storage', () => ({
  storageService: {
    saveExercise: vi.fn(async () => {}),
    getExercise: vi.fn(async () => undefined),
    getAllExercises: vi.fn(async () => []),
    deleteExercise: vi.fn(async () => {}),
    saveRoutine: vi.fn(async () => {}),
    getAllRoutines: vi.fn(async () => []),
    deleteRoutine: vi.fn(async () => {}),
    saveWorkoutSession: vi.fn(async () => {}),
    getWorkoutSession: vi.fn(async () => undefined),
    getWorkoutSessionByDate: vi.fn(async () => undefined),
    getAllWorkoutSessions: vi.fn(async () => []),
    deleteWorkoutSession: vi.fn(async () => {}),
    saveBodyWeightLog: vi.fn(async () => {}),
    getAllBodyWeightLogs: vi.fn(async () => []),
    deleteBodyWeightLog: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

describe('bodyWeightStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('logs a new entry for a date that has never been logged', async () => {
    const store = useBodyWeightStore()
    const entry = await store.logWeight('2025-01-06', 75)

    expect(store.logs).toHaveLength(1)
    expect(entry.date).toBe('2025-01-06')
    expect(entry.weightKg).toBe(75)
  })

  it('overwrites the existing entry when logging again on the same date', async () => {
    const store = useBodyWeightStore()
    const first = await store.logWeight('2025-01-06', 75)
    const second = await store.logWeight('2025-01-06', 76.5)

    expect(store.logs).toHaveLength(1)
    expect(second.id).toBe(first.id)
    expect(store.logByDate('2025-01-06')?.weightKg).toBe(76.5)
  })

  it('keeps separate entries for different dates', async () => {
    const store = useBodyWeightStore()
    await store.logWeight('2025-01-06', 75)
    await store.logWeight('2025-01-07', 74.8)

    expect(store.logs).toHaveLength(2)
  })

  it('allLogs returns entries sorted oldest-first regardless of log order', async () => {
    const store = useBodyWeightStore()
    await store.logWeight('2025-01-13', 74)
    await store.logWeight('2025-01-06', 75)

    expect(store.allLogs.map((l) => l.date)).toEqual(['2025-01-06', '2025-01-13'])
  })

  it('deletes a log entry', async () => {
    const store = useBodyWeightStore()
    const entry = await store.logWeight('2025-01-06', 75)
    await store.deleteLog(entry.id)

    expect(store.logs).toHaveLength(0)
  })

  it('loadLogs replaces state with storage contents', async () => {
    const store = useBodyWeightStore()
    await store.logWeight('2025-01-06', 75)

    await store.loadLogs() // mocked storage returns [] — should clear local state
    expect(store.logs).toHaveLength(0)
  })
})
