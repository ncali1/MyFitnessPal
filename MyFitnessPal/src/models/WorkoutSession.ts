import type { WorkoutSession, SessionExercisePerformance, DifficultyLevel } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validation error class for WorkoutSession operations
 */
export class WorkoutSessionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkoutSessionValidationError';
  }
}

/**
 * WorkoutSession model class with performance tracking
 */
export class WorkoutSessionModel implements WorkoutSession {
  id: string;
  date: Date;
  exercises: SessionExercisePerformance[];
  createdAt: Date;
  updatedAt: Date;

  private static readonly VALID_DIFFICULTY_LEVELS: DifficultyLevel[] = ['easy', 'moderate', 'hard'];

  constructor(
    date: Date,
    exercises?: SessionExercisePerformance[],
    id?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id || uuidv4();
    this.date = date;
    this.exercises = exercises || [];
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();

    this.validate();
  }

  /**
   * Validates the workout session
   * @throws WorkoutSessionValidationError if validation fails
   */
  private validate(): void {
    if (!(this.date instanceof Date) || isNaN(this.date.getTime())) {
      throw new WorkoutSessionValidationError('Date must be a valid Date object');
    }

    if (!Array.isArray(this.exercises)) {
      throw new WorkoutSessionValidationError('Exercises must be an array');
    }

    for (const exercise of this.exercises) {
      this.validateExercisePerformance(exercise);
    }
  }

  /**
   * Validates a single exercise performance entry
   * @param performance - Performance data to validate
   * @throws WorkoutSessionValidationError if validation fails
   */
  private validateExercisePerformance(performance: SessionExercisePerformance): void {
    if (!performance.exerciseId || typeof performance.exerciseId !== 'string') {
      throw new WorkoutSessionValidationError('Exercise ID must be a non-empty string');
    }

    if (typeof performance.completed !== 'boolean') {
      throw new WorkoutSessionValidationError('Completed status must be a boolean');
    }

    if (!(performance.timestamp instanceof Date) || isNaN(performance.timestamp.getTime())) {
      throw new WorkoutSessionValidationError('Timestamp must be a valid Date object');
    }

    // Validate performance data only if exercise is completed
    if (performance.completed) {
      if (performance.actualSets !== undefined) {
        if (!Number.isInteger(performance.actualSets) || performance.actualSets < 0) {
          throw new WorkoutSessionValidationError('Actual sets must be a non-negative integer');
        }
      }

      if (performance.actualReps !== undefined) {
        if (!Number.isInteger(performance.actualReps) || performance.actualReps < 0) {
          throw new WorkoutSessionValidationError('Actual reps must be a non-negative integer');
        }
      }

      if (performance.weight !== undefined) {
        if (typeof performance.weight !== 'number' || performance.weight < 0) {
          throw new WorkoutSessionValidationError('Weight must be a non-negative number');
        }
      }

      if (performance.difficultyLevel !== undefined) {
        if (!WorkoutSessionModel.VALID_DIFFICULTY_LEVELS.includes(performance.difficultyLevel)) {
          throw new WorkoutSessionValidationError(
            `Difficulty level must be one of: ${WorkoutSessionModel.VALID_DIFFICULTY_LEVELS.join(', ')}`
          );
        }
      }
    }
  }

  /**
   * Adds or updates an exercise in the session
   * @param exerciseId - ID of the exercise
   * @param completed - Whether the exercise was completed
   * @throws WorkoutSessionValidationError if exerciseId is invalid
   */
  addExercise(exerciseId: string, completed: boolean = false): void {
    if (!exerciseId || typeof exerciseId !== 'string') {
      throw new WorkoutSessionValidationError('Exercise ID must be a non-empty string');
    }

    const existingIndex = this.exercises.findIndex((e) => e.exerciseId === exerciseId);

    if (existingIndex > -1) {
      const exercise = this.exercises[existingIndex];
      if (exercise) {
        exercise.completed = completed;
        exercise.timestamp = new Date();
      }
    } else {
      this.exercises.push({
        exerciseId,
        completed,
        timestamp: new Date(),
      });
    }

    this.updatedAt = new Date();
  }

  /**
   * Toggles the completion status of an exercise
   * @param exerciseId - ID of the exercise
   * @throws WorkoutSessionValidationError if exercise not found
   */
  toggleExerciseCompletion(exerciseId: string): void {
    const exercise = this.exercises.find((e) => e.exerciseId === exerciseId);

    if (!exercise) {
      throw new WorkoutSessionValidationError(`Exercise ${exerciseId} not found in session`);
    }

    exercise.completed = !exercise.completed;
    exercise.timestamp = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Logs performance data for a completed exercise
   * @param exerciseId - ID of the exercise
   * @param actualSets - Actual sets completed
   * @param actualReps - Actual reps completed
   * @param weight - Weight used (optional)
   * @param difficultyLevel - Difficulty level (optional)
   * @throws WorkoutSessionValidationError if exercise not found or data is invalid
   */
  logPerformance(
    exerciseId: string,
    actualSets: number,
    actualReps: number,
    weight?: number,
    difficultyLevel?: DifficultyLevel
  ): void {
    const exercise = this.exercises.find((e) => e.exerciseId === exerciseId);

    if (!exercise) {
      throw new WorkoutSessionValidationError(`Exercise ${exerciseId} not found in session`);
    }

    // Validate performance data
    if (!Number.isInteger(actualSets) || actualSets < 0) {
      throw new WorkoutSessionValidationError('Actual sets must be a non-negative integer');
    }

    if (!Number.isInteger(actualReps) || actualReps < 0) {
      throw new WorkoutSessionValidationError('Actual reps must be a non-negative integer');
    }

    if (weight !== undefined) {
      if (typeof weight !== 'number' || weight < 0) {
        throw new WorkoutSessionValidationError('Weight must be a non-negative number');
      }
    }

    if (difficultyLevel !== undefined) {
      if (!WorkoutSessionModel.VALID_DIFFICULTY_LEVELS.includes(difficultyLevel)) {
        throw new WorkoutSessionValidationError(
          `Difficulty level must be one of: ${WorkoutSessionModel.VALID_DIFFICULTY_LEVELS.join(', ')}`
        );
      }
    }

    // Update performance data
    exercise!.completed = true;
    exercise!.actualSets = actualSets;
    exercise!.actualReps = actualReps;
    if (weight !== undefined) {
      exercise!.weight = weight;
    }
    if (difficultyLevel !== undefined) {
      exercise!.difficultyLevel = difficultyLevel;
    }
    exercise!.timestamp = new Date();

    this.updatedAt = new Date();
  }

  /**
   * Gets performance data for a specific exercise
   * @param exerciseId - ID of the exercise
   * @returns Performance data or undefined if not found
   */
  getExercisePerformance(exerciseId: string): SessionExercisePerformance | undefined {
    return this.exercises.find((e) => e.exerciseId === exerciseId);
  }

  /**
   * Gets all completed exercises in the session
   * @returns Array of completed exercise performance data
   */
  getCompletedExercises(): SessionExercisePerformance[] {
    return this.exercises.filter((e) => e.completed);
  }

  /**
   * Gets all incomplete exercises in the session
   * @returns Array of incomplete exercise performance data
   */
  getIncompleteExercises(): SessionExercisePerformance[] {
    return this.exercises.filter((e) => !e.completed);
  }

  /**
   * Removes an exercise from the session
   * @param exerciseId - ID of the exercise to remove
   */
  removeExercise(exerciseId: string): void {
    const index = this.exercises.findIndex((e) => e.exerciseId === exerciseId);

    if (index > -1) {
      this.exercises.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * Converts the session to a plain object
   */
  toJSON(): WorkoutSession {
    return {
      id: this.id,
      date: this.date,
      exercises: this.exercises.map((e) => ({ ...e })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates a WorkoutSessionModel from a plain WorkoutSession object
   */
  static fromJSON(data: WorkoutSession): WorkoutSessionModel {
    return new WorkoutSessionModel(data.date, data.exercises, data.id, data.createdAt, data.updatedAt);
  }
}
