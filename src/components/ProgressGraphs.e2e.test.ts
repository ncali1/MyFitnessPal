/**
 * End-to-End Test: Task 15.5 - View Progress Graphs
 *
 * Validates the complete progress graphs workflow:
 * - Exercises exist in the system
 * - Workouts logged across multiple weeks with sets, reps, weight, difficulty
 * - Navigate to Progress Graphs section (select exercise)
 * - Select an exercise to view progress for (Req 6.2)
 * - Verify reps over time data is correct (Req 6.3)
 * - Verify weight over time data is correct (Req 6.4)
 * - Verify weekly completion rates (Req 6.5)
 * - Test time range filtering (4 weeks, 12 weeks) (Req 6.6)
 * - Verify graph display (Req 6.1)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExercisesStore } from '../stores/exercises'
import { useRoutineStore } from '../stores/routine'
import { useWorkoutSessionsStore } from '../stores/workoutSessions'
import { useUIStore } from '../stores/ui'
import { getWeeksInRange, addDays } from '../utils/calculations'
import type { Exercise } from '../stores/types'

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

// -----------------------------------------------------------------------------
// Test data: 12 weeks of workout data centred around a known reference Monday.
//
// Reference: Week 1 starts 2025-01-06 (Monday).
//   Week  1: 2025-01-06 to 2025-01-12
//   Week  2: 2025-01-13 to 2025-01-19
//   Week  3: 2025-01-20 to 2025-01-26
//   Week  4: 2025-01-27 to 2025-02-02
//   Week  5: 2025-02-03 to 2025-02-09
//   Week  6: 2025-02-10 to 2025-02-16
//   Week  7: 2025-02-17 to 2025-02-23
//   Week  8: 2025-02-24 to 2025-03-02
//   Week  9: 2025-03-03 to 2025-03-09
//   Week 10: 2025-03-10 to 2025-03-16
//   Week 11: 2025-03-17 to 2025-03-23
//   Week 12: 2025-03-24 to 2025-03-30
// -----------------------------------------------------------------------------

/** Monday date string for each of the 12 test weeks */
const WEEKS = [
  '2025-01-06', // Week 1
  '2025-01-13', // Week 2
  '2025-01-20', // Week 3
  '2025-01-27', // Week 4
  '2025-02-03', // Week 5
  '2025-02-10', // Week 6
  '2025-02-17', // Week 7
  '2025-02-24', // Week 8
  '2025-03-03', // Week 9
  '2025-03-10', // Week 10
  '2025-03-17', // Week 11
  '2025-03-24', // Week 12
]

// Full 12-week date range
const RANGE_12W_START = '2025-01-06'
const RANGE_12W_END   = '2025-03-30'

// Last 4 weeks of the 12-week window (weeks 9-12)
const RANGE_4W_START = '2025-03-03'
const RANGE_4W_END   = '2025-03-30'

// Per-week Monday workout performance data for "Bench Press"
// reps, weight (lbs), difficulty
const BENCH_PRESS_DATA = [
  { reps: 8,  weight: 135, difficulty: 'easy'     as const },
  { reps: 9,  weight: 140, difficulty: 'easy'     as const },
  { reps: 10, weight: 140, difficulty: 'moderate' as const },
  { reps: 9,  weight: 145, difficulty: 'moderate' as const },
  { reps: 11, weight: 145, difficulty: 'moderate' as const },
  { reps: 10, weight: 150, difficulty: 'hard'     as const },
  { reps: 12, weight: 150, difficulty: 'hard'     as const },
  { reps: 11, weight: 155, difficulty: 'hard'     as const },
  { reps: 13, weight: 155, difficulty: 'moderate' as const },
  { reps: 12, weight: 160, difficulty: 'moderate' as const },
  { reps: 14, weight: 160, difficulty: 'hard'     as const },
  { reps: 15, weight: 165, difficulty: 'hard'     as const },
]

// Per-week Wednesday workout performance data for "Squat" (bodyweight - no weight)
const SQUAT_DATA = [
  { reps: 10, difficulty: 'easy'     as const },
  { reps: 12, difficulty: 'easy'     as const },
  { reps: 12, difficulty: 'moderate' as const },
  { reps: 14, difficulty: 'moderate' as const },
  { reps: 14, difficulty: 'moderate' as const },
  { reps: 16, difficulty: 'hard'     as const },
  { reps: 16, difficulty: 'hard'     as const },
  { reps: 18, difficulty: 'hard'     as const },
  { reps: 18, difficulty: 'moderate' as const },
  { reps: 20, difficulty: 'moderate' as const },
  { reps: 20, difficulty: 'hard'     as const },
  { reps: 22, difficulty: 'hard'     as const },
]

const DAYS_OF_WEEK = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
] as const

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Returns the date of the given day-of-week offset within the week starting on weekMonday. */
function dateForDay(weekMonday: string, dayOfWeek: typeof DAYS_OF_WEEK[number]): string {
  const idx = DAYS_OF_WEEK.indexOf(dayOfWeek)
  return addDays(weekMonday, idx)
}

// -----------------------------------------------------------------------------
// Test suite
// -----------------------------------------------------------------------------

describe('E2E: View Progress Graphs (Task 15.5)', () => {
  let exercisesStore: ReturnType<typeof useExercisesStore>
  let routineStore: ReturnType<typeof useRoutineStore>
  let sessionsStore: ReturnType<typeof useWorkoutSessionsStore>
  let uiStore: ReturnType<typeof useUIStore>

  let benchPress: Exercise
  let squat: Exercise
  let overheadPress: Exercise  // third exercise with no sessions logged

  beforeEach(async () => {
    setActivePinia(createPinia())

    exercisesStore = useExercisesStore()
    routineStore   = useRoutineStore()
    sessionsStore  = useWorkoutSessionsStore()
    uiStore        = useUIStore()

    // -- Requirement 6.2: Create exercises with various muscle groups --
    benchPress    = await exercisesStore.createExercise('Bench Press',    3, 10, ['Chest', 'Triceps'])
    squat         = await exercisesStore.createExercise('Squat',          4,  8, ['Legs',  'Glutes'])
    overheadPress = await exercisesStore.createExercise('Overhead Press', 3,  8, ['Shoulders'])

    // Assign Bench Press to Monday and Squat to Wednesday across every week
    await routineStore.assignExercise('monday',    benchPress.id)
    await routineStore.assignExercise('wednesday', squat.id)

    // -- Log 12 weeks of data --------------------------------------------
    for (let w = 0; w < WEEKS.length; w++) {
      const weekMonday = WEEKS[w]!

      // Bench Press � logged on Monday of each week
      const bpDate   = dateForDay(weekMonday, 'monday')
      const bpData   = BENCH_PRESS_DATA[w]!
      const bpSession = await sessionsStore.createSession(bpDate)
      await sessionsStore.logPerformance(bpSession.id, benchPress.id, {
        completed:       true,
        actualSets:      3,
        actualReps:      bpData.reps,
        weight:          bpData.weight,
        difficultyLevel: bpData.difficulty,
      })

      // Squat � logged on Wednesday of each week (bodyweight, no weight field)
      const sqDate   = dateForDay(weekMonday, 'wednesday')
      const sqData   = SQUAT_DATA[w]!
      const sqSession = await sessionsStore.createSession(sqDate)
      await sessionsStore.logPerformance(sqSession.id, squat.id, {
        completed:       true,
        actualSets:      4,
        actualReps:      sqData.reps,
        difficultyLevel: sqData.difficulty,
      })
    }
  })

  // -------------------------------------------------------------------------
  // Requirement 6.1: Progress graph showing exercise performance trends
  //                  over multiple weeks
  // -------------------------------------------------------------------------
  describe('Requirement 6.1 � Progress graph shows performance trends over multiple weeks', () => {
    it('should return weekly data for all 12 weeks in the full range', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // One data point per week
      expect(progress.weeklyData).toHaveLength(12)
    })

    it('should show increasing reps trend for Bench Press over 12 weeks', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      const reps = progress.weeklyData.map((w) => w.averageReps)

      // First week should be lower than last week (8 vs 15)
      expect(reps[0]).toBe(8)
      expect(reps[11]).toBe(15)
    })

    it('should show increasing reps trend for Squat over 12 weeks', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        squat.id, squat.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      const reps = progress.weeklyData.map((w) => w.averageReps)

      expect(reps[0]).toBe(10)
      expect(reps[11]).toBe(22)
    })

    it('should include the correct exerciseId and exerciseName', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      expect(progress.exerciseId).toBe(benchPress.id)
      expect(progress.exerciseName).toBe('Bench Press')
    })

    it('should include the correct time range in the result', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      expect(progress.timeRange.startDate).toEqual(new Date(2025, 0, 6))
      expect(progress.timeRange.endDate).toEqual(new Date(2025, 2, 30))
    })
  })

  // -------------------------------------------------------------------------
  // Requirement 6.2: Allow users to select which exercise to view progress for
  // -------------------------------------------------------------------------
  describe('Requirement 6.2 � Select different exercises updates displayed graph data', () => {
    it('should return data scoped to the selected exercise (Bench Press vs Squat)', () => {
      const routine = routineStore.routine!

      const bpProgress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )
      const sqProgress = sessionsStore.getCachedProgressData(
        squat.id, squat.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Bench Press and Squat have different reps data
      expect(bpProgress.exerciseId).toBe(benchPress.id)
      expect(sqProgress.exerciseId).toBe(squat.id)

      // Week 1 reps differ between exercises
      expect(bpProgress.weeklyData[0]!.averageReps).toBe(8)   // Bench Press week 1
      expect(sqProgress.weeklyData[0]!.averageReps).toBe(10)  // Squat week 1
    })

    it('should show all three exercises in the exercises store', () => {
      expect(exercisesStore.allExercises).toHaveLength(3)

      const names = exercisesStore.allExercises.map((e) => e.name)
      expect(names).toContain('Bench Press')
      expect(names).toContain('Squat')
      expect(names).toContain('Overhead Press')
    })

    it('should return empty reps data for an exercise with no logged sessions', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        overheadPress.id, overheadPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // All weeks should have averageReps = 0 since nothing was logged
      const allZero = progress.weeklyData.every((w) => w.averageReps === 0)
      expect(allZero).toBe(true)
    })

    it('should allow switching the selected exercise via the UI store', () => {
      uiStore.setSelectedExercise(benchPress.id)
      expect(uiStore.selectedExercise).toBe(benchPress.id)

      uiStore.setSelectedExercise(squat.id)
      expect(uiStore.selectedExercise).toBe(squat.id)

      uiStore.setSelectedExercise(overheadPress.id)
      expect(uiStore.selectedExercise).toBe(overheadPress.id)
    })
  })

  // -------------------------------------------------------------------------
  // Requirement 6.3: Display actual reps completed over time on the graph
  // -------------------------------------------------------------------------
  describe('Requirement 6.3 � Actual reps completed over time', () => {
    it('should record the exact reps logged each week for Bench Press', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Each week has exactly one session, so averageReps == logged reps
      progress.weeklyData.forEach((weekData, i) => {
        expect(weekData.averageReps).toBe(BENCH_PRESS_DATA[i]!.reps)
      })
    })

    it('should record the exact reps logged each week for Squat', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        squat.id, squat.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      progress.weeklyData.forEach((weekData, i) => {
        expect(weekData.averageReps).toBe(SQUAT_DATA[i]!.reps)
      })
    })

    it('should average reps correctly when multiple sessions exist in one week', async () => {
      // Add a second Bench Press session in week 1 (Tuesday)
      await routineStore.assignExercise('tuesday', benchPress.id)
      const tuesdayDate = dateForDay(WEEKS[0]!, 'tuesday')
      const extraSession = await sessionsStore.createSession(tuesdayDate)
      await sessionsStore.logPerformance(extraSession.id, benchPress.id, {
        completed:       true,
        actualSets:      3,
        actualReps:      12,  // 12 reps on Tuesday
        weight:          135,
        difficultyLevel: 'moderate',
      })

      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Week 1 averageReps: (8 + 12) / 2 = 10
      expect(progress.weeklyData[0]!.averageReps).toBe(10)

      // Other weeks should remain unchanged (single session per week)
      expect(progress.weeklyData[1]!.averageReps).toBe(BENCH_PRESS_DATA[1]!.reps)
    })

    it('should return averageReps = 0 for weeks with no completed sessions', async () => {
      // Overhead Press has no sessions logged at all
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        overheadPress.id, overheadPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      progress.weeklyData.forEach((weekData) => {
        expect(weekData.averageReps).toBe(0)
      })
    })

    it('should not count incomplete performances toward reps', async () => {
      // Add an incomplete session for Bench Press in week 1 (different day)
      await routineStore.assignExercise('friday', benchPress.id)
      const fridayDate = dateForDay(WEEKS[0]!, 'friday')
      const incompleteSession = await sessionsStore.createSession(fridayDate)
      await sessionsStore.logPerformance(incompleteSession.id, benchPress.id, {
        completed: false,
        actualReps: 999,  // Should NOT appear in reps data
      })

      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Week 1 should still only count the completed session (8 reps)
      expect(progress.weeklyData[0]!.averageReps).toBe(8)
    })
  })

  // -------------------------------------------------------------------------
  // Requirement 6.4: Display actual weight used over time (if applicable)
  // -------------------------------------------------------------------------
  describe('Requirement 6.4 � Actual weight used over time', () => {
    it('should record the exact weight logged each week for Bench Press', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Each week has one session, so averageWeight == logged weight
      progress.weeklyData.forEach((weekData, i) => {
        expect(weekData.averageWeight).toBe(BENCH_PRESS_DATA[i]!.weight)
      })
    })

    it('should return averageWeight = 0 for bodyweight exercises (no weight logged)', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        squat.id, squat.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Squat has no weight field logged � averageWeight should be 0
      progress.weeklyData.forEach((weekData) => {
        expect(weekData.averageWeight).toBe(0)
      })
    })

    it('should show increasing weight trend for Bench Press across 12 weeks', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Week 1: 135 lbs, Week 12: 165 lbs
      expect(progress.weeklyData[0]!.averageWeight).toBe(135)
      expect(progress.weeklyData[11]!.averageWeight).toBe(165)

      // Overall trend: last week's weight >= first week's weight
      expect(progress.weeklyData[11]!.averageWeight)
        .toBeGreaterThanOrEqual(progress.weeklyData[0]!.averageWeight)
    })

    it('should average weight correctly when multiple sessions exist in one week', async () => {
      // Add a second Bench Press session in week 1 (Tuesday) with weight 145
      await routineStore.assignExercise('tuesday', benchPress.id)
      const tuesdayDate  = dateForDay(WEEKS[0]!, 'tuesday')
      const extraSession = await sessionsStore.createSession(tuesdayDate)
      await sessionsStore.logPerformance(extraSession.id, benchPress.id, {
        completed:       true,
        actualSets:      3,
        actualReps:      8,
        weight:          145,
        difficultyLevel: 'moderate',
      })

      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Week 1 averageWeight: (135 + 145) / 2 = 140
      expect(progress.weeklyData[0]!.averageWeight).toBe(140)
    })

    it('should not count weight from incomplete performances', async () => {
      await routineStore.assignExercise('friday', benchPress.id)
      const fridayDate       = dateForDay(WEEKS[0]!, 'friday')
      const incompleteSession = await sessionsStore.createSession(fridayDate)
      await sessionsStore.logPerformance(incompleteSession.id, benchPress.id, {
        completed: false,
        weight:    9999,  // Should NOT appear in weight data
      })

      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Week 1 should still show only the completed weight (135)
      expect(progress.weeklyData[0]!.averageWeight).toBe(135)
    })
  })

  // -------------------------------------------------------------------------
  // Requirement 6.5: Display weekly completion rates as a trend line or bar chart
  // -------------------------------------------------------------------------
  describe('Requirement 6.5 � Weekly completion rates', () => {
    it('should show completionCount = 1 for each week where Bench Press was logged', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Each week has exactly 1 completed Bench Press session
      progress.weeklyData.forEach((weekData, _i) => {
        expect(weekData.completionCount).toBe(1)
      })
    })

    it('should show completionCount = 0 for exercises with no logged sessions', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        overheadPress.id, overheadPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      progress.weeklyData.forEach((weekData) => {
        expect(weekData.completionCount).toBe(0)
      })
    })

    it('should show totalAssigned = 1 per week for exercises assigned to one day', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Bench Press is only assigned to Monday, so 1 per week
      progress.weeklyData.forEach((weekData) => {
        expect(weekData.totalAssigned).toBe(1)
      })
    })

    it('should show totalAssigned = 0 for exercises not assigned to any day', () => {
      const routine  = routineStore.routine!
      // Overhead Press was never assigned to any day in the routine
      const progress = sessionsStore.getCachedProgressData(
        overheadPress.id, overheadPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      progress.weeklyData.forEach((weekData) => {
        expect(weekData.totalAssigned).toBe(0)
      })
    })

    it('should accumulate completionCount correctly when multiple sessions in a week', async () => {
      // Add a second Bench Press session in week 1 (Tuesday)
      await routineStore.assignExercise('tuesday', benchPress.id)
      const tuesdayDate  = dateForDay(WEEKS[0]!, 'tuesday')
      const extraSession = await sessionsStore.createSession(tuesdayDate)
      await sessionsStore.logPerformance(extraSession.id, benchPress.id, {
        completed:       true,
        actualSets:      3,
        actualReps:      8,
        weight:          135,
        difficultyLevel: 'easy',
      })

      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Week 1: 2 completed sessions (Monday + Tuesday)
      expect(progress.weeklyData[0]!.completionCount).toBe(2)
      // totalAssigned = 2 (Monday + Tuesday both in routine)
      expect(progress.weeklyData[0]!.totalAssigned).toBe(2)

      // Other weeks still have 1 completed and 2 assigned (Tuesday added but not logged other weeks)
      expect(progress.weeklyData[1]!.completionCount).toBe(1)
      expect(progress.weeklyData[1]!.totalAssigned).toBe(2)
    })

    it('should not count incomplete sessions toward completionCount', async () => {
      await routineStore.assignExercise('friday', benchPress.id)
      const fridayDate        = dateForDay(WEEKS[0]!, 'friday')
      const incompleteSession = await sessionsStore.createSession(fridayDate)
      await sessionsStore.logPerformance(incompleteSession.id, benchPress.id, {
        completed:  false,
        actualReps: 5,
      })

      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Incomplete session should NOT count
      expect(progress.weeklyData[0]!.completionCount).toBe(1)
    })
  })

  // -------------------------------------------------------------------------
  // Requirement 6.6: Allow users to adjust the time range for the graph
  //                  (e.g., last 4 weeks, last 12 weeks)
  // -------------------------------------------------------------------------
  describe('Requirement 6.6 � Time range filtering (4 weeks vs 12 weeks)', () => {
    it('should return 12 data points for a 12-week range', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      expect(progress.weeklyData).toHaveLength(12)
    })

    it('should return 4 data points for a 4-week range', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_4W_START, RANGE_4W_END, routine
      )

      expect(progress.weeklyData).toHaveLength(4)
    })

    it('should only include performance data from within the 4-week range', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_4W_START, RANGE_4W_END, routine
      )

      // Weeks 9-12 of BENCH_PRESS_DATA: reps 13, 12, 14, 15
      expect(progress.weeklyData[0]!.averageReps).toBe(13)
      expect(progress.weeklyData[1]!.averageReps).toBe(12)
      expect(progress.weeklyData[2]!.averageReps).toBe(14)
      expect(progress.weeklyData[3]!.averageReps).toBe(15)
    })

    it('should exclude data from weeks before the 4-week range start', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_4W_START, RANGE_4W_END, routine
      )

      // Weeks 1-8 data (reps 8-11) should NOT appear
      const repsInRange = progress.weeklyData.map((w) => w.averageReps)
      // None of the early weeks' data (reps 8, 9, 10, 9, 11, 10, 12, 11) should be present
      const earlyWeekReps = [8, 9, 10, 9, 11, 10, 12, 11]
      repsInRange.forEach((reps) => {
        // The last 4 weeks have reps 13, 12, 14, 15 � none match the early weeks exactly
        // (12 could overlap, so we check the set of early weeks that are NOT in last 4)
        expect(earlyWeekReps.slice(0, 6)).not.toContain(reps) // 8,9,10,9,11,10 not in last 4
      })
    })

    it('should allow UI store to update the time range and reflect change', () => {
      // Set 12-week range
      uiStore.setTimeRange(RANGE_12W_START, RANGE_12W_END)
      const range12 = getWeeksInRange(uiStore.timeRange.start, uiStore.timeRange.end)
      expect(range12).toHaveLength(12)

      // Switch to 4-week range
      uiStore.setTimeRange(RANGE_4W_START, RANGE_4W_END)
      const range4 = getWeeksInRange(uiStore.timeRange.start, uiStore.timeRange.end)
      expect(range4).toHaveLength(4)
    })

    it('should produce independent results for different time ranges of the same exercise', () => {
      const routine = routineStore.routine!

      const progress12w = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )
      const progress4w = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_4W_START, RANGE_4W_END, routine
      )

      // 12-week starts at week 1 (8 reps); 4-week starts at week 9 (13 reps)
      expect(progress12w.weeklyData[0]!.averageReps).toBe(8)
      expect(progress4w.weeklyData[0]!.averageReps).toBe(13)

      // Last week of each range has the correct reps
      expect(progress12w.weeklyData[11]!.averageReps).toBe(15)
      expect(progress4w.weeklyData[3]!.averageReps).toBe(15)
    })

    it('should return 1 data point for a single-week range', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, WEEKS[0]!, WEEKS[0]!, routine
      )

      expect(progress.weeklyData).toHaveLength(1)
      expect(progress.weeklyData[0]!.averageReps).toBe(8)
      expect(progress.weeklyData[0]!.averageWeight).toBe(135)
    })
  })

  // -------------------------------------------------------------------------
  // Full workflow integration: all requirements exercised together
  // -------------------------------------------------------------------------
  describe('Full workflow integration � complete progress graph workflow', () => {
    it('should produce correct progress data for the complete 12-week Bench Press workflow', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Req 6.1: trends over multiple weeks
      expect(progress.weeklyData).toHaveLength(12)

      // Req 6.2: exercise selection
      expect(progress.exerciseId).toBe(benchPress.id)
      expect(progress.exerciseName).toBe('Bench Press')

      // Req 6.3: reps data matches logged data
      BENCH_PRESS_DATA.forEach((data, i) => {
        expect(progress.weeklyData[i]!.averageReps).toBe(data.reps)
      })

      // Req 6.4: weight data matches logged data
      BENCH_PRESS_DATA.forEach((data, i) => {
        expect(progress.weeklyData[i]!.averageWeight).toBe(data.weight)
      })

      // Req 6.5: completion rates � 1 completion per week, 1 assigned per week
      progress.weeklyData.forEach((weekData) => {
        expect(weekData.completionCount).toBe(1)
        expect(weekData.totalAssigned).toBe(1)
      })
    })

    it('should produce correct progress data for the complete 12-week Squat workflow (no weight)', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        squat.id, squat.name, RANGE_12W_START, RANGE_12W_END, routine
      )

      // Req 6.1: 12 weeks of data
      expect(progress.weeklyData).toHaveLength(12)

      // Req 6.2: exercise selection
      expect(progress.exerciseId).toBe(squat.id)

      // Req 6.3: reps data for bodyweight exercise
      SQUAT_DATA.forEach((data, i) => {
        expect(progress.weeklyData[i]!.averageReps).toBe(data.reps)
      })

      // Req 6.4: no weight data � averageWeight = 0
      progress.weeklyData.forEach((weekData) => {
        expect(weekData.averageWeight).toBe(0)
      })

      // Req 6.5: 1 completion per week
      progress.weeklyData.forEach((weekData) => {
        expect(weekData.completionCount).toBe(1)
      })
    })

    it('should correctly filter Bench Press data for the last 4 weeks (Req 6.6)', () => {
      const routine  = routineStore.routine!
      const progress = sessionsStore.getCachedProgressData(
        benchPress.id, benchPress.name, RANGE_4W_START, RANGE_4W_END, routine
      )

      // 4 weeks of data (weeks 9-12)
      expect(progress.weeklyData).toHaveLength(4)

      const expectedReps    = [13, 12, 14, 15]
      const expectedWeights = [155, 160, 160, 165]

      progress.weeklyData.forEach((weekData, i) => {
        expect(weekData.averageReps).toBe(expectedReps[i])
        expect(weekData.averageWeight).toBe(expectedWeights[i])
        expect(weekData.completionCount).toBe(1)
        expect(weekData.totalAssigned).toBe(1)
      })
    })

    it('should handle the full workflow: select exercise, change time range, verify data updates', () => {
      const routine = routineStore.routine!

      // Step 1: Select Bench Press and view 12 weeks
      uiStore.setSelectedExercise(benchPress.id)
      uiStore.setTimeRange(RANGE_12W_START, RANGE_12W_END)

      const bp12w = sessionsStore.getCachedProgressData(
        uiStore.selectedExercise!, benchPress.name,
        uiStore.timeRange.start, uiStore.timeRange.end, routine
      )
      expect(bp12w.weeklyData).toHaveLength(12)
      expect(bp12w.weeklyData[0]!.averageReps).toBe(8)

      // Step 2: Narrow to 4-week range
      uiStore.setTimeRange(RANGE_4W_START, RANGE_4W_END)

      const bp4w = sessionsStore.getCachedProgressData(
        uiStore.selectedExercise!, benchPress.name,
        uiStore.timeRange.start, uiStore.timeRange.end, routine
      )
      expect(bp4w.weeklyData).toHaveLength(4)
      expect(bp4w.weeklyData[0]!.averageReps).toBe(13)

      // Step 3: Switch to Squat
      uiStore.setSelectedExercise(squat.id)

      const sq4w = sessionsStore.getCachedProgressData(
        uiStore.selectedExercise!, squat.name,
        uiStore.timeRange.start, uiStore.timeRange.end, routine
      )
      expect(sq4w.exerciseId).toBe(squat.id)
      expect(sq4w.weeklyData).toHaveLength(4)
      // Squat weeks 9-12: reps 18, 20, 20, 22
      expect(sq4w.weeklyData[0]!.averageReps).toBe(18)
      expect(sq4w.weeklyData[3]!.averageReps).toBe(22)
    })
  })
})
