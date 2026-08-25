<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="restTimer.active"
      class="fixed left-4 right-4 bottom-24 sm:bottom-4 sm:left-4 sm:right-auto sm:w-72 z-50 pwa-safe-bottom"
    >
      <div class="card p-4 flex items-center gap-4 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]">
        <!-- Progress ring -->
        <svg viewBox="0 0 56 56" width="56" height="56" class="flex-shrink-0 -rotate-90">
          <circle cx="28" cy="28" r="24" fill="none" stroke="#262835" stroke-width="5" />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            stroke="#ff5a2b"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
            style="transition: stroke-dashoffset 1s linear"
          />
          <text x="28" y="28" transform="rotate(90 28 28)" text-anchor="middle" dominant-baseline="central" fill="#f5f6f8" font-size="15" font-weight="700">
            {{ restTimer.remaining }}
          </text>
        </svg>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-ink">Rest timer</p>
          <div class="flex gap-1.5 mt-2">
            <button @click="restTimer.adjust(-15)" class="btn-secondary !px-2 !py-1 text-xs">-15s</button>
            <button @click="restTimer.adjust(15)" class="btn-secondary !px-2 !py-1 text-xs">+15s</button>
            <button @click="restTimer.stop()" class="btn-ghost !px-2 !py-1 text-xs ml-auto">Skip</button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * @component RestTimer
 * @description Floating countdown widget shown whenever the global rest timer is
 * active. Mounted once in App.vue so it stays visible and running regardless of which
 * tab the user navigates to. Positioned on the opposite side from InstallPrompt so the
 * two never overlap.
 */
import { computed } from 'vue'
import { useRestTimerStore } from '../stores/restTimer'

const restTimer = useRestTimerStore()

const RADIUS = 24
const circumference = 2 * Math.PI * RADIUS

const dashOffset = computed(() => {
  const fraction = restTimer.duration > 0 ? restTimer.remaining / restTimer.duration : 0
  return circumference * (1 - fraction)
})
</script>
