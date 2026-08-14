<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-panel">
      <div class="p-6">
        <h2 class="text-ink text-lg mb-1">Log Performance</h2>
        <p class="text-sm text-ink-muted mb-5">
          {{ exerciseName }}
          <span class="ml-1 text-ink-faint">(target: {{ targetSets }}×{{ targetReps }})</span>
        </p>

        <form @submit.prevent="submitForm" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="actualSets" class="field-label">Actual Sets *</label>
              <input
                id="actualSets"
                v-model.number="form.actualSets"
                type="number"
                min="1"
                placeholder="3"
                class="field-input"
                @blur="validateField('actualSets')"
              />
              <p v-if="errors.actualSets" class="field-error">{{ errors.actualSets }}</p>
            </div>

            <div>
              <label for="actualReps" class="field-label">Actual Reps *</label>
              <input
                id="actualReps"
                v-model.number="form.actualReps"
                type="number"
                min="1"
                placeholder="10"
                class="field-input"
                @blur="validateField('actualReps')"
              />
              <p v-if="errors.actualReps" class="field-error">{{ errors.actualReps }}</p>
            </div>
          </div>

          <!-- Weight (optional) -->
          <div>
            <label for="weight" class="field-label">Weight (kg) <span class="text-ink-faint normal-case font-normal">optional</span></label>
            <input
              id="weight"
              v-model.number="form.weight"
              type="number"
              min="0"
              step="0.5"
              placeholder="e.g., 60"
              class="field-input"
              @blur="validateField('weight')"
            />
            <p v-if="errors.weight" class="field-error">{{ errors.weight }}</p>
          </div>

          <!-- Difficulty Level -->
          <div>
            <label class="field-label">Difficulty Level *</label>
            <div class="flex gap-2">
              <label
                v-for="level in difficultyLevels"
                :key="level.value"
                :class="[
                  'flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border cursor-pointer transition-colors text-sm font-semibold',
                  form.difficultyLevel === level.value
                    ? level.activeClass
                    : 'border-surface-border text-ink-muted hover:border-ink-faint/50',
                ]"
              >
                <input type="radio" :value="level.value" v-model="form.difficultyLevel" class="sr-only" />
                {{ level.label }}
              </label>
            </div>
            <p v-if="errors.difficultyLevel" class="field-error">{{ errors.difficultyLevel }}</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" @click="$emit('cancel')" class="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" :disabled="isSubmitting" class="btn-primary flex-1">
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
  { value: 'easy', label: 'Easy', activeClass: 'bg-lime-500/15 border-lime-500 text-lime-500' },
  { value: 'moderate', label: 'Moderate', activeClass: 'bg-amber-500/15 border-amber-500 text-amber-400' },
  { value: 'hard', label: 'Hard', activeClass: 'bg-red-500/15 border-red-500 text-red-400' },
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
