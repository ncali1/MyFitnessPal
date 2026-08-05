<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div class="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700 overflow-x-auto">
      <div
        v-for="day in DAYS"
        :key="day.key"
        class="flex flex-col items-center py-3 px-1"
      >
        <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-2">
          {{ day.label }}
        </span>
        <div class="flex flex-col items-center gap-1">
          <component
            :is="'span'"
            class="text-lg"
            :title="statusTitle(day.key)"
          >
            {{ statusIcon(day.key) }}
          </component>
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ breakdown[day.key]?.completed ?? 0 }}/{{ breakdown[day.key]?.assigned ?? 0 }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component DayBreakdown
 * @description Shows a 7-column grid (Mon–Sun) with a status icon and
 * "completed/assigned" count for each day of the week.
 *
 * @prop {Record<string, { assigned: number; completed: number }>} breakdown
 *   Map of lowercase day name to assigned/completed counts
 */
const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
]

const props = defineProps<{
  breakdown: Record<string, { assigned: number; completed: number }>
}>()

/**
 * Returns a status emoji for the given day based on its completion ratio.
 * ✅ = fully complete, 🔶 = partially complete, ❌ = none complete, — = no workouts.
 * @param day - Lowercase day name
 * @returns Emoji string representing the day's status
 */
function statusIcon(day: string): string {
  const data = props.breakdown[day]
  if (!data || data.assigned === 0) return '—'
  if (data.completed === data.assigned) return '✅'
  if (data.completed > 0) return '🔶'
  return '❌'
}

/**
 * Returns an accessible tooltip string for the given day's completion data.
 * @param day - Lowercase day name
 * @returns Human-readable status string (e.g. "2 of 3 completed")
 */
function statusTitle(day: string): string {
  const data = props.breakdown[day]
  if (!data || data.assigned === 0) return 'No workouts assigned'
  return `${data.completed} of ${data.assigned} completed`
}
</script>
