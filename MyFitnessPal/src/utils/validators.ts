/**
 * Pure validation utility functions.
 * Each returns { valid: boolean; error?: string }.
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates an exercise name.
 * Must be a non-empty string of 255 characters or fewer.
 * @param name - The exercise name to validate
 * @returns Validation result with an optional error message
 */
export function validateExerciseName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Exercise name is required' }
  }
  if (name.trim().length > 255) {
    return { valid: false, error: 'Exercise name must be 255 characters or less' }
  }
  return { valid: true }
}

/**
 * Validates a sets count (target or actual).
 * Must be a positive integer.
 * @param sets - The sets value to validate (may be null or undefined)
 * @param label - Optional label used in error messages (default: `'Sets'`)
 * @returns Validation result with an optional error message
 */
export function validateSets(
  sets: number | null | undefined,
  _label = 'Sets'
): ValidationResult {
  if (sets === null || sets === undefined || !Number.isInteger(sets) || sets < 1) {
    return { valid: false, error: 'Sets and reps must be positive numbers' }
  }
  return { valid: true }
}

/**
 * Validates a reps count (target or actual).
 * Must be a positive integer.
 * @param reps - The reps value to validate (may be null or undefined)
 * @param label - Optional label used in error messages (default: `'Reps'`)
 * @returns Validation result with an optional error message
 */
export function validateReps(
  reps: number | null | undefined,
  _label = 'Reps'
): ValidationResult {
  if (reps === null || reps === undefined || !Number.isInteger(reps) || reps < 1) {
    return { valid: false, error: 'Sets and reps must be positive numbers' }
  }
  return { valid: true }
}

/**
 * Validates an array of muscle group strings.
 * At least one non-empty group name must be present.
 * @param groups - Array of muscle group strings to validate
 * @returns Validation result with an optional error message
 */
export function validateMuscleGroups(groups: string[]): ValidationResult {
  if (!groups || groups.length === 0 || !groups.some((g) => g.trim().length > 0)) {
    return { valid: false, error: 'At least one muscle group must be selected' }
  }
  return { valid: true }
}

/**
 * Validates an optional weight value.
 * Absence (null/undefined) is considered valid. When present, must be non-negative.
 * @param weight - Weight in kg to validate (may be null or undefined)
 * @returns Validation result with an optional error message
 */
export function validateWeight(weight: number | null | undefined): ValidationResult {
  if (weight === null || weight === undefined) {
    // Optional field — absence is valid
    return { valid: true }
  }
  if (weight < 0) {
    return { valid: false, error: 'Weight must be a positive number' }
  }
  return { valid: true }
}

/**
 * Validates a difficulty level string.
 * Must be one of `'easy'`, `'moderate'`, or `'hard'`.
 * @param level - Difficulty level string to validate (may be null or undefined)
 * @returns Validation result with an optional error message
 */
export function validateDifficultyLevel(
  level: string | null | undefined
): ValidationResult {
  if (!level || !['easy', 'moderate', 'hard'].includes(level)) {
    return { valid: false, error: 'Difficulty level is required' }
  }
  return { valid: true }
}

/**
 * Validates a date string against the YYYY-MM-DD format and calendar correctness.
 * @param date - Date string to validate
 * @returns Validation result with an optional error message
 */
export function validateDate(date: string): ValidationResult {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, error: 'Invalid date format' }
  }
  const [year, month, day] = date.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  if (
    d.getFullYear() !== year ||
    d.getMonth() + 1 !== month ||
    d.getDate() !== day
  ) {
    return { valid: false, error: 'Invalid date format' }
  }
  return { valid: true }
}

/**
 * Validates all exercise form fields.
 * Returns a map of field name → error message for invalid fields only.
 */
export function validateExerciseForm(fields: {
  name: string
  targetSets: number | null | undefined
  targetReps: number | null | undefined
  targetMuscleGroups: string[]
}): Record<string, string> {
  const errors: Record<string, string> = {}

  const nameResult = validateExerciseName(fields.name)
  if (!nameResult.valid && nameResult.error) errors.name = nameResult.error

  const setsResult = validateSets(fields.targetSets)
  if (!setsResult.valid && setsResult.error) errors.targetSets = setsResult.error

  const repsResult = validateReps(fields.targetReps)
  if (!repsResult.valid && repsResult.error) errors.targetReps = repsResult.error

  const muscleResult = validateMuscleGroups(fields.targetMuscleGroups)
  if (!muscleResult.valid && muscleResult.error) errors.targetMuscleGroups = muscleResult.error

  return errors
}

/**
 * Validates all performance form fields.
 * Returns a map of field name → error message for invalid fields only.
 */
export function validatePerformanceForm(fields: {
  actualSets: number | null | undefined
  actualReps: number | null | undefined
  weight: number | null | undefined
  difficultyLevel: string | null | undefined
}): Record<string, string> {
  const errors: Record<string, string> = {}

  const setsResult = validateSets(fields.actualSets, 'Actual Sets')
  if (!setsResult.valid && setsResult.error) errors.actualSets = setsResult.error

  const repsResult = validateReps(fields.actualReps, 'Actual Reps')
  if (!repsResult.valid && repsResult.error) errors.actualReps = repsResult.error

  const weightResult = validateWeight(fields.weight)
  if (!weightResult.valid && weightResult.error) errors.weight = weightResult.error

  const diffResult = validateDifficultyLevel(fields.difficultyLevel)
  if (!diffResult.valid && diffResult.error) errors.difficultyLevel = diffResult.error

  return errors
}
