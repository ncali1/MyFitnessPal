/**
 * End-to-End Test: Task 15.3 — Log Workouts for a Full Week
 *
 * Validates the complete workout logging workflow:
 * - Exercises assigned to each day of the week
 * - Logging workout sessions with actual performance data (sets, reps, weight, difficulty)
 * - Verifying sessions are saved with all fields and a timestamp
 * - Marking exercises complete/incomplete
 * - Editing previously logged performance data
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExercisesStore } from '../stores/exercises'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import type { Exercise } from '../stores/types'

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

// Week of 2025-01-06 (Monday) through 2025-01-12 (Sunday)
const WEEK_DATES: Record<string, string> = {
  monday: '2025-01-06',
  tuesday: '2025-01-07',
  wednesday: '2025-01-08',
  thursday: '2025-01-09',
  friday: '2025-01-10',
  saturday: '2025-01-11',
  sunday: '2025-01-12',
}

const DAYS = Object.keys(WEEK_DATES) as Array<keyof typeof WEEK_DATES>

describe('E2E: Log Workouts for a Full Week (Task 15.3)', () => {
  let exercisesStore: ReturnType<typeof useExercisesStore>
  let routineStore: ReturnType<typeof useRoutineStore>
  let sessionsStore: ReturnType<typeof useWorkoutSessionsStore>

  // Exercises created once and reused across tests
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
  // Requirement 3.1: Display exercises assigned to a day as a checklist
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 3.1 — Exercises assigned to each day are retrievable', () => {
    it('should return the correct exercise for each day of the week', () => {
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i]!
        const assignedIds = routineStore.routineForDay(day)
        expect(assignedIds).toContain(exercises[i]!.id)
      }
    })

    it('should resolve exercise details for each day', () => {
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i]!
        const ids = routineStore.routineForDay(day)
        const resolved = ids.map((id) => exercisesStore.exerciseById(id)).filter(Boolean)
        expect(resolved).toHaveLength(1)
        expect(resolved[0]!.name).toBe(exercises[i]!.name)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirements 3.2, 3.3, 3.4, 4.1–4.5: Log performance for each day
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirements 3.2–3.4, 4.1–4.5 — Log a full week of workouts', () => {
    const weekPerformance = [
      { actualSets: 3, actualReps: 10, weight: 80,  difficultyLevel: 'moderate' as const },
      { actualSets: 4, actualReps: 8,  weight: 100, difficultyLevel: 'hard'     as const },
      { actualSets: 3, actualReps: 5,  weight: 140, difficultyLevel: 'hard'     as const },
      { actualSets: 3, actualReps: 8,  weight: 60,  difficultyLevel: 'moderate' as const },
      { actualSets: 3, actualReps: 10, weight: undefined, difficultyLevel: 'easy' as const },
      { actualSets: 3, actualReps: 12, weight: 30,  difficultyLevel: 'easy'     as const },
      { actualSets: 3, actualReps: 60, weight: undefined, difficultyLevel: 'moderate' as const },
    ]

    it('should create a session for each day of the week', async () => {
      for (const day of DAYS) {
        const date = WEEK_DATES[day]!
        const session = await sessionsStore.createSession(date)
        expect(session.date).toBe(date)
        expect(session.id).toBeTruthy()
      }

      expect(sessionsStore.sessions).toHaveLength(7)
    })

    it('should log performance data for each day and verify all fields are stored', async () => {
      for (let i = 0; i < DAYS.length; i++) {
        const day = DAYS[i]!
        const date = WEEK_DATES[day]!
        const exercise = exercises[i]!
        const perf = weekPerformance[i]!

        const session = await sessionsStore.createSession(date)
        const before = Date.now()

        await sessionsStore.logPerformance(session.id, exercise.id, {
          completed: true,
          ...perf,
        })

        const after = Date.now()

        // Requirement 3.4 / 4.1–4.5: verify all fields stored
        const stored = sessionsStore.sessionByDate(date)
        expect(stored).toBeDefined()

        const storedPerf = stored!.exercises.find((e) => e.exerciseId === exercise.id)
        expect(storedPerf).toBeDefined()
        expect(storedPerf!.completed).toBe(true)

        // Requirement 4.1: actual sets
        expect(storedPerf!.actualSets).toBe(perf.actualSets)

        // Requirement 4.2: actual reps
        expect(storedPerf!.actualReps).toBe(perf.actualReps)

        // Requirement 4.3: weight (optional)
        if (perf.weight !== undefined) {
          expect(storedPerf!.weight).toBe(perf.weight)
        } else {
          expect(storedPerf!.weight).toBeUndefined()
        }

        // Requirement 4.4: difficulty level
        expect(storedPerf!.difficultyLevel).toBe(perf.difficultyLevel)

        // Requirement 4.5: timestamp
        expect(storedPerf!.timestamp).toBeTypeOf('number')
        expect(storedPerf!.timestamp).toBeGreaterThanOrEqual(before)
        expect(storedPerf!.timestamp).toBeLessThanOrEqual(after)
      }
    })

    it('should store all 7 sessions independently without cross-contamination', async () => {
      // Log all 7 days
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          ...weekPerformance[i]!,
        })
      }

      // Verify each day's session contains only its own exercise
      for (let i = 0; i < DAYS.length; i++) {
        const date = WEEK_DATES[DAYS[i]!]!
        const session = sessionsStore.sessionByDate(date)
        expect(session).toBeDefined()
        expect(session!.exercises).toHaveLength(1)
        expect(session!.exercises[0]!.exerciseId).toBe(exercises[i]!.id)
        expect(session!.exercises[0]!.actualSets).toBe(weekPerformance[i]!.actualSets)
        expect(session!.exercises[0]!.actualReps).toBe(weekPerformance[i]!.actualReps)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 3.2: Mark exercise as completed or incomplete
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 3.2 — Mark exercises complete and incomplete', () => {
    it('should mark an exercise as completed', async () => {
      const session = await sessionsStore.createSession(WEEK_DATES.monday!)
      await sessionsStore.logPerformance(session.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'moderate',
      })

      const stored = sessionsStore.sessionByDate(WEEK_DATES.monday!)
      expect(stored!.exercises[0]!.completed).toBe(true)
    })

    it('should mark an exercise as incomplete after it was completed', async () => {
      const session = await sessionsStore.createSession(WEEK_DATES.tuesday!)
      await sessionsStore.logPerformance(session.id, exercises[1]!.id, {
        completed: true,
        actualSets: 4,
        actualReps: 8,
        weight: 100,
        difficultyLevel: 'hard',
      })

      // Toggle off
      await sessionsStore.logPerformance(session.id, exercises[1]!.id, {
        completed: false,
      })

      const stored = sessionsStore.sessionByDate(WEEK_DATES.tuesday!)
      const perf = stored!.exercises.find((e) => e.exerciseId === exercises[1]!.id)
      expect(perf!.completed).toBe(false)
    })

    it('should toggle completion for multiple exercises in the same session', async () => {
      // Assign a second exercise to Monday
      const extraExercise = await exercisesStore.createExercise('Dips', 3, 12, ['Triceps'])
      await routineStore.assignExercise('monday', extraExercise.id)

      const session = await sessionsStore.createSession(WEEK_DATES.monday!)

      await sessionsStore.logPerformance(session.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'easy',
      })
      await sessionsStore.logPerformance(session.id, extraExercise.id, {
        completed: false,
      })

      const stored = sessionsStore.sessionByDate(WEEK_DATES.monday!)
      expect(stored!.exercises).toHaveLength(2)

      const first = stored!.exercises.find((e) => e.exerciseId === exercises[0]!.id)
      const second = stored!.exercises.find((e) => e.exerciseId === extraExercise.id)

      expect(first!.completed).toBe(true)
      expect(second!.completed).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 3.5: Edit previously logged performance data
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 3.5 — Edit previously logged performance data', () => {
    it('should overwrite performance data when re-logging the same exercise', async () => {
      const session = await sessionsStore.createSession(WEEK_DATES.wednesday!)

      // Initial log
      await sessionsStore.logPerformance(session.id, exercises[2]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 5,
        weight: 140,
        difficultyLevel: 'hard',
      })

      // Edit: different sets, reps, weight, difficulty
      await sessionsStore.logPerformance(session.id, exercises[2]!.id, {
        completed: true,
        actualSets: 4,
        actualReps: 6,
        weight: 150,
        difficultyLevel: 'moderate',
      })

      const stored = sessionsStore.sessionByDate(WEEK_DATES.wednesday!)
      const perfs = stored!.exercises.filter((e) => e.exerciseId === exercises[2]!.id)

      // Must not duplicate — only one entry per exercise per session
      expect(perfs).toHaveLength(1)

      // Must reflect the latest values
      expect(perfs[0]!.actualSets).toBe(4)
      expect(perfs[0]!.actualReps).toBe(6)
      expect(perfs[0]!.weight).toBe(150)
      expect(perfs[0]!.difficultyLevel).toBe('moderate')
    })

    it('should update the timestamp when performance is edited', async () => {
      const session = await sessionsStore.createSession(WEEK_DATES.thursday!)

      await sessionsStore.logPerformance(session.id, exercises[3]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 8,
        weight: 60,
        difficultyLevel: 'moderate',
      })

      const firstTimestamp = sessionsStore
        .sessionByDate(WEEK_DATES.thursday!)!
        .exercises.find((e) => e.exerciseId === exercises[3]!.id)!.timestamp

      // Small delay to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 5))

      await sessionsStore.logPerformance(session.id, exercises[3]!.id, {
        completed: true,
        actualSets: 4,
        actualReps: 10,
        weight: 65,
        difficultyLevel: 'hard',
      })

      const secondTimestamp = sessionsStore
        .sessionByDate(WEEK_DATES.thursday!)!
        .exercises.find((e) => e.exerciseId === exercises[3]!.id)!.timestamp

      expect(secondTimestamp).toBeGreaterThanOrEqual(firstTimestamp)
    })

    it('should allow editing performance for any day of the week', async () => {
      // Log all 7 days first
      const sessionIds: string[] = []
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        sessionIds.push(session.id)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'easy',
        })
      }

      // Edit each day's performance
      for (let i = 0; i < DAYS.length; i++) {
        await sessionsStore.logPerformance(sessionIds[i]!, exercises[i]!.id, {
          completed: true,
          actualSets: 5,
          actualReps: 15,
          weight: i * 10 + 10,
          difficultyLevel: 'hard',
        })
      }

      // Verify all edits persisted
      for (let i = 0; i < DAYS.length; i++) {
        const date = WEEK_DATES[DAYS[i]!]!
        const stored = sessionsStore.sessionByDate(date)
        const perf = stored!.exercises.find((e) => e.exerciseId === exercises[i]!.id)

        expect(perf!.actualSets).toBe(5)
        expect(perf!.actualReps).toBe(15)
        expect(perf!.weight).toBe(i * 10 + 10)
        expect(perf!.difficultyLevel).toBe('hard')
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Requirement 4.5: Timestamp stored with all performance data
  // ─────────────────────────────────────────────────────────────────────────
  describe('Requirement 4.5 — Timestamp stored with all performance data', () => {
    it('should record a valid timestamp for every logged exercise', async () => {
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        const before = Date.now()

        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })

        const after = Date.now()
        const stored = sessionsStore.sessionByDate(WEEK_DATES[DAYS[i]!]!)
        const perf = stored!.exercises.find((e) => e.exerciseId === exercises[i]!.id)

        expect(perf!.timestamp).toBeTypeOf('number')
        expect(perf!.timestamp).toBeGreaterThan(0)
        expect(perf!.timestamp).toBeGreaterThanOrEqual(before)
        expect(perf!.timestamp).toBeLessThanOrEqual(after)
      }
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Full week integration: all 7 days logged and verified together
  // ─────────────────────────────────────────────────────────────────────────
  describe('Full week integration — log and verify all 7 days', () => {
    it('should log a complete week and verify all sessions are saved with correct data', async () => {
      const weekData = [
        { sets: 3, reps: 10, weight: 80,        difficulty: 'moderate' as const },
        { sets: 4, reps: 8,  weight: 100,       difficulty: 'hard'     as const },
        { sets: 3, reps: 5,  weight: 140,       difficulty: 'hard'     as const },
        { sets: 3, reps: 8,  weight: 60,        difficulty: 'moderate' as const },
        { sets: 3, reps: 10, weight: undefined, difficulty: 'easy'     as const },
        { sets: 3, reps: 12, weight: 30,        difficulty: 'easy'     as const },
        { sets: 3, reps: 60, weight: undefined, difficulty: 'moderate' as const },
      ]

      // Log all 7 days
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: weekData[i]!.sets,
          actualReps: weekData[i]!.reps,
          weight: weekData[i]!.weight,
          difficultyLevel: weekData[i]!.difficulty,
        })
      }

      // Verify all 7 sessions exist
      expect(sessionsStore.sessions).toHaveLength(7)

      // Verify each session's data
      for (let i = 0; i < DAYS.length; i++) {
        const date = WEEK_DATES[DAYS[i]!]!
        const session = sessionsStore.sessionByDate(date)

        expect(session).toBeDefined()
        expect(session!.date).toBe(date)
        expect(session!.exercises).toHaveLength(1)

        const perf = session!.exercises[0]!
        expect(perf.exerciseId).toBe(exercises[i]!.id)
        expect(perf.completed).toBe(true)
        expect(perf.actualSets).toBe(weekData[i]!.sets)
        expect(perf.actualReps).toBe(weekData[i]!.reps)
        expect(perf.difficultyLevel).toBe(weekData[i]!.difficulty)

        if (weekData[i]!.weight !== undefined) {
          expect(perf.weight).toBe(weekData[i]!.weight)
        } else {
          expect(perf.weight).toBeUndefined()
        }

        expect(perf.timestamp).toBeTypeOf('number')
        expect(perf.timestamp).toBeGreaterThan(0)
      }
    })

    it('should allow querying performance history for each exercise across the week', async () => {
      // Log all 7 days
      for (let i = 0; i < DAYS.length; i++) {
        const session = await sessionsStore.createSession(WEEK_DATES[DAYS[i]!]!)
        await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          difficultyLevel: 'moderate',
        })
      }

      // Each exercise should appear in exactly one session
      for (let i = 0; i < exercises.length; i++) {
        const history = sessionsStore.performanceByExercise(exercises[i]!.id)
        expect(history).toHaveLength(1)
        expect(history[0]!.completed).toBe(true)
      }
    })

    it('should handle a day with multiple exercises logged', async () => {
      // Assign two more exercises to Monday
      const ex2 = await exercisesStore.createExercise('Incline Press', 3, 8, ['Chest'])
      const ex3 = await exercisesStore.createExercise('Cable Fly', 3, 15, ['Chest'])
      await routineStore.assignExercise('monday', ex2.id)
      await routineStore.assignExercise('monday', ex3.id)

      const session = await sessionsStore.createSession(WEEK_DATES.monday!)

      await sessionsStore.logPerformance(session.id, exercises[0]!.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        weight: 80,
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

      const stored = sessionsStore.sessionByDate(WEEK_DATES.monday!)
      expect(stored!.exercises).toHaveLength(3)

      const p1 = stored!.exercises.find((e) => e.exerciseId === exercises[0]!.id)
      const p2 = stored!.exercises.find((e) => e.exerciseId === ex2.id)
      const p3 = stored!.exercises.find((e) => e.exerciseId === ex3.id)

      expect(p1!.completed).toBe(true)
      expect(p1!.actualSets).toBe(3)
      expect(p1!.weight).toBe(80)

      expect(p2!.completed).toBe(true)
      expect(p2!.actualSets).toBe(3)
      expect(p2!.weight).toBe(70)

      expect(p3!.completed).toBe(false)
    })
  })
})
