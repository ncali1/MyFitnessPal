<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h2 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Weekly Routine</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="day in days"
        :key="day"
        @click="selectDay(day)"
        :class="[
          'p-4 rounded-lg border-2 cursor-pointer transition-all',
          selectedDay === day
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:border-blue-300'
        ]"
      >
        <h3 class="font-semibold text-lg mb-3 text-gray-900 dark:text-white capitalize">
          {{ day }}
        </h3>
        
        <div v-if="getExercisesForDay(day).length === 0" class="text-gray-500 dark:text-gray-400 text-sm">
          No exercises assigned
        </div>
        
        <div v-else class="space-y-2">
          <div
            v-for="exerciseId in getExercisesForDay(day)"
            :key="exerciseId"
            class="bg-white dark:bg-gray-600 p-2 rounded text-sm text-gray-700 dark:text-gray-200 truncate"
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
