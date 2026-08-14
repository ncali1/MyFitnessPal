<template>
  <div class="flex items-center justify-between card-pad !py-3">
    <button
      @click="$emit('prev')"
      class="btn-icon"
      aria-label="Previous week"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    </button>

    <div class="text-center">
      <p class="text-sm font-semibold text-ink">
        {{ formatDate(weekStart) }} – {{ formatDate(weekEnd) }}
      </p>
      <p v-if="isCurrentWeek" class="text-xs text-accent-400 font-semibold mt-0.5">This week</p>
    </div>

    <button
      @click="$emit('next')"
      :disabled="isCurrentWeek"
      class="btn-icon disabled:opacity-30 disabled:cursor-not-allowed"
      aria-label="Next week"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
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
