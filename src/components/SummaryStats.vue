<template>
  <div class="grid grid-cols-3 gap-3">
    <div class="stat-tile">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Assigned</p>
      <p class="text-3xl font-extrabold text-ink mt-1">{{ totalAssigned }}</p>
    </div>
    <div class="stat-tile">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Completed</p>
      <p class="text-3xl font-extrabold text-lime-500 mt-1">{{ totalCompleted }}</p>
    </div>
    <div class="stat-tile">
      <p class="text-xs font-semibold uppercase tracking-wide text-ink-muted">Completion</p>
      <p class="text-3xl font-extrabold mt-1" :class="completionColor">{{ completionPercentage }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component SummaryStats
 * @description Displays three stat cards: total assigned workouts, total completed,
 * and the completion percentage (colour-coded green/yellow/red by threshold).
 *
 * @prop {number} totalAssigned - Total number of workouts assigned in the period
 * @prop {number} totalCompleted - Total number of workouts completed in the period
 */
import { computed } from 'vue'

const props = defineProps<{
  totalAssigned: number
  totalCompleted: number
}>()

/**
 * Calculates the completion percentage as a rounded integer.
 * Returns 0 when no workouts are assigned.
 */
const completionPercentage = computed(() => {
  if (props.totalAssigned === 0) return 0
  return Math.round((props.totalCompleted / props.totalAssigned) * 100)
})

/**
 * Returns a Tailwind colour class for the completion percentage.
 * Green for ≥ 80%, yellow for ≥ 50%, red otherwise.
 */
const completionColor = computed(() => {
  const pct = completionPercentage.value
  if (pct >= 80) return 'text-lime-500'
  if (pct >= 50) return 'text-amber-400'
  return 'text-red-400'
})
</script>
