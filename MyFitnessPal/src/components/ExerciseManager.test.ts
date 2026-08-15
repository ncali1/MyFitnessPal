import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExercisesStore } from '../stores/exercises'

// Mock the storage service before importing the store
vi.mock('../services/storage', () => ({
  storageService: {
    saveExercise: vi.fn(async () => {}),
    getExercise: vi.fn(async () => undefined),
    getAllExercises: vi.fn(async () => []),
    deleteExercise: vi.fn(async () => {}),
    saveRoutine: vi.fn(async () => {}),
    getRoutine: vi.fn(async () => undefined),
    saveWorkoutSession: vi.fn(async () => {}),
    getWorkoutSession: vi.fn(async () => undefined),
    getWorkoutSessionByDate: vi.fn(async () => undefined),
    getAllWorkoutSessions: vi.fn(async () => []),
    deleteWorkoutSession: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

describe('ExerciseManager Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Creating exercises', () => {
    it('should create exercise with valid data', async () => {
      const store = useExercisesStore()

      const exercise = await store.createExercise('Bench Press', 3, 10, ['Chest', 'Triceps'])

      expect(exercise.name).toBe('Bench Press')
      expect(exercise.targetSets).toBe(3)
      expect(exercise.targetReps).toBe(10)
      expect(exercise.targetMuscleGroups).toEqual(['Chest', 'Triceps'])
      expect(store.allExercises).toHaveLength(1)
    })

    it('should reject exercise with empty name', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('', 3, 10, ['Chest'])).rejects.toThrow()
    })

    it('should reject exercise with invalid sets', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('Bench Press', 0, 10, ['Chest'])).rejects.toThrow()
      await expect(store.createExercise('Bench Press', -1, 10, ['Chest'])).rejects.toThrow()
    })

    it('should reject exercise with invalid reps', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('Bench Press', 3, 0, ['Chest'])).rejects.toThrow()
      await expect(store.createExercise('Bench Press', 3, -1, ['Chest'])).rejects.toThrow()
    })

    it('should reject exercise with no muscle groups', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('Bench Press', 3, 10, [])).rejects.toThrow()
    })
  })

  describe('Editing exercises', () => {
    it('should update exercise fields', async () => {
      const store = useExercisesStore()

      const exercise = await store.createExercise('Bench Press', 3, 10, ['Chest'])
      const updated = await store.updateExercise(exercise.id, {
        name: 'Incline Bench Press',
        targetSets: 4,
        targetReps: 8,
        targetMuscleGroups: ['Chest', 'Shoulders'],
        updatedAt: Date.now(),
      })

      expect(updated.name).toBe('Incline Bench Press')
      expect(updated.targetSets).toBe(4)
      expect(updated.targetReps).toBe(8)
      expect(updated.targetMuscleGroups).toEqual(['Chest', 'Shoulders'])
    })

    it('should reject update with invalid data', async () => {
      const store = useExercisesStore()

      const exercise = await store.createExercise('Bench Press', 3, 10, ['Chest'])

      await expect(
        store.updateExercise(exercise.id, {
          targetSets: 0,
          updatedAt: Date.now(),
        })
      ).rejects.toThrow()
    })

    it('should throw error when updating non-existent exercise', async () => {
      const store = useExercisesStore()

      await expect(
        store.updateExercise('non-existent-id', {
          name: 'Updated',
          updatedAt: Date.now(),
        })
      ).rejects.toThrow('Exercise not found')
    })
  })

  describe('Deleting exercises', () => {
    it('should delete exercise from list', async () => {
      const store = useExercisesStore()

      const exercise = await store.createExercise('Bench Press', 3, 10, ['Chest'])
      expect(store.allExercises).toHaveLength(1)

      await store.deleteExercise(exercise.id)

      expect(store.allExercises).toHaveLength(0)
    })

    it('should handle deleting non-existent exercise gracefully', async () => {
      const store = useExercisesStore()

      // Should not throw
      await expect(store.deleteExercise('non-existent-id')).resolves.not.toThrow()
    })
  })

  describe('Listing exercises', () => {
    it('should display all exercises', async () => {
      const store = useExercisesStore()

      await store.createExercise('Bench Press', 3, 10, ['Chest'])
      await store.createExercise('Squat', 4, 8, ['Legs'])
      await store.createExercise('Deadlift', 3, 5, ['Back', 'Legs'])

      expect(store.allExercises).toHaveLength(3)
    })

    it('should maintain flat list structure', async () => {
      const store = useExercisesStore()

      await store.createExercise('Bench Press', 3, 10, ['Chest'])
      await store.createExercise('Squat', 4, 8, ['Legs'])

      const exercises = store.allExercises
      expect(Array.isArray(exercises)).toBe(true)
      expect(exercises.every((ex) => typeof ex === 'object' && !Array.isArray(ex))).toBe(true)
    })

    it('should retrieve exercise by id', async () => {
      const store = useExercisesStore()

      const created = await store.createExercise('Bench Press', 3, 10, ['Chest'])
      const retrieved = store.exerciseById(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.name).toBe('Bench Press')
    })

    it('should return undefined for non-existent exercise id', async () => {
      const store = useExercisesStore()

      const retrieved = store.exerciseById('non-existent-id')

      expect(retrieved).toBeUndefined()
    })
  })

  describe('Form validation', () => {
    it('should validate exercise name is required', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('', 3, 10, ['Chest'])).rejects.toThrow(
        'Exercise name is required'
      )
    })

    it('should validate sets and reps are positive numbers', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('Bench Press', 0, 10, ['Chest'])).rejects.toThrow(
        'Target sets must be a positive integer'
      )

      await expect(store.createExercise('Bench Press', 3, 0, ['Chest'])).rejects.toThrow(
        'Target reps must be a positive integer'
      )
    })

    it('should validate at least one muscle group is selected', async () => {
      const store = useExercisesStore()

      await expect(store.createExercise('Bench Press', 3, 10, [])).rejects.toThrow(
        'At least one muscle group must be selected'
      )
    })
  })

  describe('Error handling', () => {
    it('should set error state on creation failure', async () => {
      const store = useExercisesStore()

      try {
        await store.createExercise('', 3, 10, ['Chest'])
      } catch (_err) {
        // Expected to fail
      }

      expect(store.error).toBeDefined()
    })

    it('should clear error on successful operation', async () => {
      const store = useExercisesStore()

      // First cause an error
      try {
        await store.createExercise('', 3, 10, ['Chest'])
      } catch (_err) {
        // Expected to fail
      }

      // Then succeed
      await store.createExercise('Bench Press', 3, 10, ['Chest'])

      expect(store.error).toBeNull()
    })
  })
})
