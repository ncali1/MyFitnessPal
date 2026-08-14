/**
 * @module stores/auth
 * @description Pinia store wrapping Supabase Auth. Tracks the current session, exposes
 * sign-up / sign-in / sign-out actions, and stays in sync with auth state changes (e.g.
 * token refresh, sign-out in another tab). When cloud sync isn't configured
 * (`isCloudEnabled()` is false), the store simply reports `cloudEnabled: false` and the
 * app runs in local-only mode — no auth gate is shown.
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

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
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

  return {
    user,
    loading,
    error,
    cloudEnabled,
    isAuthenticated,
    init,
    signUp,
    signIn,
    signOut,
  }
})
