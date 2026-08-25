/**
 * End-to-end tests for the WorkoutReminder component: the first-run opt-in ask,
 * the daily nudge once enabled, opting out, and the once-per-day cooldown.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import WorkoutReminder from './WorkoutReminder.vue'
import { useRoutineStore } from '../stores/routine'
import { useSettingsStore } from '../stores/settings'

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

// A known Monday — matches the routine assignment used below.
const TODAY = new Date(2025, 0, 6)

beforeEach(() => {
  // Only fake Date — real timers stay intact so setTimeout/Transition still work normally.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(TODAY)
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

/** Renders WorkoutReminder with a routine assigned for today (Monday). */
async function renderWithTodayAssigned() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const routineStore = useRoutineStore()
  await routineStore.assignExercise('monday', 'ex1')

  const result = render(WorkoutReminder, { global: { plugins: [pinia] } })
  return { ...result, routineStore }
}

describe('E2E: Workout Reminder', () => {
  it('shows nothing when reminders were explicitly disabled', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settingsStore = useSettingsStore()
    settingsStore.setRemindersEnabled(false)

    const routineStore = useRoutineStore()
    await routineStore.assignExercise('monday', 'ex1')

    render(WorkoutReminder, { global: { plugins: [pinia] } })

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText(/you usually train today/i)).toBeNull()
  })

  it('shows an opt-in ask on the first qualifying day, and enabling switches to the nudge', async () => {
    await renderWithTodayAssigned()

    expect(await screen.findByText(/want a nudge like this/i)).toBeTruthy()

    const settingsStore = useSettingsStore()
    expect(settingsStore.remindersEnabled).toBeNull()

    await fireEvent.click(screen.getByRole('button', { name: /enable/i }))

    expect(settingsStore.remindersEnabled).toBe(true)
    await waitFor(() => {
      expect(screen.getByText(/nothing logged yet/i)).toBeTruthy()
    })
  })

  it('dismisses and remembers opt-out when "No thanks" is clicked', async () => {
    await renderWithTodayAssigned()

    await screen.findByText(/want a nudge like this/i)
    await fireEvent.click(screen.getByRole('button', { name: /no thanks/i }))

    const settingsStore = useSettingsStore()
    expect(settingsStore.remindersEnabled).toBe(false)
    expect(screen.queryByText(/want a nudge like this/i)).toBeNull()
  })

  it('shows the nudge directly (no ask) once reminders are already enabled', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settingsStore = useSettingsStore()
    settingsStore.setRemindersEnabled(true)

    const routineStore = useRoutineStore()
    await routineStore.assignExercise('monday', 'ex1')

    render(WorkoutReminder, { global: { plugins: [pinia] } })

    expect(await screen.findByText(/nothing logged yet/i)).toBeTruthy()
    expect(screen.queryByText(/want a nudge like this/i)).toBeNull()
  })

  it('does not show a second time the same day once already shown', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settingsStore = useSettingsStore()
    settingsStore.setRemindersEnabled(true)

    const routineStore = useRoutineStore()
    await routineStore.assignExercise('monday', 'ex1')

    const first = render(WorkoutReminder, { global: { plugins: [pinia] } })
    await screen.findByText(/nothing logged yet/i)
    first.unmount()

    render(WorkoutReminder, { global: { plugins: [pinia] } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText(/nothing logged yet/i)).toBeNull()
  })
})
