/**
 * End-to-End Test: Task 15.4 — View Weekly Summary
 *
 * Validates the complete weekly summary workflow:
 * - Creating exercises and assigning them to days of the week
 * - Logging workout sessions for a full week
 * - Retrieving and verifying weekly summary calculations
 * - Per-day breakdown accuracy
 * - Previous week retrieval
 * - Multiple exercises per day aggregation
 * - Completion percentage formula
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExercisesStore } from '../stores/exercises'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { calculateWeeklySummary, getWeekStart } from '../utils/calculations'
import type { Exercise, Routine } from '../stores/types'

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

// Primary test week: 2025-01-06 (Monday) through 2025-01-12 (Sunday)
const WEEK_START = '2025-01-06'
const WEEK_DATES: Record<string, string> = {
  monday: '2025-01-06',
  tuesday: '2025-01-07',
  wednesday: '2025-01-08',
  thursday: '2025-01-09',
  friday: '2025-01-10',
  saturday: '2025-01-11',
  sunday: '2025-01-12',
}

// Previous week: 2024-12-30 (Monday) through 2025-01-05 (Sunday)
const PREV_WEEK_START = '2024-12-30'
const PREV_WEEK_DATES: Record<string, string> = {
  monday: '2024-12-30',
  tuesday: '2024-12-31',
  wednesday: '2025-01-01',
  thursday: '2025-01-02',
  friday: '2025-01-03',
  saturday: '2025-01-04',
  sunday: '2025-01-05',
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

describe('E2E: View Weekly Summary (Task 15.4)', () => {
  let exercisesStore: ReturnType<typeof useExercisesStore>
  let routineStore: ReturnType<typeof useRoutineStore>
  let sessionsStore: ReturnType<typeof useWorkoutSessionsStore>
  let exercises: Exercise[]

  beforeEach(async () => {
    setActivePinia(createPinia())

    exercisesStore = useExercisesStore()
    routineStore = useRoutineStore()
    sessionsStore = useWorkoutSessionsStore()

    // Create 7 exercises — one per day of the week
    exercises = await Promise.all([
      exercisesStore.createExercise('Bench Press', 3, 10, ['Chest', 'Triceps']),
      exercisesStore.createExercise('Squat', 4, 8, ['Legs', 'Glutes']),
      exercisesStore.createExercise('Deadlift', 3, 5, ['Back', 'Legs']),
      exercisesStore.createExercise('Overhead Press', 3, 8, ['Shoulders']),
      exercisesStore.createExercise('Pull-up', 3, 10, ['Back', 'Biceps']),
      exercisesStore.createExercise('Dumbbell Row', 3, 12, ['Back']),
      exercisesStore.createExercise('Plank', 3, 60, ['Core']),
    ])

    // Assign one exercise per day
    for (let i = 0; i < DAYS.length; i++) {
      await routineStore.assignExercise(DAYS[i]!, exercises[i]!.id)
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 5.1: Weekly summary shows all days of the current week
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 5.1 — Weekly summary shows all days of the week', () => {
    it('should include all 7 days in the dailyBreakdown', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.dailyBreakdown).toBeDefined()
      for (const day of DAYS) {
        expect(summary.dailyBreakdown).toHaveProperty(day)
      }
    })

    it('should have correct weekStartDate and weekEndDate', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.weekStartDate).toEqual(new Date(2025, 0, 6))
      expect(summary.weekEndDate).toEqual(new Date(2025, 0, 12))
    })

    it('getWeekStart should return the Monday of any given date in the week', () => {
      // Any date in the week 2025-01-06 to 2025-01-12 should return 2025-01-06
      expect(getWeekStart('2025-01-06')).toBe('2025-01-06') // Monday
      expect(getWeekStart('2025-01-08')).toBe('2025-01-06') // Wednesday
      expect(getWeekStart('2025-01-12')).toBe('2025-01-06') // Sunday
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 5.2: Shows per-day which exercises were completed / not
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 5.2 — Per-day breakdown of completed vs assigned', () => {
    it('should show assigned count per day matching the routine', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      // Each day has exactly 1 exercise assigned
      for (const day of DAYS) {
        expect(summary.dailyBreakdown[day]!.assigned).toBe(1)
      }
    })

    it('should show completed = 0 for days with no session logged', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      for (const day of DAYS) {
        expect(summary.dailyBreakdown[day]!.completed).toBe(0)
      }
    })

    it('should reflect completed exercises in the per-day breakdown', async () => {
      // Log Monday and Wednesday as completed, leave others empty
      const monSession = await sessionsStore.createSession(WEEK_DATES.monday!)
      await sessionsStore.logPerformance(monSession.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'moderate',
      })

      const wedSession = await sessionsStore.createSession(WEEK_DATES.wednesday!)
      await sessionsStore.logPerformance(wedSession.id, exercises[2]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 5,
        weight: 140,
        difficultyLevel: 'hard',
      })

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.dailyBreakdown['monday']!.completed).toBe(1)
      expect(summary.dailyBreakdown['tuesday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['wednesday']!.completed).toBe(1)
      expect(summary.dailyBreakdown['thursday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['friday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['saturday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['sunday']!.completed).toBe(0)
    })

    it('should not count incomplete exercises as completed in the breakdown', async () => {
      // Log Tuesday with completed = false
      const tueSession = await sessionsStore.createSession(WEEK_DATES.tuesday!)
      await sessionsStore.logPerformance(tueSession.id, exercises[1]!.id, {
        completed: false,
      })

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.dailyBreakdown['tuesday']!.assigned).toBe(1)
      expect(summary.dailyBreakdown['tuesday']!.completed).toBe(0)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 5.3: Total completed workouts for the week
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 5.3 — Total completed workouts for the week', () => {
    it('should report totalCompletedWorkouts = 7 when all exercises are completed', async () => {
      // Log all 7 days as completed
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })
      }

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.totalCompletedWorkouts).toBe(7)
      expect(summary.totalAssignedWorkouts).toBe(7)
    })

    it('should report totalCompletedWorkouts = 0 when no sessions are logged', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.totalCompletedWorkouts).toBe(0)
      expect(summary.totalAssignedWorkouts).toBe(7)
    })

    it('should count only completed exercises toward totalCompletedWorkouts', async () => {
      // Log 3 days completed, 1 day incomplete, 3 days no session
      const completedDays = ['monday', 'wednesday', 'friday'] as const
      const incompleteDays = ['tuesday'] as const

      for (const day of completedDays) {
        const idx = DAYS.indexOf(day)
        const session = await sessionsStore.createSession(WEEK_DATES[day]!)
        await sessionsStore.logPerformance(session.id, exercises[idx]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'easy',
        })
      }

      for (const day of incompleteDays) {
        const idx = DAYS.indexOf(day)
        const session = await sessionsStore.createSession(WEEK_DATES[day]!)
        await sessionsStore.logPerformance(session.id, exercises[idx]!.id, {
          completed: false,
        })
      }

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.totalCompletedWorkouts).toBe(3)
      expect(summary.totalAssignedWorkouts).toBe(7)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 5.4: Completion percentage (completed / assigned * 100)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 5.4 — Completion percentage calculation', () => {
    it('should return completionPercentage = 100 when all exercises are completed', async () => {
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })
      }

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.completionPercentage).toBe(100)
    })

    it('should return completionPercentage = 0 when no sessions are logged', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.completionPercentage).toBe(0)
    })

    it('should calculate completionPercentage correctly for partial completion', async () => {
      // Complete 3 out of 7 days → Math.round(3/7 * 100) = 43
      const completedDays = ['monday', 'wednesday', 'friday'] as const
      for (const day of completedDays) {
        const idx = DAYS.indexOf(day)
        const session = await sessionsStore.createSession(WEEK_DATES[day]!)
        await sessionsStore.logPerformance(session.id, exercises[idx]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'easy',
        })
      }

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.completionPercentage).toBe(Math.round((3 / 7) * 100))
    })

    it('should return completionPercentage = 0 when no exercises are assigned', async () => {
      // Use a fresh routine with no assignments
      const emptyRoutine: Routine = {
        id: 'empty',
        weeklyAssignments: {
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
          sunday: [],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }

      const summary = calculateWeeklySummary(WEEK_START, emptyRoutine, [])
      expect(summary.completionPercentage).toBe(0)
      expect(summary.totalAssignedWorkouts).toBe(0)
      expect(summary.totalCompletedWorkouts).toBe(0)
    })

    it('should round the completion percentage to the nearest integer', async () => {
      // 1 out of 7 → Math.round(1/7 * 100) = 14
      const session = await sessionsStore.createSession(WEEK_DATES.monday!)
      await sessionsStore.logPerformance(session.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'easy',
      })

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.completionPercentage).toBe(Math.round((1 / 7) * 100))
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 5.5: View weekly summaries for previous weeks
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 5.5 — View weekly summaries for previous weeks', () => {
    it('should return independent summaries for different weeks', async () => {
      const routine = routineStore.routine!

      // Log 3 days in the current week
      for (const day of ['monday', 'wednesday', 'friday'] as const) {
        const idx = DAYS.indexOf(day)
        const session = await sessionsStore.createSession(WEEK_DATES[day]!)
        await sessionsStore.logPerformance(session.id, exercises[idx]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })
      }

      // Log 5 days in the previous week
      for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const) {
        const idx = DAYS.indexOf(day)
        const session = await sessionsStore.createSession(PREV_WEEK_DATES[day]!)
        await sessionsStore.logPerformance(session.id, exercises[idx]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })
      }

      const currentSummary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)
      const prevSummary = sessionsStore.getCachedWeeklySummary(PREV_WEEK_START, routine)

      // Current week: 3 completed out of 7
      expect(currentSummary.totalCompletedWorkouts).toBe(3)
      expect(currentSummary.totalAssignedWorkouts).toBe(7)
      expect(currentSummary.completionPercentage).toBe(Math.round((3 / 7) * 100))

      // Previous week: 5 completed out of 7
      expect(prevSummary.totalCompletedWorkouts).toBe(5)
      expect(prevSummary.totalAssignedWorkouts).toBe(7)
      expect(prevSummary.completionPercentage).toBe(Math.round((5 / 7) * 100))
    })

    it('should have correct weekStartDate and weekEndDate for the previous week', async () => {
      const routine = routineStore.routine!
      const prevSummary = sessionsStore.getCachedWeeklySummary(PREV_WEEK_START, routine)

      expect(prevSummary.weekStartDate).toEqual(new Date(2024, 11, 30)) // Dec 30, 2024
      expect(prevSummary.weekEndDate).toEqual(new Date(2025, 0, 5))    // Jan 5, 2025
    })

    it('should show empty previous week when no sessions were logged for it', async () => {
      // Log current week only
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'easy',
        })
      }

      const routine = routineStore.routine!
      const prevSummary = sessionsStore.getCachedWeeklySummary(PREV_WEEK_START, routine)

      expect(prevSummary.totalCompletedWorkouts).toBe(0)
      expect(prevSummary.completionPercentage).toBe(0)
    })

    it('should not mix sessions from different weeks', async () => {
      const routine = routineStore.routine!

      // Log Monday of current week
      const currSession = await sessionsStore.createSession(WEEK_DATES.monday!)
      await sessionsStore.logPerformance(currSession.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'easy',
      })

      // Log Monday of previous week
      const prevSession = await sessionsStore.createSession(PREV_WEEK_DATES.monday!)
      await sessionsStore.logPerformance(prevSession.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'easy',
      })

      const currentSummary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)
      const prevSummary = sessionsStore.getCachedWeeklySummary(PREV_WEEK_START, routine)

      // Each week should only count its own sessions
      expect(currentSummary.totalCompletedWorkouts).toBe(1)
      expect(prevSummary.totalCompletedWorkouts).toBe(1)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Multiple exercises per day — aggregate counts correctly
  // ─────────────────────────────────────────────────────────────────────────
  describe('Multiple exercises per day — aggregate counts', () => {
    it('should count all completed exercises when multiple are assigned to a day', async () => {
      // Assign 2 more exercises to Monday (total 3 on Monday)
      const ex2 = await exercisesStore.createExercise('Incline Press', 3, 8, ['Chest'])
      const ex3 = await exercisesStore.createExercise('Cable Fly', 3, 15, ['Chest'])
      await routineStore.assignExercise('monday', ex2.id)
      await routineStore.assignExercise('monday', ex3.id)

      // Log Monday: 2 completed, 1 incomplete
      const session = await sessionsStore.createSession(WEEK_DATES.monday!)
      await sessionsStore.logPerformance(session.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'moderate',
      })
      await sessionsStore.logPerformance(session.id, ex2.id, {
        completed: true,
        actualSets: 3,
        actualReps: 8,
        weight: 70,
        difficultyLevel: 'hard',
      })
      await sessionsStore.logPerformance(session.id, ex3.id, {
        completed: false,
      })

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      // Monday: 3 assigned, 2 completed
      expect(summary.dailyBreakdown['monday']!.assigned).toBe(3)
      expect(summary.dailyBreakdown['monday']!.completed).toBe(2)

      // Total: 3 (Mon) + 1 each for Tue–Sun = 9 assigned; 2 completed
      expect(summary.totalAssignedWorkouts).toBe(9)
      expect(summary.totalCompletedWorkouts).toBe(2)
    })

    it('should aggregate totalAssigned correctly across all days with multiple exercises', async () => {
      // Add 1 extra exercise to Tuesday and Thursday
      const extraTue = await exercisesStore.createExercise('Leg Press', 4, 12, ['Legs'])
      const extraThu = await exercisesStore.createExercise('Lateral Raise', 3, 15, ['Shoulders'])
      await routineStore.assignExercise('tuesday', extraTue.id)
      await routineStore.assignExercise('thursday', extraThu.id)

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      // 7 base + 2 extra = 9 total assigned
      expect(summary.totalAssignedWorkouts).toBe(9)
      expect(summary.dailyBreakdown['tuesday']!.assigned).toBe(2)
      expect(summary.dailyBreakdown['thursday']!.assigned).toBe(2)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Full week integration: all scenarios combined
  // ─────────────────────────────────────────────────────────────────────────
  describe('Full week integration — complete workflow', () => {
    it('should produce correct summary for a fully logged week', async () => {
      // Log all 7 days as completed
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })
      }

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      // Req 5.1: all 7 days present
      expect(Object.keys(summary.dailyBreakdown)).toHaveLength(7)

      // Req 5.2: each day has 1 assigned and 1 completed
      for (const day of DAYS) {
        expect(summary.dailyBreakdown[day]!.assigned).toBe(1)
        expect(summary.dailyBreakdown[day]!.completed).toBe(1)
      }

      // Req 5.3: total completed = 7
      expect(summary.totalCompletedWorkouts).toBe(7)
      expect(summary.totalAssignedWorkouts).toBe(7)

      // Req 5.4: 100% completion
      expect(summary.completionPercentage).toBe(100)
    })

    it('should produce correct summary for a partially logged week', async () => {
      // Log only Mon, Tue, Wed as completed; Thu logged but incomplete
      const completedDays = ['monday', 'tuesday', 'wednesday'] as const
      for (const day of completedDays) {
        const idx = DAYS.indexOf(day)
        const session = await sessionsStore.createSession(WEEK_DATES[day]!)
        await sessionsStore.logPerformance(session.id, exercises[idx]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'easy',
        })
      }

      const thuSession = await sessionsStore.createSession(WEEK_DATES.thursday!)
      await sessionsStore.logPerformance(thuSession.id, exercises[3]!.id, {
        completed: false,
      })

      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.totalCompletedWorkouts).toBe(3)
      expect(summary.totalAssignedWorkouts).toBe(7)
      expect(summary.completionPercentage).toBe(Math.round((3 / 7) * 100))

      // Verify per-day breakdown
      expect(summary.dailyBreakdown['monday']!.completed).toBe(1)
      expect(summary.dailyBreakdown['tuesday']!.completed).toBe(1)
      expect(summary.dailyBreakdown['wednesday']!.completed).toBe(1)
      expect(summary.dailyBreakdown['thursday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['friday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['saturday']!.completed).toBe(0)
      expect(summary.dailyBreakdown['sunday']!.completed).toBe(0)
    })

    it('should produce correct summary for an empty week (no sessions)', async () => {
      const routine = routineStore.routine!
      const summary = sessionsStore.getCachedWeeklySummary(WEEK_START, routine)

      expect(summary.totalCompletedWorkouts).toBe(0)
      expect(summary.totalAssignedWorkouts).toBe(7)
      expect(summary.completionPercentage).toBe(0)

      for (const day of DAYS) {
        expect(summary.dailyBreakdown[day]!.assigned).toBe(1)
        expect(summary.dailyBreakdown[day]!.completed).toBe(0)
      }
    })
  })
})
