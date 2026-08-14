<template>
  <header class="sticky top-0 z-40 pwa-safe-top bg-canvas/85 backdrop-blur-lg border-b border-surface-border">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand -->
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(255,90,43,0.7)]">
            <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="currentColor">
              <path d="M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
            </svg>
          </div>
          <span class="text-lg font-extrabold tracking-tight text-ink">FitTrack</span>
        </div>

        <!-- Desktop nav -->
        <nav class="hidden sm:flex items-center gap-1" aria-label="Primary">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            :aria-current="activeTab === tab.id ? 'page' : undefined"
            :class="[
              'px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
              activeTab === tab.id
                ? 'bg-accent-500 text-white shadow-[0_4px_16px_-4px_rgba(255,90,43,0.6)]'
                : 'text-ink-muted hover:text-ink hover:bg-surface-hover',
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>

        <div class="flex items-center gap-2 sm:w-auto w-9 justify-end">
          <span
            v-if="authStore.cloudEnabled && authStore.isAuthenticated"
            class="hidden sm:inline-flex badge-lime"
            title="Synced with the cloud"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14"/></svg>
            Synced
          </span>
          <button
            v-if="authStore.cloudEnabled && authStore.isAuthenticated"
            @click="authStore.signOut()"
            class="hidden sm:inline-flex btn-ghost !px-2.5 !py-1.5 text-xs"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * @component TopBar
 * @description Sticky top header with app branding and, on sm+ viewports, a pill-style
 * desktop tab row. On mobile the primary navigation instead lives in BottomNav. When
 * cloud sync is configured and the user is signed in, also shows a "Synced" indicator
 * and a sign-out button.
 */
import { computed } from 'vue'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'

const uiStore = useUIStore()
const authStore = useAuthStore()

const tabs = [
  { id: 'exercises', label: 'Exercises' },
  { id: 'routine', label: 'Routine' },
  { id: 'checklist', label: 'Today' },
  { id: 'summary', label: 'Summary' },
  { id: 'progress', label: 'Progress' },
]

const activeTab = computed(() => uiStore.activeTab)

const setActiveTab = (tab: string) => {
  uiStore.setActiveTab(tab)
}
</script>
