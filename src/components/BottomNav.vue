<template>
  <nav
    class="sm:hidden fixed bottom-0 inset-x-0 z-40 pwa-safe-bottom bg-surface/95 backdrop-blur-lg border-t border-surface-border"
    aria-label="Primary"
  >
    <div class="grid grid-cols-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="setActiveTab(tab.id)"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        class="flex flex-col items-center justify-center gap-1 py-2.5 focus:outline-none"
      >
        <span
          :class="[
            'w-9 h-7 flex items-center justify-center rounded-full transition-colors',
            activeTab === tab.id ? 'bg-accent-500/15 text-accent-400' : 'text-ink-faint',
          ]"
          v-html="tab.icon"
        />
        <span
          :class="[
            'text-[10px] font-semibold tracking-tight',
            activeTab === tab.id ? 'text-accent-400' : 'text-ink-faint',
          ]"
        >
          {{ tab.label }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * @component BottomNav
 * @description Fixed bottom tab bar shown on mobile viewports (hidden on sm+), mirroring
 * the native-app navigation pattern of apps like Strava. Drives the same UI store tab
 * state as TopBar so both stay in sync.
 */
import { computed } from 'vue'
import { useUIStore } from '../stores/ui'

const uiStore = useUIStore()

const ICONS = {
  exercises: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5 17.5 17.5M4 9l2.5-2.5M14.5 6.5 17.5 3.5M17.5 3.5 20.5 6.5M17.5 3.5 14.5 6.5M20 14.5 17.5 17.5M17.5 17.5 20.5 20.5M17.5 17.5 14.5 20.5M9 4 6.5 6.5M4 9 6.5 6.5"/></svg>',
  routine: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>',
  checklist: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>',
  summary: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  progress: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/></svg>',
  bodyweight: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c.7.9 2 1.5 3.5 1.5s2.8-.6 3.5-1.5M9 10h.01M15 10h.01"/></svg>',
}

const tabs = [
  { id: 'exercises', label: 'Exercises', icon: ICONS.exercises },
  { id: 'routine', label: 'Routine', icon: ICONS.routine },
  { id: 'checklist', label: 'Today', icon: ICONS.checklist },
  { id: 'summary', label: 'Summary', icon: ICONS.summary },
  { id: 'progress', label: 'Progress', icon: ICONS.progress },
  { id: 'bodyweight', label: 'Weight', icon: ICONS.bodyweight },
]

const activeTab = computed(() => uiStore.activeTab)

const setActiveTab = (tab: string) => {
  uiStore.setActiveTab(tab)
}
</script>
