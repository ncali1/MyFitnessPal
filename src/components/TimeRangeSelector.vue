<template>
  <div class="flex flex-wrap items-center gap-2">
    <!-- Preset buttons -->
    <button
      v-for="preset in presets"
      :key="preset.label"
      type="button"
      @click="selectPreset(preset)"
      :class="[
        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        activePreset === preset.label
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
      ]"
    >
      {{ preset.label }}
    </button>

    <!-- Custom date inputs -->
    <template v-if="activePreset === 'Custom'">
      <input
        type="date"
        :value="modelValue.start"
        @change="onStartChange"
        class="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <span class="text-gray-500 dark:text-gray-400 text-sm">to</span>
      <input
        type="date"
        :value="modelValue.end"
        @change="onEndChange"
        class="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @component TimeRangeSelector
 * @description Provides quick-select preset buttons (4 Weeks, 12 Weeks) and a
 * Custom mode with explicit date inputs for choosing the progress graph time range.
 * Implements `v-model` via the `modelValue` / `update:modelValue` pattern.
 *
 * @prop {{ start: string; end: string }} modelValue - Current time range (YYYY-MM-DD start and end)
 * @emits update:modelValue - `(value: { start: string; end: string })` — emitted when the range changes
 */
import { ref } from 'vue'

interface TimeRange {
  start: string
  end: string
}

const props = defineProps<{
  modelValue: TimeRange
}>()

const emit = defineEmits<{
  'update:modelValue': [value: TimeRange]
}>()

/**
 * Formats a Date as a YYYY-MM-DD string.
 * @param d - Date to format
 * @returns YYYY-MM-DD string
 */
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const presets = [
  { label: '4 Weeks', days: 28 },
  { label: '12 Weeks', days: 84 },
  { label: 'Custom', days: null },
]

const activePreset = ref<string>('4 Weeks')

/**
 * Activates a preset time range and emits the corresponding date range.
 * For the "Custom" preset, the range is not changed — the date inputs become visible.
 * @param preset - The preset object containing its label and day count (null for Custom)
 */
function selectPreset(preset: { label: string; days: number | null }) {
  activePreset.value = preset.label
  if (preset.days !== null) {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - preset.days)
    emit('update:modelValue', { start: toDateString(start), end: toDateString(today) })
  }
}

/**
 * Handles changes to the custom start date input.
 * @param event - The DOM change event from the start date input
 */
function onStartChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', { start: value, end: props.modelValue.end })
}

/**
 * Handles changes to the custom end date input.
 * @param event - The DOM change event from the end date input
 */
function onEndChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:modelValue', { start: props.modelValue.start, end: value })
}
</script>
