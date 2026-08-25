/**
 * Unit tests for exercise history: the pure `getExerciseHistory` function and the
 * workoutSessions store's cached `getCachedExerciseHistory` getter.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { getExerciseHistory } from '../utils/calculations'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useExercisesStore } from '../stores/exercises'
import type { WorkoutSession } from '../stores/types'

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
    clearAllData: vi.fn(async () => {}),
  },
}))

function makeSession(date: string, exercises: WorkoutSession['exercises']): WorkoutSession {
  return { id: `session-${date}`, date, exercises, createdAt: Date.now(), updatedAt: Date.now() }
}

describe('getExerciseHistory (pure function)', () => {
  it('returns an empty array when no session logged the exercise', () => {
    const sessions = [makeSession('2025-01-06', [{ exerciseId: 'other', completed: true, timestamp: 1 }])]
    expect(getExerciseHistory('ex1', sessions)).toEqual([])
  })

  it('returns one entry per session that logged the exercise, with the session date attached', () => {
    const sessions = [
      makeSession('2025-01-06', [{ exerciseId: 'ex1', completed: true, actualReps: 10, weight: 50, timestamp: 1 }]),
      makeSession('2025-01-08', [{ exerciseId: 'ex1', completed: true, actualReps: 12, weight: 55, timestamp: 2 }]),
    ]
    const history = getExerciseHistory('ex1', sessions)
    expect(history).toHaveLength(2)
    expect(history.every((h) => h.date && h.exerciseId === 'ex1')).toBe(true)
  })

  it('sorts entries newest-first by date', () => {
    const sessions = [
      makeSession('2025-01-06', [{ exerciseId: 'ex1', completed: true, timestamp: 1 }]),
      makeSession('2025-01-20', [{ exerciseId: 'ex1', completed: true, timestamp: 2 }]),
      makeSession('2025-01-13', [{ exerciseId: 'ex1', completed: true, timestamp: 3 }]),
    ]
    const history = getExerciseHistory('ex1', sessions)
    expect(history.map((h) => h.date)).toEqual(['2025-01-20', '2025-01-13', '2025-01-06'])
  })

  it('ignores other exercises logged in the same session', () => {
    const sessions = [
      makeSession('2025-01-06', [
        { exerciseId: 'ex1', completed: true, actualReps: 10, timestamp: 1 },
        { exerciseId: 'ex2', completed: true, actualReps: 20, timestamp: 2 },
      ]),
    ]
    const history = getExerciseHistory('ex1', sessions)
    expect(history).toHaveLength(1)
    expect(history[0]!.actualReps).toBe(10)
  })
})

describe('workoutSessionsStore.getCachedExerciseHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('reflects logged performances for the given exercise, newest first', async () => {
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()
    const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

    const session1 = await sessionsStore.createSession('2025-01-06')
    await sessionsStore.logPerformance(session1.id, exercise.id, { completed: true, actualReps: 8, weight: 40 })
    const session2 = await sessionsStore.createSession('2025-01-13')
    await sessionsStore.logPerformance(session2.id, exercise.id, { completed: true, actualReps: 10, weight: 45 })

    const history = sessionsStore.getCachedExerciseHistory(exercise.id)
    expect(history).toHaveLength(2)
    expect(history[0]!.date).toBe('2025-01-13')
    expect(history[1]!.date).toBe('2025-01-06')
  })

  it('invalidates the cache when a new performance is logged', async () => {
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()
    const exercise = await exercisesStore.createExercise('Squat', 4, 8, ['Legs'])

    expect(sessionsStore.getCachedExerciseHistory(exercise.id)).toHaveLength(0)

    const session = await sessionsStore.createSession('2025-01-06')
    await sessionsStore.logPerformance(session.id, exercise.id, { completed: true, actualReps: 8 })

    expect(sessionsStore.getCachedExerciseHistory(exercise.id)).toHaveLength(1)
  })
})
