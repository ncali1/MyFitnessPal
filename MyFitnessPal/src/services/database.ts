import Dexie, { type Table } from 'dexie'
import type { Exercise, Routine, WorkoutSession } from '../stores/types'

/**
 * Dexie (IndexedDB) database for the Fitness Tracker application.
 *
 * Tables:
 * - `exercises`      — all user-defined exercises
 * - `routine`        — the single weekly routine document
 * - `workoutSessions`— daily workout sessions, indexed by `date`
 */
export class FitnessTrackerDB extends Dexie {
  exercises!: Table<Exercise>
  routine!: Table<Routine>
  workoutSessions!: Table<WorkoutSession>

  constructor() {
    super('FitnessTrackerDB')
    this.version(1).stores({
      exercises: '++id',
      routine: '++id',
      workoutSessions: '++id, date',
    })
  }
}

/** Singleton database instance shared across the application. */
export const db = new FitnessTrackerDB()
