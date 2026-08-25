<template>
  <div class="space-y-4">
    <div v-if="exercisesStore.error" class="alert-error">
      <p class="text-red-400 text-sm">{{ exercisesStore.error }}</p>
    </div>

    <div v-if="exercisesStore.loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-surface-border border-t-accent-500 rounded-full animate-spin"></div>
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
