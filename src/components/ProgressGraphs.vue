/**
 * @component ProgressGraphs
 * @description Displays exercise progress charts over a selectable time range.
 * Renders three lazily-loaded chart components — RepsChart, WeightChart, and
 * CompletionRateChart — once an exercise is selected. Charts are loaded
 * asynchronously via defineAsyncComponent to reduce initial bundle size.
 *
 * @emits No custom events — UI state (selected exercise, time range) is managed
 * through the UI store.
 */
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useUIStore } from '../stores/ui'
import { useExercisesStore } from '../stores/exercises'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useRoutineStore } from '../stores/routine'
import GraphExerciseSelector from './GraphExerciseSelector.vue'
import TimeRangeSelector from './TimeRangeSelector.vue'

// Lazy-load chart components — only bundled/mounted when an exercise is selected
const RepsChart = defineAsyncComponent(() => import('./RepsChart.vue'))
const WeightChart = defineAsyncComponent(() => import('./WeightChart.vue'))
const CompletionRateChart = defineAsyncComponent(() => import('./CompletionRateChart.vue'))

const uiStore = useUIStore()
const exercisesStore = useExercisesStore()
const sessionsStore = useWorkoutSessionsStore()
const routineStore = useRoutineStore()

// Two-way bindings to UI store
const selectedExercise = computed({
  get: () => uiStore.selectedExercise,
  set: (val) => uiStore.setSelectedExercise(val),
})

const timeRange = computed({
  get: () => uiStore.timeRange,
  set: (val) => uiStore.setTimeRange(val.start!, val.end!),
})

/** Display name of the currently selected exercise, used as chart labels. */
const exerciseName = computed(() => {
  if (!selectedExercise.value) return ''
  return exercisesStore.exerciseById(selectedExercise.value)?.name ?? ''
})

/**
 * Aggregated progress data for the selected exercise and time range.
 * Returns `null` when no exercise is selected or the routine is not loaded.
 */
const progressData = computed(() => {
  if (!selectedExercise.value || !routineStore.routine) return null
  return sessionsStore.getCachedProgressData(
    selectedExercise.value,
    exerciseName.value,
    timeRange.value.start!,
    timeRange.value.end!,
    routineStore.routine
  )
})

/**
 * Formats a Date as a short month + day label for chart X-axis ticks.
 * @param d - Date to format
 * @returns Formatted label, e.g. "Jan 6"
 */
function formatWeekLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Weekly average-reps data shaped for RepsChart. */
const repsData = computed(() => {
  if (!progressData.value) return []
  return progressData.value.weeklyData.map((w) => ({
    weekLabel: formatWeekLabel(w.weekStartDate),
    averageReps: w.averageReps,
  }))
})

/** Weekly average-weight data shaped for WeightChart. */
const weightData = computed(() => {
  if (!progressData.value) return []
  return progressData.value.weeklyData.map((w) => ({
    weekLabel: formatWeekLabel(w.weekStartDate),
    averageWeight: w.averageWeight === 0 ? null : w.averageWeight,
  }))
})

/** Weekly completion-rate percentages shaped for CompletionRateChart. */
const completionData = computed(() => {
  if (!progressData.value) return []
  return progressData.value.weeklyData.map((w) => ({
    weekLabel: formatWeekLabel(w.weekStartDate),
    completionRate:
      w.totalAssigned === 0 ? 0 : Math.round((w.completionCount / w.totalAssigned) * 100),
  }))
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with selectors -->
    <div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Progress Graphs</h2>
      <div class="mt-4 flex flex-wrap gap-4">
        <div class="min-w-48 flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Exercise
          </label>
          <GraphExerciseSelector v-model="selectedExercise" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range
          </label>
          <TimeRangeSelector v-model="timeRange" />
        </div>
      </div>
    </div>

    <!-- No exercise selected message -->
    <div
      v-if="!selectedExercise"
      class="rounded-lg bg-white p-12 text-center text-gray-400 shadow dark:bg-gray-800 dark:text-gray-500"
    >
      Select an exercise to view progress
    </div>

    <!-- Charts — loaded lazily via defineAsyncComponent, rendered in background via Suspense -->
    <template v-else>
      <Suspense>
        <template #default>
          <div class="space-y-6">
            <RepsChart :data="repsData" :exercise-name="exerciseName" />
            <WeightChart :data="weightData" :exercise-name="exerciseName" />
            <CompletionRateChart :data="completionData" />
          </div>
        </template>
        <template #fallback>
          <div class="rounded-lg bg-white p-12 text-center text-gray-400 shadow dark:bg-gray-800 dark:text-gray-500">
            Loading charts…
          </div>
        </template>
      </Suspense>
    </template>
  </div>
</template>
