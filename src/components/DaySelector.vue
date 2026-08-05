<template>
  <div class="flex flex-col gap-3">
    <!-- Date display -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
        {{ formattedSelectedDate }}
      </h2>
      <button
        v-if="!isToday"
        @click="selectToday"
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        Go to Today
      </button>
    </div>

    <!-- Day navigation buttons -->
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="day in recentDays"
        :key="day.dateString"
        @click="selectDate(day.dateString)"
        :class="[
          'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg border transition-colors',
          day.dateString === selectedDate
            ? 'bg-blue-600 border-blue-600 text-white'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
        ]"
      >
        <span class="text-xs font-medium">{{ day.dayLabel }}</span>
        <span class="text-lg font-bold">{{ day.dayNumber }}</span>
        <span class="text-xs">{{ day.monthLabel }}</span>
      </button>
    </div>

    <!-- Custom date picker -->
    <div class="flex items-center gap-2">
      <label for="date-picker" class="text-sm text-gray-600 dark:text-gray-400">
        Select date:
      </label>
      <input
        id="date-picker"
        type="date"
        :value="selectedDate"
        :max="todayString"
        @change="onDateInputChange"
        class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component DaySelector
 * @description Provides date-selection UI for the Daily Checklist. Renders a row of
 * the last 7 days as quick-select buttons, a "Go to Today" shortcut, and a native
 * date-picker for arbitrary past dates. Emits `update:selectedDate` when the date changes.
 *
 * @prop {string} selectedDate - Currently selected date in YYYY-MM-DD format
 * @emits update:selectedDate - `(date: string)` — emitted whenever the user picks a new date
 */
import { computed } from 'vue'

interface Props {
  selectedDate: string // YYYY-MM-DD
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:selectedDate': [date: string]
}>()

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Returns today's date as YYYY-MM-DD */
const todayString = computed(() => {
  const today = new Date()
  return toDateString(today)
})

/** `true` when the currently selected date is today. */
const isToday = computed(() => props.selectedDate === todayString.value)

/** Last 7 days including today, displayed oldest-first (left to right). */
const recentDays = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      dateString: toDateString(d),
      dayLabel: DAY_LABELS[d.getDay()],
      dayNumber: d.getDate(),
      monthLabel: MONTH_LABELS[d.getMonth()],
    })
  }
  return days
})

/** Full formatted display label for the selected date (e.g. "Monday, Jan 6, 2025"). */
const formattedSelectedDate = computed(() => {
  const [year, month, day] = props.selectedDate.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]
  return `${dayName}, ${MONTH_LABELS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
})

/**
 * Formats a Date object as a YYYY-MM-DD string.
 * @param date - Date to format
 * @returns YYYY-MM-DD string
 */
function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Emits `update:selectedDate` with the given date string.
 * @param dateString - Date in YYYY-MM-DD format
 */
function selectDate(dateString: string) {
  emit('update:selectedDate', dateString)
}

/**
 * Emits `update:selectedDate` with today's date.
 */
function selectToday() {
  emit('update:selectedDate', todayString.value)
}

/**
 * Handles changes from the native date input and emits `update:selectedDate`.
 * @param event - The input change event
 */
function onDateInputChange(event: Event) {
  const value = (event.target as HTMLInputElement).value
  if (value) {
    emit('update:selectedDate', value)
  }
}
</script>
