<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Exercises</h2>
      <button
        @click="showForm = true"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Exercise
      </button>
    </div>

    <div v-if="exercises.length === 0" class="text-center py-8">
      <p class="text-gray-500 dark:text-gray-400">No exercises yet. Create one to get started!</p>
    </div>

    <!-- Normal grid for < 1000 exercises -->
    <div v-else-if="!useVirtualScroll" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="exercise in exercises"
        :key="exercise.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      >
        <ExerciseCard
          :exercise="exercise"
          @edit="editExercise"
          @delete="deleteExercise"
        />
      </div>
    </div>

    <!-- Virtual scroll for 1000+ exercises — renders only visible rows -->
    <div v-else class="rounded-lg border border-gray-200 dark:border-gray-700" style="height: 600px">
      <VirtualList :items="exercises" :item-height="CARD_HEIGHT">
        <template #default="{ item: exercise }">
          <div
            :key="exercise.id"
            class="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
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
          h('h3', { class: 'text-base font-semibold text-gray-900 dark:text-white truncate' }, props.exercise.name),
        ]),
        h('div', { class: 'flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3 flex-wrap' }, [
          h('span', null, [`Sets: ${props.exercise.targetSets}`]),
          h('span', null, [`Reps: ${props.exercise.targetReps}`]),
          h('span', { class: 'truncate' }, [`Muscles: ${props.exercise.targetMuscleGroups.join(', ')}`]),
        ]),
        h('div', { class: 'flex gap-2 mt-auto' }, [
          h('button', {
            class: 'flex-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm',
            onClick: () => emit('edit', props.exercise),
          }, 'Edit'),
          h('button', {
            class: 'flex-1 px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm',
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
