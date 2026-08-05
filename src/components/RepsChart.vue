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
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend)

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
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true },
      },
      scales: {
        y: { beginAtZero: true },
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
  <div class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
    <h3 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
      {{ exerciseName }} — Reps Over Time
    </h3>
    <div v-if="data.length === 0" class="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
      No data available
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
