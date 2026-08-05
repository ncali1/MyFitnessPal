import type { Exercise } from './types';

/**
 * Validation error class for Exercise operations
 */
export class ExerciseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExerciseValidationError';
  }
}

/**
 * Exercise model class with validation methods
 */
export class ExerciseModel implements Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetMuscleGroups: string[];
  createdAt: Date;
  updatedAt: Date;

  constructor(
    name: string,
    targetSets: number,
    targetReps: number,
    targetMuscleGroups: string[],
    id?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.id = id || crypto.randomUUID();
    this.name = name;
    this.targetSets = targetSets;
    this.targetReps = targetReps;
    this.targetMuscleGroups = targetMuscleGroups;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();

    this.validate();
  }

  /**
   * Validates all exercise fields
   * @throws ExerciseValidationError if validation fails
   */
  private validate(): void {
    this.validateName();
    this.validateSets();
    this.validateReps();
    this.validateMuscleGroups();
  }

  /**
   * Validates exercise name
   * @throws ExerciseValidationError if name is invalid
   */
  private validateName(): void {
    if (!this.name || typeof this.name !== 'string') {
      throw new ExerciseValidationError('Exercise name is required');
    }

    const trimmedName = this.name.trim();
    if (trimmedName.length === 0) {
      throw new ExerciseValidationError('Exercise name cannot be empty or whitespace only');
    }

    if (trimmedName.length > 255) {
      throw new ExerciseValidationError('Exercise name must be 255 characters or less');
    }

    this.name = trimmedName;
  }

  /**
   * Validates target sets
   * @throws ExerciseValidationError if sets are invalid
   */
  private validateSets(): void {
    if (!Number.isInteger(this.targetSets) || this.targetSets <= 0) {
      throw new ExerciseValidationError('Target sets must be a positive integer');
    }
  }

  /**
   * Validates target reps
   * @throws ExerciseValidationError if reps are invalid
   */
  private validateReps(): void {
    if (!Number.isInteger(this.targetReps) || this.targetReps <= 0) {
      throw new ExerciseValidationError('Target reps must be a positive integer');
    }
  }

  /**
   * Validates muscle groups
   * @throws ExerciseValidationError if muscle groups are invalid
   */
  private validateMuscleGroups(): void {
    if (!Array.isArray(this.targetMuscleGroups) || this.targetMuscleGroups.length === 0) {
      throw new ExerciseValidationError('At least one muscle group must be selected');
    }

    if (!this.targetMuscleGroups.every((group) => typeof group === 'string' && group.trim().length > 0)) {
      throw new ExerciseValidationError('All muscle groups must be non-empty strings');
    }
  }

  /**
   * Updates exercise name
   * @param name - New exercise name
   * @throws ExerciseValidationError if name is invalid
   */
  updateName(name: string): void {
    this.name = name;
    this.validateName();
    this.updatedAt = new Date();
  }

  /**
   * Updates target sets
   * @param sets - New target sets
   * @throws ExerciseValidationError if sets are invalid
   */
  updateSets(sets: number): void {
    this.targetSets = sets;
    this.validateSets();
    this.updatedAt = new Date();
  }

  /**
   * Updates target reps
   * @param reps - New target reps
   * @throws ExerciseValidationError if reps are invalid
   */
  updateReps(reps: number): void {
    this.targetReps = reps;
    this.validateReps();
    this.updatedAt = new Date();
  }

  /**
   * Updates muscle groups
   * @param groups - New muscle groups
   * @throws ExerciseValidationError if groups are invalid
   */
  updateMuscleGroups(groups: string[]): void {
    this.targetMuscleGroups = groups;
    this.validateMuscleGroups();
    this.updatedAt = new Date();
  }

  /**
   * Converts the exercise to a plain object
   */
  toJSON(): Exercise {
    return {
      id: this.id,
      name: this.name,
      targetSets: this.targetSets,
      targetReps: this.targetReps,
      targetMuscleGroups: this.targetMuscleGroups,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Creates an ExerciseModel from a plain Exercise object
   */
  static fromJSON(data: Exercise): ExerciseModel {
    return new ExerciseModel(
      data.name,
      data.targetSets,
      data.targetReps,
      data.targetMuscleGroups,
      data.id,
      data.createdAt,
      data.updatedAt
    );
  }
}
