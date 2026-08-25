/**
 * @component ExerciseHistory
 * @description Displays every logged instance of one exercise, newest first — date, sets,
 * reps, weight, and difficulty — as a raw chronological list rather than the aggregated
 * weekly charts shown elsewhere in Progress. Rows that match the exercise's all-time
 * personal record are flagged with a PR badge.
 *
 * @prop {string} exerciseId - ID of the exercise to show history for
 */
<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useSettingsStore } from '../stores/settings'
import { calculatePersonalRecord } from '../utils/personalRecords'
import { formatWeight } from '../utils/units'

const props = defineProps<{
  exerciseId: string
}>()

const sessionsStore = useWorkoutSessionsStore()
const settingsStore = useSettingsStore()

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'badge-lime',
  moderate: 'badge-warn',
  hard: 'badge-danger',
}

/** Newest-first log of every instance this exercise was logged. */
const history = computed(() => sessionsStore.getCachedExerciseHistory(props.exerciseId))

/** All-time PR for this exercise, used to flag matching rows below. */
const record = computed(() =>
  calculatePersonalRecord(sessionsStore.performanceByExercise(props.exerciseId))
)

/**
 * `true` when the given entry's weight or reps matches the exercise's current
 * all-time best — used to show a PR badge on the row that set it.
 */
function isPersonalRecord(entry: { weight?: number; actualReps?: number }): boolean {
  const isWeightPR = entry.weight !== undefined && entry.weight === record.value.maxWeight
  const isRepsPR = entry.actualReps !== undefined && entry.actualReps === record.value.maxReps
  return isWeightPR || isRepsPR
}

/**
 * Formats a YYYY-MM-DD string as a short readable date, e.g. "Jan 6, 2026".
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="card-pad">
    <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">History</h3>

    <div v-if="history.length === 0" class="text-center py-10">
      <div class="text-3xl mb-2">📋</div>
      <p class="text-ink-faint text-sm">No history logged yet for this exercise.</p>
    </div>

    <ul v-else class="divide-y divide-surface-border">
      <li
        v-for="(entry, i) in history"
        :key="`${entry.date}-${i}`"
        class="py-3 flex items-center justify-between gap-3 flex-wrap"
      >
        <div class="min-w-32">
          <p class="text-sm font-semibold text-ink">{{ formatDate(entry.date) }}</p>
          <p v-if="!entry.completed" class="text-xs text-ink-faint mt-0.5">Not completed</p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <span v-if="entry.actualSets != null && entry.actualReps != null" class="badge-muted">
            {{ entry.actualSets }} × {{ entry.actualReps }}
          </span>
          <span v-if="entry.weight != null" class="badge-muted">
            {{ formatWeight(entry.weight, settingsStore.weightUnit) }}{{ settingsStore.weightUnit }}
          </span>
          <span v-if="entry.difficultyLevel" :class="DIFFICULTY_BADGE[entry.difficultyLevel]">
            {{ entry.difficultyLevel }}
          </span>
          <span v-if="isPersonalRecord(entry)" class="badge-accent">🏆 PR</span>
        </div>
      </li>
    </ul>
  </div>
</template>
