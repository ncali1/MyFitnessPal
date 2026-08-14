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

const GRID_COLOR = 'rgba(245, 246, 248, 0.06)'
const TICK_COLOR = '#9a9ea9'

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
          backgroundColor: 'rgba(255, 90, 43, 0.55)',
          borderColor: '#ff5a2b',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: 36,
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
          max: 100,
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
  <div class="card-pad">
    <h3 class="mb-4 text-sm font-semibold text-ink-muted uppercase tracking-wide">Weekly Completion Rate</h3>
    <div v-if="data.length === 0" class="flex items-center justify-center py-12 text-ink-faint text-sm">
      No data available
    </div>
    <div v-else class="relative h-64">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
