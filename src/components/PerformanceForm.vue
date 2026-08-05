<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Log Performance
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {{ exerciseName }}
          <span class="ml-1 text-gray-400">(target: {{ targetSets }}×{{ targetReps }})</span>
        </p>

        <form @submit.prevent="submitForm" class="space-y-4">
          <!-- Actual Sets -->
          <div>
            <label for="actualSets" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Actual Sets *
            </label>
            <input
              id="actualSets"
              v-model.number="form.actualSets"
              type="number"
              min="1"
              placeholder="e.g., 3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @blur="validateField('actualSets')"
            />
            <p v-if="errors.actualSets" class="text-red-500 text-sm mt-1">{{ errors.actualSets }}</p>
          </div>

          <!-- Actual Reps -->
          <div>
            <label for="actualReps" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Actual Reps *
            </label>
            <input
              id="actualReps"
              v-model.number="form.actualReps"
              type="number"
              min="1"
              placeholder="e.g., 10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @blur="validateField('actualReps')"
            />
            <p v-if="errors.actualReps" class="text-red-500 text-sm mt-1">{{ errors.actualReps }}</p>
          </div>

          <!-- Weight (optional) -->
          <div>
            <label for="weight" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Weight (kg) <span class="text-gray-400 font-normal">optional</span>
            </label>
            <input
              id="weight"
              v-model.number="form.weight"
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g., 60"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @blur="validateField('weight')"
            />
            <p v-if="errors.weight" class="text-red-500 text-sm mt-1">{{ errors.weight }}</p>
          </div>

          <!-- Difficulty Level -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty Level *
            </label>
            <div class="flex gap-3">
              <label
                v-for="level in difficultyLevels"
                :key="level.value"
                :class="[
                  'flex-1 flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-colors',
                  form.difficultyLevel === level.value
                    ? level.activeClass
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                ]"
              >
                <input
                  type="radio"
                  :value="level.value"
                  v-model="form.difficultyLevel"
                  class="sr-only"
                />
                {{ level.label }}
              </label>
            </div>
            <p v-if="errors.difficultyLevel" class="text-red-500 text-sm mt-1">{{ errors.difficultyLevel }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
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
 * @component PerformanceForm
 * @description Modal form for logging actual performance data (sets, reps, optional weight,
 * difficulty level) after marking an exercise as completed. Pre-fills from `existingPerformance`
 * when editing a previously logged entry. Validates all required fields before emitting.
 *
 * @prop {string} exerciseId - ID of the exercise being logged
 * @prop {string} exerciseName - Display name of the exercise
 * @prop {number} targetSets - Target set count shown as a hint
 * @prop {number} targetReps - Target rep count shown as a hint
 * @prop {ExercisePerformance | null} [existingPerformance] - Pre-fill values when editing
 * @emits submit - `(performance: Omit<ExercisePerformance, 'exerciseId' | 'timestamp'>)` — emitted on valid submission
 * @emits cancel - Emitted when the user dismisses the form
 */
import { ref, reactive, watch } from 'vue'
import type { ExercisePerformance } from '../stores/types'

interface Props {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
  /** Pre-fill form when editing existing performance */
  existingPerformance?: ExercisePerformance | null
}

interface FormData {
  actualSets: number | null
  actualReps: number | null
  weight: number | null
  difficultyLevel: 'easy' | 'moderate' | 'hard' | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  submit: [performance: Omit<ExercisePerformance, 'exerciseId' | 'timestamp'>]
  cancel: []
}>()

const isSubmitting = ref(false)

const difficultyLevels = [
  { value: 'easy', label: 'Easy', activeClass: 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-300' },
  { value: 'moderate', label: 'Moderate', activeClass: 'bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  { value: 'hard', label: 'Hard', activeClass: 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900 dark:text-red-300' },
] as const

const form = reactive<FormData>({
  actualSets: null,
  actualReps: null,
  weight: null,
  difficultyLevel: null,
})

const errors = reactive<Partial<Record<keyof FormData, string>>>({})

// Pre-fill when editing
watch(
  () => props.existingPerformance,
  (perf) => {
    if (perf) {
      form.actualSets = perf.actualSets ?? null
      form.actualReps = perf.actualReps ?? null
      form.weight = perf.weight ?? null
      form.difficultyLevel = perf.difficultyLevel ?? null
    }
  },
  { immediate: true }
)

/**
 * Validates a single form field and sets the corresponding error message.
 * @param field - The name of the form field to validate
 */
function validateField(field: keyof FormData) {
  errors[field] = undefined

  if (field === 'actualSets') {
    if (form.actualSets === null || !Number.isInteger(form.actualSets) || form.actualSets < 1) {
      errors.actualSets = 'Sets must be a positive number'
    }
  } else if (field === 'actualReps') {
    if (form.actualReps === null || !Number.isInteger(form.actualReps) || form.actualReps < 1) {
      errors.actualReps = 'Reps must be a positive number'
    }
  } else if (field === 'weight') {
    if (form.weight !== null && form.weight < 0) {
      errors.weight = 'Weight must be a positive number'
    }
  } else if (field === 'difficultyLevel') {
    if (!form.difficultyLevel) {
      errors.difficultyLevel = 'Difficulty level is required'
    }
  }
}

/**
 * Validates all form fields and returns whether the form is valid.
 * @returns `true` when all required fields pass validation
 */
function validateForm(): boolean {
  validateField('actualSets')
  validateField('actualReps')
  validateField('weight')
  validateField('difficultyLevel')
  return !Object.values(errors).some((e) => e !== undefined)
}

/**
 * Handles form submission. Validates fields, then emits `submit` with the
 * collected performance data.
 */
async function submitForm() {
  if (!validateForm()) return

  try {
    isSubmitting.value = true
    emit('submit', {
      completed: true,
      actualSets: form.actualSets!,
      actualReps: form.actualReps!,
      weight: form.weight ?? undefined,
      difficultyLevel: form.difficultyLevel!,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
