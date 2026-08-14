/**
 * Property 6: Weekly Summary Calculation
 *
 * For any week with assigned and completed exercises, the weekly summary must
 * correctly calculate total assigned workouts, total completed workouts, and
 * completion percentage (completed / assigned); the summary must show per-day
 * completion status.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 *
 * Property 7: Weekly Summary Retrieval
 *
 * For any date, the system must be able to retrieve the weekly summary for the
 * week containing that date; summaries for previous weeks must be retrievable
 * and accurate.
 *
 * Validates: Requirements 5.5
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

// ── helpers ───────────────────────────────────────────────────────────────────

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type Day = typeof DAYS[number]

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOf(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return toDateString(d)
}

function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

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

// ── scenario generators ───────────────────────────────────────────────────────

interface WeekScenario {
  /** How many exercises to assign per day (0 = rest day) */
  assignedPerDay: Record<Day, number>
  /** How many of those to mark completed */
  completedPerDay: Record<Day, number>
}

function generateScenarios(): WeekScenario[] {
  const scenarios: WeekScenario[] = []

  // Scenario: all rest days
  scenarios.push({
    assignedPerDay: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 },
    completedPerDay: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 },
  })

  // Scenario: 1 exercise every day, all completed
  scenarios.push({
    assignedPerDay: { monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
    completedPerDay: { monday: 1, tuesday: 1, wednesday: 1, thursday: 1, friday: 1, saturday: 1, sunday: 1 },
  })

  // Scenario: 2 exercises every day, none completed
  scenarios.push({
    assignedPerDay: { monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 2, sunday: 2 },
    completedPerDay: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 },
  })

  // Scenario: typical 3-day split (Mon/Wed/Fri), partial completion
  scenarios.push({
    assignedPerDay: { monday: 3, tuesday: 0, wednesday: 3, thursday: 0, friday: 3, saturday: 0, sunday: 0 },
    completedPerDay: { monday: 2, tuesday: 0, wednesday: 3, thursday: 0, friday: 1, saturday: 0, sunday: 0 },
  })

  // Scenario: 5-day plan, all completed
  scenarios.push({
    assignedPerDay: { monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 0, sunday: 0 },
    completedPerDay: { monday: 2, tuesday: 2, wednesday: 2, thursday: 2, friday: 2, saturday: 0, sunday: 0 },
  })

  // Scenario: weekend warrior
  scenarios.push({
    assignedPerDay: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 4, sunday: 4 },
    completedPerDay: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 2, sunday: 4 },
  })

  return scenarios
}

// ── Property 6 tests ──────────────────────────────────────────────────────────

describe('Property 6: Weekly Summary Calculation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should correctly calculate totals and percentage for any valid week scenario', async () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      setActivePinia(createPinia())

      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const sessionsStore = useWorkoutSessionsStore()

      // Create a pool of exercises large enough for the scenario
      const maxPerDay = Math.max(...Object.values(scenario.assignedPerDay))
      const exercisePool = await Promise.all(
        Array.from({ length: Math.max(maxPerDay, 1) }, (_, i) =>
          exercisesStore.createExercise(`Exercise ${i + 1}`, 3, 10, ['Chest'])
        )
      )

      const weekStart = '2025-01-06' // a known Monday

      // Assign exercises to each day
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i]!
        const count = scenario.assignedPerDay[day]
        for (let j = 0; j < count; j++) {
          await routineStore.assignExercise(day, exercisePool[j]!.id)
        }
      }

      // Log completions
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i]!
        const assigned = scenario.assignedPerDay[day]
        const completed = scenario.completedPerDay[day]
        if (assigned === 0) continue

        const dateStr = addDays(weekStart, i)
        const session = await sessionsStore.createSession(dateStr)

        for (let j = 0; j < assigned; j++) {
          await sessionsStore.logPerformance(session.id, exercisePool[j]!.id, {
            completed: j < completed,
            ...(j < completed
              ? { actualSets: 3, actualReps: 10, difficultyLevel: 'moderate' as const }
              : {}),
          })
        }
      }

      const result = calculateWeeklySummary(
        weekStart,
        (day) => routineStore.routineForDay(day),
        (date) => sessionsStore.sessionByDate(date)
      )

      const expectedAssigned = Object.values(scenario.assignedPerDay).reduce((a, b) => a + b, 0)
      const expectedCompleted = Object.values(scenario.completedPerDay).reduce((a, b) => a + b, 0)
      const expectedPct = expectedAssigned === 0
        ? 0
        : Math.round((expectedCompleted / expectedAssigned) * 100)

      // Property: total assigned must equal sum of per-day assigned counts
      expect(result.totalAssigned).toBe(expectedAssigned)

      // Property: total completed must equal sum of per-day completed counts
      expect(result.totalCompleted).toBe(expectedCompleted)

      // Property: completion percentage = round((completed / assigned) * 100)
      expect(result.completionPercentage).toBe(expectedPct)

      // Property: completed never exceeds assigned
      expect(result.totalCompleted).toBeLessThanOrEqual(result.totalAssigned)

      // Property: percentage is in [0, 100]
      expect(result.completionPercentage).toBeGreaterThanOrEqual(0)
      expect(result.completionPercentage).toBeLessThanOrEqual(100)

      // Property: per-day breakdown is accurate
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i]!
        expect(result.dailyBreakdown[day]?.assigned).toBe(scenario.assignedPerDay[day])
        expect(result.dailyBreakdown[day]?.completed).toBe(scenario.completedPerDay[day])
      }
    }
  })

  it('should always include all 7 days in the breakdown regardless of assignments', async () => {
    const routineStore = useRoutineStore()
    const sessionsStore = useWorkoutSessionsStore()

    const result = calculateWeeklySummary(
      '2025-01-06',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )

    DAYS.forEach((day) => {
      expect(result.dailyBreakdown[day]).toBeDefined()
    })
  })

  it('should never have completed > assigned for any day', async () => {
    const routineStore = useRoutineStore()
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()

    const ex = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
    await routineStore.assignExercise('monday', ex.id)

    const session = await sessionsStore.createSession('2025-01-06')
    await sessionsStore.logPerformance(session.id, ex.id, {
      completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'easy',
    })

    const result = calculateWeeklySummary(
      '2025-01-06',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )

    DAYS.forEach((day) => {
      const { assigned, completed } = result.dailyBreakdown[day]!
      expect(completed).toBeLessThanOrEqual(assigned)
    })
  })
})

// ── Property 7 tests ──────────────────────────────────────────────────────────

describe('Property 7: Weekly Summary Retrieval', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should retrieve accurate summaries for multiple different weeks', async () => {
    const routineStore = useRoutineStore()
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()

    const ex = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
    await routineStore.assignExercise('monday', ex.id)

    // Week 1: 2025-01-06 (Monday) — completed
    const s1 = await sessionsStore.createSession('2025-01-06')
    await sessionsStore.logPerformance(s1.id, ex.id, {
      completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'easy',
    })

    // Week 2: 2025-01-13 (Monday) — not completed
    // (no session created)

    // Week 3: 2025-01-20 (Monday) — completed
    const s3 = await sessionsStore.createSession('2025-01-20')
    await sessionsStore.logPerformance(s3.id, ex.id, {
      completed: true, actualSets: 3, actualReps: 8, difficultyLevel: 'moderate',
    })

    const week1 = calculateWeeklySummary(
      '2025-01-06',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )
    const week2 = calculateWeeklySummary(
      '2025-01-13',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )
    const week3 = calculateWeeklySummary(
      '2025-01-20',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )

    expect(week1.totalCompleted).toBe(1)
    expect(week2.totalCompleted).toBe(0)
    expect(week3.totalCompleted).toBe(1)
  })

  it('should not let data from one week affect another week summary', async () => {
    const routineStore = useRoutineStore()
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()

    const ex = await exercisesStore.createExercise('Bench', 3, 10, ['Chest'])
    await routineStore.assignExercise('wednesday', ex.id)

    // Only log for week 1
    const s = await sessionsStore.createSession('2025-01-08') // Wednesday of week 1
    await sessionsStore.logPerformance(s.id, ex.id, {
      completed: true, actualSets: 3, actualReps: 10, difficultyLevel: 'hard',
    })

    const week1 = calculateWeeklySummary(
      '2025-01-06',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )
    const week2 = calculateWeeklySummary(
      '2025-01-13',
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )

    // Week 1 has the completion
    expect(week1.totalCompleted).toBe(1)
    // Week 2 should be unaffected
    expect(week2.totalCompleted).toBe(0)
    expect(week2.totalAssigned).toBe(1) // routine still applies
  })

  it('should correctly identify the week boundaries for any given date', () => {
    // Verify getMondayOf returns the correct Monday for various dates
    const cases: Array<{ input: string; expectedMonday: string }> = [
      { input: '2025-01-06', expectedMonday: '2025-01-06' }, // already Monday
      { input: '2025-01-07', expectedMonday: '2025-01-06' }, // Tuesday
      { input: '2025-01-08', expectedMonday: '2025-01-06' }, // Wednesday
      { input: '2025-01-09', expectedMonday: '2025-01-06' }, // Thursday
      { input: '2025-01-10', expectedMonday: '2025-01-06' }, // Friday
      { input: '2025-01-11', expectedMonday: '2025-01-06' }, // Saturday
      { input: '2025-01-12', expectedMonday: '2025-01-06' }, // Sunday
      { input: '2025-01-13', expectedMonday: '2025-01-13' }, // next Monday
    ]

    cases.forEach(({ input, expectedMonday }) => {
      expect(getMondayOf(input)).toBe(expectedMonday)
    })
  })

  it('should produce consistent results when the same week is queried multiple times', async () => {
    const routineStore = useRoutineStore()
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()

    const ex = await exercisesStore.createExercise('Deadlift', 3, 5, ['Back'])
    await routineStore.assignExercise('friday', ex.id)

    const session = await sessionsStore.createSession('2025-01-10')
    await sessionsStore.logPerformance(session.id, ex.id, {
      completed: true, actualSets: 3, actualReps: 5, difficultyLevel: 'hard',
    })

    const weekStart = '2025-01-06'
    const result1 = calculateWeeklySummary(
      weekStart,
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )
    const result2 = calculateWeeklySummary(
      weekStart,
      (day) => routineStore.routineForDay(day),
      (date) => sessionsStore.sessionByDate(date)
    )

    expect(result1.totalAssigned).toBe(result2.totalAssigned)
    expect(result1.totalCompleted).toBe(result2.totalCompleted)
    expect(result1.completionPercentage).toBe(result2.completionPercentage)
  })
})
