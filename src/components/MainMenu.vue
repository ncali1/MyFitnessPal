<template>
  <nav class="bg-white dark:bg-gray-800 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Brand -->
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold text-blue-600 dark:text-blue-400">💪 Fitness Tracker</span>
        </div>

        <!-- Desktop nav -->
        <div class="hidden sm:flex items-center space-x-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            :aria-current="activeTab === tab.id ? 'page' : undefined"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            ]"
          >
            <span class="mr-1">{{ tab.icon }}</span>{{ tab.label }}
          </button>
        </div>

        <!-- Mobile hamburger -->
        <button
          class="sm:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :aria-expanded="mobileOpen"
          aria-label="Toggle navigation menu"
          @click="mobileOpen = !mobileOpen"
        >
          <svg v-if="!mobileOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile dropdown -->
    <div v-if="mobileOpen" class="sm:hidden border-t border-gray-200 dark:border-gray-700">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="selectMobileTab(tab.id)"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          :class="[
            'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500',
            activeTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
          ]"
        >
          <span class="mr-2">{{ tab.icon }}</span>{{ tab.label }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
/**
 * @component MainMenu
 * @description Top navigation bar. Renders a desktop tab row and a mobile hamburger
 * menu that expands to a vertical list. Clicking a tab calls `setActiveTab` on the UI
 * store to drive view switching in App.vue.
 *
 * @emits No custom events — navigation state is managed through the UI store.
 */
import { ref, computed } from 'vue'
import { useUIStore } from '../stores/ui'

const uiStore = useUIStore()
const mobileOpen = ref(false)

const tabs = [
  { id: 'exercises', label: 'Exercises', icon: '🏋️' },
  { id: 'routine', label: 'Routine', icon: '📅' },
  { id: 'checklist', label: 'Daily Checklist', icon: '✅' },
  { id: 'summary', label: 'Weekly Summary', icon: '📊' },
  { id: 'progress', label: 'Progress', icon: '📈' },
]

/** The currently active navigation tab, derived from the UI store. */
const activeTab = computed(() => uiStore.activeTab)

/**
 * Sets the active tab in the UI store (desktop navigation).
 * @param tab - Tab identifier string (e.g. `'exercises'`)
 */
const setActiveTab = (tab: string) => {
  uiStore.setActiveTab(tab)
}

/**
 * Sets the active tab and closes the mobile dropdown.
 * @param tab - Tab identifier string
 */
const selectMobileTab = (tab: string) => {
  uiStore.setActiveTab(tab)
  mobileOpen.value = false
}
</script>
