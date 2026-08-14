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

const GRID_COLOR = 'rgba(245, 246, 248, 0.06)'
const TICK_COLOR = '#9a9ea9'

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
          borderColor: '#c6ff5e',
          backgroundColor: 'rgba(198, 255, 94, 0.12)',
          pointBackgroundColor: '#c6ff5e',
          pointBorderColor: '#0a0b0f',
          pointRadius: 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          spanGaps: true,
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
  <div class="card-pad">
    <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">
      Weight Over Time
    </h3>
    <div
      v-if="!hasWeightData"
      class="flex items-center justify-center py-12 text-ink-faint text-sm"
    >
      No weight data available
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
