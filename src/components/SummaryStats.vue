<template>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400">Assigned</p>
      <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">{{ totalAssigned }}</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400">Completed</p>
      <p class="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{{ totalCompleted }}</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-gray-200 dark:border-gray-700">
      <p class="text-sm text-gray-500 dark:text-gray-400">Completion</p>
      <p class="text-3xl font-bold mt-1" :class="completionColor">{{ completionPercentage }}%</p>
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
  if (pct >= 80) return 'text-green-600 dark:text-green-400'
  if (pct >= 50) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
})
</script>
