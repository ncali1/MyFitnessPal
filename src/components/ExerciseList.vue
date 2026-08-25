<template>
  <div class="space-y-5">
    <div class="section-header">
      <div>
        <h2 class="text-ink">Exercises</h2>
        <p class="text-ink-muted text-sm mt-0.5">{{ exercises.length }} in your library</p>
      </div>
      <button @click="showForm = true" class="btn-primary">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Add Exercise
      </button>
    </div>

    <div v-if="exercises.length === 0" class="card-pad text-center py-14">
      <div class="text-4xl mb-3">🏋️</div>
      <p class="text-ink font-semibold">No exercises yet</p>
      <p class="text-ink-muted text-sm mt-1">Create one to start building your routine.</p>
    </div>

    <!-- Normal grid for < 1000 exercises -->
    <div v-else-if="!useVirtualScroll" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="exercise in exercises"
        :key="exercise.id"
        class="card-pad hover:border-ink-faint/40 transition-colors"
      >
        <ExerciseCard
          :exercise="exercise"
          @edit="editExercise"
          @delete="deleteExercise"
        />
      </div>
    </div>

    <!-- Virtual scroll for 1000+ exercises — renders only visible rows -->
    <div v-else class="card overflow-hidden" style="height: 600px">
      <VirtualList :items="exercises" :item-height="CARD_HEIGHT">
        <template #default="{ item: exercise }">
          <div
            :key="exercise.id"
            class="border-b border-surface-border p-4 hover:bg-surface-hover transition-colors"
            :style="{ height: `${CARD_HEIGHT}px`, boxSizing: 'border-box' }"
          >
            <ExerciseCard
              :exercise="exercise"
              @edit="editExercise"
              @delete="deleteExercise"
            />
          </div>
        </template>
      </VirtualList>
    </div>

    <ExerciseForm
      v-if="showForm"
      :exercise="selectedExercise"
      @submit="handleFormSubmit"
      @cancel="closeForm"
    />
  </div>
</template>

/**
 * @component ExerciseList
 * @description Displays the full list of exercises and manages create / edit / delete interactions.
 * Automatically switches to a virtual-scroll container when the exercise count reaches
 * VIRTUAL_SCROLL_THRESHOLD to maintain smooth rendering with large datasets.
 *
 * @emits No custom events — state mutations are handled through the exercises store.
 */
<script setup lang="ts">
import { ref, computed, defineComponent, h } from 'vue'
import { useExercisesStore } from '../stores/exercises'
import type { Exercise } from '../stores/types'
import ExerciseForm from './ExerciseForm.vue'
import VirtualList from './VirtualList.vue'

/** Switch to virtual scrolling when the list exceeds this size */
const VIRTUAL_SCROLL_THRESHOLD = 1000
/** Fixed row height used by the virtual scroller (px) */
const CARD_HEIGHT = 140

const exercisesStore = useExercisesStore()
const showForm = ref(false)
const selectedExercise = ref<Exercise | null>(null)

const exercises = computed(() => exercisesStore.allExercises)
const useVirtualScroll = computed(() => exercises.value.length >= VIRTUAL_SCROLL_THRESHOLD)

// Inline card component to avoid a separate file for a small piece of markup
const ExerciseCard = defineComponent({
  props: {
    exercise: { type: Object as () => Exercise, required: true },
  },
  emits: ['edit', 'delete'],
  setup(props, { emit }) {
    return () =>
      h('div', { class: 'flex flex-col h-full' }, [
        h('div', { class: 'flex justify-between items-start mb-2' }, [
          h('h3', { class: 'text-base font-semibold text-ink truncate' }, props.exercise.name),
        ]),
        h('div', { class: 'flex gap-3 text-xs text-ink-muted mb-4 flex-wrap' }, [
          h('span', { class: 'badge-muted' }, [`Sets: ${props.exercise.targetSets}`]),
          h('span', { class: 'badge-muted' }, [`Reps: ${props.exercise.targetReps}`]),
        ]),
        h('div', { class: 'text-xs text-ink-faint truncate mb-4' }, [
          props.exercise.targetMuscleGroups.join(' · '),
        ]),
        h('div', { class: 'flex gap-2 mt-auto' }, [
          h('button', {
            class: 'btn-secondary flex-1 !px-3 !py-1.5 text-xs',
            onClick: () => emit('edit', props.exercise),
          }, 'Edit'),
          h('button', {
            class: 'btn-danger flex-1 !px-3 !py-1.5 text-xs',
            onClick: () => emit('delete', props.exercise.id),
          }, 'Delete'),
        ]),
      ])
  },
})

/**
 * Opens the exercise form pre-populated with the given exercise for editing.
 * @param exercise - The exercise to edit
 */
const editExercise = (exercise: Exercise) => {
  selectedExercise.value = exercise
  showForm.value = true
}

/**
 * Prompts the user for confirmation then deletes the exercise from the store.
 * @param id - ID of the exercise to delete
 */
const deleteExercise = async (id: string) => {
  if (confirm('Are you sure you want to delete this exercise?')) {
    try {
      await exercisesStore.deleteExercise(id)
    } catch (err) {
      console.error('Failed to delete exercise:', err)
    }
  }
}

/**
 * Called when the ExerciseForm emits a successful submit. Closes the form.
 */
const handleFormSubmit = () => {
  closeForm()
}

/**
 * Closes the exercise form and clears the selected exercise.
 */
const closeForm = () => {
  showForm.value = false
  selectedExercise.value = null
}
</script>
