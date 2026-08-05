<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
      Select Exercises for {{ dayLabel }}
    </h3>

    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Available Exercises
      </label>
      <select
        v-model="selectedExerciseId"
        @change="addExercise"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select an exercise --</option>
        <option
          v-for="exercise in availableExercises"
          :key="exercise.id"
          :value="exercise.id"
        >
          {{ exercise.name }} ({{ exercise.targetSets }}x{{ exercise.targetReps }})
        </option>
      </select>
    </div>

    <div v-if="selectedExercises.length > 0" class="space-y-2">
      <h4 class="font-medium text-gray-900 dark:text-white mb-2">Selected Exercises:</h4>
      <div
        v-for="exerciseId in selectedExercises"
        :key="exerciseId"
        class="flex items-center justify-between bg-blue-50 dark:bg-blue-900 p-3 rounded-lg"
      >
        <span class="text-gray-900 dark:text-white">
          {{ getExerciseName(exerciseId) }}
        </span>
        <button
          @click="removeExercise(exerciseId)"
          class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
        >
          Remove
        </button>
      </div>
    </div>

    <div v-else class="text-gray-500 dark:text-gray-400 text-sm">
      No exercises selected yet
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component ExerciseSelector
 * @description Displays a dropdown of exercises not yet assigned to the current day and
 * a list of already-selected exercises. Emits `add-exercise` and `remove-exercise` so the
 * parent (RoutineBuilder) can update the routine store.
 *
 * @prop {string} day - The day being edited (lowercase, e.g. `'monday'`)
 * @prop {string[]} selectedExercises - IDs of exercises already assigned to this day
 * @emits add-exercise - `(exerciseId: string)` — fired when the user picks an exercise from the dropdown
 * @emits remove-exercise - `(exerciseId: string)` — fired when the user clicks Remove
 */
import { ref, computed } from 'vue'
import { useExercisesStore } from '../stores/exercises'

interface Props {
  day: string
  selectedExercises: string[]
}

interface Emits {
  (e: 'add-exercise', exerciseId: string): void
  (e: 'remove-exercise', exerciseId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedExerciseId = ref<string>('')
const exercisesStore = useExercisesStore()

/** Capitalised day label for the section heading. */
const dayLabel = computed(() => {
  return props.day.charAt(0).toUpperCase() + props.day.slice(1)
})

/** Exercises that are not yet assigned to this day, shown in the dropdown. */
const availableExercises = computed(() => {
  return exercisesStore.allExercises.filter(
    (ex) => !props.selectedExercises.includes(ex.id)
  )
})

/**
 * Emits `add-exercise` with the currently selected dropdown value, then clears the selection.
 */
const addExercise = () => {
  if (selectedExerciseId.value) {
    emit('add-exercise', selectedExerciseId.value)
    selectedExerciseId.value = ''
  }
}

/**
 * Emits `remove-exercise` for the given exercise ID.
 * @param exerciseId - ID of the exercise to remove
 */
const removeExercise = (exerciseId: string) => {
  emit('remove-exercise', exerciseId)
}

/**
 * Looks up the display name of an exercise by ID.
 * @param exerciseId - ID of the exercise
 * @returns The exercise name, or `'Unknown Exercise'` if not found
 */
const getExerciseName = (exerciseId: string) => {
  const exercise = exercisesStore.exerciseById(exerciseId)
  return exercise?.name || 'Unknown Exercise'
}
</script>
