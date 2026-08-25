/**
 * Unit tests for BodyWeightLogForm: converts the typed display-unit value to
 * canonical kg before saving.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/vue'
import { setActivePinia, createPinia } from 'pinia'
import BodyWeightLogForm from './BodyWeightLogForm.vue'
import { useBodyWeightStore } from '../stores/bodyWeight'
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
    saveBodyWeightLog: vi.fn(async () => {}),
    getAllBodyWeightLogs: vi.fn(async () => []),
    deleteBodyWeightLog: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

beforeEach(() => {
  localStorage.clear()
})

describe('BodyWeightLogForm', () => {
  it('saves the typed weight as-is (already kg) when the display unit is kg', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const bodyWeightStore = useBodyWeightStore()

    render(BodyWeightLogForm, { global: { plugins: [pinia] } })

    await fireEvent.update(screen.getByLabelText(/weight \(kg\)/i), '75')
    const form = document.querySelector('form')!
    await fireEvent.submit(form)

    await waitFor(() => {
      expect(bodyWeightStore.logs).toHaveLength(1)
    })
    expect(bodyWeightStore.logs[0]!.weightKg).toBe(75)
  })

  it('converts the typed weight from lb to kg before saving', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const settingsStore = useSettingsStore()
    settingsStore.weightUnit = 'lb'
    const bodyWeightStore = useBodyWeightStore()

    render(BodyWeightLogForm, { global: { plugins: [pinia] } })

    await fireEvent.update(screen.getByLabelText(/weight \(lb\)/i), '165')
    await fireEvent.submit(document.querySelector('form')!)

    await waitFor(() => {
      expect(bodyWeightStore.logs).toHaveLength(1)
    })
    // 165 lb ≈ 74.84 kg
    expect(bodyWeightStore.logs[0]!.weightKg).toBeCloseTo(74.84, 1)
  })
})
