<template>
  <div class="space-y-5">
    <div class="section-header">
      <div>
        <h2 class="text-ink">Body Weight</h2>
        <p class="text-ink-muted text-sm mt-0.5">{{ bodyWeightStore.logs.length }} entries logged</p>
      </div>
    </div>

    <div v-if="error" class="alert-error">
      <p class="text-red-400 text-sm">{{ error }}</p>
      <button type="button" @click="error = null" class="text-red-400 hover:text-red-300 ml-2 text-lg leading-none" aria-label="Dismiss error">&times;</button>
    </div>

    <!--
      The form is rendered unconditionally (not gated behind the loading check below) —
      logging today's weight doesn't need to wait on the log list, and mounting a
      component with local interactive state as part of a v-else swap that appears only
      after an async operation loses its v-model reactivity here (reproducible: the
      input's DOM value updates but the underlying ref never does). Keeping the form
      outside that gate sidesteps it entirely.
    -->
    <BodyWeightLogForm />

    <div v-if="bodyWeightStore.loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-surface-border border-t-accent-500 rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <BodyWeightChart :logs="bodyWeightStore.logs" />

      <div class="card-pad">
        <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">Log</h3>

        <div v-if="recentLogs.length === 0" class="text-center py-10">
          <div class="text-3xl mb-2">⚖️</div>
          <p class="text-ink-faint text-sm">No entries yet — log your weight above.</p>
        </div>

        <ul v-else class="divide-y divide-surface-border">
          <li v-for="log in recentLogs" :key="log.id" class="py-3 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-ink">{{ formatDate(log.date) }}</p>
            <div class="flex items-center gap-3">
              <span class="badge-muted">
                {{ formatWeight(log.weightKg, settingsStore.weightUnit) }}{{ settingsStore.weightUnit }}
              </span>
              <button @click="handleDelete(log.id)" class="btn-icon !w-8 !h-8" aria-label="Delete entry">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>
              </button>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * @component BodyWeightTracker
 * @description Composition-root page for the Body Weight tab. Composes a log-entry
 * form, a chronological chart, and a deletable log list — separate from workout
 * performance data. Mirrors RoutineBuilder.vue's page-level structure.
 *
 * BodyWeightLogForm is deliberately rendered outside the `loading` v-if/v-else gate
 * below (see the template comment) — only presentational content (the chart, the log
 * list) is gated behind it. BodyWeightChart has no interactive local state of its own,
 * so it's safe to lazy-load via defineAsyncComponent, same as ProgressGraphs' charts.
 *
 * @emits No custom events — all mutations go through the body weight store.
 */
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useBodyWeightStore } from '../stores/bodyWeight'
import { useSettingsStore } from '../stores/settings'
import { formatWeight } from '../utils/units'
import BodyWeightLogForm from './BodyWeightLogForm.vue'

// Lazy-load the chart — pulls in Chart.js, only needed once this tab is visited.
const BodyWeightChart = defineAsyncComponent(() => import('./BodyWeightChart.vue'))

const bodyWeightStore = useBodyWeightStore()
const settingsStore = useSettingsStore()
const error = ref<string | null>(null)

/** Logged entries, newest first, for the log list (chart shows them oldest-first). */
const recentLogs = computed(() => [...bodyWeightStore.logs].sort((a, b) => b.date.localeCompare(a.date)))

/**
 * Formats a YYYY-MM-DD string as a short readable date, e.g. "Jan 6, 2026".
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Prompts for confirmation then deletes a log entry from the store.
 * @param id - ID of the log entry to delete
 */
const handleDelete = async (id: string) => {
  if (!confirm('Delete this entry?')) return
  try {
    await bodyWeightStore.deleteLog(id)
  } catch (err) {
    console.error('Failed to delete body weight log:', err)
    error.value = 'Failed to delete entry. Please try again.'
  }
}

onMounted(async () => {
  try {
    await bodyWeightStore.loadLogs()
  } catch (err) {
    console.error('Failed to load body weight logs:', err)
    error.value = 'Failed to load body weight logs. Please refresh the page.'
  }
})
</script>
