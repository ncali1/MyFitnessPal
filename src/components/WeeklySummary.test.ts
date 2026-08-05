/**
 * Unit tests for WeeklySummary calculation logic
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useExercisesStore } from '../stores/exercises'

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

// ── helpers ──────────────────────────────────────────────────────────────────

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns the Monday of the week containing the given date string */
function getMondayOf(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

/**
 * Calculates the weekly summary for the week containing `weekStartDate`.
 * Mirrors the logic in WeeklySummary.vue so we can unit-test it in isolation.
 */
function calculateWeeklySummary(
  weekStartStr: string,
  routineForDay: (day: string) => string[],
  sessionByDate: (date: string) => { exercises: { exerciseId: string; completed: boolean }[] } | undefined
) {
  const dailyBreakdown: Record<string, { assigned: number; completed: number }> = {}
  let totalAssigned = 0
  let totalCompleted = 0

  DAYS.forEach((day, i) => {
    const dateStr = addDays(weekStartStr, i)
    const assigned = routineForDay(day).length
    const session = sessionByDate(dateStr)
    const completed = session ? session.exercises.filter((e) => e.completed).length : 0

    dailyBreakdown[day] = { assigned, completed }
    totalAssigned += assigned
    totalCompleted += completed
  })

  const completionPercentage =
    totalAssigned === 0 ? 0 : Math.round((totalCompleted / totalAssigned) * 100)

  return { totalAssigned, totalCompleted, completionPercentage, dailyBreakdown }
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('WeeklySummary calculation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Total assigned count', () => {
    it('should count all exercises assigned across the week', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const ex1 = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      const ex2 = await exercisesStore.createExercise('Bench', 3, 10, ['Chest'])
      const ex3 = await exercisesStore.createExercise('Row', 3, 10, ['Back'])

      await routineStore.assignExercise('monday', ex1.id)
      await routineStore.assignExercise('wednesday', ex2.id)
      await routineStore.assignExercise('friday', ex3.id)

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const sessionsStore = useWorkoutSessionsStore()
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.totalAssigned).toBe(3)
    })

    it('should return 0 assigned when routine is empty', async () => {
      const routineStore = useRoutineStore()
      const sessionsStore = useWorkoutSessionsStore()

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.totalAssigned).toBe(0)
    })

    it('should count multiple exercises on the same day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const ex1 = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      const ex2 = await exercisesStore.createExercise('Lunge', 3, 10, ['Legs'])
      const ex3 = await exercisesStore.createExercise('Calf Raise', 3, 15, ['Legs'])

      await routineStore.assignExercise('monday', ex1.id)
      await routineStore.assignExercise('monday', ex2.id)
      await routineStore.assignExercise('monday', ex3.id)

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.totalAssigned).toBe(3)
    })
  })

  describe('Total completed count', () => {
    it('should count only completed exercises', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const ex1 = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      const ex2 = await exercisesStore.createExercise('Bench', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', ex1.id)
      await routineStore.assignExercise('monday', ex2.id)

      // Complete only ex1 on Monday 2025-01-06
      const session = await sessionsStore.createSession('2025-01-06')
      await sessionsStore.logPerformance(session.id, ex1.id, {
        completed: true,
        actualSets: 3,
        actualReps: 8,
        difficultyLevel: 'moderate',
      })
      await sessionsStore.logPerformance(session.id, ex2.id, {
        completed: false,
      })

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.totalCompleted).toBe(1)
    })

    it('should return 0 completed when no sessions exist', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const ex = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      await routineStore.assignExercise('monday', ex.id)

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.totalCompleted).toBe(0)
    })

    it('should count completions across multiple days', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const ex1 = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      const ex2 = await exercisesStore.createExercise('Bench', 3, 10, ['Chest'])
      const ex3 = await exercisesStore.createExercise('Row', 3, 10, ['Back'])

      await routineStore.assignExercise('monday', ex1.id)
      await routineStore.assignExercise('wednesday', ex2.id)
      await routineStore.assignExercise('friday', ex3.id)

      const mondaySession = await sessionsStore.createSession('2025-01-06')
      await sessionsStore.logPerformance(mondaySession.id, ex1.id, {
        completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'easy',
      })

      const wednesdaySession = await sessionsStore.createSession('2025-01-08')
      await sessionsStore.logPerformance(wednesdaySession.id, ex2.id, {
        completed: true, actualSets: 3, actualReps: 10, difficultyLevel: 'moderate',
      })

      // Friday not completed

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.totalCompleted).toBe(2)
    })
  })

  describe('Completion percentage', () => {
    it('should calculate percentage as (completed / assigned) * 100', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const exercises = await Promise.all([
        exercisesStore.createExercise('Ex1', 3, 8, ['Legs']),
        exercisesStore.createExercise('Ex2', 3, 10, ['Chest']),
        exercisesStore.createExercise('Ex3', 3, 10, ['Back']),
        exercisesStore.createExercise('Ex4', 3, 12, ['Shoulders']),
      ])

      await routineStore.assignExercise('monday', exercises[0]!.id)
      await routineStore.assignExercise('tuesday', exercises[1]!.id)
      await routineStore.assignExercise('wednesday', exercises[2]!.id)
      await routineStore.assignExercise('thursday', exercises[3]!.id)

      // Complete 3 out of 4
      const s1 = await sessionsStore.createSession('2025-01-06')
      await sessionsStore.logPerformance(s1.id, exercises[0]!.id, { completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'easy' })
      const s2 = await sessionsStore.createSession('2025-01-07')
      await sessionsStore.logPerformance(s2.id, exercises[1]!.id, { completed: true, actualSets: 3, actualReps: 10, difficultyLevel: 'moderate' })
      const s3 = await sessionsStore.createSession('2025-01-08')
      await sessionsStore.logPerformance(s3.id, exercises[2]!.id, { completed: true, actualSets: 3, actualReps: 10, difficultyLevel: 'hard' })

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.completionPercentage).toBe(75)
    })

    it('should return 0% when nothing is assigned', async () => {
      const routineStore = useRoutineStore()
      const sessionsStore = useWorkoutSessionsStore()

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.completionPercentage).toBe(0)
    })

    it('should return 100% when all assigned exercises are completed', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const ex = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      await routineStore.assignExercise('monday', ex.id)

      const session = await sessionsStore.createSession('2025-01-06')
      await sessionsStore.logPerformance(session.id, ex.id, {
        completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'easy',
      })

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.completionPercentage).toBe(100)
    })
  })

  describe('Per-day breakdown', () => {
    it('should show correct assigned and completed counts per day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      const ex1 = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      const ex2 = await exercisesStore.createExercise('Bench', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', ex1.id)
      await routineStore.assignExercise('monday', ex2.id)

      const session = await sessionsStore.createSession('2025-01-06')
      await sessionsStore.logPerformance(session.id, ex1.id, {
        completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'easy',
      })

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      expect(result.dailyBreakdown['monday']?.assigned).toBe(2)
      expect(result.dailyBreakdown['monday']?.completed).toBe(1)
      expect(result.dailyBreakdown['tuesday']?.assigned).toBe(0)
      expect(result.dailyBreakdown['tuesday']?.completed).toBe(0)
    })

    it('should include all 7 days in the breakdown', async () => {
      const routineStore = useRoutineStore()
      const sessionsStore = useWorkoutSessionsStore()

      const weekStart = toDateString(getMondayOf('2025-01-06'))
      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      days.forEach((day) => {
        expect(result.dailyBreakdown[day]).toBeDefined()
        expect(result.dailyBreakdown[day]?.assigned).toBe(0)
        expect(result.dailyBreakdown[day]?.completed).toBe(0)
      })
    })
  })
})
