import type { Routine, DayOfWeek } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Validation error class for Routine operations
 */
export class RoutineValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoutineValidationError';
  }
}

/**
 * Routine model class with day-based assignment logic
 */
export class RoutineModel implements Routine {
  id: string;
  weeklyAssignments: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  createdAt: Date;
  updatedAt: Date;

  private static readonly VALID_DAYS: DayOfWeek[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  constructor(
    weeklyAssignments?: Routine['weeklyAssignments'],
    id?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id || uuidv4();
    this.weeklyAssignments = weeklyAssignments || this.initializeEmptyAssignments();
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();

    this.validate();
  }

  /**
   * Initializes empty assignments for all days
   */
  private initializeEmptyAssignments(): Routine['weeklyAssignments'] {
    return {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };
  }

  /**
   * Validates the routine structure
   * @throws RoutineValidationError if validation fails
   */
  private validate(): void {
    if (!this.weeklyAssignments || typeof this.weeklyAssignments !== 'object') {
      throw new RoutineValidationError('Weekly assignments must be an object');
    }

    for (const day of RoutineModel.VALID_DAYS) {
      if (!Array.isArray(this.weeklyAssignments[day])) {
        throw new RoutineValidationError(`Assignments for ${day} must be an array`);
      }

      if (!this.weeklyAssignments[day].every((id) => typeof id === 'string' && id.length > 0)) {
        throw new RoutineValidationError(`All exercise IDs for ${day} must be non-empty strings`);
      }
    }
  }

  /**
   * Validates a day of the week
   * @param day - Day to validate
   * @throws RoutineValidationError if day is invalid
   */
  private validateDay(day: string): asserts day is DayOfWeek {
    if (!RoutineModel.VALID_DAYS.includes(day as DayOfWeek)) {
      throw new RoutineValidationError(
        `Invalid day: ${day}. Must be one of: ${RoutineModel.VALID_DAYS.join(', ')}`
      );
    }
  }

  /**
   * Assigns an exercise to a specific day
   * @param day - Day of the week
   * @param exerciseId - ID of the exercise to assign
   * @throws RoutineValidationError if day or exerciseId is invalid
   */
  assignExercise(day: string, exerciseId: string): void {
    this.validateDay(day);

    if (!exerciseId || typeof exerciseId !== 'string') {
      throw new RoutineValidationError('Exercise ID must be a non-empty string');
    }

    if (!this.weeklyAssignments[day as DayOfWeek].includes(exerciseId)) {
      this.weeklyAssignments[day as DayOfWeek].push(exerciseId);
      this.updatedAt = new Date();
    }
  }

  /**
   * Removes an exercise from a specific day
   * @param day - Day of the week
   * @param exerciseId - ID of the exercise to remove
   * @throws RoutineValidationError if day is invalid
   */
  removeExercise(day: string, exerciseId: string): void {
    this.validateDay(day);

    const dayAssignments = this.weeklyAssignments[day as DayOfWeek];
    const index = dayAssignments.indexOf(exerciseId);

    if (index > -1) {
      dayAssignments.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * Gets all exercises assigned to a specific day
   * @param day - Day of the week
   * @returns Array of exercise IDs
   * @throws RoutineValidationError if day is invalid
   */
  getExercisesForDay(day: string): string[] {
    this.validateDay(day);
    return [...this.weeklyAssignments[day as DayOfWeek]];
  }

  /**
   * Gets all exercises assigned to a specific day of the week (by index)
   * @param dayIndex - Day index (0 = Monday, 6 = Sunday)
   * @returns Array of exercise IDs
   * @throws RoutineValidationError if dayIndex is invalid
   */
  getExercisesForDayIndex(dayIndex: number): string[] {
    if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex > 6) {
      throw new RoutineValidationError('Day index must be between 0 and 6');
    }

    const day = RoutineModel.VALID_DAYS[dayIndex]!;
    return this.getExercisesForDay(day);
  }

  /**
   * Clears all assignments for a specific day
   * @param day - Day of the week
   * @throws RoutineValidationError if day is invalid
   */
  clearDay(day: string): void {
    this.validateDay(day);
    this.weeklyAssignments[day as DayOfWeek] = [];
    this.updatedAt = new Date();
  }

  /**
   * Checks if an exercise is assigned to a specific day
   * @param day - Day of the week
   * @param exerciseId - ID of the exercise
   * @returns true if exercise is assigned to the day
   * @throws RoutineValidationError if day is invalid
   */
  hasExerciseOnDay(day: string, exerciseId: string): boolean {
    this.validateDay(day);
    return this.weeklyAssignments[day as DayOfWeek].includes(exerciseId);
  }

  /**
   * Gets all days that have an exercise assigned
   * @param exerciseId - ID of the exercise
   * @returns Array of days with the exercise assigned
   */
  getDaysForExercise(exerciseId: string): DayOfWeek[] {
    return RoutineModel.VALID_DAYS.filter((day) =>
      this.weeklyAssignments[day].includes(exerciseId)
    );
  }

  /**
   * Converts the routine to a plain object
   */
  toJSON(): Routine {
    return {
      id: this.id,
      weeklyAssignments: {
        monday: [...this.weeklyAssignments.monday],
        tuesday: [...this.weeklyAssignments.tuesday],
        wednesday: [...this.weeklyAssignments.wednesday],
        thursday: [...this.weeklyAssignments.thursday],
        friday: [...this.weeklyAssignments.friday],
        saturday: [...this.weeklyAssignments.saturday],
        sunday: [...this.weeklyAssignments.sunday],
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates a RoutineModel from a plain Routine object
   */
  static fromJSON(data: Routine): RoutineModel {
    return new RoutineModel(data.weeklyAssignments, data.id, data.createdAt, data.updatedAt);
  }
}
