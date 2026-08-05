<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <MainMenu />
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * @component Layout
 * @description Root page layout wrapper. Renders the MainMenu navigation bar at the top
 * and provides a centred, max-width content area for the default slot.
 */
import MainMenu from './MainMenu.vue'
</script>
