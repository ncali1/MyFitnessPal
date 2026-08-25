<template>
  <div class="space-y-5">
    <div v-if="error" class="alert-error">
      <p class="text-red-400 text-sm">{{ error }}</p>
      <button type="button" @click="error = null" class="text-red-400 hover:text-red-300 ml-2 text-lg leading-none" aria-label="Dismiss error">&times;</button>
    </div>

    <div v-if="routineStore.error" class="alert-error">
      <p class="text-red-400 text-sm">{{ routineStore.error }}</p>
    </div>

    <div v-if="routineStore.loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-surface-border border-t-accent-500 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <div class="card-pad">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-ink">Routines</h2>
          <button @click="openCreateForm" class="btn-secondary !px-3 !py-1.5 text-xs">
            + New Routine
          </button>
        </div>

        <div class="flex flex-wrap gap-2">
          <div v-for="r in routineStore.routines" :key="r.id" class="flex items-center gap-1">
            <button
              @click="switchRoutine(r.id)"
              :class="r.isActive ? 'badge-accent' : 'badge-muted'"
            >
              {{ r.name }}
            </button>
            <button
              v-if="r.isActive"
              @click="openRenameForm(r)"
              class="btn-icon !w-7 !h-7"
              aria-label="Rename routine"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
            <button
              v-if="routineStore.routines.length > 1"
              @click="handleDeleteRoutine(r.id)"
              class="btn-icon !w-7 !h-7"
              aria-label="Delete routine"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <form v-if="showNameForm" @submit.prevent="submitName" class="flex gap-2 mt-3">
          <input
            v-model="nameInput"
            type="text"
            placeholder="Routine name"
            class="field-input flex-1"
            aria-label="Routine name"
          />
          <button type="submit" class="btn-primary !px-3 !py-1.5 text-xs">Save</button>
          <button type="button" @click="cancelNameForm" class="btn-ghost !px-3 !py-1.5 text-xs">Cancel</button>
        </form>
      </div>

      <WeeklyGrid ref="weeklyGridRef" />

      <ExerciseSelector
        :day="selectedDay"
        :selected-exercises="getExercisesForDay(selectedDay)"
        @add-exercise="handleAddExercise"
        @remove-exercise="handleRemoveExercise"
      />

      <div class="flex gap-3">
        <button @click="saveRoutine" :disabled="routineStore.loading" class="btn-primary">
          {{ routineStore.loading ? 'Saving...' : 'Save Routine' }}
        </button>
        <button @click="resetRoutine" class="btn-secondary">
          Reset
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @component RoutineBuilder
 * @description Allows the user to build a weekly workout routine by assigning exercises to
 * specific days, and to manage multiple saved routines/programs (e.g. push/pull/legs, 5x5) —
 * switching, creating, renaming, and deleting them. Composes WeeklyGrid (for day selection)
 * with ExerciseSelector (for add/remove operations); all of that operates on whichever
 * routine is currently active, transparently, via the routine store.
 *
 * @emits No custom events — all mutations go through the routine store.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoutineStore } from '../stores/routine'
import type { Routine } from '../stores/types'
import WeeklyGrid from './WeeklyGrid.vue'
import ExerciseSelector from './ExerciseSelector.vue'

const routineStore = useRoutineStore()
const weeklyGridRef = ref<InstanceType<typeof WeeklyGrid>>()
const error = ref<string | null>(null)

const showNameForm = ref(false)
const renamingId = ref<string | null>(null)
const nameInput = ref('')

/** The day currently highlighted in the WeeklyGrid, defaults to 'monday'. */
const selectedDay = computed(() => {
  return weeklyGridRef.value?.selectedDay || 'monday'
})

/**
 * Returns the exercise IDs assigned to the given day in the active routine.
 * @param day - Lowercase day name (e.g. `'monday'`)
 * @returns Array of exercise IDs
 */
const getExercisesForDay = (day: string) => {
  return routineStore.routineForDay(day)
}

/**
 * Assigns an exercise to the currently selected day.
 * @param exerciseId - ID of the exercise to add
 */
const handleAddExercise = async (exerciseId: string) => {
  try {
    await routineStore.assignExercise(selectedDay.value, exerciseId)
  } catch (err) {
    console.error('Failed to add exercise:', err)
    error.value = 'Failed to add exercise to routine. Please try again.'
  }
}

/**
 * Removes an exercise from the currently selected day.
 * @param exerciseId - ID of the exercise to remove
 */
const handleRemoveExercise = async (exerciseId: string) => {
  try {
    await routineStore.removeExercise(selectedDay.value, exerciseId)
  } catch (err) {
    console.error('Failed to remove exercise:', err)
    error.value = 'Failed to remove exercise from routine. Please try again.'
  }
}

/**
 * Persists the active routine's current state to IndexedDB.
 */
const saveRoutine = async () => {
  try {
    await routineStore.saveRoutine()
  } catch (err) {
    console.error('Failed to save routine:', err)
    error.value = 'Failed to save routine. Please try again.'
  }
}

/**
 * Discards any unsaved local changes by reloading routines from storage.
 */
const resetRoutine = () => {
  routineStore.loadRoutines()
}

/** Opens the inline form to create a new routine. */
const openCreateForm = () => {
  renamingId.value = null
  nameInput.value = ''
  showNameForm.value = true
}

/**
 * Opens the inline form pre-filled to rename an existing routine.
 * @param r - The routine to rename
 */
const openRenameForm = (r: Routine) => {
  renamingId.value = r.id
  nameInput.value = r.name
  showNameForm.value = true
}

const cancelNameForm = () => {
  showNameForm.value = false
}

/**
 * Submits the create/rename form. Creating a routine also makes it active.
 */
const submitName = async () => {
  const name = nameInput.value.trim()
  if (!name) return

  try {
    if (renamingId.value) {
      await routineStore.renameRoutine(renamingId.value, name)
    } else {
      const created = await routineStore.createRoutine(name)
      await routineStore.setActiveRoutine(created.id)
    }
    showNameForm.value = false
  } catch (err) {
    console.error('Failed to save routine name:', err)
    error.value = 'Failed to save routine. Please try again.'
  }
}

/**
 * Switches the active routine.
 * @param id - ID of the routine to activate
 */
const switchRoutine = async (id: string) => {
  try {
    await routineStore.setActiveRoutine(id)
  } catch (err) {
    console.error('Failed to switch routine:', err)
    error.value = 'Failed to switch routine. Please try again.'
  }
}

/**
 * Prompts for confirmation then deletes a routine.
 * @param id - ID of the routine to delete
 */
const handleDeleteRoutine = async (id: string) => {
  if (!confirm('Delete this routine? This cannot be undone.')) return
  try {
    await routineStore.deleteRoutine(id)
  } catch (err) {
    console.error('Failed to delete routine:', err)
    error.value = 'Failed to delete routine. Please try again.'
  }
}

onMounted(async () => {
  try {
    await routineStore.loadRoutines()
  } catch (err) {
    console.error('Failed to load routines:', err)
    error.value = 'Failed to load routines. Please refresh the page.'
  }
})
</script>
