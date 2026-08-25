/**
 * End-to-end test for the ExerciseHistory component: logging an exercise across
 * multiple sessions and verifying the rendered history list.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import ExerciseHistory from './ExerciseHistory.vue'
import { useExercisesStore } from '../stores/exercises'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'

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

describe('E2E: Exercise History', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows an empty state when the exercise has never been logged', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const exercisesStore = useExercisesStore()
    const exercise = await exercisesStore.createExercise('Deadlift', 3, 5, ['Back'])

    render(ExerciseHistory, { props: { exerciseId: exercise.id }, global: { plugins: [pinia] } })

    expect(await screen.findByText(/no history logged yet/i)).toBeTruthy()
  })

  it('lists every logged instance newest-first with sets, reps, weight, and difficulty', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const exercisesStore = useExercisesStore()
    const sessionsStore = useWorkoutSessionsStore()

    const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

    const session1 = await sessionsStore.createSession('2025-01-06')
    await sessionsStore.logPerformance(session1.id, exercise.id, {
      completed: true,
      actualSets: 3,
      actualReps: 8,
      weight: 60,
      difficultyLevel: 'moderate',
    })

    const session2 = await sessionsStore.createSession('2025-01-13')
    await sessionsStore.logPerformance(session2.id, exercise.id, {
      completed: true,
      actualSets: 3,
      actualReps: 10,
      weight: 70,
      difficultyLevel: 'hard',
    })

    render(ExerciseHistory, { props: { exerciseId: exercise.id }, global: { plugins: [pinia] } })

    await waitFor(() => {
      expect(screen.getAllByText(/3 × (8|10)/)).toHaveLength(2)
    })

    // Newest session (Jan 13, 70kg) should render before the older one (Jan 6, 60kg)
    const rows = screen.getAllByText(/kg$/)
    expect(rows[0]!.textContent).toContain('70')
    expect(rows[1]!.textContent).toContain('60')

    // The heavier, more recent entry set both the weight and reps PR — exactly one row flagged
    expect(screen.getAllByText(/PR/)).toHaveLength(1)
  })
})
