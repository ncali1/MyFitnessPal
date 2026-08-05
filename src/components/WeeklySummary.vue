<template>
  <div class="space-y-4">
    <WeekNavigator
      :week-start="weekStart"
      :week-end="weekEnd"
      @prev="goToPrevWeek"
      @next="goToNextWeek"
    />

    <SummaryStats
      :total-assigned="summary.totalAssignedWorkouts"
      :total-completed="summary.totalCompletedWorkouts"
    />

    <DayBreakdown :breakdown="summary.dailyBreakdown" />
  </div>
</template>

<script setup lang="ts">
/**
 * @component WeeklySummary
 * @description Displays an overview of a calendar week's workout completion. Shows the
 * total assigned vs. completed workouts plus a per-day breakdown. Supports navigating
 * to previous weeks (navigation to future weeks is disabled).
 *
 * @emits No custom events — week navigation is handled internally via weekOffset.
 */
import { ref, computed } from 'vue'
import WeekNavigator from './WeekNavigator.vue'
import SummaryStats from './SummaryStats.vue'
import DayBreakdown from './DayBreakdown.vue'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import type { WeeklySummary } from '../models/types'

/**
 * Returns the Monday Date of the week containing the given YYYY-MM-DD string.
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns The Monday Date for that week
 */
function getMondayOf(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return d
}

/**
 * Formats a Date as a YYYY-MM-DD string.
 * @param d - Date to format
 * @returns YYYY-MM-DD string
 */
function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Adds `n` days to a YYYY-MM-DD string and returns the result.
 * @param dateStr - Starting date in YYYY-MM-DD format
 * @param n - Number of days to add (may be negative)
 * @returns Resulting date in YYYY-MM-DD format
 */
function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

const routineStore = useRoutineStore()
const sessionsStore = useWorkoutSessionsStore()

const today = new Date()
const todayStr = toDateString(today)

const weekOffset = ref(0)

/** Monday date string for the currently displayed week. */
const weekStart = computed(() => {
  const monday = getMondayOf(todayStr)
  monday.setDate(monday.getDate() + weekOffset.value * 7)
  return toDateString(monday)
})

/** Sunday date string for the currently displayed week. */
const weekEnd = computed(() => addDays(weekStart.value, 6))

// Use the cached getter — avoids recalculating on every render
const summary = computed<WeeklySummary>(() => {
  if (!routineStore.routine) {
    return {
      weekStartDate: new Date(weekStart.value),
      weekEndDate: new Date(weekEnd.value),
      totalAssignedWorkouts: 0,
      totalCompletedWorkouts: 0,
      completionPercentage: 0,
      dailyBreakdown: {},
    }
  }
  return sessionsStore.getCachedWeeklySummary(weekStart.value, routineStore.routine)
})

/** Navigates to the previous week. */
function goToPrevWeek() {
  weekOffset.value -= 1
}

/** Navigates to the next week (only allowed if the current week is not the present week). */
function goToNextWeek() {
  if (weekOffset.value < 0) weekOffset.value += 1
}
</script>
