<template>
  <div class="space-y-4">
    <div v-if="exercisesStore.error" class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
      <p class="text-red-800 dark:text-red-200">{{ exercisesStore.error }}</p>
    </div>

    <div v-if="exercisesStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <ExerciseList v-else />
  </div>
</template>

<script setup lang="ts">
/**
 * @component ExerciseManager
 * @description Container component for the exercise library. Loads all exercises on mount,
 * displays a loading spinner while fetching, shows any store-level errors, and delegates
 * rendering of the list (and CRUD actions) to ExerciseList.
 */
import { onMounted } from 'vue'
import { useExercisesStore } from '../stores/exercises'
import ExerciseList from './ExerciseList.vue'

const exercisesStore = useExercisesStore()

onMounted(async () => {
  await exercisesStore.loadExercises()
})
</script>
