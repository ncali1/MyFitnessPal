/**
 * End-to-end test for the Body Weight tab: logging an entry, seeing it in the list,
 * and deleting it.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import BodyWeightTracker from './BodyWeightTracker.vue'

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
    saveBodyWeightLog: vi.fn(async () => {}),
    getAllBodyWeightLogs: vi.fn(async () => []),
    deleteBodyWeightLog: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

// Auto-confirm the delete prompt used by BodyWeightTracker's delete button.
vi.stubGlobal('confirm', () => true)

describe('E2E: Body Weight Tracker', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows an empty state, logs an entry via the form, and lists it', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    render(BodyWeightTracker, { global: { plugins: [pinia] } })

    const weightInput = await screen.findByLabelText(/weight \(kg\)/i)
    expect(await screen.findByText(/no entries yet/i)).toBeTruthy()

    await fireEvent.update(weightInput, '80')
    // Submitting the form directly (rather than clicking the submit button) — happy-dom
    // doesn't reliably propagate a button click into the form's native submit event.
    await fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(screen.getByText(/80kg/)).toBeTruthy()
    })
    expect(screen.queryByText(/no entries yet/i)).toBeNull()
  })

  it('deletes a logged entry', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    render(BodyWeightTracker, { global: { plugins: [pinia] } })
    const weightInput = await screen.findByLabelText(/weight \(kg\)/i)

    await fireEvent.update(weightInput, '80')
    // Submitting the form directly (rather than clicking the submit button) — happy-dom
    // doesn't reliably propagate a button click into the form's native submit event.
    await fireEvent.submit(document.querySelector('form')!)
    await waitFor(() => expect(screen.getByText(/80kg/)).toBeTruthy())

    await fireEvent.click(screen.getByRole('button', { name: /delete entry/i }))

    await waitFor(() => {
      expect(screen.getByText(/no entries yet/i)).toBeTruthy()
    })
  })
})
