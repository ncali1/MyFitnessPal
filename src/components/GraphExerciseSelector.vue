<template>
  <select
    :value="modelValue ?? ''"
    @change="onChange"
    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">-- Select an exercise --</option>
    <option
      v-for="exercise in exercisesStore.allExercises"
      :key="exercise.id"
      :value="exercise.id"
    >
      {{ exercise.name }}
    </option>
  </select>
</template>

<script setup lang="ts">
/**
 * @component GraphExerciseSelector
 * @description A `<select>` dropdown pre-populated from the exercises store, used to
 * pick which exercise to display in the Progress Graphs view. Implements `v-model`
 * via the `modelValue` / `update:modelValue` pattern.
 *
 * @prop {string | null} modelValue - The currently selected exercise ID, or null
 * @emits update:modelValue - `(value: string | null)` — emitted on selection change
 */
import { useExercisesStore } from '../stores/exercises'

interface Props {
  modelValue: string | null
}

interface Emits {
  (e: 'update:modelValue', value: string | null): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const exercisesStore = useExercisesStore()

/**
 * Handles the native select change event and emits the new exercise ID (or null if
 * the placeholder option is selected).
 * @param event - The DOM change event from the select element
 */
const onChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  emit('update:modelValue', value || null)
}
</script>
