<script setup lang="ts">
/**
 * @component WorkoutReminder
 * @description Local, in-app nudge shown when today is a day the active routine
 * normally assigns a workout to and nothing has been logged as completed yet. Runs
 * once at app boot (no background execution, since this is not Web Push) and at
 * most once per calendar day, tracked via a localStorage date-stamp.
 *
 * On the first qualifying day, shows an opt-in ask instead of a nudge — reminders
 * are off until the user explicitly enables them. The in-app toast is the primary
 * surface; a native `Notification` is also fired, but only as a secondary channel
 * when the tab is hidden and permission was already granted, since a foreground-only
 * check makes a native notification redundant most of the time.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useSettingsStore } from '../stores/settings'
import { useRestTimerStore } from '../stores/restTimer'
import { shouldNudgeToday } from '../utils/reminders'

const LAST_NUDGE_KEY = 'fittrack-last-nudge-date'

const routineStore = useRoutineStore()
const sessionsStore = useWorkoutSessionsStore()
const settingsStore = useSettingsStore()
const restTimer = useRestTimerStore()

type Mode = 'ask' | 'nudge' | null
const mode = ref<Mode>(null)

const visible = computed(() => mode.value !== null && !restTimer.active)

/** Today's date as a YYYY-MM-DD string, matching the format used across the app. */
function todayString(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

/** `true` when the reminder (ask or nudge) has already been shown today. */
function alreadyShownToday(today: string): boolean {
  return localStorage.getItem(LAST_NUDGE_KEY) === today
}

function markShownToday(today: string) {
  localStorage.setItem(LAST_NUDGE_KEY, today)
}

onMounted(() => {
  if (settingsStore.remindersEnabled === false) return

  const today = todayString()
  if (alreadyShownToday(today)) return
  if (!shouldNudgeToday(routineStore.routine, sessionsStore.sessions, today)) return

  markShownToday(today)
  mode.value = settingsStore.remindersEnabled === null ? 'ask' : 'nudge'

  if (
    mode.value === 'nudge' &&
    document.visibilityState === 'hidden' &&
    'Notification' in window &&
    Notification.permission === 'granted'
  ) {
    new Notification('Time to train', {
      body: "You usually work out today — don't break the streak.",
    })
  }
})

/** Enables reminders going forward and requests native notification permission. */
async function enable() {
  settingsStore.setRemindersEnabled(true)
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
  mode.value = 'nudge'
}

/** Opts out of reminders; won't ask again. */
function disable() {
  settingsStore.setRemindersEnabled(false)
  mode.value = null
}

function dismiss() {
  mode.value = null
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-3"
  >
    <div v-if="visible" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm pwa-safe-top">
      <div class="card p-4 flex items-start gap-3 border-accent-500/40 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]">
        <div class="w-9 h-9 rounded-xl bg-accent-500/15 flex items-center justify-center flex-shrink-0 text-lg">
          💪
        </div>

        <div v-if="mode === 'ask'" class="flex-1">
          <p class="text-sm font-semibold text-ink">You usually train today</p>
          <p class="text-xs text-ink-muted mt-0.5">Want a nudge like this on days you normally work out?</p>
          <div class="flex gap-2 mt-3">
            <button @click="enable" class="btn-primary flex-1 !px-3 !py-1.5 text-xs">Enable</button>
            <button @click="disable" class="btn-ghost flex-1 !px-3 !py-1.5 text-xs">No thanks</button>
          </div>
        </div>

        <div v-else class="flex-1">
          <p class="text-sm font-semibold text-ink">You usually train today</p>
          <p class="text-xs text-ink-muted mt-0.5">Nothing logged yet — get a session in?</p>
          <button @click="dismiss" class="btn-ghost !px-3 !py-1.5 text-xs mt-3">Dismiss</button>
        </div>
      </div>
    </div>
  </Transition>
</template>
