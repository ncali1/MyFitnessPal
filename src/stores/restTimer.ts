/**
 * @module stores/restTimer
 * @description Global rest-timer countdown. Lives in a Pinia store (not a component)
 * so the countdown keeps running even if the user switches tabs while resting — the
 * RestTimer widget just renders whatever state is here, from wherever it's mounted.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRestTimerStore = defineStore('restTimer', () => {
  const active = ref(false)
  const remaining = ref(0)
  const duration = ref(90)

  let intervalId: ReturnType<typeof setInterval> | undefined

  function clearTick() {
    if (intervalId !== undefined) {
      clearInterval(intervalId)
      intervalId = undefined
    }
  }

  /**
   * Starts (or restarts) the countdown from the given duration in seconds.
   * @param seconds - Duration to count down from
   */
  function start(seconds: number) {
    clearTick()
    duration.value = seconds
    remaining.value = seconds
    active.value = true

    intervalId = setInterval(() => {
      remaining.value -= 1
      if (remaining.value <= 0) {
        finish()
      }
    }, 1000)
  }

  /** Called when the countdown naturally reaches zero — buzzes the device if supported. */
  function finish() {
    clearTick()
    active.value = false
    remaining.value = 0
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  }

  /** Cancels the timer early (user tapped "Skip"). */
  function stop() {
    clearTick()
    active.value = false
    remaining.value = 0
  }

  /**
   * Adds (or subtracts) seconds from the time remaining, never going below zero.
   * @param delta - Seconds to add (negative to subtract)
   */
  function adjust(delta: number) {
    remaining.value = Math.max(0, remaining.value + delta)
  }

  return { active, remaining, duration, start, stop, adjust }
})
