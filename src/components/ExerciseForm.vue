<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-panel">
      <div class="p-6">
        <h2 class="text-ink mb-5">
          {{ exercise ? 'Edit Exercise' : 'Create Exercise' }}
        </h2>

        <form @submit.prevent="submitForm" class="space-y-4">
          <!-- Name Field -->
          <div>
            <label for="name" class="field-label">Exercise Name *</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="e.g., Bench Press"
              class="field-input"
              @blur="validateField('name')"
            />
            <p v-if="errors.name" class="field-error">{{ errors.name }}</p>
          </div>

          <!-- Target Sets / Reps side by side -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="targetSets" class="field-label">Target Sets *</label>
              <input
                id="targetSets"
                v-model.number="form.targetSets"
                type="number"
                min="1"
                placeholder="3"
                class="field-input"
                @blur="validateField('targetSets')"
              />
              <p v-if="errors.targetSets" class="field-error">{{ errors.targetSets }}</p>
            </div>

            <div>
              <label for="targetReps" class="field-label">Target Reps *</label>
              <input
                id="targetReps"
                v-model.number="form.targetReps"
                type="number"
                min="1"
                placeholder="10"
                class="field-input"
                @blur="validateField('targetReps')"
              />
              <p v-if="errors.targetReps" class="field-error">{{ errors.targetReps }}</p>
            </div>
          </div>

          <!-- Muscle Groups Field -->
          <div>
            <label class="field-label">Target Muscle Groups *</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="group in muscleGroupOptions"
                :key="group"
                :class="[
                  'px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors select-none',
                  form.targetMuscleGroups.includes(group)
                    ? 'bg-accent-500/15 border-accent-500 text-accent-400'
                    : 'bg-canvas-800 border-surface-border text-ink-muted hover:border-ink-faint',
                ]"
              >
                <input
                  :id="`group-${group}`"
                  :value="group"
                  v-model="form.targetMuscleGroups"
                  type="checkbox"
                  class="sr-only"
                />
                {{ group }}
              </label>
            </div>
            <p v-if="errors.targetMuscleGroups" class="field-error">
              {{ errors.targetMuscleGroups }}
            </p>
          </div>

          <!-- Submit Error Banner -->
          <div v-if="submitError" class="alert-error">
            <p class="text-red-400 text-sm">{{ submitError }}</p>
            <button
              type="button"
              @click="submitError = null"
              class="text-red-400 hover:text-red-300 ml-2 text-lg leading-none"
              aria-label="Dismiss error"
            >&times;</button>
          </div>

          <!-- Form Actions -->
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
        targetMuscleGroups: [...form.targetMuscleGroups],
        updatedAt: Date.now(),
      })
    } else {
      // Create new exercise
      // Spread into a plain array — form.targetMuscleGroups is a reactive Proxy
      // array, which IndexedDB's structured-clone algorithm cannot serialize.
      await exercisesStore.createExercise(
        form.name,
        form.targetSets,
        form.targetReps,
        [...form.targetMuscleGroups]
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
