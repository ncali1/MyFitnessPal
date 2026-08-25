<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-[0_8px_32px_-8px_rgba(255,90,43,0.7)] mb-4">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h1 class="text-ink">Set a new password</h1>
        <p class="text-ink-muted text-sm mt-1 text-center">
          You followed a password reset link. Choose a new password to finish.
        </p>
      </div>

      <div class="card-pad">
        <SetNewPasswordForm @done="onDone" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component PasswordRecoveryGate
 * @description Full-screen gate shown when the user has followed a "forgot password"
 * email link (Supabase's PASSWORD_RECOVERY auth event). Blocks access to the rest of
 * the app until a new password is set, then hands off to the normal authenticated flow.
 */
import { useAuthStore } from '../stores/auth'
import SetNewPasswordForm from './SetNewPasswordForm.vue'

const authStore = useAuthStore()

/**
 * Called once the password has been successfully updated — exits recovery mode so
 * App.vue proceeds to the normal authenticated app.
 */
function onDone() {
  authStore.passwordRecoveryMode = false
}
</script>
