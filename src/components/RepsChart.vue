/**
 * @component RepsChart
 * @description Renders a Chart.js line chart of average reps per week for the selected
 * exercise. Destroys and recreates the chart instance when the data changes, and cleans
 * up on unmount.
 *
 * @prop {WeeklyDataPoint[]} data - Array of weekly data points (label + averageReps)
 * @prop {string} exerciseName - Exercise name used in the chart dataset label
 */
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
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

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

interface WeeklyDataPoint {
  weekLabel: string
  averageReps: number
}

const props = defineProps<{
  data: WeeklyDataPoint[]
  exerciseName: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

const GRID_COLOR = 'rgba(245, 246, 248, 0.06)'
const TICK_COLOR = '#9a9ea9'

/**
 * Creates a new Chart.js line chart bound to `canvasRef`.
 * Does nothing if the canvas is not yet mounted.
 */
function buildChart() {
  if (!canvasRef.value) return
  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.data.map((d) => d.weekLabel),
      datasets: [
        {
          label: `${props.exerciseName} - Reps`,
          data: props.data.map((d) => d.averageReps),
          borderColor: '#ff5a2b',
          backgroundColor: 'rgba(255, 90, 43, 0.15)',
          pointBackgroundColor: '#ff5a2b',
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
          beginAtZero: true,
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
  chartInstance.data.labels = props.data.map((d) => d.weekLabel)
  chartInstance.data.datasets[0]!.data = props.data.map((d) => d.averageReps)
  chartInstance.data.datasets[0]!.label = `${props.exerciseName} - Reps`
  chartInstance.update()
}

onMounted(() => {
  if (props.data.length > 0) buildChart()
})

onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})

watch(
  () => props.data,
  (newData) => {
    if (newData.length === 0) {
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
</script>

<template>
  <div class="card-pad">
    <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">
      Reps Over Time
    </h3>
    <div v-if="data.length === 0" class="flex items-center justify-center py-12 text-ink-faint text-sm">
      No data available
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
