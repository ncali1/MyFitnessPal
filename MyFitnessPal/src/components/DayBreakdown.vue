<template>
  <div class="card overflow-hidden">
    <div class="grid grid-cols-7 divide-x divide-surface-border overflow-x-auto">
      <div
        v-for="day in DAYS"
        :key="day.key"
        class="flex flex-col items-center py-4 px-1"
      >
        <span class="text-[10px] font-semibold text-ink-faint uppercase mb-2 tracking-wide">
          {{ day.label }}
        </span>
        <div class="flex flex-col items-center gap-1.5">
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs"
            :class="statusClass(day.key)"
            :title="statusTitle(day.key)"
          >
            {{ statusIcon(day.key) }}
          </span>
          <span class="text-[10px] text-ink-muted">
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
  if (data.completed === data.assigned) return '✓'
  if (data.completed > 0) return '·'
  return '×'
}

/**
 * Returns a Tailwind background/text class for the given day's status dot.
 * @param day - Lowercase day name
 */
function statusClass(day: string): string {
  const data = props.breakdown[day]
  if (!data || data.assigned === 0) return 'bg-surface-hover text-ink-faint'
  if (data.completed === data.assigned) return 'bg-lime-500 text-base-900 font-bold'
  if (data.completed > 0) return 'bg-amber-500/20 text-amber-400 font-bold'
  return 'bg-red-500/15 text-red-400 font-bold'
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
