/**
 * End-to-end workflow tests for RoutineBuilder component.
 *
 * Tests the full user workflow: building a weekly routine by assigning exercises
 * to days, verifying display, and modifying assignments.
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import RoutineBuilder from './RoutineBuilder.vue'
import { useExercisesStore } from '../stores/exercises'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { getWeekStart } from '../utils/calculations'

// Mock the storage service (same pattern as existing tests)
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

/**
 * Helper: render RoutineBuilder with a fresh Pinia instance and pre-populated exercises.
 * Returns the rendered result plus store references.
 */
async function renderWithExercises() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const exercisesStore = useExercisesStore()
  const routineStore = useRoutineStore()

  // Pre-populate exercises store with 3 exercises
  const pushUps = await exercisesStore.createExercise('Push-ups', 3, 15, ['Chest', 'Triceps'])
  const pullUps = await exercisesStore.createExercise('Pull-ups', 3, 10, ['Back', 'Biceps'])
  const squats = await exercisesStore.createExercise('Squats', 4, 12, ['Legs', 'Glutes'])

  const result = render(RoutineBuilder, { global: { plugins: [pinia] } })

  // Wait for the component to finish mounting (loadRoutine is called in onMounted)
  await waitFor(() => {
    expect(screen.queryByRole('status')).toBeNull()
  })

  return { ...result, pinia, exercisesStore, routineStore, pushUps, pullUps, squats }
}

/**
 * Helper: click a day cell in the WeeklyGrid to select it.
 * Clicks the heading element inside the day cell; the click bubbles up to the
 * parent div which has the @click="selectDay(day)" handler.
 */
async function selectDay(dayName: string) {
  // The day heading is an h3 inside the clickable div.
  // Click the h3 directly — the event bubbles to the parent div's click handler.
  const heading = screen.getByRole('heading', { name: new RegExp(`^${dayName}$`, 'i') })
  await fireEvent.click(heading)
  // Allow Vue to flush reactivity updates
  await new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Helper: select an exercise from the ExerciseSelector dropdown.
 */
async function selectExerciseFromDropdown(exerciseName: string) {
  const select = screen.getByRole('combobox')
  // Find the option by partial text (name is followed by sets×reps)
  const option = Array.from(select.querySelectorAll('option')).find((o) =>
    o.textContent?.includes(exerciseName)
  )
  expect(option, `Option for "${exerciseName}" not found in dropdown`).toBeTruthy()
  await fireEvent.change(select, { target: { value: option!.getAttribute('value') } })
}

// ─────────────────────────────────────────────────────────────────────────────

describe('RoutineBuilder – Build Routine E2E Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Requirement 2.1: Weekly grid displays all 7 days ──────────────────────

  describe('Weekly grid displays all 7 days (Req 2.1)', () => {
    it('renders all seven days of the week', async () => {
      await renderWithExercises()

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      for (const day of days) {
        expect(screen.getByRole('heading', { name: new RegExp(`^${day}$`, 'i') })).toBeTruthy()
      }
    })

    it('shows "No exercises assigned" for each empty day initially', async () => {
      await renderWithExercises()

      const emptyMessages = screen.getAllByText(/no exercises assigned/i)
      // All 7 days start empty
      expect(emptyMessages.length).toBe(7)
    })
  })

  // ── Requirement 2.2: Assign exercises to days ─────────────────────────────

  describe('Assign exercises to each day of the week (Req 2.2)', () => {
    it('assigns Push-ups to Monday and displays it in the grid', async () => {
      await renderWithExercises()

      // Monday is selected by default; assign Push-ups
      await selectExerciseFromDropdown('Push-ups')

      await waitFor(() => {
        // The exercise name should appear in the selected exercises list
        expect(screen.getAllByText(/push-ups/i).length).toBeGreaterThan(0)
      })
    })

    it('assigns an exercise to each day of the week', async () => {
      const { routineStore, pushUps } = await renderWithExercises()

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

      for (const day of days) {
        await selectDay(day)
        await selectExerciseFromDropdown('Push-ups')
        await waitFor(() => {
          expect(routineStore.routineForDay(day)).toContain(pushUps.id)
        })
      }

      // Verify all days have Push-ups assigned in the store
      for (const day of days) {
        expect(routineStore.routineForDay(day)).toContain(pushUps.id)
      }
    })

    it('assigns Pull-ups to Tuesday via UI interaction', async () => {
      const { routineStore, pullUps } = await renderWithExercises()

      await selectDay('tuesday')
      await selectExerciseFromDropdown('Pull-ups')

      await waitFor(() => {
        expect(routineStore.routineForDay('tuesday')).toContain(pullUps.id)
      })
    })

    it('assigns Squats to Wednesday via UI interaction', async () => {
      const { routineStore, squats } = await renderWithExercises()

      await selectDay('wednesday')
      await selectExerciseFromDropdown('Squats')

      await waitFor(() => {
        expect(routineStore.routineForDay('wednesday')).toContain(squats.id)
      })
    })

    it('assigns exercises to Saturday and Sunday (weekend days)', async () => {
      const { routineStore, pushUps, squats } = await renderWithExercises()

      await selectDay('saturday')
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => {
        expect(routineStore.routineForDay('saturday')).toContain(pushUps.id)
      })

      await selectDay('sunday')
      await selectExerciseFromDropdown('Squats')
      await waitFor(() => {
        expect(routineStore.routineForDay('sunday')).toContain(squats.id)
      })
    })
  })

  // ── Requirement 2.3: Multiple exercises per day ───────────────────────────

  describe('Assign multiple exercises to the same day (Req 2.3)', () => {
    it('assigns all three exercises to Monday', async () => {
      const { routineStore, pushUps, pullUps, squats } = await renderWithExercises()

      // Monday is selected by default
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))

      await selectExerciseFromDropdown('Pull-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pullUps.id))

      await selectExerciseFromDropdown('Squats')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(squats.id))

      expect(routineStore.routineForDay('monday')).toHaveLength(3)
    })

    it('shows all assigned exercises in the selected exercises list', async () => {
      await renderWithExercises()

      // Assign two exercises to Monday (default selected day)
      await selectExerciseFromDropdown('Push-ups')
      await selectExerciseFromDropdown('Pull-ups')

      await waitFor(() => {
        expect(screen.getAllByText(/push-ups/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/pull-ups/i).length).toBeGreaterThan(0)
      })
    })

    it('does not add duplicate exercise to the same day', async () => {
      const { routineStore, pushUps } = await renderWithExercises()

      // Assign Push-ups once via store directly (simulating first assignment)
      await routineStore.assignExercise('monday', pushUps.id)

      // The dropdown should no longer show Push-ups (already assigned, filtered out)
      await waitFor(() => {
        const select = screen.getByRole('combobox')
        const options = Array.from(select.querySelectorAll('option'))
        const pushUpsOption = options.find((o) => o.textContent?.includes('Push-ups'))
        expect(pushUpsOption).toBeUndefined()
      })

      // Store should still have only one entry
      expect(routineStore.routineForDay('monday')).toHaveLength(1)
    })

    it('allows same exercise to be assigned to different days', async () => {
      const { routineStore, pushUps } = await renderWithExercises()

      // Assign Push-ups to Monday
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))

      // Switch to Wednesday and assign Push-ups there too
      await selectDay('wednesday')
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('wednesday')).toContain(pushUps.id))

      // Both days should have Push-ups
      expect(routineStore.routineForDay('monday')).toContain(pushUps.id)
      expect(routineStore.routineForDay('wednesday')).toContain(pushUps.id)
    })
  })

  // ── Requirement 2.4: Modify assignments (remove exercise) ─────────────────

  describe('Modify assignments – remove exercise from a day (Req 2.4)', () => {
    it('removes an exercise from Monday via the Remove button', async () => {
      const { routineStore, pushUps } = await renderWithExercises()

      // Assign Push-ups to Monday first
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))

      // Click the Remove button next to Push-ups
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await fireEvent.click(removeButton)

      await waitFor(() => {
        expect(routineStore.routineForDay('monday')).not.toContain(pushUps.id)
        expect(routineStore.routineForDay('monday')).toHaveLength(0)
      })
    })

    it('removes only the specified exercise, leaving others intact', async () => {
      const { routineStore, pushUps, pullUps } = await renderWithExercises()

      // Assign both Push-ups and Pull-ups to Monday
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))

      await selectExerciseFromDropdown('Pull-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pullUps.id))

      // Find and click the Remove button specifically for Push-ups
      // The selected exercises list shows each exercise with its own Remove button
      const exerciseItems = screen.getAllByRole('button', { name: /remove/i })
      // First Remove button corresponds to Push-ups (first assigned)
      await fireEvent.click(exerciseItems[0]!)

      await waitFor(() => {
        expect(routineStore.routineForDay('monday')).not.toContain(pushUps.id)
        expect(routineStore.routineForDay('monday')).toContain(pullUps.id)
        expect(routineStore.routineForDay('monday')).toHaveLength(1)
      })
    })

    it('shows "No exercises selected yet" after removing the last exercise', async () => {
      await renderWithExercises()

      // Assign one exercise
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => {
        expect(screen.queryByText(/no exercises selected yet/i)).toBeNull()
      })

      // Remove it
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.getByText(/no exercises selected yet/i)).toBeTruthy()
      })
    })

    it('removing exercise from one day does not affect other days', async () => {
      const { routineStore, pushUps } = await renderWithExercises()

      // Assign Push-ups to Monday
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))

      // Assign Push-ups to Wednesday
      await selectDay('wednesday')
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('wednesday')).toContain(pushUps.id))

      // Go back to Monday and remove Push-ups
      await selectDay('monday')
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await fireEvent.click(removeButton)

      await waitFor(() => {
        expect(routineStore.routineForDay('monday')).not.toContain(pushUps.id)
      })

      // Wednesday should still have Push-ups
      expect(routineStore.routineForDay('wednesday')).toContain(pushUps.id)
    })
  })

  // ── Routine display correctness ───────────────────────────────────────────

  describe('Routine displays correctly in the weekly grid', () => {
    it('shows exercise names in the day cell after assignment', async () => {
      const { routineStore, pushUps } = await renderWithExercises()

      // Assign Push-ups to Monday via store (simulates a saved state)
      await routineStore.assignExercise('monday', pushUps.id)

      // The WeeklyGrid should render the exercise name inside the Monday cell
      await waitFor(() => {
        // Push-ups name should appear in the grid (in the day cell)
        const allPushUpsText = screen.getAllByText(/push-ups/i)
        expect(allPushUpsText.length).toBeGreaterThan(0)
      })
    })

    it('shows "No exercises assigned" in grid cell when day is empty', async () => {
      await renderWithExercises()

      // All days start empty
      const emptyMessages = screen.getAllByText(/no exercises assigned/i)
      expect(emptyMessages.length).toBe(7)
    })

    it('updates grid display after assigning exercise to a day', async () => {
      await renderWithExercises()

      // Initially 7 empty days
      expect(screen.getAllByText(/no exercises assigned/i)).toHaveLength(7)

      // Assign Push-ups to Monday
      await selectExerciseFromDropdown('Push-ups')

      await waitFor(() => {
        // Now only 6 days should show "No exercises assigned"
        expect(screen.getAllByText(/no exercises assigned/i)).toHaveLength(6)
      })
    })

    it('updates grid display after removing exercise from a day', async () => {
      await renderWithExercises()

      // Assign Push-ups to Monday
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => {
        expect(screen.getAllByText(/no exercises assigned/i)).toHaveLength(6)
      })

      // Remove Push-ups
      const removeButton = screen.getByRole('button', { name: /remove/i })
      await fireEvent.click(removeButton)

      await waitFor(() => {
        // Back to 7 empty days
        expect(screen.getAllByText(/no exercises assigned/i)).toHaveLength(7)
      })
    })

    it('displays multiple exercises in the same day cell', async () => {
      const { routineStore, pushUps, pullUps, squats } = await renderWithExercises()

      // Assign all three exercises to Friday via store
      await routineStore.assignExercise('friday', pushUps.id)
      await routineStore.assignExercise('friday', pullUps.id)
      await routineStore.assignExercise('friday', squats.id)

      await waitFor(() => {
        // All three exercise names should appear in the grid
        expect(screen.getAllByText(/push-ups/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/pull-ups/i).length).toBeGreaterThan(0)
        expect(screen.getAllByText(/squats/i).length).toBeGreaterThan(0)
      })
    })
  })

  // ── Save routine workflow ─────────────────────────────────────────────────

  describe('Save routine workflow', () => {
    it('saves the routine when Save Routine button is clicked', async () => {
      await renderWithExercises()
      const { storageService } = await import('../services/storage')

      // Assign an exercise
      await selectExerciseFromDropdown('Push-ups')

      // Click Save Routine
      const saveButton = screen.getByRole('button', { name: /save routine/i })
      await fireEvent.click(saveButton)

      await waitFor(() => {
        expect(storageService.saveRoutine).toHaveBeenCalled()
      })
    })

    it('persists all day assignments after saving', async () => {
      const { routineStore, pushUps, pullUps, squats } = await renderWithExercises()

      // Build a full routine
      await selectDay('monday')
      await selectExerciseFromDropdown('Push-ups')

      await selectDay('wednesday')
      await selectExerciseFromDropdown('Pull-ups')

      await selectDay('friday')
      await selectExerciseFromDropdown('Squats')

      // Save
      const saveButton = screen.getByRole('button', { name: /save routine/i })
      await fireEvent.click(saveButton)

      await waitFor(() => {
        expect(routineStore.routineForDay('monday')).toContain(pushUps.id)
        expect(routineStore.routineForDay('wednesday')).toContain(pullUps.id)
        expect(routineStore.routineForDay('friday')).toContain(squats.id)
      })
    })
  })

  // ── Full workflow: build complete weekly routine ───────────────────────────

  describe('Full workflow: build a complete weekly routine', () => {
    it('assigns different exercises to each day and verifies the complete routine', async () => {
      const { routineStore, pushUps, pullUps, squats } = await renderWithExercises()

      // Use the store directly to assign exercises to each day.
      // This simulates the result of a user building a full weekly routine
      // (the UI interaction for day-switching is covered by other tests).
      await routineStore.assignExercise('monday', pushUps.id)
      await routineStore.assignExercise('tuesday', pullUps.id)
      await routineStore.assignExercise('wednesday', squats.id)
      await routineStore.assignExercise('thursday', pushUps.id)
      await routineStore.assignExercise('thursday', pullUps.id)
      await routineStore.assignExercise('friday', pushUps.id)
      await routineStore.assignExercise('friday', pullUps.id)
      await routineStore.assignExercise('friday', squats.id)
      await routineStore.assignExercise('sunday', squats.id)

      // Verify the complete routine state in the store
      const allAssignments = routineStore.allAssignments
      expect(allAssignments.monday).toContain(pushUps.id)
      expect(allAssignments.tuesday).toContain(pullUps.id)
      expect(allAssignments.wednesday).toContain(squats.id)
      expect(allAssignments.thursday).toHaveLength(2)
      expect(allAssignments.thursday).toContain(pushUps.id)
      expect(allAssignments.thursday).toContain(pullUps.id)
      expect(allAssignments.friday).toHaveLength(3)
      expect(allAssignments.friday).toContain(pushUps.id)
      expect(allAssignments.friday).toContain(pullUps.id)
      expect(allAssignments.friday).toContain(squats.id)
      expect(allAssignments.saturday).toHaveLength(0)
      expect(allAssignments.sunday).toContain(squats.id)

      // Verify the grid renders all assigned exercises
      await waitFor(() => {
        // Push-ups appears in Monday, Thursday, Friday cells
        expect(screen.getAllByText(/push-ups/i).length).toBeGreaterThanOrEqual(3)
        // Pull-ups appears in Tuesday, Thursday, Friday cells
        expect(screen.getAllByText(/pull-ups/i).length).toBeGreaterThanOrEqual(3)
        // Squats appears in Wednesday, Friday, Sunday cells
        expect(screen.getAllByText(/squats/i).length).toBeGreaterThanOrEqual(3)
      })

      // Saturday should still show "No exercises assigned"
      const noExercisesMessages = screen.getAllByText(/no exercises assigned/i)
      expect(noExercisesMessages.length).toBe(1) // only Saturday
    })

    it('builds routine, modifies it, and verifies final state', async () => {
      const { routineStore, pushUps, pullUps, squats } = await renderWithExercises()

      // Step 1: Assign Push-ups and Pull-ups to Monday
      await selectDay('monday')
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))
      await selectExerciseFromDropdown('Pull-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pullUps.id))

      expect(routineStore.routineForDay('monday')).toHaveLength(2)

      // Step 2: Remove Push-ups from Monday
      const removeButtons = screen.getAllByRole('button', { name: /remove/i })
      await fireEvent.click(removeButtons[0]!) // Remove first (Push-ups)

      await waitFor(() => {
        expect(routineStore.routineForDay('monday')).not.toContain(pushUps.id)
        expect(routineStore.routineForDay('monday')).toContain(pullUps.id)
        expect(routineStore.routineForDay('monday')).toHaveLength(1)
      })

      // Step 3: Add Squats to Monday
      await selectExerciseFromDropdown('Squats')
      await waitFor(() => {
        expect(routineStore.routineForDay('monday')).toContain(squats.id)
        expect(routineStore.routineForDay('monday')).toHaveLength(2)
      })

      // Final state: Monday has Pull-ups and Squats
      expect(routineStore.routineForDay('monday')).toContain(pullUps.id)
      expect(routineStore.routineForDay('monday')).toContain(squats.id)
      expect(routineStore.routineForDay('monday')).not.toContain(pushUps.id)
    })
  })

  // ── Multiple routines/programs ─────────────────────────────────────────────

  describe('Multiple routines', () => {
    it('creates a second routine, switches active, keeps assignments separate, and invalidates the weekly-summary cache so the switch is reflected (not stale)', async () => {
      const { routineStore, pushUps, squats } = await renderWithExercises()
      const sessionsStore = useWorkoutSessionsStore()
      const today = todayDayName()
      const weekStart = getWeekStart(todayDateString())

      // Assign Push-ups to today's day-of-week in the auto-created first routine ("My Routine")
      await selectDay(today)
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay(today)).toContain(pushUps.id))
      expect(routineStore.activeRoutine?.name).toBe('My Routine')

      // Prime the weekly-summary cache for "My Routine" — 1 exercise assigned this week
      const summaryBefore = sessionsStore.getCachedWeeklySummary(weekStart, routineStore.routine!)
      expect(summaryBefore.totalAssignedWorkouts).toBe(1)

      // Create a second routine — the inline form auto-activates it on save
      await fireEvent.click(screen.getByRole('button', { name: /\+ new routine/i }))
      await fireEvent.update(screen.getByLabelText(/routine name/i), '5x5')
      await fireEvent.submit(screen.getByLabelText(/routine name/i).closest('form')!)

      await waitFor(() => {
        expect(routineStore.activeRoutine?.name).toBe('5x5')
        expect(routineStore.loading).toBe(false)
      })
      // The new routine starts with no assignments — the switch must have invalidated the
      // cache from "My Routine" above, or this would incorrectly still read totalAssignedWorkouts: 1
      const summaryAfterSwitch = sessionsStore.getCachedWeeklySummary(weekStart, routineStore.routine!)
      expect(summaryAfterSwitch.totalAssignedWorkouts).toBe(0)

      // Assign Squats to today under the new active routine. Re-select the day first —
      // WeeklyGrid's local day selection resets whenever it remounts (the loading v-if/v-else
      // above toggles during store actions), same as the other tests in this file account for.
      await selectDay(today)
      await selectExerciseFromDropdown('Squats')
      await waitFor(() => expect(routineStore.routineForDay(today)).toContain(squats.id))
      expect(routineStore.routineForDay(today)).not.toContain(pushUps.id)

      // Switch back to "My Routine" via its pill — Push-ups reappears, Squats doesn't,
      // and the weekly summary reflects "My Routine" again (not "5x5"'s stale data)
      await fireEvent.click(screen.getByText('My Routine'))
      await waitFor(() => {
        expect(routineStore.activeRoutine?.name).toBe('My Routine')
        expect(routineStore.loading).toBe(false)
        expect(routineStore.routineForDay(today)).toContain(pushUps.id)
        expect(routineStore.routineForDay(today)).not.toContain(squats.id)
      })
      const summaryAfterSwitchBack = sessionsStore.getCachedWeeklySummary(weekStart, routineStore.routine!)
      expect(summaryAfterSwitchBack.totalAssignedWorkouts).toBe(1)
    })

    it('refuses to delete the last remaining routine, and auto-activates another when the active one is removed', async () => {
      const { routineStore, pushUps } = await renderWithExercises()
      await selectDay('monday')
      await selectExerciseFromDropdown('Push-ups')
      await waitFor(() => expect(routineStore.routineForDay('monday')).toContain(pushUps.id))

      // Only one routine exists — no delete button should be offered for it
      expect(screen.queryByRole('button', { name: /delete routine/i })).toBeNull()

      // Add a second routine
      await fireEvent.click(screen.getByRole('button', { name: /\+ new routine/i }))
      await fireEvent.update(screen.getByLabelText(/routine name/i), '5x5')
      await fireEvent.submit(screen.getByLabelText(/routine name/i).closest('form')!)
      await waitFor(() => {
        expect(routineStore.routines).toHaveLength(2)
        expect(routineStore.activeRoutine?.name).toBe('5x5')
        expect(routineStore.loading).toBe(false)
      })

      // Now delete affordances exist; delete the currently-active one ("5x5") specifically —
      // both routines get a delete button, so scope the query to the "5x5" pill's own row.
      vi.stubGlobal('confirm', () => true)
      const fiveByFiveRow = screen.getByText('5x5').closest('div')!
      await fireEvent.click(within(fiveByFiveRow).getByRole('button', { name: /delete routine/i }))

      await waitFor(() => {
        expect(routineStore.routines).toHaveLength(1)
        expect(routineStore.activeRoutine?.name).toBe('My Routine')
      })
    })
  })
})

/** Returns today's lowercase day-of-week name (e.g. 'monday'), matching DailyChecklist's default selected date. */
function todayDayName(): string {
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return names[new Date().getDay()]!
}

/** Returns today's date as a YYYY-MM-DD string. */
function todayDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
