<template>
  <div class="card-pad">
    <h2 class="text-ink mb-5">Weekly Routine</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="day in days"
        :key="day"
        @click="selectDay(day)"
        :class="[
          'p-4 rounded-xl border cursor-pointer transition-all',
          selectedDay === day
            ? 'border-accent-500 bg-accent-500/10'
            : 'border-surface-border bg-canvas-800 hover:border-ink-faint/50',
        ]"
      >
        <h3 class="font-semibold text-sm mb-3 text-ink capitalize flex items-center justify-between">
          {{ day }}
          <span
            v-if="getExercisesForDay(day).length > 0"
            class="w-2 h-2 rounded-full"
            :class="selectedDay === day ? 'bg-accent-500' : 'bg-lime-500'"
          />
        </h3>

        <div v-if="getExercisesForDay(day).length === 0" class="text-ink-faint text-xs">
          No exercises assigned
        </div>

        <div v-else class="space-y-1.5">
          <div
            v-for="exerciseId in getExercisesForDay(day)"
            :key="exerciseId"
            class="bg-surface-hover px-2.5 py-1.5 rounded-lg text-xs text-ink-muted truncate"
          >
            {{ getExerciseName(exerciseId) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component WeeklyGrid
 * @description Renders a 7-day grid of the weekly routine. Each day card shows its
 * assigned exercises and highlights when selected. The `selectedDay` ref is exposed
 * so parent components (RoutineBuilder) can read the current selection.
 *
 * @emits No custom events — selection state is exposed via defineExpose.
 */
import { ref } from 'vue'
import { useRoutineStore } from '../stores/routine'
import { useExercisesStore } from '../stores/exercises'

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const selectedDay = ref<string>('monday')

const routineStore = useRoutineStore()
const exercisesStore = useExercisesStore()

/**
 * Updates the selected day.
 * @param day - Lowercase day name to select
 */
const selectDay = (day: string) => {
  selectedDay.value = day
}

/**
 * Returns the exercise IDs assigned to the given day.
 * @param day - Lowercase day name
 * @returns Array of exercise IDs
 */
const getExercisesForDay = (day: string) => {
  return routineStore.routineForDay(day)
}

/**
 * Looks up the display name of an exercise by its ID.
 * @param exerciseId - ID of the exercise
 * @returns The exercise name, or `'Unknown Exercise'` if not found
 */
const getExerciseName = (exerciseId: string) => {
  const exercise = exercisesStore.exerciseById(exerciseId)
  return exercise?.name || 'Unknown Exercise'
}

defineExpose({
  selectedDay,
})
</script>
