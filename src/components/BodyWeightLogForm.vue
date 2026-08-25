<template>
  <div class="card-pad">
    <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">Log Weight</h3>

    <form @submit.prevent="submitForm" class="flex flex-wrap items-end gap-4">
      <div class="min-w-40">
        <label for="bw-date" class="field-label">Date</label>
        <input id="bw-date" v-model="date" type="date" :max="today" class="field-input" />
      </div>

      <div class="min-w-32">
        <label for="bw-weight" class="field-label">Weight ({{ settingsStore.weightUnit }})</label>
        <input
          id="bw-weight"
          v-model.number="weight"
          type="number"
          step="0.1"
          min="0"
          :placeholder="settingsStore.weightUnit === 'kg' ? '75.0' : '165.0'"
          class="field-input"
        />
      </div>

      <button type="submit" :disabled="isSubmitting || !weight" class="btn-primary">
        {{ isSubmitting ? 'Saving...' : 'Log' }}
      </button>
    </form>

    <p v-if="submitError" class="field-error mt-2">{{ submitError }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * @component BodyWeightLogForm
 * @description Small inline form for logging today's (or a past) body weight entry.
 * Accepts input in the user's preferred display unit and converts to canonical kg
 * before saving — logging again on the same date overwrites that date's entry.
 */
import { ref } from 'vue'
import { useBodyWeightStore } from '../stores/bodyWeight'
import { useSettingsStore } from '../stores/settings'
import { toKg } from '../utils/units'

const bodyWeightStore = useBodyWeightStore()
const settingsStore = useSettingsStore()

const today = new Date().toISOString().split('T')[0] as string

const date = ref(today)
const weight = ref<number | null>(null)
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

async function submitForm() {
  if (weight.value == null) return

  try {
    isSubmitting.value = true
    submitError.value = null

    const weightKg = toKg(weight.value, settingsStore.weightUnit)!
    await bodyWeightStore.logWeight(date.value, weightKg)

    weight.value = null
  } catch (err) {
    console.error('Failed to log body weight:', err)
    submitError.value = 'Failed to save. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
