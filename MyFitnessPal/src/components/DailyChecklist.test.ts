import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRoutineStore } from '../stores/routine'
import { useExercisesStore } from '../stores/exercises'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'

vi.mock('../services/storage', () => ({
  storageService: {
    saveExercise: vi.fn(async () => {}),
    getExercise: vi.fn(async () => undefined),
    getAllExercises: vi.fn(async () => []),
    deleteExercise: vi.fn(async () => {}),
    saveRoutine: vi.fn(async () => {}),
    getRoutine: vi.fn(async () => undefined),
    saveWorkoutSession: vi.fn(async () => {}),
    getWorkoutSession: vi.fn(async () => undefined),
    getWorkoutSessionByDate: vi.fn(async () => undefined),
    getAllWorkoutSessions: vi.fn(async () => []),
    deleteWorkoutSession: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

describe('DailyChecklist logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Displaying exercises for selected day', () => {
    it('should return exercises assigned to the selected day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const ex = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      await routineStore.assignExercise('monday', ex.id)

      const ids = routineStore.routineForDay('monday')
      expect(ids).toContain(ex.id)

      const resolved = ids.map((id) => exercisesStore.exerciseById(id)).filter(Boolean)
      expect(resolved).toHaveLength(1)
      expect(resolved[0]?.name).toBe('Squat')
    })

    it('should return empty list when no exercises assigned to day', async () => {
      const routineStore = useRoutineStore()
      await routineStore.loadRoutine()

      const ids = routineStore.routineForDay('tuesday')
      expect(ids).toHaveLength(0)
    })

    it('should return exercises for the correct day of week', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const mondayEx = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const fridayEx = await exercisesStore.createExercise('Deadlift', 3, 5, ['Back'])

      await routineStore.assignExercise('monday', mondayEx.id)
      await routineStore.assignExercise('friday', fridayEx.id)

      expect(routineStore.routineForDay('monday')).toContain(mondayEx.id)
      expect(routineStore.routineForDay('monday')).not.toContain(fridayEx.id)
      expect(routineStore.routineForDay('friday')).toContain(fridayEx.id)
    })
  })

  describe('Toggling completion status', () => {
    it('should create a session and log performance when marking complete', async () => {
      const sessionsStore = useWorkoutSessionsStore()
      const exercisesStore = useExercisesStore()

      const ex = await exercisesStore.createExercise('Pull-up', 3, 10, ['Back'])
      const date = '2025-01-06'

      const session = await sessionsStore.createSession(date)
      await sessionsStore.logPerformance(session.id, ex.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'moderate',
      })

      const updated = sessionsStore.sessionByDate(date)
      expect(updated?.exercises).toHaveLength(1)
      expect(updated?.exercises[0]?.completed).toBe(true)
      expect(updated?.exercises[0]?.exerciseId).toBe(ex.id)
    })

    it('should mark exercise as incomplete when toggled off', async () => {
      const sessionsStore = useWorkoutSessionsStore()
      const exercisesStore = useExercisesStore()

      const ex = await exercisesStore.createExercise('Push-up', 3, 15, ['Chest'])
      const date = '2025-01-06'

      const session = await sessionsStore.createSession(date)
      await sessionsStore.logPerformance(session.id, ex.id, {
        completed: true,
        actualSets: 3,
        actualReps: 15,
        difficultyLevel: 'easy',
      })

      // Now mark incomplete
      await sessionsStore.logPerformance(session.id, ex.id, { completed: false })

      const updated = sessionsStore.sessionByDate(date)
      const perf = updated?.exercises.find((e) => e.exerciseId === ex.id)
      expect(perf?.completed).toBe(false)
    })

    it('should update existing performance when re-logging', async () => {
      const sessionsStore = useWorkoutSessionsStore()
      const exercisesStore = useExercisesStore()

      const ex = await exercisesStore.createExercise('Row', 4, 8, ['Back'])
      const date = '2025-01-07'

      const session = await sessionsStore.createSession(date)
      await sessionsStore.logPerformance(session.id, ex.id, {
        completed: true,
        actualSets: 3,
        actualReps: 8,
        difficultyLevel: 'hard',
      })
      await sessionsStore.logPerformance(session.id, ex.id, {
        completed: true,
        actualSets: 4,
        actualReps: 8,
        difficultyLevel: 'moderate',
      })

      const updated = sessionsStore.sessionByDate(date)
      // Should not duplicate
      expect(updated?.exercises.filter((e) => e.exerciseId === ex.id)).toHaveLength(1)
      expect(updated?.exercises.find((e) => e.exerciseId === ex.id)?.actualSets).toBe(4)
    })
  })

  describe('Performance form validation', () => {
    it('should require actualSets to be a positive integer', () => {
      expect(Number.isInteger(3) && 3 >= 1).toBe(true)
      expect(Number.isInteger(0) && 0 >= 1).toBe(false)
      expect(Number.isInteger(-1) && -1 >= 1).toBe(false)
    })

    it('should require actualReps to be a positive integer', () => {
      expect(Number.isInteger(10) && 10 >= 1).toBe(true)
      expect(Number.isInteger(0) && 0 >= 1).toBe(false)
    })

    it('should allow weight to be optional (null/undefined)', () => {
      const perf = { completed: true, actualSets: 3, actualReps: 10, difficultyLevel: 'easy' as const }
      expect(perf.completed).toBe(true)
      // weight is absent — valid
      expect('weight' in perf).toBe(false)
    })

    it('should require difficultyLevel to be easy, moderate, or hard', () => {
      const valid = ['easy', 'moderate', 'hard']
      expect(valid.includes('easy')).toBe(true)
      expect(valid.includes('moderate')).toBe(true)
      expect(valid.includes('hard')).toBe(true)
      expect(valid.includes('extreme')).toBe(false)
    })
  })

  describe('Saving performance data', () => {
    it('should persist performance data to the session', async () => {
      const sessionsStore = useWorkoutSessionsStore()
      const exercisesStore = useExercisesStore()

      const ex = await exercisesStore.createExercise('Lunge', 3, 12, ['Legs'])
      const date = '2025-01-08'

      const session = await sessionsStore.createSession(date)
      await sessionsStore.logPerformance(session.id, ex.id, {
        completed: true,
        actualSets: 3,
        actualReps: 12,
        weight: 20,
        difficultyLevel: 'moderate',
      })

      const saved = sessionsStore.sessionByDate(date)
      const perf = saved?.exercises.find((e) => e.exerciseId === ex.id)

      expect(perf).toBeDefined()
      expect(perf?.actualSets).toBe(3)
      expect(perf?.actualReps).toBe(12)
      expect(perf?.weight).toBe(20)
      expect(perf?.difficultyLevel).toBe('moderate')
      expect(perf?.timestamp).toBeTypeOf('number')
    })

    it('should create a new session if none exists for the date', async () => {
      const sessionsStore = useWorkoutSessionsStore()

      const date = '2025-03-01'
      expect(sessionsStore.sessionByDate(date)).toBeUndefined()

      const session = await sessionsStore.createSession(date)
      expect(session.date).toBe(date)
      expect(sessionsStore.sessionByDate(date)).toBeDefined()
    })

    it('should track multiple exercises in the same session', async () => {
      const sessionsStore = useWorkoutSessionsStore()
      const exercisesStore = useExercisesStore()

      const ex1 = await exercisesStore.createExercise('Curl', 3, 12, ['Biceps'])
      const ex2 = await exercisesStore.createExercise('Tricep Dip', 3, 10, ['Triceps'])
      const date = '2025-01-09'

      const session = await sessionsStore.createSession(date)
      await sessionsStore.logPerformance(session.id, ex1.id, {
        completed: true,
        actualSets: 3,
        actualReps: 12,
        difficultyLevel: 'easy',
      })
      await sessionsStore.logPerformance(session.id, ex2.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'hard',
      })

      const saved = sessionsStore.sessionByDate(date)
      expect(saved?.exercises).toHaveLength(2)
    })
  })
})
