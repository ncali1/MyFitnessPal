<template>
  <div class="space-y-2.5">
    <div v-if="items.length === 0" class="text-center py-10 text-ink-muted text-sm">
      No exercises assigned for this day.
    </div>

    <div
      v-for="item in items"
      :key="item.exerciseId"
      class="flex items-start gap-3 p-4 card"
    >
      <!-- Checkbox -->
      <button
        :id="`exercise-${item.exerciseId}`"
        type="button"
        role="checkbox"
        :aria-checked="item.completed"
        @click="onToggle(item.exerciseId, !item.completed)"
        :class="[
          'mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          item.completed ? 'bg-lime-500 border-lime-500' : 'border-surface-border hover:border-ink-faint',
        ]"
      >
        <svg v-if="item.completed" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0a0b0f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L19 8"/></svg>
      </button>

      <!-- Exercise info -->
      <label :for="`exercise-${item.exerciseId}`" class="flex-1 cursor-pointer" @click="onToggle(item.exerciseId, !item.completed)">
        <div class="flex items-center justify-between gap-2">
          <span :class="['font-semibold text-sm', item.completed ? 'line-through text-ink-faint' : 'text-ink']">
            {{ item.exerciseName }}
          </span>
          <span v-if="item.completed" class="badge-lime flex-shrink-0">Done</span>
        </div>
        <div class="text-xs text-ink-muted mt-1">
          {{ item.targetSets }} sets × {{ item.targetReps }} reps
          <span v-if="item.targetMuscleGroups.length > 0" class="ml-1">
            · {{ item.targetMuscleGroups.join(', ') }}
          </span>
        </div>
        <!-- Logged performance summary -->
        <div v-if="item.completed && item.performance" class="text-xs text-accent-400 mt-1.5 font-medium flex items-center gap-1.5 flex-wrap">
          <span>
            {{ item.performance.actualSets }} sets × {{ item.performance.actualReps }} reps
            <span v-if="item.performance.weight != null"> @ {{ formatWeight(item.performance.weight, settingsStore.weightUnit) }}{{ settingsStore.weightUnit }}</span>
            · {{ item.performance.difficultyLevel }}
          </span>
          <span v-if="item.isWeightPR || item.isRepsPR" class="badge-lime !py-0.5">🏆 PR</span>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component ChecklistItems
 * @description Renders a list of ChecklistItem rows, each showing the exercise name,
 * targets, completion state, and logged performance summary (weight shown in the
 * user's preferred unit). Emits a `toggle` event when the user clicks a checkbox.
 *
 * @prop {ChecklistItem[]} items - The checklist items to display
 * @emits toggle - `(exerciseId: string, completed: boolean)` — fired when a checkbox changes
 */
import type { ExercisePerformance } from '../stores/types'
import { useSettingsStore } from '../stores/settings'
import { formatWeight } from '../utils/units'

export interface ChecklistItem {
  exerciseId: string
  exerciseName: string
  targetSets: number
  targetReps: number
  targetMuscleGroups: string[]
  completed: boolean
  performance?: ExercisePerformance
  /** True when this logged performance currently holds the exercise's all-time max weight. */
  isWeightPR?: boolean
  /** True when this logged performance currently holds the exercise's all-time max reps. */
  isRepsPR?: boolean
}

interface Props {
  items: ChecklistItem[]
}

defineProps<Props>()

const settingsStore = useSettingsStore()

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
