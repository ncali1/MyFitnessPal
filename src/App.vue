/**
 * @component App
 * @description Root application component. Initialises the app by loading persisted data from
 * IndexedDB, then renders the active view inside the Layout shell. Shows a loading spinner while
 * data is being fetched and an error banner with a retry button on failure.
 */
<script setup lang="ts">
import { onMounted } from 'vue'
import Layout from './components/Layout.vue'
import ExerciseManager from './components/ExerciseManager.vue'
import RoutineBuilder from './components/RoutineBuilder.vue'
import DailyChecklist from './components/DailyChecklist.vue'
import WeeklySummary from './components/WeeklySummary.vue'
import ProgressGraphs from './components/ProgressGraphs.vue'
import { useAppInitialization } from './composables/useAppInitialization'
import { useUIStore } from './stores/ui'

const { initializeApp, isLoading, error } = useAppInitialization()
const uiStore = useUIStore()

onMounted(async () => {
  try {
    await initializeApp()
  } catch (err) {
    console.error('Failed to initialize app:', err)
  }
})
</script>

<template>
  <div v-if="isLoading" class="loading-container">
    <div class="loading-spinner"></div>
    <p>Loading your fitness data...</p>
  </div>

  <div v-else-if="error" class="error-container">
    <p class="error-message">{{ error }}</p>
    <button @click="initializeApp" class="retry-button">Retry</button>
  </div>

  <Layout v-else>
    <ExerciseManager v-if="uiStore.activeTab === 'exercises'" />
    <RoutineBuilder v-else-if="uiStore.activeTab === 'routine'" />
    <DailyChecklist v-else-if="uiStore.activeTab === 'checklist'" />
    <WeeklySummary v-else-if="uiStore.activeTab === 'summary'" />
    <ProgressGraphs v-else-if="uiStore.activeTab === 'progress'" />
  </Layout>
</template>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1rem;
  padding: 2rem;
}

.error-message {
  color: #e74c3c;
  font-size: 1.1rem;
  text-align: center;
  max-width: 500px;
}

.retry-button {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.retry-button:hover {
  background-color: #2980b9;
}
</style>
