<template>
  <form @submit.prevent="submit" class="space-y-4">
    <div>
      <label for="new-password" class="field-label">New Password</label>
      <input
        id="new-password"
        v-model="password"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        class="field-input"
        placeholder="••••••••"
      />
    </div>
    <div>
      <label for="confirm-password" class="field-label">Confirm Password</label>
      <input
        id="confirm-password"
        v-model="confirm"
        type="password"
        required
        minlength="6"
        autocomplete="new-password"
        class="field-input"
        placeholder="••••••••"
      />
      <p v-if="mismatchError" class="field-error">Passwords don't match.</p>
    </div>

    <div v-if="authStore.error" class="alert-error">
      <p class="text-red-400 text-sm">{{ authStore.error }}</p>
    </div>
    <div v-if="successMessage" class="bg-lime-500/10 border border-lime-500/30 rounded-xl p-3">
      <p class="text-lime-500 text-sm">{{ successMessage }}</p>
    </div>

    <button type="submit" :disabled="submitting" class="btn-primary w-full">
      {{ submitting ? 'Saving…' : 'Set New Password' }}
    </button>
  </form>
</template>

<script setup lang="ts">
/**
 * @component SetNewPasswordForm
 * @description Self-contained "new password + confirm" form that calls
 * `authStore.updatePassword` directly. Used both by PasswordRecoveryGate (after a
 * forgot-password email link) and ChangePasswordModal (a signed-in user voluntarily
 * changing their password) — the underlying Supabase call is identical in both cases.
 *
 * @emits done - Emitted after the password is successfully updated
 */
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{ done: [] }>()

const authStore = useAuthStore()
const password = ref('')
const confirm = ref('')
const submitting = ref(false)
const successMessage = ref<string | null>(null)
const touched = ref(false)

const mismatchError = computed(
  () => touched.value && confirm.value.length > 0 && password.value !== confirm.value
)

/**
 * Validates the two fields match, then calls the store to update the password.
 */
async function submit() {
  touched.value = true
  if (password.value !== confirm.value) return

  submitting.value = true
  successMessage.value = null
  try {
    await authStore.updatePassword(password.value)
    successMessage.value = 'Password updated.'
    setTimeout(() => emit('done'), 900)
  } catch {
    // authStore.error already holds the message
  } finally {
    submitting.value = false
  }
}
</script>
