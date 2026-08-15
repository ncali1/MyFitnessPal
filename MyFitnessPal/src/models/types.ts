/**
 * Core TypeScript interfaces for the Fitness Tracker application
 */

/**
 * Represents a single exercise with target metrics
 */
export interface Exercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: number;
  targetMuscleGroups: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents performance data for a single exercise in a workout session
 */
export interface SessionExercisePerformance {
  exerciseId: string;
  completed: boolean;
  actualSets?: number;
  actualReps?: number;
  weight?: number;
  difficultyLevel?: 'easy' | 'moderate' | 'hard';
  timestamp: Date;
}

/**
 * Represents a daily workout session with performance data for multiple exercises
 */
export interface WorkoutSession {
  id: string;
  date: Date;
  exercises: SessionExercisePerformance[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents the weekly routine with exercises assigned to each day
 */
export interface Routine {
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
}

/**
 * Computed interface for weekly summary statistics
 */
export interface WeeklySummary {
  weekStartDate: Date;
  weekEndDate: Date;
  totalAssignedWorkouts: number;
  totalCompletedWorkouts: number;
  completionPercentage: number;
  dailyBreakdown: {
    [day: string]: {
      assigned: number;
      completed: number;
    };
  };
}

/**
 * Computed interface for progress data aggregation
 */
export interface ProgressData {
  exerciseId: string;
  exerciseName: string;
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
  weeklyData: Array<{
    weekStartDate: Date;
    averageReps: number;
    averageWeight: number;
    completionCount: number;
    totalAssigned: number;
  }>;
}

/**
 * Days of the week for routine assignments
 */
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/**
 * Difficulty levels for performance logging
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'hard';
