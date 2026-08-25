<script setup lang="ts">
/**
 * @component BodyWeightChart
 * @description Renders a Chart.js line chart of every logged body weight entry, in
 * chronological order, displayed in the user's preferred unit (kg/lb) via the settings
 * store. The underlying data is always canonical kg — this component converts only
 * for display. Unlike WeightChart (which shows weekly-aggregated exercise performance),
 * this plots raw log entries with no bucketing.
 *
 * @prop {BodyWeightLog[]} logs - Body weight log entries, any order (sorted internally)
 */
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { useSettingsStore } from '../stores/settings'
import { fromKg } from '../utils/units'
import type { BodyWeightLog } from '../stores/types'

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

const props = defineProps<{
  logs: BodyWeightLog[]
}>()

const settingsStore = useSettingsStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const GRID_COLOR = 'rgba(245, 246, 248, 0.06)'
const TICK_COLOR = '#9a9ea9'

/** Log entries sorted chronologically, oldest first. */
const sortedLogs = computed(() => [...props.logs].sort((a, b) => a.date.localeCompare(b.date)))

const hasData = computed(() => sortedLogs.value.length > 0)

/** Chart labels: each entry's date as a short month + day string. */
const labels = computed(() =>
  sortedLogs.value.map((l) => {
    const [year, month, day] = l.date.split('-').map(Number)
    return new Date(year!, month! - 1, day!).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  })
)

/** Log entries converted to the user's currently selected display unit. */
const displayValues = computed(() =>
  sortedLogs.value.map((l) => fromKg(l.weightKg, settingsStore.weightUnit))
)

const datasetLabel = computed(() => `Body Weight (${settingsStore.weightUnit})`)

/**
 * Creates a new Chart.js line chart bound to `canvasRef`.
 */
function buildChart() {
  if (!canvasRef.value) return
  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: labels.value,
      datasets: [
        {
          label: datasetLabel.value,
          data: displayValues.value,
          borderColor: '#c6ff5e',
          backgroundColor: 'rgba(198, 255, 94, 0.12)',
          pointBackgroundColor: '#c6ff5e',
          pointBorderColor: '#0a0b0f',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: '#1c1e28',
          titleColor: '#f5f6f8',
          bodyColor: '#f5f6f8',
          borderColor: '#262835',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        y: {
          grid: { color: GRID_COLOR },
          ticks: { color: TICK_COLOR },
        },
        x: {
          grid: { display: false },
          ticks: { color: TICK_COLOR },
        },
      },
    },
  })
}

/**
 * Updates an existing chart instance with new data without destroying it.
 */
function updateChart() {
  if (!chartInstance) return
  chartInstance.data.labels = labels.value
  chartInstance.data.datasets[0]!.data = displayValues.value
  chartInstance.data.datasets[0]!.label = datasetLabel.value
  chartInstance.update()
}

onMounted(() => {
  if (hasData.value) buildChart()
})

onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})

watch(
  () => props.logs,
  () => {
    if (!hasData.value) {
      chartInstance?.destroy()
      chartInstance = null
      return
    }
    if (chartInstance) {
      updateChart()
    } else {
      buildChart()
    }
  },
  { deep: true }
)

// Re-render in the new unit immediately when the user toggles kg/lb.
watch(
  () => settingsStore.weightUnit,
  () => {
    if (chartInstance) updateChart()
  }
)
</script>

<template>
  <div class="card-pad">
    <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">
      Body Weight Over Time ({{ settingsStore.weightUnit }})
    </h3>
    <div v-if="!hasData" class="flex items-center justify-center py-12 text-ink-faint text-sm">
      No body weight logged yet
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
