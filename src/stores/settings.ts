/**
 * @module stores/settings
 * @description Small persisted user preferences: weight display unit, default rest
 * timer duration, and whether local workout reminders are enabled. Stored in
 * localStorage (not IndexedDB/cloud) since these are per-device display preferences,
 * not workout data — no reason to sync them across devices.
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { WeightUnit } from '../utils/units'

const UNIT_KEY = 'fittrack-weight-unit'
const REST_DURATION_KEY = 'fittrack-rest-duration'
const DEFAULT_REST_SECONDS = 90
const REMINDERS_ENABLED_KEY = 'fittrack-reminders-enabled'

function readUnit(): WeightUnit {
  const stored = localStorage.getItem(UNIT_KEY)
  return stored === 'lb' ? 'lb' : 'kg'
}

function readRestDuration(): number {
  const stored = Number(localStorage.getItem(REST_DURATION_KEY))
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_REST_SECONDS
}

/** `null` means the user has never been asked yet (first-run state). */
function readRemindersEnabled(): boolean | null {
  const stored = localStorage.getItem(REMINDERS_ENABLED_KEY)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return null
}

export const useSettingsStore = defineStore('settings', () => {
  const weightUnit = ref<WeightUnit>(readUnit())
  const restDuration = ref<number>(readRestDuration())
  const remindersEnabled = ref<boolean | null>(readRemindersEnabled())

  watch(weightUnit, (unit) => localStorage.setItem(UNIT_KEY, unit))
  watch(restDuration, (seconds) => localStorage.setItem(REST_DURATION_KEY, String(seconds)))
  watch(remindersEnabled, (enabled) => {
    if (enabled === null) {
      localStorage.removeItem(REMINDERS_ENABLED_KEY)
    } else {
      localStorage.setItem(REMINDERS_ENABLED_KEY, String(enabled))
    }
  })

  /** Toggles between kg and lb display. */
  function toggleWeightUnit() {
    weightUnit.value = weightUnit.value === 'kg' ? 'lb' : 'kg'
  }

  /** Records the user's opt-in/opt-out choice for local workout reminders. */
  function setRemindersEnabled(enabled: boolean) {
    remindersEnabled.value = enabled
  }

  return { weightUnit, restDuration, remindersEnabled, toggleWeightUnit, setRemindersEnabled }
})
