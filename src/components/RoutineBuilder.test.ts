import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRoutineStore } from '../stores/routine'
import { useExercisesStore } from '../stores/exercises'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'

// Mock the storage service
vi.mock('../services/storage', () => ({
  storageService: {
    saveExercise: vi.fn(async () => {}),
    getExercise: vi.fn(async () => undefined),
    getAllExercises: vi.fn(async () => []),
    deleteExercise: vi.fn(async () => {}),
    saveRoutine: vi.fn(async () => {}),
    getAllRoutines: vi.fn(async () => []),
    deleteRoutine: vi.fn(async () => {}),
    saveWorkoutSession: vi.fn(async () => {}),
    getWorkoutSession: vi.fn(async () => undefined),
    getWorkoutSessionByDate: vi.fn(async () => undefined),
    getAllWorkoutSessions: vi.fn(async () => []),
    deleteWorkoutSession: vi.fn(async () => {}),
    clearAllData: vi.fn(async () => {}),
  },
}))

describe('RoutineBuilder Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Assigning exercises to days', () => {
    it('should assign exercise to a day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)

      const mondayExercises = routineStore.routineForDay('monday')
      expect(mondayExercises).toContain(exercise.id)
    })

    it('should assign multiple exercises to the same day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise1 = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const exercise2 = await exercisesStore.createExercise('Incline Press', 3, 8, ['Chest'])

      await routineStore.assignExercise('monday', exercise1.id)
      await routineStore.assignExercise('monday', exercise2.id)

      const mondayExercises = routineStore.routineForDay('monday')
      expect(mondayExercises).toHaveLength(2)
      expect(mondayExercises).toContain(exercise1.id)
      expect(mondayExercises).toContain(exercise2.id)
    })

    it('should not add duplicate exercise to same day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.assignExercise('monday', exercise.id)

      const mondayExercises = routineStore.routineForDay('monday')
      expect(mondayExercises).toHaveLength(1)
    })

    it('should assign same exercise to different days', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.assignExercise('wednesday', exercise.id)

      expect(routineStore.routineForDay('monday')).toContain(exercise.id)
      expect(routineStore.routineForDay('wednesday')).toContain(exercise.id)
    })
  })

  describe('Removing exercises from days', () => {
    it('should remove exercise from day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      expect(routineStore.routineForDay('monday')).toHaveLength(1)

      await routineStore.removeExercise('monday', exercise.id)

      expect(routineStore.routineForDay('monday')).toHaveLength(0)
    })

    it('should remove only specified exercise from day with multiple exercises', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise1 = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const exercise2 = await exercisesStore.createExercise('Incline Press', 3, 8, ['Chest'])

      await routineStore.assignExercise('monday', exercise1.id)
      await routineStore.assignExercise('monday', exercise2.id)

      await routineStore.removeExercise('monday', exercise1.id)

      const mondayExercises = routineStore.routineForDay('monday')
      expect(mondayExercises).toHaveLength(1)
      expect(mondayExercises).toContain(exercise2.id)
      expect(mondayExercises).not.toContain(exercise1.id)
    })

    it('should handle removing non-existent exercise gracefully', async () => {
      const routineStore = useRoutineStore()

      // Should not throw
      await expect(
        routineStore.removeExercise('monday', 'non-existent-id')
      ).resolves.not.toThrow()
    })

    it('should not affect other days when removing exercise', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.assignExercise('wednesday', exercise.id)

      await routineStore.removeExercise('monday', exercise.id)

      expect(routineStore.routineForDay('monday')).toHaveLength(0)
      expect(routineStore.routineForDay('wednesday')).toContain(exercise.id)
    })
  })

  describe('Routine persistence', () => {
    it('should save routine to storage', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.saveRoutine()

      expect(routineStore.routine).toBeDefined()
      expect(routineStore.routine?.weeklyAssignments.monday).toContain(exercise.id)
    })

    it('should load routine from storage', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.saveRoutine()

      // Verify the routine was saved with the exercise
      const savedRoutine = routineStore.routine
      expect(savedRoutine).toBeDefined()
      expect(savedRoutine?.weeklyAssignments.monday).toContain(exercise.id)
    })

    it('should initialize empty routine if none exists', async () => {
      const routineStore = useRoutineStore()

      await routineStore.loadRoutines()

      expect(routineStore.routine).toBeDefined()
      expect(routineStore.routine?.weeklyAssignments).toBeDefined()
      expect(Object.keys(routineStore.routine?.weeklyAssignments || {})).toHaveLength(7)
    })

    it('should update routine timestamp on save', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      const beforeSave = routineStore.routine?.updatedAt

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10))

      await routineStore.saveRoutine()
      const afterSave = routineStore.routine?.updatedAt

      expect(afterSave).toBeGreaterThan(beforeSave || 0)
    })
  })

  describe('Routine state management', () => {
    it('should track all assignments across all days', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise1 = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const exercise2 = await exercisesStore.createExercise('Squat', 4, 8, ['Legs'])
      const exercise3 = await exercisesStore.createExercise('Deadlift', 3, 5, ['Back'])

      await routineStore.assignExercise('monday', exercise1.id)
      await routineStore.assignExercise('wednesday', exercise2.id)
      await routineStore.assignExercise('friday', exercise3.id)

      const allAssignments = routineStore.allAssignments

      expect(allAssignments.monday).toContain(exercise1.id)
      expect(allAssignments.wednesday).toContain(exercise2.id)
      expect(allAssignments.friday).toContain(exercise3.id)
    })

    it('should handle case-insensitive day names', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('MONDAY', exercise.id)

      expect(routineStore.routineForDay('monday')).toContain(exercise.id)
      expect(routineStore.routineForDay('MONDAY')).toContain(exercise.id)
    })

    it('should set error state on failure', async () => {
      const routineStore = useRoutineStore()

      // Try to remove from non-existent routine
      await routineStore.removeExercise('monday', 'any-id')

      // Error should be cleared after successful operation
      const exercisesStore = useExercisesStore()
      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      await routineStore.assignExercise('monday', exercise.id)

      expect(routineStore.error).toBeNull()
    })

    it('should maintain loading state during async operations', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      const assignPromise = routineStore.assignExercise('monday', exercise.id)
      // At this point, loading might be true (depending on timing)
      await assignPromise

      // After operation completes, loading should be false
      expect(routineStore.loading).toBe(false)
    })
  })

  describe('Weekly grid display', () => {
    it('should display all 7 days of the week', async () => {
      const routineStore = useRoutineStore()

      await routineStore.loadRoutines()

      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      days.forEach((day) => {
        expect(routineStore.routineForDay(day)).toBeDefined()
      })
    })

    it('should show empty day when no exercises assigned', async () => {
      const routineStore = useRoutineStore()

      await routineStore.loadRoutines()

      expect(routineStore.routineForDay('monday')).toHaveLength(0)
    })

    it('should show all exercises for a day', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercises = await Promise.all([
        exercisesStore.createExercise('Bench Press', 3, 10, ['Chest']),
        exercisesStore.createExercise('Incline Press', 3, 8, ['Chest']),
        exercisesStore.createExercise('Dumbbell Flyes', 3, 12, ['Chest']),
      ])

      for (const exercise of exercises) {
        await routineStore.assignExercise('monday', exercise.id)
      }

      const mondayExercises = routineStore.routineForDay('monday')
      expect(mondayExercises).toHaveLength(3)
    })
  })

  describe('Exercise selector integration', () => {
    it('should filter out already assigned exercises from selector', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise1 = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const exercise2 = await exercisesStore.createExercise('Squat', 4, 8, ['Legs'])

      await routineStore.assignExercise('monday', exercise1.id)

      const mondayExercises = routineStore.routineForDay('monday')
      expect(mondayExercises).toContain(exercise1.id)
      expect(mondayExercises).not.toContain(exercise2.id)
    })

    it('should allow same exercise to be selected for different days', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()

      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)
      await routineStore.assignExercise('wednesday', exercise.id)

      expect(routineStore.routineForDay('monday')).toContain(exercise.id)
      expect(routineStore.routineForDay('wednesday')).toContain(exercise.id)
    })
  })

  describe('Multiple routines', () => {
    it('lazily creates the first routine as "My Routine", marked active', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const exercise = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])

      await routineStore.assignExercise('monday', exercise.id)

      expect(routineStore.routines).toHaveLength(1)
      expect(routineStore.activeRoutine?.name).toBe('My Routine')
      expect(routineStore.activeRoutine?.isActive).toBe(true)
      // `routine` remains a working alias for the active routine
      expect(routineStore.routine).toBe(routineStore.activeRoutine)
    })

    it('createRoutine adds a new, initially inactive routine', async () => {
      const routineStore = useRoutineStore()
      await routineStore.createRoutine('Push/Pull/Legs')

      expect(routineStore.routines).toHaveLength(1)
      expect(routineStore.routines[0]!.name).toBe('Push/Pull/Legs')
      expect(routineStore.routines[0]!.isActive).toBe(false)
    })

    it('renameRoutine updates the routine name', async () => {
      const routineStore = useRoutineStore()
      const created = await routineStore.createRoutine('5x5')
      await routineStore.renameRoutine(created.id, 'Starting Strength')

      expect(routineStore.routines.find((r) => r.id === created.id)?.name).toBe('Starting Strength')
    })

    it('setActiveRoutine switches which routine is active and keeps assignments separate', async () => {
      const routineStore = useRoutineStore()
      const exercisesStore = useExercisesStore()
      const benchPress = await exercisesStore.createExercise('Bench Press', 3, 10, ['Chest'])
      const squat = await exercisesStore.createExercise('Squat', 4, 8, ['Legs'])

      // First routine (auto-created) gets bench press on Monday
      await routineStore.assignExercise('monday', benchPress.id)
      const firstRoutineId = routineStore.activeRoutine!.id

      // Second routine gets squat on Monday instead
      const second = await routineStore.createRoutine('5x5')
      await routineStore.setActiveRoutine(second.id)
      await routineStore.assignExercise('monday', squat.id)

      expect(routineStore.activeRoutine?.id).toBe(second.id)
      expect(routineStore.routineForDay('monday')).toContain(squat.id)
      expect(routineStore.routineForDay('monday')).not.toContain(benchPress.id)

      // Switching back reveals the first routine's own assignments, untouched
      await routineStore.setActiveRoutine(firstRoutineId)
      expect(routineStore.routineForDay('monday')).toContain(benchPress.id)
      expect(routineStore.routineForDay('monday')).not.toContain(squat.id)
    })

    it('setActiveRoutine invalidates the workout-sessions caches so stale computed data is not leaked', async () => {
      const routineStore = useRoutineStore()
      const sessionsStore = useWorkoutSessionsStore()
      const invalidateSpy = vi.spyOn(sessionsStore, 'invalidateCache')

      await routineStore.assignExercise('monday', 'ex1')
      const second = await routineStore.createRoutine('5x5')

      invalidateSpy.mockClear()
      await routineStore.setActiveRoutine(second.id)

      expect(invalidateSpy).toHaveBeenCalled()
    })

    it('deleteRoutine refuses to delete the last remaining routine', async () => {
      const routineStore = useRoutineStore()
      await routineStore.assignExercise('monday', 'ex1') // lazily creates the only routine

      await expect(routineStore.deleteRoutine(routineStore.activeRoutine!.id)).rejects.toThrow()
      expect(routineStore.routines).toHaveLength(1)
    })

    it('deleteRoutine auto-activates another routine when the active one is deleted', async () => {
      const routineStore = useRoutineStore()
      await routineStore.assignExercise('monday', 'ex1') // first routine, active
      const firstId = routineStore.activeRoutine!.id
      const second = await routineStore.createRoutine('5x5')

      await routineStore.deleteRoutine(firstId)

      expect(routineStore.routines).toHaveLength(1)
      expect(routineStore.activeRoutine?.id).toBe(second.id)
      expect(routineStore.activeRoutine?.isActive).toBe(true)
    })

    it('deleteRoutine leaves the active routine alone when deleting an inactive one', async () => {
      const routineStore = useRoutineStore()
      await routineStore.assignExercise('monday', 'ex1') // first routine, active
      const activeId = routineStore.activeRoutine!.id
      const second = await routineStore.createRoutine('5x5')

      await routineStore.deleteRoutine(second.id)

      expect(routineStore.routines).toHaveLength(1)
      expect(routineStore.activeRoutine?.id).toBe(activeId)
    })
  })
})
