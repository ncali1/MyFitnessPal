<template>
  <div class="space-y-5">
    <div v-if="error" class="alert-error">
      <p class="text-red-400 text-sm">{{ error }}</p>
      <button type="button" @click="error = null" class="text-red-400 hover:text-red-300 ml-2 text-lg leading-none" aria-label="Dismiss error">&times;</button>
    </div>

    <div v-if="routineStore.error" class="alert-error">
      <p class="text-red-400 text-sm">{{ routineStore.error }}</p>
    </div>

    <div v-if="routineStore.loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-surface-border border-t-accent-500 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <WeeklyGrid ref="weeklyGridRef" />

      <ExerciseSelector
        :day="selectedDay"
        :selected-exercises="getExercisesForDay(selectedDay)"
        @add-exercise="handleAddExercise"
        @remove-exercise="handleRemoveExercise"
      />

      <div class="flex gap-3">
        <button @click="saveRoutine" :disabled="routineStore.loading" class="btn-primary">
          {{ routineStore.loading ? 'Saving...' : 'Save Routine' }}
        </button>
        <button @click="resetRoutine" class="btn-secondary">
          Reset
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @component RoutineBuilder
 * @description Allows the user to build their weekly workout routine by assigning exercises to
 * specific days. Composes WeeklyGrid (for day selection) with ExerciseSelector (for
 * add/remove operations) and exposes Save / Reset actions.
 *
 * @emits No custom events — all mutations go through the routine store.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoutineStore } from '../stores/routine'
import WeeklyGrid from './WeeklyGrid.vue'
import ExerciseSelector from './ExerciseSelector.vue'

const routineStore = useRoutineStore()
const weeklyGridRef = ref<InstanceType<typeof WeeklyGrid>>()
const error = ref<string | null>(null)

/** The day currently highlighted in the WeeklyGrid, defaults to 'monday'. */
const selectedDay = computed(() => {
  return weeklyGridRef.value?.selectedDay || 'monday'
})

/**
 * Returns the exercise IDs assigned to the given day in the current routine.
 * @param day - Lowercase day name (e.g. `'monday'`)
 * @returns Array of exercise IDs
 */
const getExercisesForDay = (day: string) => {
  return routineStore.routineForDay(day)
}

/**
 * Assigns an exercise to the currently selected day.
 * @param exerciseId - ID of the exercise to add
 */
const handleAddExercise = async (exerciseId: string) => {
  try {
    await routineStore.assignExercise(selectedDay.value, exerciseId)
  } catch (err) {
    console.error('Failed to add exercise:', err)
    error.value = 'Failed to add exercise to routine. Please try again.'
  }
}

/**
 * Removes an exercise from the currently selected day.
 * @param exerciseId - ID of the exercise to remove
 */
const handleRemoveExercise = async (exerciseId: string) => {
  try {
    await routineStore.removeExercise(selectedDay.value, exerciseId)
  } catch (err) {
    console.error('Failed to remove exercise:', err)
    error.value = 'Failed to remove exercise from routine. Please try again.'
  }
}

/**
 * Persists the current routine state to IndexedDB.
 */
const saveRoutine = async () => {
  try {
    await routineStore.saveRoutine()
  } catch (err) {
    console.error('Failed to save routine:', err)
    error.value = 'Failed to save routine. Please try again.'
  }
}

/**
 * Discards any unsaved local changes by reloading the routine from storage.
 */
const resetRoutine = () => {
  // Reload routine from storage to discard unsaved changes
  routineStore.loadRoutine()
}

onMounted(async () => {
  try {
    await routineStore.loadRoutine()
  } catch (err) {
    console.error('Failed to load routine:', err)
    error.value = 'Failed to load routine. Please refresh the page.'
  }
})
</script>
