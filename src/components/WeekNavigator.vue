<template>
  <div class="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-4 py-3 shadow-sm border border-gray-200 dark:border-gray-700">
    <button
      @click="$emit('prev')"
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
      aria-label="Previous week"
    >
      &#8592;
    </button>

    <div class="text-center">
      <p class="text-sm font-medium text-gray-900 dark:text-white">
        {{ formatDate(weekStart) }} – {{ formatDate(weekEnd) }}
      </p>
      <p v-if="isCurrentWeek" class="text-xs text-blue-600 dark:text-blue-400 mt-0.5">This week</p>
    </div>

    <button
      @click="$emit('next')"
      :disabled="isCurrentWeek"
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
      aria-label="Next week"
    >
      &#8594;
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * @component WeekNavigator
 * @description Navigation bar for stepping between calendar weeks. Displays the week's
 * date range and emits `prev` / `next` events. The "next" button is disabled when the
 * current week is the present week.
 *
 * @prop {string} weekStart - Monday date of the displayed week in YYYY-MM-DD format
 * @prop {string} weekEnd - Sunday date of the displayed week in YYYY-MM-DD format
 * @emits prev - Fired when the user clicks the back arrow
 * @emits next - Fired when the user clicks the forward arrow (only when not on current week)
 */
import { computed } from 'vue'

const props = defineProps<{
  weekStart: string // YYYY-MM-DD (Monday)
  weekEnd: string   // YYYY-MM-DD (Sunday)
}>()

defineEmits<{
  prev: []
  next: []
}>()

/**
 * Formats a YYYY-MM-DD date string as a short month + day label.
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Formatted label, e.g. "Jan 6"
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** `true` when today falls within the displayed week (disables the Next button). */
const isCurrentWeek = computed(() => {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return todayStr >= props.weekStart && todayStr <= props.weekEnd
})
</script>
