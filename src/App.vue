/**
 * @component App
 * @description Root application component. Initialises auth (if cloud sync is configured),
 * pulls the latest cloud data on sign-in, then loads persisted data from IndexedDB and
 * renders the active view inside the Layout shell. Shows a loading spinner while data is
 * being fetched and an error banner with a retry button on failure. When cloud sync isn't
 * configured, or the user chooses "Skip for now", the app runs exactly as it did before —
 * local-only, no auth gate.
 */
<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import Layout from './components/Layout.vue'
import ExerciseManager from './components/ExerciseManager.vue'
import RoutineBuilder from './components/RoutineBuilder.vue'
import DailyChecklist from './components/DailyChecklist.vue'
import WeeklySummary from './components/WeeklySummary.vue'
import ProgressGraphs from './components/ProgressGraphs.vue'
import BodyWeightTracker from './components/BodyWeightTracker.vue'
import InstallPrompt from './components/InstallPrompt.vue'
import RestTimer from './components/RestTimer.vue'
import WorkoutReminder from './components/WorkoutReminder.vue'
import AuthGate from './components/AuthGate.vue'
import PasswordRecoveryGate from './components/PasswordRecoveryGate.vue'
import { useAppInitialization } from './composables/useAppInitialization'
import { useUIStore } from './stores/ui'
import { useAuthStore } from './stores/auth'
import { pullAndHydrate, flushQueue } from './services/cloudSync'

const SKIP_KEY = 'fittrack-skip-auth'

const { initializeApp, isLoading, error } = useAppInitialization()
const uiStore = useUIStore()
const authStore = useAuthStore()

const skipped = ref(localStorage.getItem(SKIP_KEY) === 'true')
const authReady = ref(false)

/** `true` once we know whether to show the auth gate, sign-in state resolved. */
const showAuthGate = computed(
  () => authStore.cloudEnabled && authReady.value && !authStore.isAuthenticated && !skipped.value
)

/**
 * Loads local data, and — when signed in — first pulls the latest from the cloud and
 * flushes any queued offline writes so both devices converge on the same state.
 */
async function loadEverything() {
  if (authStore.cloudEnabled && authStore.user) {
    try {
      await flushQueue(authStore.user.id)
      await pullAndHydrate(authStore.user.id)
    } catch (err) {
      console.error('Cloud sync failed, continuing with local data:', err)
    }
  }
  try {
    await initializeApp()
  } catch (err) {
    console.error('Failed to initialize app:', err)
  }
}

/**
 * Dismisses the auth gate for this device without signing in.
 */
function skipAuth() {
  localStorage.setItem(SKIP_KEY, 'true')
  skipped.value = true
  loadEverything()
}

onMounted(async () => {
  await authStore.init()
  authReady.value = true
  if (!showAuthGate.value) {
    await loadEverything()
  }
})

// Once the user signs in through AuthGate, authStore.user flips reactively;
// load everything at that point.
watch(
  () => authStore.isAuthenticated,
  async (isAuth, wasAuth) => {
    if (isAuth && !wasAuth && authReady.value) {
      await loadEverything()
    }
  }
)
</script>

<template>
  <PasswordRecoveryGate v-if="authStore.passwordRecoveryMode" />

  <AuthGate v-else-if="showAuthGate" @skip="skipAuth" />

  <template v-else>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-mark">
        <div class="loading-spinner"></div>
      </div>
      <p class="text-ink-muted text-sm font-medium tracking-wide">Loading your training data…</p>
    </div>

    <div v-else-if="error" class="error-container">
      <div class="text-4xl mb-2">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="initializeApp" class="btn-primary">Retry</button>
    </div>

    <Layout v-else>
      <ExerciseManager v-if="uiStore.activeTab === 'exercises'" />
      <RoutineBuilder v-else-if="uiStore.activeTab === 'routine'" />
      <DailyChecklist v-else-if="uiStore.activeTab === 'checklist'" />
      <WeeklySummary v-else-if="uiStore.activeTab === 'summary'" />
      <ProgressGraphs v-else-if="uiStore.activeTab === 'progress'" />
      <BodyWeightTracker v-else-if="uiStore.activeTab === 'bodyweight'" />
    </Layout>
    <InstallPrompt v-if="!isLoading && !error" />
    <RestTimer v-if="!isLoading && !error" />
    <WorkoutReminder v-if="!isLoading && !error" />
  </template>
</template>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1.25rem;
  padding: 2rem;
  background: radial-gradient(120% 140% at 50% -10%, #17181f 0%, #0a0b0f 55%);
}

.loading-mark {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff5a2b, #ea4413);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px -8px rgba(255, 90, 43, 0.6);
}

.loading-spinner {
  width: 22px;
  height: 22px;
  border: 3px solid rgba(255, 255, 255, 0.35);
  border-top: 3px solid #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #f5f6f8;
  font-size: 1rem;
  text-align: center;
  max-width: 420px;
}
</style>
