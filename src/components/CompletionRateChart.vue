/**
 * @component CompletionRateChart
 * @description Renders a Chart.js bar chart of weekly completion rate percentages (0–100).
 * Shows a "No data available" placeholder when the data array is empty.
 *
 * @prop {WeeklyDataPoint[]} data - Array of weekly data points (label + completionRate %)
 */
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'

Chart.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend)

interface WeeklyDataPoint {
  weekLabel: string
  completionRate: number
}

const props = defineProps<{
  data: WeeklyDataPoint[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

/**
 * Creates a new Chart.js bar chart bound to `canvasRef`.
 */
function buildChart() {
  if (!canvasRef.value) return
  chartInstance = new Chart(canvasRef.value, {
    type: 'bar',
    data: {
      labels: props.data.map((d) => d.weekLabel),
      datasets: [
        {
          label: 'Completion Rate (%)',
          data: props.data.map((d) => d.completionRate),
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderColor: '#a855f7',
          borderWidth: 1,
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
        y: {
          beginAtZero: true,
          max: 100,
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
  chartInstance.data.datasets[0]!.data = props.data.map((d) => d.completionRate)
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
    <h3 class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Weekly Completion Rate</h3>
    <div v-if="data.length === 0" class="flex items-center justify-center py-12 text-gray-400 dark:text-gray-500">
      No data available
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
