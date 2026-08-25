/**
 * Property 11: Performance Data Prompt on Completion
 *
 * When an exercise is marked as complete, the system must capture and persist
 * performance data (sets, reps, weight, difficulty). For any valid combination
 * of performance inputs, the stored data must exactly match what was submitted.
 *
 * Validates: Requirements 3.3
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useExercisesStore } from '../stores/exercises'

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

type DifficultyLevel = 'easy' | 'moderate' | 'hard'

interface PerformanceInput {
  actualSets: number
  actualReps: number
  weight?: number
  difficultyLevel: DifficultyLevel
}

// Generate a range of valid performance inputs to test the property exhaustively
function generatePerformanceInputs(): PerformanceInput[] {
  const difficulties: DifficultyLevel[] = ['easy', 'moderate', 'hard']
  const inputs: PerformanceInput[] = []

  for (const sets of [1, 2, 3, 5, 10]) {
    for (const reps of [1, 5, 8, 10, 15, 20]) {
      for (const difficulty of difficulties) {
        // Without weight
        inputs.push({ actualSets: sets, actualReps: reps, difficultyLevel: difficulty })
        // With weight
        inputs.push({ actualSets: sets, actualReps: reps, weight: sets * 10, difficultyLevel: difficulty })
      }
    }
  }

  return inputs
}

describe('Property 11: Performance Data Prompt on Completion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should store exactly the submitted performance data for any valid input', async () => {
    const sessionsStore = useWorkoutSessionsStore()
    const exercisesStore = useExercisesStore()

    const exercise = await exercisesStore.createExercise('Test Exercise', 3, 10, ['Chest'])
    const inputs = generatePerformanceInputs()

    for (const input of inputs) {
      const date = `2025-01-${String(inputs.indexOf(input) % 28 + 1).padStart(2, '0')}`
      const session = await sessionsStore.createSession(`${date}-${input.actualSets}-${input.actualReps}`)

      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        ...input,
      })

      const stored = sessionsStore.sessions
        .find((s) => s.id === session.id)
        ?.exercises.find((e) => e.exerciseId === exercise.id)

      expect(stored).toBeDefined()
      expect(stored?.completed).toBe(true)
      expect(stored?.actualSets).toBe(input.actualSets)
      expect(stored?.actualReps).toBe(input.actualReps)
      expect(stored?.difficultyLevel).toBe(input.difficultyLevel)
      if (input.weight !== undefined) {
        expect(stored?.weight).toBe(input.weight)
      }
      expect(stored?.timestamp).toBeTypeOf('number')
      expect(stored?.timestamp).toBeGreaterThan(0)
    }
  })

  it('should always record a timestamp when performance is logged', async () => {
    const sessionsStore = useWorkoutSessionsStore()
    const exercisesStore = useExercisesStore()

    const exercise = await exercisesStore.createExercise('Timed Exercise', 3, 10, ['Legs'])
    const difficulties: DifficultyLevel[] = ['easy', 'moderate', 'hard']

    for (const difficulty of difficulties) {
      const session = await sessionsStore.createSession(`2025-02-0${difficulties.indexOf(difficulty) + 1}`)
      const before = Date.now()

      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        actualSets: 3,
        actualReps: 10,
        difficultyLevel: difficulty,
      })

      const after = Date.now()
      const stored = sessionsStore.sessions
        .find((s) => s.id === session.id)
        ?.exercises.find((e) => e.exerciseId === exercise.id)

      expect(stored?.timestamp).toBeGreaterThanOrEqual(before)
      expect(stored?.timestamp).toBeLessThanOrEqual(after)
    }
  })

  it('should overwrite previous performance when re-logging the same exercise', async () => {
    const sessionsStore = useWorkoutSessionsStore()
    const exercisesStore = useExercisesStore()

    const exercise = await exercisesStore.createExercise('Overwrite Exercise', 3, 10, ['Back'])
    const session = await sessionsStore.createSession('2025-03-10')

    const firstInputs: PerformanceInput[] = [
      { actualSets: 2, actualReps: 8, difficultyLevel: 'easy' },
      { actualSets: 3, actualReps: 10, difficultyLevel: 'moderate' },
      { actualSets: 4, actualReps: 12, difficultyLevel: 'hard' },
    ]

    const secondInputs: PerformanceInput[] = [
      { actualSets: 5, actualReps: 15, difficultyLevel: 'hard' },
      { actualSets: 1, actualReps: 5, difficultyLevel: 'easy' },
      { actualSets: 3, actualReps: 8, weight: 50, difficultyLevel: 'moderate' },
    ]

    for (let i = 0; i < firstInputs.length; i++) {
      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        ...firstInputs[i]!,
      })
      await sessionsStore.logPerformance(session.id, exercise.id, {
        completed: true,
        ...secondInputs[i]!,
      })

      const stored = sessionsStore.sessions
        .find((s) => s.id === session.id)
        ?.exercises.filter((e) => e.exerciseId === exercise.id)

      // Must not duplicate — only one entry per exercise per session
      expect(stored).toHaveLength(1)
      // Must reflect the latest submission
      expect(stored![0]?.actualSets).toBe(secondInputs[i]!.actualSets)
      expect(stored![0]?.actualReps).toBe(secondInputs[i]!.actualReps)
      expect(stored![0]?.difficultyLevel).toBe(secondInputs[i]!.difficultyLevel)
    }
  })

  it('should handle multiple exercises in the same session independently', async () => {
    const sessionsStore = useWorkoutSessionsStore()
    const exercisesStore = useExercisesStore()

    const exercises = await Promise.all([
      exercisesStore.createExercise('Exercise A', 3, 10, ['Chest']),
      exercisesStore.createExercise('Exercise B', 4, 8, ['Back']),
      exercisesStore.createExercise('Exercise C', 3, 12, ['Legs']),
    ])

    const session = await sessionsStore.createSession('2025-03-15')

    const performances: PerformanceInput[] = [
      { actualSets: 3, actualReps: 10, difficultyLevel: 'easy' },
      { actualSets: 4, actualReps: 8, weight: 60, difficultyLevel: 'hard' },
      { actualSets: 3, actualReps: 12, difficultyLevel: 'moderate' },
    ]

    for (let i = 0; i < exercises.length; i++) {
      await sessionsStore.logPerformance(session.id, exercises[i]!.id, {
        completed: true,
        ...performances[i]!,
      })
    }

    const stored = sessionsStore.sessions.find((s) => s.id === session.id)
    expect(stored?.exercises).toHaveLength(exercises.length)

    for (let i = 0; i < exercises.length; i++) {
      const perf = stored?.exercises.find((e) => e.exerciseId === exercises[i]!.id)
      expect(perf?.actualSets).toBe(performances[i]!.actualSets)
      expect(perf?.actualReps).toBe(performances[i]!.actualReps)
      expect(perf?.difficultyLevel).toBe(performances[i]!.difficultyLevel)
    }
  })
})
