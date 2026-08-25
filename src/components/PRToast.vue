<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-3"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-3"
  >
    <div v-if="message" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm pwa-safe-top">
      <div class="card p-4 flex items-center gap-3 border-lime-500/40 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.7)]">
        <div class="w-9 h-9 rounded-xl bg-lime-500/15 flex items-center justify-center flex-shrink-0 text-lg">
          🏆
        </div>
        <div>
          <p class="text-sm font-semibold text-ink">New personal record!</p>
          <p class="text-xs text-ink-muted mt-0.5">{{ message }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * @component PRToast
 * @description Brief celebratory toast shown when a logged performance beats a prior
 * personal record. Auto-dismisses after a few seconds. Controlled entirely by the
 * `message` prop — the parent decides when to show it (e.g. by watching detectNewRecords
 * results) and passing/clearing a message.
 *
 * @prop {string | null} message - Text to show, or null/empty to hide the toast
 */
import { watch } from 'vue'

const props = defineProps<{ message: string | null }>()
const emit = defineEmits<{ dismissed: [] }>()

let timeoutId: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.message,
  (msg) => {
    if (timeoutId) clearTimeout(timeoutId)
    if (msg) {
      timeoutId = setTimeout(() => emit('dismissed'), 3200)
    }
  }
)
</script>
