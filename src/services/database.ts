import Dexie, { type Table } from 'dexie'
import type { Exercise, Routine, WorkoutSession, BodyWeightLog } from '../stores/types'

/**
 * Dexie (IndexedDB) database for the Fitness Tracker application.
 *
 * Tables:
 * - `exercises`      — all user-defined exercises
 * - `routine`        — saved routines/programs, indexed by `isActive` (added in v3)
 * - `workoutSessions`— daily workout sessions, indexed by `date`
 * - `bodyWeightLogs` — daily body weight log entries, indexed by `date` (added in v2)
 */
export class FitnessTrackerDB extends Dexie {
  exercises!: Table<Exercise>
  routine!: Table<Routine>
  workoutSessions!: Table<WorkoutSession>
  bodyWeightLogs!: Table<BodyWeightLog>

  constructor() {
    super('FitnessTrackerDB')
    this.version(1).stores({
      exercises: '++id',
      routine: '++id',
      workoutSessions: '++id, date',
    })
    // v2: adds bodyWeightLogs — purely additive, no upgrade transform needed.
    this.version(2).stores({
      exercises: '++id',
      routine: '++id',
      workoutSessions: '++id, date',
      bodyWeightLogs: '++id, date',
    })
    // v3: routines become a list (name + isActive) instead of a single document.
    // The existing routine row is auto-migrated in place: named "My Routine" and
    // marked active, so nothing changes for existing users until they add another.
    this.version(3)
      .stores({
        exercises: '++id',
        routine: '++id, isActive',
        workoutSessions: '++id, date',
        bodyWeightLogs: '++id, date',
      })
      .upgrade(async (tx) => {
        await tx
          .table('routine')
          .toCollection()
          .modify((r) => {
            if (r.name === undefined) r.name = 'My Routine'
            if (r.isActive === undefined) r.isActive = true
          })
      })
  }
}

/** Singleton database instance shared across the application. */
export const db = new FitnessTrackerDB()
