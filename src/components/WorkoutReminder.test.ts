/**
 * Unit tests for the reminder trigger logic (`shouldNudgeToday`) and the settings
 * store's `remindersEnabled` preference.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import { shouldNudgeToday } from '../utils/reminders'
import { useSettingsStore } from '../stores/settings'
import type { Routine, WorkoutSession } from '../stores/types'

function makeRoutine(weeklyAssignments: Routine['weeklyAssignments']): Routine {
  return { id: 'r1', name: 'My Routine', isActive: true, weeklyAssignments, createdAt: Date.now(), updatedAt: Date.now() }
}

function makeSession(date: string, exercises: WorkoutSession['exercises']): WorkoutSession {
  return { id: `s-${date}`, date, exercises, createdAt: Date.now(), updatedAt: Date.now() }
}

describe('shouldNudgeToday', () => {
  const MONDAY = '2025-01-06' // known Monday

  it('returns false when there is no routine yet', () => {
    expect(shouldNudgeToday(null, [], MONDAY)).toBe(false)
  })

  it('returns false when today has nothing assigned in the routine', () => {
    const routine = makeRoutine({ monday: [] })
    expect(shouldNudgeToday(routine, [], MONDAY)).toBe(false)
  })

  it('returns true when today is assigned and nothing has been logged', () => {
    const routine = makeRoutine({ monday: ['ex1'] })
    expect(shouldNudgeToday(routine, [], MONDAY)).toBe(true)
  })

  it('returns false when today is assigned but already logged as completed', () => {
    const routine = makeRoutine({ monday: ['ex1'] })
    const sessions = [makeSession(MONDAY, [{ exerciseId: 'ex1', completed: true, timestamp: 1 }])]
    expect(shouldNudgeToday(routine, sessions, MONDAY)).toBe(false)
  })

  it('returns true when a session exists for today but nothing in it is completed', () => {
    const routine = makeRoutine({ monday: ['ex1'] })
    const sessions = [makeSession(MONDAY, [{ exerciseId: 'ex1', completed: false, timestamp: 1 }])]
    expect(shouldNudgeToday(routine, sessions, MONDAY)).toBe(true)
  })

  it('ignores completed entries logged on a different date', () => {
    const routine = makeRoutine({ monday: ['ex1'] })
    const sessions = [makeSession('2025-01-05', [{ exerciseId: 'ex1', completed: true, timestamp: 1 }])]
    expect(shouldNudgeToday(routine, sessions, MONDAY)).toBe(true)
  })
})

describe('settingsStore.remindersEnabled', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to null (never asked) when nothing is stored', () => {
    const settingsStore = useSettingsStore()
    expect(settingsStore.remindersEnabled).toBeNull()
  })

  it('persists true/false across store instances via localStorage', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.setRemindersEnabled(true)
    await nextTick()
    expect(localStorage.getItem('fittrack-reminders-enabled')).toBe('true')

    setActivePinia(createPinia())
    const reloaded = useSettingsStore()
    expect(reloaded.remindersEnabled).toBe(true)
  })

  it('persists an explicit opt-out', async () => {
    const settingsStore = useSettingsStore()
    settingsStore.setRemindersEnabled(false)
    await nextTick()

    setActivePinia(createPinia())
    const reloaded = useSettingsStore()
    expect(reloaded.remindersEnabled).toBe(false)
  })
})
