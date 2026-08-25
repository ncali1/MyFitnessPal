<template>
  <div class="min-h-screen bg-canvas flex flex-col">
    <TopBar />
    <main class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:pb-10">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>

<script setup lang="ts">
/**
 * @component Layout
 * @description Root page layout wrapper. Renders the TopBar (brand + desktop nav) and,
 * on small screens, a fixed BottomNav tab bar. Provides a centred, max-width content
 * area for the default slot with bottom padding to clear the mobile tab bar.
 */
import TopBar from './TopBar.vue'
import BottomNav from './BottomNav.vue'
</script>
