/**
 * @module stores/auth
 * @description Pinia store wrapping Supabase Auth. Tracks the current session, exposes
 * sign-up / sign-in / sign-out actions plus password reset ("forgot password") and
 * in-session password change, and stays in sync with auth state changes (e.g. token
 * refresh, sign-out in another tab, or landing back from a password-reset email link).
 * When cloud sync isn't configured (`isCloudEnabled()` is false), the store simply
 * reports `cloudEnabled: false` and the app runs in local-only mode — no auth gate,
 * no password features shown.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { getSupabase, isCloudEnabled } from '../services/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const cloudEnabled = isCloudEnabled()
  /**
   * `true` when the user has followed a "reset password" email link and Supabase has
   * established a recovery session. While true, the app should show the "set a new
   * password" form instead of the normal authenticated app.
   */
  const passwordRecoveryMode = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  /**
   * Initialises the auth listener and hydrates the current session. Call once on app boot.
   * No-ops immediately when cloud sync isn't configured.
   */
  async function init() {
    if (!cloudEnabled) {
      loading.value = false
      return
    }
    const supabase = getSupabase()!

    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    loading.value = false

    supabase.auth.onAuthStateChange((event, session) => {
      user.value = session?.user ?? null
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryMode.value = true
      }
    })
  }

  /**
   * Creates a new account with email + password. Supabase sends a confirmation email
   * by default (configurable in the Supabase dashboard under Authentication → Settings).
   */
  async function signUp(email: string, password: string) {
    if (!cloudEnabled) return
    error.value = null
    const supabase = getSupabase()!
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      error.value = err.message
      throw err
    }
    user.value = data.user
  }

  /**
   * Signs in with email + password.
   */
  async function signIn(email: string, password: string) {
    if (!cloudEnabled) return
    error.value = null
    const supabase = getSupabase()!
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      error.value = err.message
      throw err
    }
    user.value = data.user
  }

  /**
   * Signs the current user out.
   */
  async function signOut() {
    if (!cloudEnabled) return
    const supabase = getSupabase()!
    await supabase.auth.signOut()
    user.value = null
  }

  /**
   * Sends a "reset your password" email containing a link back to this app. Following
   * that link establishes a recovery session and fires the PASSWORD_RECOVERY event
   * handled in `init()`, which flips `passwordRecoveryMode` on.
   */
  async function sendPasswordReset(email: string) {
    if (!cloudEnabled) return
    error.value = null
    const supabase = getSupabase()!
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Sets a new password for the current session — used both for the "forgot password"
   * recovery flow and for a signed-in user voluntarily changing their password.
   */
  async function updatePassword(newPassword: string) {
    if (!cloudEnabled) return
    error.value = null
    const supabase = getSupabase()!
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      error.value = err.message
      throw err
    }
    passwordRecoveryMode.value = false
  }

  return {
    user,
    loading,
    error,
    cloudEnabled,
    passwordRecoveryMode,
    isAuthenticated,
    init,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    updatePassword,
  }
})
