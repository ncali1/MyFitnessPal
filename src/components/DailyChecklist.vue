<template>
  <div class="space-y-5">
    <div v-if="error" class="alert-error">
      <p class="text-red-400 text-sm">{{ error }}</p>
      <button
        type="button"
        @click="error = null"
        class="text-red-400 hover:text-red-300 ml-2 text-lg leading-none"
        aria-label="Dismiss error"
      >&times;</button>
    </div>

    <PRToast :message="prMessage" @dismissed="prMessage = null" />

    <DaySelector :selected-date="selectedDate" @update:selected-date="onDateChange" />

    <div v-if="exercisesForDay.length === 0" class="card-pad text-center py-14">
      <div class="text-4xl mb-3">🌙</div>
      <p class="text-ink font-semibold">Rest day</p>
      <p class="text-ink-muted text-sm mt-1">No exercises scheduled for this day.</p>
    </div>

    <ChecklistItems
      v-else
      :items="checklistItems"
      @toggle="onToggle"
    />

    <PerformanceForm
      v-if="activeExercise"
      :exercise-id="activeExercise.id"
      :exercise-name="activeExercise.name"
      :target-sets="activeExercise.targetSets"
      :target-reps="activeExercise.targetReps"
      :existing-performance="existingPerformance"
      @submit="onPerformanceSubmit"
      @cancel="activeExercise = null"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @component DailyChecklist
 * @description Shows the list of exercises assigned to a selected date as a checklist.
 * Toggling an incomplete exercise opens the PerformanceForm so the user can log
 * actual sets, reps, weight, and difficulty. Toggling a completed exercise marks it
 * incomplete. Changes are persisted to the workout sessions store.
 *
 * @emits No custom events — state is managed through Pinia stores.
 */
import { ref, computed, onMounted } from 'vue'
import DaySelector from './DaySelector.vue'
import ChecklistItems from './ChecklistItems.vue'
import type { ChecklistItem } from './ChecklistItems.vue'
import PerformanceForm from './PerformanceForm.vue'
import PRToast from './PRToast.vue'
import { useRoutineStore } from '../stores/routine'
import { useExercisesStore } from '../stores/exercises'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useSettingsStore } from '../stores/settings'
import { useRestTimerStore } from '../stores/restTimer'
import { detectNewRecords } from '../utils/personalRecords'
import { formatWeight } from '../utils/units'
import type { Exercise, ExercisePerformance } from '../stores/types'

const DAY_NAMES: Record<number, string> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

/**
 * Returns today's date as a YYYY-MM-DD string.
 * @returns Today's date string
 */
function todayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Returns the lowercase day-of-week name for a YYYY-MM-DD date string.
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Lowercase day name (e.g. 'monday')
 */
function dayOfWeekFromDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return DAY_NAMES[d.getDay()] ?? 'monday'
}

const routineStore = useRoutineStore()
const exercisesStore = useExercisesStore()
const sessionsStore = useWorkoutSessionsStore()
const settingsStore = useSettingsStore()
const restTimer = useRestTimerStore()

const selectedDate = ref(todayString())
const activeExercise = ref<Exercise | null>(null)
const error = ref<string | null>(null)
const prMessage = ref<string | null>(null)

/** IDs of exercises assigned to the selected date's day of week. */
const exerciseIdsForDay = computed(() => {
  const dow = dayOfWeekFromDate(selectedDate.value)
  return routineStore.routineForDay(dow)
})

/** Full Exercise objects for the exercises assigned to the selected day. */
const exercisesForDay = computed<Exercise[]>(() => {
  return exerciseIdsForDay.value
    .map((id) => exercisesStore.exerciseById(id))
    .filter((ex): ex is Exercise => ex !== undefined)
})

/** The workout session for the currently selected date, if one exists. */
const currentSession = computed(() => sessionsStore.sessionByDate(selectedDate.value))

/** IDs of exercises that have been marked completed in the current session. */
const completedExerciseIds = computed<string[]>(() => {
  return (currentSession.value?.exercises ?? [])
    .filter((e) => e.completed)
    .map((e) => e.exerciseId)
})

/** The existing performance entry for the active (form-open) exercise, if any. */
const existingPerformance = computed<ExercisePerformance | null>(() => {
  if (!activeExercise.value || !currentSession.value) return null
  return (
    currentSession.value.exercises.find((e) => e.exerciseId === activeExercise.value!.id) ?? null
  )
})

/** Merged list of ChecklistItem objects for the current day, combining routine and session data. */
const checklistItems = computed<ChecklistItem[]>(() => {
  return exercisesForDay.value.map((exercise) => {
    const performance = currentSession.value?.exercises.find((p) => p.exerciseId === exercise.id)

    let isWeightPR = false
    let isRepsPR = false
    if (performance?.completed) {
      const allPerformances = sessionsStore.performanceByExercise(exercise.id)
      const priorPerformances = allPerformances.filter((p) => p.timestamp !== performance.timestamp)
      const flags = detectNewRecords(priorPerformances, {
        weight: performance.weight,
        actualReps: performance.actualReps,
      })
      isWeightPR = flags.isWeightPR
      isRepsPR = flags.isRepsPR
    }

    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      targetMuscleGroups: exercise.targetMuscleGroups,
      completed: performance?.completed ?? false,
      performance,
      isWeightPR,
      isRepsPR,
    }
  })
})

/**
 * Returns the ID of the existing session for the selected date, creating a new one if needed.
 * @returns The session ID
 */
async function ensureSession(): Promise<string> {
  const existing = sessionsStore.sessionByDate(selectedDate.value)
  if (existing) return existing.id
  const created = await sessionsStore.createSession(selectedDate.value)
  return created.id
}

/**
 * Handles toggling an exercise's completion state.
 * If the exercise is already completed it is marked incomplete; otherwise the
 * PerformanceForm is shown so the user can log their performance.
 * @param exerciseId - ID of the exercise being toggled
 */
async function onToggle(exerciseId: string) {
  const exercise = exercisesStore.exerciseById(exerciseId)
  if (!exercise) return

  const isCompleted = completedExerciseIds.value.includes(exerciseId)

  try {
    if (isCompleted) {
      // Mark incomplete — update session with completed: false
      const sessionId = await ensureSession()
      await sessionsStore.logPerformance(sessionId, exerciseId, {
        completed: false,
      })
      if (activeExercise.value?.id === exerciseId) {
        activeExercise.value = null
      }
    } else {
      // Show performance form
      activeExercise.value = exercise
    }
  } catch (err) {
    console.error('Failed to toggle exercise:', err)
    error.value = 'Failed to save workout. Please try again.'
  }
}

/**
 * Submits performance data for the active exercise and closes the PerformanceForm.
 * Detects whether this beats a prior personal record (celebratory toast), and starts
 * the rest timer for the completed set.
 * @param performance - Performance fields (sets, reps, weight, difficulty) without exerciseId/timestamp
 */
async function onPerformanceSubmit(
  performance: Omit<ExercisePerformance, 'exerciseId' | 'timestamp'>
) {
  if (!activeExercise.value) return
  const exerciseName = activeExercise.value.name

  try {
    // Compute PR status against state *before* this submission is applied.
    const priorPerformances = sessionsStore.performanceByExercise(activeExercise.value.id)
    const { isWeightPR, isRepsPR } = detectNewRecords(priorPerformances, {
      weight: performance.weight,
      actualReps: performance.actualReps,
    })

    const sessionId = await ensureSession()
    await sessionsStore.logPerformance(sessionId, activeExercise.value.id, performance)
    activeExercise.value = null

    if (isWeightPR && isRepsPR) {
      prMessage.value = `${exerciseName}: new best weight and reps!`
    } else if (isWeightPR) {
      prMessage.value = `${exerciseName}: new heaviest weight — ${formatWeight(performance.weight, settingsStore.weightUnit)}${settingsStore.weightUnit}!`
    } else if (isRepsPR) {
      prMessage.value = `${exerciseName}: new best reps — ${performance.actualReps}!`
    }

    if (performance.completed) {
      restTimer.start(settingsStore.restDuration)
    }
  } catch (err) {
    console.error('Failed to submit performance:', err)
    error.value = 'Failed to save workout. Please try again.'
  }
}

/**
 * Updates the selected date and closes any open PerformanceForm.
 * @param date - New date in YYYY-MM-DD format
 */
function onDateChange(date: string) {
  selectedDate.value = date
  activeExercise.value = null
}

onMounted(async () => {
  try {
    await Promise.all([
      routineStore.loadRoutines(),
      exercisesStore.loadExercises(),
      sessionsStore.loadSessions(),
    ])
  } catch (err) {
    console.error('Failed to load data:', err)
    error.value = 'Failed to load workout data. Please refresh the page.'
  }
})
</script>
