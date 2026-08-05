<template>
  <div class="space-y-3">
    <div v-if="items.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      No exercises assigned for this day.
    </div>

    <div
      v-for="item in items"
      :key="item.exerciseId"
      class="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <!-- Checkbox -->
      <input
        :id="`exercise-${item.exerciseId}`"
        type="checkbox"
        :checked="item.completed"
        @change="onToggle(item.exerciseId, !item.completed)"
        class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
      />

      <!-- Exercise info -->
      <label :for="`exercise-${item.exerciseId}`" class="flex-1 cursor-pointer">
        <div class="flex items-center justify-between">
          <span
            :class="[
              'font-medium text-gray-900 dark:text-white',
              item.completed ? 'line-through text-gray-400 dark:text-gray-500' : '',
            ]"
          >
            {{ item.exerciseName }}
          </span>
          <span
            v-if="item.completed"
            class="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full"
          >
            Done
          </span>
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ item.targetSets }} sets × {{ item.targetReps }} reps
          <span v-if="item.targetMuscleGroups.length > 0" class="ml-2">
            · {{ item.targetMuscleGroups.join(', ') }}
          </span>
        </div>
        <!-- Logged performance summary -->
        <div v-if="item.completed && item.performance" class="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Logged: {{ item.performance.actualSets }} sets × {{ item.performance.actualReps }} reps
          <span v-if="item.performance.weight"> @ {{ item.performance.weight }}kg</span>
          · {{ item.performance.difficultyLevel }}
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component ChecklistItems
 * @description Renders a list of ChecklistItem rows, each showing the exercise name,
 * targets, completion state, and logged performance summary. Emits a `toggle` event
 * when the user clicks a checkbox.
 *
 * @prop {ChecklistItem[]} items - The checklist items to display
 * @emits toggle - `(exerciseId: string, completed: boolean)` — fired when a checkbox changes
 */
import type { ExercisePerformance } from '../stores/types'

export interface ChecklistItem {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
  targetMuscleGroups: string[]
  completed: boolean
  performance?: ExercisePerformance
}

interface Props {
  items: ChecklistItem[]
}

defineProps<Props>()

const emit = defineEmits<{
  toggle: [exerciseId: string, completed: boolean]
}>()

/**
 * Forwards the toggle event from a checkbox change to the parent component.
 * @param exerciseId - ID of the exercise whose checkbox changed
 * @param completed - The new completion state
 */
function onToggle(exerciseId: string, completed: boolean) {
  emit('toggle', exerciseId, completed)
}
</script>
