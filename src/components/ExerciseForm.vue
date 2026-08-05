<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {{ exercise ? 'Edit Exercise' : 'Create Exercise' }}
        </h2>

        <form @submit.prevent="submitForm" class="space-y-4">
          <!-- Name Field -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exercise Name *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="e.g., Bench Press"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @blur="validateField('name')"
            />
            <p v-if="errors.name" class="text-red-500 text-sm mt-1">{{ errors.name }}</p>
          </div>

          <!-- Target Sets Field -->
          <div>
            <label for="targetSets" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Sets *
            </label>
            <input
              id="targetSets"
              v-model.number="form.targetSets"
              type="number"
              min="1"
              placeholder="e.g., 3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @blur="validateField('targetSets')"
            />
            <p v-if="errors.targetSets" class="text-red-500 text-sm mt-1">{{ errors.targetSets }}</p>
          </div>

          <!-- Target Reps Field -->
          <div>
            <label for="targetReps" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Reps *
            </label>
            <input
              id="targetReps"
              v-model.number="form.targetReps"
              type="number"
              min="1"
              placeholder="e.g., 10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @blur="validateField('targetReps')"
            />
            <p v-if="errors.targetReps" class="text-red-500 text-sm mt-1">{{ errors.targetReps }}</p>
          </div>

          <!-- Muscle Groups Field -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Muscle Groups *
            </label>
            <div class="space-y-2">
              <div v-for="group in muscleGroupOptions" :key="group" class="flex items-center">
                <input
                  :id="`group-${group}`"
                  :value="group"
                  v-model="form.targetMuscleGroups"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label :for="`group-${group}`" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {{ group }}
                </label>
              </div>
            </div>
            <p v-if="errors.targetMuscleGroups" class="text-red-500 text-sm mt-1">
              {{ errors.targetMuscleGroups }}
            </p>
          </div>

          <!-- Submit Error Banner -->
          <div
            v-if="submitError"
            class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-center justify-between"
          >
            <p class="text-red-800 dark:text-red-200 text-sm">{{ submitError }}</p>
            <button
              type="button"
              @click="submitError = null"
              class="text-red-500 hover:text-red-700 ml-2 text-lg leading-none"
              aria-label="Dismiss error"
            >&times;</button>
          </div>

          <!-- Form Actions -->
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="$emit('cancel')"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {{ isSubmitting ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component ExerciseForm
 * @description Modal form for creating a new exercise or editing an existing one.
 * When the `exercise` prop is provided the form is pre-populated for editing;
 * otherwise it starts blank for creation. Validates all fields before submitting
 * and surfaces store errors in a dismissible error banner.
 *
 * @prop {Exercise | null} exercise - Exercise to edit, or null/undefined for creation
 * @emits submit - Emitted after a successful create or update operation
 * @emits cancel - Emitted when the user clicks the Cancel button
 */
import { ref, reactive, watch } from 'vue'
import { useExercisesStore } from '../stores/exercises'
import type { Exercise } from '../stores/types'

interface Props {
  exercise?: Exercise | null
}

interface FormData {
  name: string
  targetSets: number
  targetReps: number
  targetMuscleGroups: string[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const exercisesStore = useExercisesStore()
const isSubmitting = ref(false)
const submitError = ref<string | null>(null)

const muscleGroupOptions = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Legs',
  'Quadriceps',
  'Hamstrings',
  'Calves',
  'Glutes',
  'Core',
]

const form = reactive<FormData>({
  name: '',
  targetSets: 3,
  targetReps: 10,
  targetMuscleGroups: [],
})

const errors = reactive<Partial<Record<keyof FormData, string>>>({})

// Initialize form with exercise data if editing
watch(
  () => props.exercise,
  (exercise) => {
    if (exercise) {
      form.name = exercise.name
      form.targetSets = exercise.targetSets
      form.targetReps = exercise.targetReps
      form.targetMuscleGroups = [...exercise.targetMuscleGroups]
    } else {
      form.name = ''
      form.targetSets = 3
      form.targetReps = 10
      form.targetMuscleGroups = []
    }
    errors.name = undefined
    errors.targetSets = undefined
    errors.targetReps = undefined
    errors.targetMuscleGroups = undefined
  },
  { immediate: true }
)

/**
 * Validates a single form field and sets the corresponding error message.
 * @param field - The form field to validate
 */
const validateField = (field: keyof FormData) => {
  errors[field] = undefined

  if (field === 'name') {
    if (!form.name || form.name.trim() === '') {
      errors.name = 'Exercise name is required'
    }
  } else if (field === 'targetSets') {
    if (!Number.isInteger(form.targetSets) || form.targetSets < 1) {
      errors.targetSets = 'Sets must be a positive number'
    }
  } else if (field === 'targetReps') {
    if (!Number.isInteger(form.targetReps) || form.targetReps < 1) {
      errors.targetReps = 'Reps must be a positive number'
    }
  } else if (field === 'targetMuscleGroups') {
    if (form.targetMuscleGroups.length === 0) {
      errors.targetMuscleGroups = 'At least one muscle group must be selected'
    }
  }
}

/**
 * Validates all form fields and returns whether the form is valid.
 * @returns `true` if all fields pass validation, `false` otherwise
 */
const validateForm = (): boolean => {
  validateField('name')
  validateField('targetSets')
  validateField('targetReps')
  validateField('targetMuscleGroups')

  return !Object.values(errors).some((error) => error !== undefined)
}

/**
 * Handles form submission. Validates the form, then either creates or updates
 * the exercise via the store. Emits `submit` on success.
 */
const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  try {
    isSubmitting.value = true
    submitError.value = null

    if (props.exercise) {
      // Update existing exercise
      await exercisesStore.updateExercise(props.exercise.id, {
        name: form.name,
        targetSets: form.targetSets,
        targetReps: form.targetReps,
        targetMuscleGroups: form.targetMuscleGroups,
        updatedAt: Date.now(),
      })
    } else {
      // Create new exercise
      await exercisesStore.createExercise(
        form.name,
        form.targetSets,
        form.targetReps,
        form.targetMuscleGroups
      )
    }

    emit('submit')
  } catch (err) {
    console.error('Failed to save exercise:', err)
    submitError.value = 'Failed to save exercise. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
