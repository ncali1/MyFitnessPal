/**
 * @component WeightChart
 * @description Renders a Chart.js line chart of average weight (kg) per week for the
 * selected exercise. The chart is only shown when at least one data point has a non-null
 * weight; otherwise a "No weight data available" placeholder is displayed.
 *
 * @prop {WeeklyDataPoint[]} data - Array of weekly data points (label + averageWeight | null)
 * @prop {string} exerciseName - Exercise name used in the chart dataset label
 */
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
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
  averageWeight: number | null
}

const props = defineProps<{
  data: WeeklyDataPoint[]
  exerciseName: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

/** `true` when at least one data point has a non-null weight value. */
const hasWeightData = computed(
  () => props.data.length > 0 && props.data.some((d) => d.averageWeight !== null)
)

/**
 * Creates a new Chart.js line chart bound to `canvasRef`.
 * Uses `spanGaps: true` to connect non-null points across null gaps.
 */
function buildChart() {
  if (!canvasRef.value) return
  chartInstance = new Chart(canvasRef.value, {
    type: 'line',
    data: {
      labels: props.data.map((d) => d.weekLabel),
      datasets: [
        {
          label: `${props.exerciseName} - Weight (kg)`,
          data: props.data.map((d) => d.averageWeight),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
          spanGaps: true,
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
  chartInstance.data.datasets[0]!.data = props.data.map((d) => d.averageWeight)
  chartInstance.data.datasets[0]!.label = `${props.exerciseName} - Weight (kg)`
  chartInstance.update()
}

onMounted(() => {
  if (hasWeightData.value) buildChart()
})

onUnmounted(() => {
  chartInstance?.destroy()
  chartInstance = null
})

watch(
  () => props.data,
  () => {
    if (!hasWeightData.value) {
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
      {{ exerciseName }} — Weight Over Time
    </h3>
    <div
      v-if="!hasWeightData"
      class="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500"
    >
      No weight data available
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
