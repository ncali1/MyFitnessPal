/**
 * End-to-End Test: Task 15.6 — Data Persistence Across App Reload
 *
 * Tests that all data (exercises, routine assignments, workout sessions)
 * is persisted to storage and fully restored after a simulated app reload.
 *
 * The 'app reload' is simulated by:
 * 1. Creating data using the first set of Pinia stores
 * 2. Destroying the Pinia instance (clearing all in-memory state)
 * 3. Creating a fresh Pinia instance with new store instances
 * 4. Calling the load methods (loadExercises, loadRoutine, loadSessions)
 *    which read from the stateful mock storage
 * 5. Verifying all data is present and intact in the reloaded stores
 *
 * A stateful mock storage is used so data written in step 1 is
 * readable in step 4, matching the real IndexedDB behaviour.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExercisesStore } from '../stores/exercises'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import type { Exercise, Routine, WorkoutSession } from '../stores/types'

// ---------------------------------------------------------------------------
// Stateful mock storage — persists data between the 'write' and 'reload' phases
// ---------------------------------------------------------------------------

const mockDb: {
  exercises: Record<string, Exercise>
  routine: Routine | null
  workoutSessions: Record<string, WorkoutSession>
} = {
  exercises: {},
  routine: null,
  workoutSessions: {},
}

vi.mock('../services/storage', () => ({
  storageService: {
    // Exercises
    saveExercise: vi.fn(async (exercise: Exercise) => {
      mockDb.exercises[exercise.id] = { ...exercise }
    }),
    getExercise: vi.fn(async (id: string) => mockDb.exercises[id]),
    getAllExercises: vi.fn(async () => Object.values(mockDb.exercises).map((e) => ({ ...e }))),
    deleteExercise: vi.fn(async (id: string) => {
      delete mockDb.exercises[id]
    }),

    // Routine
    saveRoutine: vi.fn(async (routine: Routine) => {
      mockDb.routine = { ...routine, weeklyAssignments: { ...routine.weeklyAssignments } }
    }),
    getRoutine: vi.fn(async () =>
      mockDb.routine
        ? { ...mockDb.routine, weeklyAssignments: { ...mockDb.routine.weeklyAssignments } }
        : undefined
    ),

    // Workout Sessions
    saveWorkoutSession: vi.fn(async (session: WorkoutSession) => {
      mockDb.workoutSessions[session.id] = {
        ...session,
        exercises: session.exercises.map((e) => ({ ...e })),
      }
    }),
    getWorkoutSession: vi.fn(async (id: string) => {
      const s = mockDb.workoutSessions[id]
      return s ? { ...s, exercises: s.exercises.map((e) => ({ ...e })) } : undefined
    }),
    getWorkoutSessionByDate: vi.fn(async (date: string) => {
      const s = Object.values(mockDb.workoutSessions).find((s) => s.date === date)
      return s ? { ...s, exercises: s.exercises.map((e) => ({ ...e })) } : undefined
    }),
    getAllWorkoutSessions: vi.fn(async () =>
      Object.values(mockDb.workoutSessions).map((s) => ({
        ...s,
        exercises: s.exercises.map((e) => ({ ...e })),
      }))
    ),
    deleteWorkoutSession: vi.fn(async (id: string) => {
      delete mockDb.workoutSessions[id]
    }),
    clearAllData: vi.fn(async () => {
      mockDb.exercises = {}
      mockDb.routine = null
      mockDb.workoutSessions = {}
    }),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a fresh Pinia instance and set it as active. Returns the store trio. */
function freshStores() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return {
    exercisesStore: useExercisesStore(),
    routineStore: useRoutineStore(),
    sessionsStore: useWorkoutSessionsStore(),
  }
}

/** Simulate closing and reopening the app: create brand-new stores and load all data from storage. */
async function simulateAppReload() {
  const { exercisesStore, routineStore, sessionsStore } = freshStores()
  await exercisesStore.loadExercises()
  await routineStore.loadRoutine()
  await sessionsStore.loadSessions()
  return { exercisesStore, routineStore, sessionsStore }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('E2E: Data Persistence Across App Reload (Task 15.6)', () => {
  beforeEach(() => {
    // Reset in-memory mock DB before each test
    mockDb.exercises = {}
    mockDb.routine = null
    mockDb.workoutSessions = {}
    vi.clearAllMocks()
  })

  // ── Requirement 7.1: Exercises persist to storage ─────────────────────────

  describe('Requirement 7.1 — Exercises persist to storage', () => {
    it('saves an exercise to storage when created', async () => {
      const { exercisesStore } = freshStores()
      await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest', 'Triceps'])

      // Storage should contain the exercise
      const stored = Object.values(mockDb.exercises)
      expect(stored).toHaveLength(1)
      expect(stored[0]!.name).toBe('Bench Press')
      expect(stored[0]!.targetSets).toBe(3)
      expect(stored[0]!.targetReps).toBe(10)
      expect(stored[0]!.targetMuscleGroups).toEqual(['Chest', 'Triceps'])
    })

    it('persists all exercises created in a session', async () => {
      const { exercisesStore } = freshStores()

      await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest', 'Triceps'])
      await exercisesStore.createExercise('Squat', 4, 8, ['Legs', 'Glutes'])
      await exercisesStore.createExercise('Deadlift', 3, 5, ['Back', 'Legs'])

      const stored = Object.values(mockDb.exercises)
      expect(stored).toHaveLength(3)
    })

    it('persists exercise updates to storage', async () => {
      const { exercisesStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      await exercisesStore.updateExercise(exercise.id, {
        name: 'Incline Bench Press',
        targetSets: 4,
        updatedAt: Date.now(),
      })

      const stored = mockDb.exercises[exercise.id]
      expect(stored).toBeDefined()
      expect(stored!.name).toBe('Incline Bench Press')
      expect(stored!.targetSets).toBe(4)
    })

    it('removes exercise from storage on delete', async () => {
      const { exercisesStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      expect(Object.keys(mockDb.exercises)).toHaveLength(1)

      await exercisesStore.deleteExercise(exercise.id)
      expect(Object.keys(mockDb.exercises)).toHaveLength(0)
    })
  })

  // ── Requirement 7.2: Routine assignments persist to storage ───────────────

  describe('Requirement 7.2 — Weekly routine assignments persist to storage', () => {
    it('saves routine to storage when exercise is assigned to a day', async () => {
      const { exercisesStore, routineStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Squat', 3, 8, ['Legs'])
      await routineStore.assignExercise('monday', exercise.id)

      expect(mockDb.routine).not.toBeNull()
      expect(mockDb.routine!.weeklyAssignments.monday).toContain(exercise.id)
    })

    it('persists assignments for all 7 days to storage', async () => {
      const { exercisesStore, routineStore } = freshStores()

      const exercises = await Promise.all([
        exercisesStore.createExercise('Bench Press', 3, 10, ['Chest']),
        exercisesStore.createExercise('Squat', 4, 8, ['Legs']),
        exercisesStore.createExercise('Deadlift', 3, 5, ['Back']),
        exercisesStore.createExercise('OHP', 3, 8, ['Shoulders']),
        exercisesStore.createExercise('Pull-up', 3, 10, ['Back']),
        exercisesStore.createExercise('Row', 3, 12, ['Back']),
        exercisesStore.createExercise('Plank', 3, 60, ['Core']),
      ])

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (let i = 0; i < days.length; i++) {
        await routineStore.assignExercise(days[i]!, exercises[i]!.id)
      }

      for (let i = 0; i < days.length; i++) {
        expect(mockDb.routine!.weeklyAssignments[days[i]!]).toContain(exercises[i]!.id)
      }
    })
  })

  // ── Requirement 7.3: Workout session data persists to storage ─────────────

  describe('Requirement 7.3 — Workout session data persists to storage', () => {
    it('saves a workout session to storage when created', async () => {
      const { sessionsStore } = freshStores()

      const session = await sessionsStore.createSession('2025-01-06')

      expect(mockDb.workoutSessions[session.id]).toBeDefined()
      expect(mockDb.workoutSessions[session.id]!.date).toBe('2025-01-06')
    })

    it('persists performance data to storage after logging', async () => {
      const { exercisesStore, sessionsStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const session = await sessionsStore.createSession('2025-01-06')

      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        weight: 80,
        difficultyLevel: 'moderate',
      })

      const stored = mockDb.workoutSessions[session.id]
      expect(stored).toBeDefined()
      expect(stored!.exercises).toHaveLength(1)

      const perf = stored!.exercises[0]!
      expect(perf.exerciseId).toBe(exercise.id)
      expect(perf.completed).toBe(true)
      expect(perf.actualSets).toBe(3)
      expect(perf.actualReps).toBe(10)
      expect(perf.weight).toBe(80)
      expect(perf.difficultyLevel).toBe('moderate')
      expect(perf.timestamp).toBeTypeOf('number')
    })
  })

  // ── Requirement 7.4: All data loads on app reopen ─────────────────────────

  describe('Requirement 7.4 — All previously saved data loads after app reload', () => {
    it('reloads exercises after app restart', async () => {
      // Phase 1: create data
      const { exercisesStore } = freshStores()
      const created = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest', 'Triceps'])

      // Phase 2: simulate reload — new Pinia, load from storage
      const reloaded = await simulateAppReload()

      expect(reloaded.exercisesStore.allExercises).toHaveLength(1)
      const restored = reloaded.exercisesStore.exerciseById(created.id)
      expect(restored).toBeDefined()
      expect(restored!.name).toBe('Bench Press')
      expect(restored!.targetSets).toBe(3)
      expect(restored!.targetReps).toBe(10)
      expect(restored!.targetMuscleGroups).toEqual(['Chest', 'Triceps'])
    })

    it('reloads routine assignments after app restart', async () => {
      // Phase 1: create exercises and build routine
      const { exercisesStore, routineStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Squat', 4, 8, ['Legs'])
      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.assignExercise('wednesday', exercise.id)
      await routineStore.assignExercise('friday', exercise.id)

      // Phase 2: simulate reload
      const reloaded = await simulateAppReload()

      expect(reloaded.routineStore.routineForDay('monday')).toContain(exercise.id)
      expect(reloaded.routineStore.routineForDay('wednesday')).toContain(exercise.id)
      expect(reloaded.routineStore.routineForDay('friday')).toContain(exercise.id)
      expect(reloaded.routineStore.routineForDay('tuesday')).toHaveLength(0)
    })

    it('reloads workout sessions after app restart', async () => {
      // Phase 1: create session and log performance
      const { exercisesStore, sessionsStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Deadlift', 3, 5, ['Back'])
      const session = await sessionsStore.createSession('2025-01-08')
      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        actualSets: 3,
        actualReps: 5,
        weight: 140,
        difficultyLevel: 'hard',
      })

      // Phase 2: simulate reload
      const reloaded = await simulateAppReload()

      const restoredSession = reloaded.sessionsStore.sessionByDate('2025-01-08')
      expect(restoredSession).toBeDefined()
      expect(restoredSession!.id).toBe(session.id)
      expect(restoredSession!.exercises).toHaveLength(1)

      const perf = restoredSession!.exercises[0]!
      expect(perf.exerciseId).toBe(exercise.id)
      expect(perf.completed).toBe(true)
      expect(perf.actualSets).toBe(3)
      expect(perf.actualReps).toBe(5)
      expect(perf.weight).toBe(140)
      expect(perf.difficultyLevel).toBe('hard')
      expect(perf.timestamp).toBeTypeOf('number')
    })

    it('reloads all data types simultaneously after app restart', async () => {
      // Phase 1: create a full dataset
      const { exercisesStore, routineStore, sessionsStore } = freshStores()

      // Create 3 exercises
      const bench = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest', 'Triceps'])
      const squat = await exercisesStore.createExercise('Squat', 4, 8, ['Legs', 'Glutes'])
      const deadlift = await exercisesStore.createExercise('Deadlift', 3, 5, ['Back', 'Legs'])

      // Build routine: assign exercises to days
      await routineStore.assignExercise('monday', bench.id)
      await routineStore.assignExercise('monday', squat.id)
      await routineStore.assignExercise('wednesday', deadlift.id)
      await routineStore.assignExercise('friday', bench.id)
      await routineStore.assignExercise('friday', squat.id)
      await routineStore.assignExercise('friday', deadlift.id)

      // Log two workout sessions
      const mondaySession = await sessionsStore.createSession('2025-01-06')
      await sessionsStore.logPerformance(mondaySession.id, bench.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        weight: 80,
        difficultyLevel: 'moderate',
      })
      await sessionsStore.logPerformance(mondaySession.id, squat.id, {
        completed: true,
        actualSets: 4,
        actualReps: 8,
        weight: 100,
        difficultyLevel: 'hard',
      })

      const wednesdaySession = await sessionsStore.createSession('2025-01-08')
      await sessionsStore.logPerformance(wednesdaySession.id, deadlift.id, {
        completed: true,
        actualSets: 3,
        actualReps: 5,
        weight: 140,
        difficultyLevel: 'hard',
      })

      // Phase 2: simulate app reload
      const reloaded = await simulateAppReload()

      // Verify exercises are intact
      expect(reloaded.exercisesStore.allExercises).toHaveLength(3)
      const restoredBench = reloaded.exercisesStore.exerciseById(bench.id)
      const restoredSquat = reloaded.exercisesStore.exerciseById(squat.id)
      const restoredDeadlift = reloaded.exercisesStore.exerciseById(deadlift.id)

      expect(restoredBench).toBeDefined()
      expect(restoredBench!.name).toBe('Bench Press')
      expect(restoredBench!.targetSets).toBe(3)
      expect(restoredBench!.targetReps).toBe(10)
      expect(restoredBench!.targetMuscleGroups).toEqual(['Chest', 'Triceps'])

      expect(restoredSquat).toBeDefined()
      expect(restoredSquat!.name).toBe('Squat')

      expect(restoredDeadlift).toBeDefined()
      expect(restoredDeadlift!.name).toBe('Deadlift')

      // Verify routine assignments are intact
      expect(reloaded.routineStore.routineForDay('monday')).toContain(bench.id)
      expect(reloaded.routineStore.routineForDay('monday')).toContain(squat.id)
      expect(reloaded.routineStore.routineForDay('monday')).toHaveLength(2)
      expect(reloaded.routineStore.routineForDay('wednesday')).toContain(deadlift.id)
      expect(reloaded.routineStore.routineForDay('friday')).toContain(bench.id)
      expect(reloaded.routineStore.routineForDay('friday')).toContain(squat.id)
      expect(reloaded.routineStore.routineForDay('friday')).toContain(deadlift.id)
      expect(reloaded.routineStore.routineForDay('tuesday')).toHaveLength(0)
      expect(reloaded.routineStore.routineForDay('thursday')).toHaveLength(0)

      // Verify Monday session is intact
      const restoredMonday = reloaded.sessionsStore.sessionByDate('2025-01-06')
      expect(restoredMonday).toBeDefined()
      expect(restoredMonday!.exercises).toHaveLength(2)

      const benchPerf = restoredMonday!.exercises.find((e) => e.exerciseId === bench.id)
      expect(benchPerf).toBeDefined()
      expect(benchPerf!.completed).toBe(true)
      expect(benchPerf!.actualSets).toBe(3)
      expect(benchPerf!.actualReps).toBe(10)
      expect(benchPerf!.weight).toBe(80)
      expect(benchPerf!.difficultyLevel).toBe('moderate')
      expect(benchPerf!.timestamp).toBeTypeOf('number')

      const squatPerf = restoredMonday!.exercises.find((e) => e.exerciseId === squat.id)
      expect(squatPerf).toBeDefined()
      expect(squatPerf!.completed).toBe(true)
      expect(squatPerf!.actualSets).toBe(4)
      expect(squatPerf!.actualReps).toBe(8)
      expect(squatPerf!.weight).toBe(100)
      expect(squatPerf!.difficultyLevel).toBe('hard')

      // Verify Wednesday session is intact
      const restoredWednesday = reloaded.sessionsStore.sessionByDate('2025-01-08')
      expect(restoredWednesday).toBeDefined()
      expect(restoredWednesday!.exercises).toHaveLength(1)

      const deadliftPerf = restoredWednesday!.exercises.find((e) => e.exerciseId === deadlift.id)
      expect(deadliftPerf).toBeDefined()
      expect(deadliftPerf!.completed).toBe(true)
      expect(deadliftPerf!.actualSets).toBe(3)
      expect(deadliftPerf!.actualReps).toBe(5)
      expect(deadliftPerf!.weight).toBe(140)
      expect(deadliftPerf!.difficultyLevel).toBe('hard')
    })

    it('preserves exercise IDs across reload (ids used in routine and sessions remain valid)', async () => {
      // Phase 1
      const { exercisesStore, routineStore, sessionsStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Pull-up', 3, 10, ['Back', 'Biceps'])
      await routineStore.assignExercise('tuesday', exercise.id)
      const session = await sessionsStore.createSession('2025-01-07')
      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: 'moderate',
      })

      // Phase 2: simulate reload
      const reloaded = await simulateAppReload()

      // The restored exercise id must match what routine and sessions reference
      const restoredExercise = reloaded.exercisesStore.exerciseById(exercise.id)
      expect(restoredExercise).toBeDefined()
      expect(restoredExercise!.id).toBe(exercise.id)

      const tuesdayIds = reloaded.routineStore.routineForDay('tuesday')
      expect(tuesdayIds).toContain(exercise.id)

      const restoredSession = reloaded.sessionsStore.sessionByDate('2025-01-07')
      expect(restoredSession!.exercises[0]!.exerciseId).toBe(exercise.id)
    })

    it('preserves exercise data with no weight (bodyweight exercise) across reload', async () => {
      // Phase 1
      const { exercisesStore, sessionsStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Plank', 3, 60, ['Core'])
      const session = await sessionsStore.createSession('2025-01-09')
      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        actualSets: 3,
        actualReps: 60,
        difficultyLevel: 'easy',
        // no weight (bodyweight exercise)
      })

      // Phase 2: simulate reload
      const reloaded = await simulateAppReload()

      const restoredSession = reloaded.sessionsStore.sessionByDate('2025-01-09')
      expect(restoredSession).toBeDefined()

      const perf = restoredSession!.exercises.find((e) => e.exerciseId === exercise.id)
      expect(perf).toBeDefined()
      expect(perf!.weight).toBeUndefined()
      expect(perf!.actualReps).toBe(60)
      expect(perf!.difficultyLevel).toBe('easy')
    })

    it('reloads multiple sessions across different dates', async () => {
      // Phase 1: log 3 sessions on different dates
      const { exercisesStore, sessionsStore } = freshStores()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const dates = ['2025-02-03', '2025-02-05', '2025-02-07']
      const weights = [75, 77.5, 80]

      for (let i = 0; i < dates.length; i++) {
        const session = await sessionsStore.createSession(dates[i]!)
        await sessionsStore.logPerformance(session.id, exercise.id, {
          completed: true,
          actualSets: 3,
          actualReps: 10,
          weight: weights[i],
          difficultyLevel: 'moderate',
        })
      }

      // Phase 2: simulate reload
      const reloaded = await simulateAppReload()

      expect(reloaded.sessionsStore.sessions).toHaveLength(3)

      for (let i = 0; i < dates.length; i++) {
        const restoredSession = reloaded.sessionsStore.sessionByDate(dates[i]!)
        expect(restoredSession).toBeDefined()

        const perf = restoredSession!.exercises.find((e) => e.exerciseId === exercise.id)
        expect(perf).toBeDefined()
        expect(perf!.weight).toBe(weights[i])
      }
    })

    it('empty state remains empty after reload when no data was created', async () => {
      // Ensure no data in mock storage
      expect(Object.keys(mockDb.exercises)).toHaveLength(0)
      expect(mockDb.routine).toBeNull()
      expect(Object.keys(mockDb.workoutSessions)).toHaveLength(0)

      // Reload with empty storage
      const reloaded = await simulateAppReload()

      expect(reloaded.exercisesStore.allExercises).toHaveLength(0)
      expect(reloaded.sessionsStore.sessions).toHaveLength(0)
      // Routine is initialized to empty structure (all 7 days, each empty)
      const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of allDays) {
        expect(reloaded.routineStore.routineForDay(day)).toHaveLength(0)
      }
    })
  })
})
