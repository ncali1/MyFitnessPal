<script setup lang="ts" generic="T">
/**
 * @component VirtualList
 * @description A minimal virtual-scroll container that renders only the items visible
 * in the viewport plus a configurable overscan buffer. Greatly reduces DOM node count
 * for large lists (1 000+ items). Uses a single scroller with an absolute-positioned
 * inner transform to fake full-height scroll behaviour.
 *
 * @prop {T[]} items - The full item array to virtualise
 * @prop {number} itemHeight - Fixed row height in pixels (must be consistent)
 * @prop {number} [overscan=3] - Number of extra rows to render above and below the visible area
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    itemHeight: number   // estimated px height of each item
    overscan?: number    // extra items to render above/below viewport
  }>(),
  { overscan: 3 }
)

const containerRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(600)

/**
 * Reads the current scroll position from the container element and updates `scrollTop`.
 * Attached as a passive scroll listener on the container.
 */
function onScroll() {
  scrollTop.value = containerRef.value?.scrollTop ?? 0
}

/**
 * Reads the container's current client height and updates `containerHeight`.
 * Called on mount and on window resize to keep the visible window accurate.
 */
function updateHeight() {
  containerHeight.value = containerRef.value?.clientHeight ?? 600
}

onMounted(() => {
  updateHeight()
  containerRef.value?.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', updateHeight)
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', updateHeight)
})

const totalHeight = computed(() => props.items.length * props.itemHeight)

const startIndex = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / props.itemHeight) - props.overscan)
)

const endIndex = computed(() =>
  Math.min(
    props.items.length - 1,
    Math.ceil((scrollTop.value + containerHeight.value) / props.itemHeight) + props.overscan
  )
)

const visibleItems = computed(() =>
  props.items.slice(startIndex.value, endIndex.value + 1).map((item, i) => ({
    item,
    index: startIndex.value + i,
  }))
)

const offsetY = computed(() => startIndex.value * props.itemHeight)
</script>

<template>
  <div ref="containerRef" class="overflow-y-auto no-scrollbar" style="height: 100%">
    <!-- Spacer that represents the full list height -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- Only the visible slice is rendered -->
      <div :style="{ transform: `translateY(${offsetY}px)` }">
        <slot v-for="{ item, index } in visibleItems" :key="index" :item="item" :index="index" />
      </div>
    </div>
  </div>
</template>
