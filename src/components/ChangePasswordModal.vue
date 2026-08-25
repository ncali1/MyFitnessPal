<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-panel">
      <div class="p-6">
        <div class="section-header mb-5">
          <h2 class="text-ink">Change Password</h2>
          <button @click="$emit('close')" class="btn-icon" aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <SetNewPasswordForm @done="$emit('close')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component ChangePasswordModal
 * @description Modal allowing an already signed-in user to voluntarily change their
 * password (as opposed to PasswordRecoveryGate, which handles the "forgot password"
 * email-link flow). Opened from TopBar's account menu.
 *
 * @emits close - Emitted when the modal should be dismissed (backdrop click, X button,
 *   or after a successful password change)
 */
import SetNewPasswordForm from './SetNewPasswordForm.vue'

defineEmits<{ close: [] }>()
</script>
