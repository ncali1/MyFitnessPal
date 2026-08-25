<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(255,90,43,0.7)] mb-4">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" class="text-white">
            <path d="M20.57 14.86 22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
          </svg>
        </div>
        <h1 class="text-ink">FitTrack</h1>
        <p class="text-ink-muted text-sm mt-1">
          {{ modeLabel }}
        </p>
      </div>

      <!-- Sign in / Sign up form -->
      <form v-if="mode !== 'forgot'" @submit.prevent="submit" class="card-pad space-y-4">
        <div>
          <label for="email" class="field-label">Email</label>
          <input id="email" v-model="email" type="email" required autocomplete="email" class="field-input" placeholder="you@example.com" />
        </div>
        <div>
          <label for="password" class="field-label">Password</label>
          <input id="password" v-model="password" type="password" required minlength="6" autocomplete="current-password" class="field-input" placeholder="••••••••" />
          <button
            v-if="mode === 'signIn'"
            type="button"
            @click="switchMode('forgot')"
            class="text-xs text-ink-muted hover:text-accent-400 mt-1.5"
          >
            Forgot password?
          </button>
        </div>

        <div v-if="authStore.error" class="alert-error">
          <p class="text-red-400 text-sm">{{ authStore.error }}</p>
        </div>
        <div v-if="infoMessage" class="bg-lime-500/10 border border-lime-500/30 rounded-xl p-3">
          <p class="text-lime-500 text-sm">{{ infoMessage }}</p>
        </div>

        <button type="submit" :disabled="submitting" class="btn-primary w-full">
          {{ submitting ? 'Please wait…' : mode === 'signIn' ? 'Sign In' : 'Create Account' }}
        </button>
      </form>

      <!-- Forgot password: request reset email -->
      <form v-else @submit.prevent="submitForgotPassword" class="card-pad space-y-4">
        <div>
          <label for="reset-email" class="field-label">Email</label>
          <input id="reset-email" v-model="email" type="email" required autocomplete="email" class="field-input" placeholder="you@example.com" />
          <p class="text-xs text-ink-muted mt-1.5">We'll send a link to reset your password.</p>
        </div>

        <div v-if="authStore.error" class="alert-error">
          <p class="text-red-400 text-sm">{{ authStore.error }}</p>
        </div>
        <div v-if="infoMessage" class="bg-lime-500/10 border border-lime-500/30 rounded-xl p-3">
          <p class="text-lime-500 text-sm">{{ infoMessage }}</p>
        </div>

        <button type="submit" :disabled="submitting" class="btn-primary w-full">
          {{ submitting ? 'Sending…' : 'Send Reset Link' }}
        </button>
      </form>

      <p class="text-center text-sm text-ink-muted mt-5">
        <template v-if="mode === 'signIn'">
          Don't have an account?
          <button @click="switchMode('signUp')" class="text-accent-400 font-semibold hover:text-accent-400/80">Sign up</button>
        </template>
        <template v-else>
          Already have an account?
          <button @click="switchMode('signIn')" class="text-accent-400 font-semibold hover:text-accent-400/80">Sign in</button>
        </template>
      </p>

      <button @click="$emit('skip')" class="w-full mt-6 text-xs text-ink-faint hover:text-ink-muted">
        Skip for now — use this device only
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component AuthGate
 * @description Sign-in / sign-up / forgot-password screen shown when cloud sync is
 * configured but the user isn't authenticated yet. Offers a "Skip for now" escape hatch
 * so the app remains usable in local-only mode without an account.
 *
 * @emits skip - Emitted when the user chooses to continue without signing in
 */
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

defineEmits<{ skip: [] }>()

const authStore = useAuthStore()
const mode = ref<'signIn' | 'signUp' | 'forgot'>('signIn')
const email = ref('')
const password = ref('')
const submitting = ref(false)
const infoMessage = ref<string | null>(null)

const modeLabel = computed(() => {
  if (mode.value === 'forgot') return 'Reset your password'
  if (mode.value === 'signUp') return 'Create an account to sync across devices'
  return 'Sign in to sync your data'
})

/**
 * Switches between sign-in, sign-up, and forgot-password modes, clearing any prior
 * error/info state.
 * @param next - The mode to switch to
 */
function switchMode(next: 'signIn' | 'signUp' | 'forgot') {
  mode.value = next
  authStore.error = null
  infoMessage.value = null
}

/**
 * Submits the sign-in or sign-up form depending on the current mode.
 */
async function submit() {
  submitting.value = true
  infoMessage.value = null
  try {
    if (mode.value === 'signIn') {
      await authStore.signIn(email.value, password.value)
    } else {
      await authStore.signUp(email.value, password.value)
      infoMessage.value = 'Check your email to confirm your account, then sign in.'
      mode.value = 'signIn'
    }
  } catch {
    // authStore.error already holds the message
  } finally {
    submitting.value = false
  }
}

/**
 * Sends a password-reset email for the entered address, then shows a confirmation
 * message. Always shows the same message regardless of whether the email exists, so
 * as not to leak which addresses have accounts.
 */
async function submitForgotPassword() {
  submitting.value = true
  infoMessage.value = null
  try {
    await authStore.sendPasswordReset(email.value)
    infoMessage.value = "If that email has an account, we've sent a reset link. Check your inbox."
  } catch {
    // authStore.error already holds the message
  } finally {
    submitting.value = false
  }
}
</script>
