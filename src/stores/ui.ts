import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Pinia store for managing global UI state.
 *
 * State:
 * - `selectedDate`     — the currently viewed date (YYYY-MM-DD), defaults to today
 * - `selectedExercise` — the exercise ID selected in the Progress Graphs view, or null
 * - `timeRange`        — the start/end date range used by the progress graph
 * - `activeTab`        — identifier of the currently visible navigation tab
 *
 * Actions: `setSelectedDate`, `setSelectedExercise`, `setTimeRange`, `setActiveTab`
 */
export const useUIStore = defineStore('ui', () => {
  const today = new Date()
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const selectedDate = ref<string>(todayString)
  const selectedExercise = ref<string | null>(null)
  const timeRange = ref<{ start: string; end: string }>({
    start: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0] as string,
    end: todayString,
  })
  const activeTab = ref('exercises')

  /**
   * Updates the selected date displayed across checklist and summary views.
   * @param date - YYYY-MM-DD date string
   */
  const setSelectedDate = (date: string) => {
    selectedDate.value = date
  }

  /**
   * Updates the exercise selected in the Progress Graphs view.
   * @param exerciseId - Exercise ID to select, or null to clear the selection
   */
  const setSelectedExercise = (exerciseId: string | null) => {
    selectedExercise.value = exerciseId
  }

  /**
   * Updates the time range used by the progress graph.
   * @param start - Start date as YYYY-MM-DD string
   * @param end - End date as YYYY-MM-DD string
   */
  const setTimeRange = (start: string, end: string) => {
    timeRange.value = { start, end }
  }

  /**
   * Sets the active navigation tab, controlling which view is rendered.
   * @param tab - Tab identifier (e.g. `'exercises'`, `'routine'`, `'checklist'`, etc.)
   */
  const setActiveTab = (tab: string) => {
    activeTab.value = tab
  }

  return {
    selectedDate,
    selectedExercise,
    timeRange,
    activeTab,
    setSelectedDate,
    setSelectedExercise,
    setTimeRange,
    setActiveTab,
  }
})
