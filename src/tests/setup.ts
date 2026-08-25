import { beforeEach, afterEach, vi } from 'vitest'

// Mock storage service for tests
const mockStorage: Record<string, any> = {
  exercises: {},
  routines: {},
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
      mockStorage.routines[routine.id] = routine
    }),
    getAllRoutines: vi.fn(async () => {
      return Object.values(mockStorage.routines)
    }),
    deleteRoutine: vi.fn(async (id) => {
      delete mockStorage.routines[id]
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
      mockStorage.routines = {}
      mockStorage.workoutSessions = {}
    }),
  },
}))

beforeEach(async () => {
  // Clear all data before each test
  mockStorage.exercises = {}
  mockStorage.routines = {}
  mockStorage.workoutSessions = {}
})

afterEach(() => {
  vi.clearAllMocks()
})
