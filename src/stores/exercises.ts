import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Exercise } from './types'
import { storageService } from '../services/storage'
import { ExerciseModel } from '../models/Exercise'

/**
 * Pinia store for managing the exercise library.
 *
 * State:
 * - `exercises` — reactive array of all exercises
 * - `loading`   — true while an async operation is in progress
 * - `error`     — last error message, or null
 *
 * Actions: `createExercise`, `updateExercise`, `deleteExercise`, `loadExercises`
 * Getters: `allExercises`, `exerciseById`
 */
export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref<Exercise[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** All exercises in the library, reactive. */
  const allExercises = computed(() => exercises.value)

  /**
   * Finds a single exercise by its ID.
   * @param id - The exercise ID to look up
   * @returns The matching exercise, or `undefined` if not found
   */
  const exerciseById = (id: string) => {
    return exercises.value.find((ex) => ex.id === id)
  }

  /**
   * Creates a new exercise, validates it, adds it to state, and persists it.
   * @param name - Exercise name
   * @param targetSets - Target number of sets (positive integer)
   * @param targetReps - Target number of reps (positive integer)
   * @param targetMuscleGroups - At least one muscle group
   * @returns The newly created exercise
   * @throws {ExerciseValidationError} when any field fails validation
   */
  const createExercise = async (
    name: string,
    targetSets: number,
    targetReps: number,
    targetMuscleGroups: string[]
  ): Promise<Exercise> => {
    try {
      loading.value = true
      error.value = null

      // Validate using ExerciseModel
      const model = new ExerciseModel(name, targetSets, targetReps, targetMuscleGroups)
      const exercise: Exercise = {
        id: model.id,
        name: model.name,
        targetSets: model.targetSets,
        targetReps: model.targetReps,
        targetMuscleGroups: model.targetMuscleGroups,
        createdAt: model.createdAt.getTime(),
        updatedAt: model.updatedAt.getTime(),
      }

      exercises.value.push(exercise)
      await storageService.saveExercise(exercise)

      return exercise
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates an existing exercise in state and persists the change.
   * @param id - ID of the exercise to update
   * @param updates - Partial exercise fields to apply (cannot change `id` or `createdAt`)
   * @returns The updated exercise
   * @throws {Error} when the exercise is not found
   * @throws {ExerciseValidationError} when the merged result fails validation
   */
  const updateExercise = async (
    id: string,
    updates: Partial<Omit<Exercise, 'id' | 'createdAt'>>
  ): Promise<Exercise> => {
    try {
      loading.value = true
      error.value = null

      const index = exercises.value.findIndex((ex) => ex.id === id)
      if (index === -1) {
        throw new Error('Exercise not found')
      }

      const existing = exercises.value[index]!
      
      // Validate using ExerciseModel
      const model = new ExerciseModel(
        updates.name ?? existing.name,
        updates.targetSets ?? existing.targetSets,
        updates.targetReps ?? existing.targetReps,
        updates.targetMuscleGroups ?? existing.targetMuscleGroups,
        existing.id,
        new Date(existing.createdAt),
        new Date(updates.updatedAt ?? Date.now())
      )

      const updated: Exercise = {
        id: model.id,
        name: model.name,
        targetSets: model.targetSets,
        targetReps: model.targetReps,
        targetMuscleGroups: model.targetMuscleGroups,
        createdAt: model.createdAt.getTime(),
        updatedAt: model.updatedAt.getTime(),
      }

      exercises.value[index] = updated
      await storageService.saveExercise(updated)

      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Removes an exercise from state and deletes it from storage.
   * @param id - ID of the exercise to delete
   */
  const deleteExercise = async (id: string): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      exercises.value = exercises.value.filter((ex) => ex.id !== id)
      await storageService.deleteExercise(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete exercise'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Loads all exercises from IndexedDB into the reactive state.
   * Safe to call multiple times — always replaces current state with storage contents.
   */
  const loadExercises = async (): Promise<void> => {
    try {
      loading.value = true
      error.value = null

      const loaded = await storageService.getAllExercises()
      exercises.value = loaded
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load exercises'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    exercises,
    loading,
    error,
    allExercises,
    exerciseById,
    createExercise,
    updateExercise,
    deleteExercise,
    loadExercises,
  }
})
