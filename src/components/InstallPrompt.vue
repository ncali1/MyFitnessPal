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
      v-if="visible && !restTimer.active"
      class="fixed left-4 right-4 bottom-24 sm:bottom-4 sm:left-auto sm:right-4 sm:w-80 z-50 pwa-safe-bottom"
    >
      <div class="card p-4 flex gap-3 items-start shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14"/></svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-ink">Install FitTrack</p>
          <p class="text-xs text-ink-muted mt-0.5 leading-snug">
            <template v-if="isIOS">
              Tap <span class="font-semibold text-ink">Share</span> then
              <span class="font-semibold text-ink">Add to Home Screen</span> to install.
            </template>
            <template v-else>
              Add it to your home screen for a full-screen, offline-ready app.
            </template>
          </p>
          <div class="flex gap-2 mt-3">
            <button v-if="!isIOS" @click="install" class="btn-primary !py-1.5 !px-3 text-xs">
              Install
            </button>
            <button @click="dismiss" class="btn-ghost !py-1.5 !px-3 text-xs">
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * @component InstallPrompt
 * @description Surfaces a custom install banner for the PWA. On Android / desktop Chrome
 * it captures the native `beforeinstallprompt` event and triggers it on demand. On iOS
 * Safari (which has no such event) it instead shows manual "Add to Home Screen" instructions.
 * The banner is suppressed once the app is already running standalone, or after the user
 * dismisses it (remembered in localStorage for 14 days).
 */
import { ref, onMounted } from 'vue'
import { useRestTimerStore } from '../stores/restTimer'

const restTimer = useRestTimerStore()

const DISMISS_KEY = 'fittrack-install-dismissed-at'
const DISMISS_DAYS = 14

const visible = ref(false)
const isIOS = ref(false)
let deferredPrompt: any = null

/** `true` when the app is already running as an installed/standalone PWA. */
function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

/** `true` when the dismissal cooldown period hasn't elapsed yet. */
function recentlyDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const dismissedAt = Number(raw)
  const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
  return elapsedDays < DISMISS_DAYS
}

onMounted(() => {
  if (isStandalone() || recentlyDismissed()) return

  isIOS.value = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !(window as any).MSStream

  if (isIOS.value) {
    // No native prompt on iOS — show manual instructions after a short delay
    setTimeout(() => {
      if (!isStandalone()) visible.value = true
    }, 2500)
    return
  }

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e
    visible.value = true
  })

  window.addEventListener('appinstalled', () => {
    visible.value = false
    deferredPrompt = null
  })
})

/**
 * Triggers the native browser install prompt (Android / desktop Chrome, Edge).
 * Hides the banner regardless of the user's choice once the prompt resolves.
 */
async function install() {
  if (!deferredPrompt) {
    visible.value = false
    return
  }
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt = null
  visible.value = false
}

/**
 * Dismisses the banner and remembers the dismissal so it doesn't reappear
 * for DISMISS_DAYS.
 */
function dismiss() {
  visible.value = false
  localStorage.setItem(DISMISS_KEY, String(Date.now()))
}
</script>
