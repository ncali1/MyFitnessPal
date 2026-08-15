import { beforeEach, afterEach, vi } from 'vitest'

// Mock storage service for tests
const mockStorage: Record<string, any> = {
  exercises: {},
  routine: null,
  workoutSessions: {},
}

vi.mock('../services/storage', () => ({
  storageService: {
    saveExercise: vi.fn(async (exercise) => {
      mockStorage.exercises[exercise.id] = exercise
    }),
    getExercise: vi.fn(async (id) => {
      return mockStorage.exercises[id]
    }),
    getAllExercises: vi.fn(async () => {
      return Object.values(mockStorage.exercises)
    }),
    deleteExercise: vi.fn(async (id) => {
      delete mockStorage.exercises[id]
    }),
    saveRoutine: vi.fn(async (routine) => {
      mockStorage.routine = routine
    }),
    getRoutine: vi.fn(async () => {
      return mockStorage.routine
    }),
    saveWorkoutSession: vi.fn(async (session) => {
      mockStorage.workoutSessions[session.id] = session
    }),
    getWorkoutSession: vi.fn(async (id) => {
      return mockStorage.workoutSessions[id]
    }),
    getWorkoutSessionByDate: vi.fn(async (date) => {
      return Object.values(mockStorage.workoutSessions).find((s: any) => s.date === date)
    }),
    getAllWorkoutSessions: vi.fn(async () => {
      return Object.values(mockStorage.workoutSessions)
    }),
    deleteWorkoutSession: vi.fn(async (id) => {
      delete mockStorage.workoutSessions[id]
    }),
    clearAllData: vi.fn(async () => {
      mockStorage.exercises = {}
      mockStorage.routine = null
      mockStorage.workoutSessions = {}
    }),
  },
}))

beforeEach(async () => {
  // Clear all data before each test
  mockStorage.exercises = {}
  mockStorage.routine = null
  mockStorage.workoutSessions = {}
})

afterEach(() => {
  vi.clearAllMocks()
})
