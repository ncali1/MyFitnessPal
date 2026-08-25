/**
 * Core TypeScript interfaces used by Pinia stores.
 * Timestamps are stored as Unix milliseconds (Date.now()) for compatibility with IndexedDB.
 */

/** A user-defined exercise with target performance metrics. */
export interface Exercise {
  id: string
  name: string
  targetSets: number
  targetReps: number
  targetMuscleGroups: string[]
  /** Unix milliseconds */
  createdAt: number
  /** Unix milliseconds */
  updatedAt: number
}

/**
 * Maps lowercase day names (e.g. `"monday"`) to arrays of exercise IDs.
 */
export interface RoutineAssignment {
  [day: string]: string[]
}

/** A saved weekly routine/program document stored in IndexedDB. */
export interface Routine {
  id: string
  /** User-facing name, e.g. "Push/Pull/Legs" or "5x5". */
  name: string
  /** Whether this is the currently active routine driving the daily checklist. */
  isActive: boolean
  weeklyAssignments: RoutineAssignment
  /** Unix milliseconds */
  createdAt: number
  /** Unix milliseconds */
  updatedAt: number
}

/** Actual performance data logged for one exercise within a workout session. */
export interface ExercisePerformance {
  exerciseId: string
  completed: boolean
  actualSets?: number
  actualReps?: number
  /** Weight used in kg; omit if bodyweight only */
  weight?: number
  difficultyLevel?: 'easy' | 'moderate' | 'hard'
  /** Unix milliseconds */
  timestamp: number
}

/** A daily workout session containing performance entries for multiple exercises. */
export interface WorkoutSession {
  id: string
  /** YYYY-MM-DD format */
  date: string
  exercises: ExercisePerformance[]
  /** Unix milliseconds */
  createdAt: number
  /** Unix milliseconds */
  updatedAt: number
}

/** A single day's logged body weight, separate from workout performance data. */
export interface BodyWeightLog {
  id: string
  /** YYYY-MM-DD format; logging again on the same date overwrites this entry. */
  date: string
  /** Canonical weight in kg; display-unit conversion happens only at render time. */
  weightKg: number
  /** Unix milliseconds */
  createdAt: number
  /** Unix milliseconds */
  updatedAt: number
}

/** Shape of the reactive UI state held by the UI store. */
export interface UIState {
  /** Currently selected date in YYYY-MM-DD format */
  selectedDate: string
  /** ID of the exercise selected in the Progress Graphs view */
  selectedExercise: string | null
  timeRange: {
    start: string
    end: string
  }
  /** Active navigation tab identifier */
  activeTab: string
}
