<template>
  <header class="sticky top-0 z-40 pwa-safe-top bg-canvas/85 backdrop-blur-lg border-b border-surface-border">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-3">
        <!-- Brand -->
        <div class="flex items-center gap-2.5 flex-shrink-0">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-[0_4px_16px_-4px_rgba(255,90,43,0.7)]">
            <svg viewBox="0 0 24 24" class="w-5 h-5 text-white" fill="currentColor">
              <path d="M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
            </svg>
          </div>
          <span class="text-lg font-extrabold tracking-tight text-ink">FitTrack</span>
        </div>

        <!-- Desktop nav — min-w-0 lets it shrink instead of overflowing onto neighbors;
             overflow-x-auto is a safety net so a future tab addition scrolls instead of clipping -->
        <nav class="hidden sm:flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar" aria-label="Primary">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            :aria-current="activeTab === tab.id ? 'page' : undefined"
            :class="[
              'px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
              activeTab === tab.id
                ? 'bg-accent-500 text-white shadow-[0_4px_16px_-4px_rgba(255,90,43,0.6)]'
                : 'text-ink-muted hover:text-ink hover:bg-surface-hover',
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>

        <!-- Utility controls -->
        <div class="flex items-center gap-2 justify-end flex-shrink-0 relative">
          <button
            @click="settingsStore.toggleWeightUnit()"
            class="inline-flex btn-ghost !px-2.5 !py-1.5 text-xs font-semibold"
            :title="`Switch to ${settingsStore.weightUnit === 'kg' ? 'lb' : 'kg'}`"
          >
            {{ settingsStore.weightUnit === 'kg' ? 'KG' : 'LB' }}
          </button>

          <template v-if="authStore.cloudEnabled && authStore.isAuthenticated">
            <button
              @click="showAccountMenu = !showAccountMenu"
              class="btn-icon"
              aria-label="Account menu"
              :aria-expanded="showAccountMenu"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>
            </button>

            <template v-if="showAccountMenu">
              <div class="fixed inset-0 z-10" @click="showAccountMenu = false" />
              <div class="absolute right-0 top-full mt-2 w-56 card p-2 z-20 space-y-1">
                <div class="badge-lime w-full justify-center">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v13m0 0-4-4m4 4 4-4M5 21h14"/></svg>
                  Synced with the cloud
                </div>
                <button @click="openChangePassword" class="btn-ghost w-full !justify-start text-sm">
                  Change password
                </button>
                <button @click="handleSignOut" class="btn-ghost w-full !justify-start text-sm">
                  Sign out
                </button>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!--
      Teleported to <body> — this header has `backdrop-blur-lg` (a backdrop-filter), which
      creates a new containing block for descendant `position: fixed` elements per the CSS
      spec. Without Teleport, the modal's "fixed, fill the viewport" overlay instead resolves
      against this 64px-tall sticky header, so it renders squashed into the top of the screen
      with most of it clipped off-screen.
    -->
    <Teleport to="body">
      <ChangePasswordModal v-if="showChangePassword" @close="showChangePassword = false" />
    </Teleport>
  </header>
</template>

<script setup lang="ts">
/**
 * @component TopBar
 * @description Sticky top header with app branding and, on sm+ viewports, a pill-style
 * desktop tab row. On mobile the primary navigation instead lives in BottomNav. When
 * cloud sync is configured and the user is signed in, also shows an account menu button
 * (synced indicator, change password, sign out) as a dropdown to keep the header compact.
 */
import { ref, computed } from 'vue'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import ChangePasswordModal from './ChangePasswordModal.vue'

const uiStore = useUIStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const showChangePassword = ref(false)
const showAccountMenu = ref(false)

const tabs = [
  { id: 'exercises', label: 'Exercises' },
  { id: 'routine', label: 'Routine' },
  { id: 'checklist', label: 'Today' },
  { id: 'summary', label: 'Summary' },
  { id: 'progress', label: 'Progress' },
  { id: 'bodyweight', label: 'Weight' },
]

const activeTab = computed(() => uiStore.activeTab)

const setActiveTab = (tab: string) => {
  uiStore.setActiveTab(tab)
}

/** Opens the change-password modal and closes the account menu. */
function openChangePassword() {
  showChangePassword.value = true
  showAccountMenu.value = false
}

/** Signs out and closes the account menu. */
function handleSignOut() {
  authStore.signOut()
  showAccountMenu.value = false
}
</script>
