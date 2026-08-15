/**
 * End-to-End tests for the ExerciseManager component.
 *
 * Tests the complete user workflow of creating exercises and verifying
 * they appear in the exercise list.
 *
 * Validates: Requirements 1.1, 1.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import ExerciseManager from './ExerciseManager.vue'

// Mock the storage service so no real IndexedDB is needed
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

/** Helper: render ExerciseManager with a fresh Pinia instance */
function renderExerciseManager() {
  const pinia = createPinia()
  return render(ExerciseManager, { global: { plugins: [pinia] } })
}

/**
 * Helper: wait for the initial loading to finish.
 * The "Add Exercise" button is only rendered once loading completes.
 */
async function waitForLoaded() {
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /add exercise/i })).toBeTruthy()
  })
}

/**
 * Helper: fill in and submit the ExerciseForm for a single exercise.
 *
 * The form is already visible when this is called (i.e. the "Add Exercise"
 * button has already been clicked).
 */
async function fillAndSubmitExerciseForm(exercise: {
  name: string
  sets: number
  reps: number
  muscleGroups: string[]
}) {
  // Name
  const nameInput = screen.getByLabelText(/exercise name/i)
  await fireEvent.update(nameInput, exercise.name)

  // Sets
  const setsInput = screen.getByLabelText(/target sets/i)
  await fireEvent.update(setsInput, String(exercise.sets))

  // Reps
  const repsInput = screen.getByLabelText(/target reps/i)
  await fireEvent.update(repsInput, String(exercise.reps))

  // Muscle group checkboxes
  for (const group of exercise.muscleGroups) {
    const checkbox = screen.getByLabelText(group)
    await fireEvent.click(checkbox)
  }

  // Submit
  const saveButton = screen.getByRole('button', { name: /^save$/i })
  await fireEvent.click(saveButton)

  // Wait for the form to close (Save button disappears)
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull()
  })
}

// ---------------------------------------------------------------------------

describe('ExerciseManager – Create exercises workflow (Requirements 1.1, 1.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows an empty state message when no exercises exist', async () => {
    renderExerciseManager()

    // Wait for the initial load to complete
    await waitForLoaded()

    expect(screen.getByText(/no exercises yet/i)).toBeTruthy()
  })

  it('creates a single exercise and shows it in the list', async () => {
    renderExerciseManager()

    await waitForLoaded()

    // Open the form
    await fireEvent.click(screen.getByRole('button', { name: /add exercise/i }))

    // Fill in and submit
    await fillAndSubmitExerciseForm({
      name: 'Push-ups',
      sets: 3,
      reps: 15,
      muscleGroups: ['Chest', 'Triceps'],
    })

    // The exercise card should now be visible
    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeTruthy()
    })
  })

  it('creates 3 different exercises with various muscle groups and all appear in the list', async () => {
    /**
     * Primary workflow test for Requirements 1.1 and 1.5.
     *
     * Exercises:
     *   1. Push-ups  – Chest, Triceps
     *   2. Pull-ups  – Back, Biceps
     *   3. Squats    – Legs, Glutes
     */
    const exercises = [
      { name: 'Push-ups', sets: 3, reps: 15, muscleGroups: ['Chest', 'Triceps'] },
      { name: 'Pull-ups', sets: 4, reps: 8, muscleGroups: ['Back', 'Biceps'] },
      { name: 'Squats', sets: 4, reps: 12, muscleGroups: ['Legs', 'Glutes'] },
    ]

    renderExerciseManager()

    await waitForLoaded()

    for (const exercise of exercises) {
      // Open the form for each exercise
      await fireEvent.click(screen.getByRole('button', { name: /add exercise/i }))

      // Fill in and submit (helper also waits for form to close)
      await fillAndSubmitExerciseForm(exercise)
    }

    // All 3 exercises should now be visible in the list
    await waitFor(() => {
      expect(screen.getByText('Push-ups')).toBeTruthy()
      expect(screen.getByText('Pull-ups')).toBeTruthy()
      expect(screen.getByText('Squats')).toBeTruthy()
    })
  })

  it('shows muscle group information for each created exercise', async () => {
    renderExerciseManager()

    await waitForLoaded()

    const exercises = [
      { name: 'Push-ups', sets: 3, reps: 15, muscleGroups: ['Chest', 'Triceps'] },
      { name: 'Pull-ups', sets: 4, reps: 8, muscleGroups: ['Back', 'Biceps'] },
      { name: 'Squats', sets: 4, reps: 12, muscleGroups: ['Legs', 'Glutes'] },
    ]

    for (const exercise of exercises) {
      await fireEvent.click(screen.getByRole('button', { name: /add exercise/i }))
      await fillAndSubmitExerciseForm(exercise)
    }

    // Verify muscle group text is rendered in the cards
    await waitFor(() => {
      // ExerciseCard renders: "Muscles: Chest, Triceps"
      expect(screen.getByText(/Chest.*Triceps|Triceps.*Chest/)).toBeTruthy()
      expect(screen.getByText(/Back.*Biceps|Biceps.*Back/)).toBeTruthy()
      expect(screen.getByText(/Legs.*Glutes|Glutes.*Legs/)).toBeTruthy()
    })
  })

  it('shows sets and reps for each created exercise', async () => {
    renderExerciseManager()

    await waitForLoaded()

    await fireEvent.click(screen.getByRole('button', { name: /add exercise/i }))
    await fillAndSubmitExerciseForm({
      name: 'Squats',
      sets: 4,
      reps: 12,
      muscleGroups: ['Legs'],
    })

    await waitFor(() => {
      expect(screen.getByText(/Sets: 4/)).toBeTruthy()
      expect(screen.getByText(/Reps: 12/)).toBeTruthy()
    })
  })

  it('the exercise list grows with each new exercise added', async () => {
    renderExerciseManager()

    await waitForLoaded()

    const exercisesToAdd = [
      { name: 'Push-ups', sets: 3, reps: 15, muscleGroups: ['Chest'] },
      { name: 'Pull-ups', sets: 4, reps: 8, muscleGroups: ['Back'] },
      { name: 'Squats', sets: 4, reps: 12, muscleGroups: ['Legs'] },
    ]

    for (let i = 0; i < exercisesToAdd.length; i++) {
      await fireEvent.click(screen.getByRole('button', { name: /add exercise/i }))
      await fillAndSubmitExerciseForm(exercisesToAdd[i]!)

      // After adding the (i+1)th exercise, all previously added names should be visible
      for (let j = 0; j <= i; j++) {
        expect(screen.getByText(exercisesToAdd[j]!.name)).toBeTruthy()
      }
    }
  })
})
