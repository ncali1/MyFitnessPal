/**
 * Unit tests for ProgressGraphs data generation logic
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

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

// ── Pure functions extracted from ProgressGraphs.vue ─────────────────────────

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekStart(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  const dow = d.getDay()
  const diff = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + diff)
  return toDateString(d)
}

function addDays(dateStr: string, n: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  d.setDate(d.getDate() + n)
  return toDateString(d)
}

function formatWeekLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year!, month! - 1, day!)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getWeeksInRange(start: string, end: string): string[] {
  const weeks: string[] = []
  let current = getWeekStart(start)
  while (current <= end) {
    weeks.push(current)
    current = addDays(current, 7)
  }
  return weeks
}

interface PerfWithDate {
  perf: {
    exerciseId: string
    completed: boolean
    actualReps?: number
    weight?: number
    difficultyLevel?: string
    timestamp: number
  }
  date: string
}

function generateRepsData(
  weeksInRange: string[],
  perfsWithDates: PerfWithDate[]
): Array<{ weekLabel: string; averageReps: number }> {
  return weeksInRange.map((weekStart) => {
    const weekEnd = addDays(weekStart, 6)
    const weekPerfs = perfsWithDates.filter(
      ({ perf, date }) => date >= weekStart && date <= weekEnd && perf.completed
    )
    const totalReps = weekPerfs.reduce((sum, { perf }) => sum + (perf.actualReps ?? 0), 0)
    const averageReps = weekPerfs.length > 0 ? totalReps / weekPerfs.length : 0
    return { weekLabel: formatWeekLabel(weekStart), averageReps }
  })
}

function generateWeightData(
  weeksInRange: string[],
  perfsWithDates: PerfWithDate[]
): Array<{ weekLabel: string; averageWeight: number | null }> {
  return weeksInRange.map((weekStart) => {
    const weekEnd = addDays(weekStart, 6)
    const weekPerfs = perfsWithDates.filter(
      ({ perf, date }) => date >= weekStart && date <= weekEnd && perf.completed
    )
    const withWeight = weekPerfs.filter(({ perf }) => perf.weight != null)
    const averageWeight =
      withWeight.length > 0
        ? withWeight.reduce((sum, { perf }) => sum + (perf.weight ?? 0), 0) / withWeight.length
        : null
    return { weekLabel: formatWeekLabel(weekStart), averageWeight }
  })
}

function generateCompletionData(
  weeksInRange: string[],
  routineForDay: (day: string) => string[],
  sessionByDate: (date: string) => { exercises: { completed: boolean }[] } | undefined
): Array<{ weekLabel: string; completionRate: number }> {
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return weeksInRange.map((weekStart) => {
    let totalAssigned = 0
    let totalCompleted = 0
    DAYS.forEach((day, i) => {
      const dateStr = addDays(weekStart, i)
      const assigned = routineForDay(day).length
      const session = sessionByDate(dateStr)
      const completed = session ? session.exercises.filter((e) => e.completed).length : 0
      totalAssigned += assigned
      totalCompleted += completed
    })
    const completionRate =
      totalAssigned === 0 ? 0 : Math.round((totalCompleted / totalAssigned) * 100)
    return { weekLabel: formatWeekLabel(weekStart), completionRate }
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProgressGraphs data generation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Week of 2025-01-06 (Monday)
  const WEEK1 = '2025-01-06'
  const WEEK2 = '2025-01-13'
  const WEEK4 = '2025-01-27'

  function makePerf(
    date: string,
    opts: { completed?: boolean; actualReps?: number; weight?: number } = {}
  ): PerfWithDate {
    return {
      perf: {
        exerciseId: 'ex1',
        completed: opts.completed ?? true,
        actualReps: opts.actualReps,
        weight: opts.weight,
        timestamp: Date.now(),
      },
      date,
    }
  }

  // ── Reps data aggregation ──────────────────────────────────────────────────

  describe('generateRepsData', () => {
    it('returns empty array when no weeks provided', () => {
      const result = generateRepsData([], [makePerf('2025-01-06', { actualReps: 10 })])
      expect(result).toEqual([])
    })

    it('returns 0 averageReps for a week with no performances', () => {
      const result = generateRepsData([WEEK1], [])
      expect(result).toHaveLength(1)
      expect(result[0]!.averageReps).toBe(0)
    })

    it('calculates average reps correctly for a week with one performance', () => {
      const perfs = [makePerf('2025-01-07', { actualReps: 12 })]
      const result = generateRepsData([WEEK1], perfs)
      expect(result[0]!.averageReps).toBe(12)
    })

    it('calculates average reps correctly for a week with multiple performances', () => {
      const perfs = [
        makePerf('2025-01-06', { actualReps: 10 }),
        makePerf('2025-01-08', { actualReps: 14 }),
        makePerf('2025-01-10', { actualReps: 12 }),
      ]
      const result = generateRepsData([WEEK1], perfs)
      expect(result[0]!.averageReps).toBe(12) // (10+14+12)/3
    })

    it('returns 0 for weeks with no data when other weeks have data', () => {
      const perfs = [makePerf('2025-01-06', { actualReps: 10 })]
      const result = generateRepsData([WEEK1, WEEK2], perfs)
      expect(result[0]!.averageReps).toBe(10)
      expect(result[1]!.averageReps).toBe(0)
    })

    it('only counts completed performances', () => {
      const perfs = [
        makePerf('2025-01-06', { completed: true, actualReps: 10 }),
        makePerf('2025-01-07', { completed: false, actualReps: 20 }),
      ]
      const result = generateRepsData([WEEK1], perfs)
      expect(result[0]!.averageReps).toBe(10)
    })

    it('treats missing actualReps as 0 for completed performances', () => {
      const perfs = [makePerf('2025-01-06', { completed: true })] // no actualReps
      const result = generateRepsData([WEEK1], perfs)
      expect(result[0]!.averageReps).toBe(0)
    })
  })

  // ── Weight data aggregation ────────────────────────────────────────────────

  describe('generateWeightData', () => {
    it('returns null averageWeight for a week with no performances', () => {
      const result = generateWeightData([WEEK1], [])
      expect(result[0]!.averageWeight).toBeNull()
    })

    it('returns null when performances have no weight field', () => {
      const perfs = [makePerf('2025-01-06', { completed: true })] // no weight
      const result = generateWeightData([WEEK1], perfs)
      expect(result[0]!.averageWeight).toBeNull()
    })

    it('calculates average weight correctly', () => {
      const perfs = [
        makePerf('2025-01-06', { weight: 50 }),
        makePerf('2025-01-08', { weight: 60 }),
      ]
      const result = generateWeightData([WEEK1], perfs)
      expect(result[0]!.averageWeight).toBe(55)
    })

    it('handles mix of weeks with and without weight data', () => {
      const perfs = [makePerf('2025-01-06', { weight: 80 })]
      const result = generateWeightData([WEEK1, WEEK2], perfs)
      expect(result[0]!.averageWeight).toBe(80)
      expect(result[1]!.averageWeight).toBeNull()
    })

    it('ignores incomplete performances when calculating weight', () => {
      const perfs = [
        makePerf('2025-01-06', { completed: true, weight: 50 }),
        makePerf('2025-01-07', { completed: false, weight: 100 }),
      ]
      const result = generateWeightData([WEEK1], perfs)
      expect(result[0]!.averageWeight).toBe(50)
    })
  })

  // ── Completion rate calculation ────────────────────────────────────────────

  describe('generateCompletionData', () => {
    it('returns 0 completionRate when nothing is assigned', () => {
      const result = generateCompletionData(
        [WEEK1],
        () => [],
        () => undefined
      )
      expect(result[0]!.completionRate).toBe(0)
    })

    it('returns 100 when all assigned exercises are completed', () => {
      const result = generateCompletionData(
        [WEEK1],
        (day) => (day === 'monday' ? ['ex1'] : []),
        (date) =>
          date === '2025-01-06' ? { exercises: [{ completed: true }] } : undefined
      )
      expect(result[0]!.completionRate).toBe(100)
    })

    it('calculates partial completion correctly', () => {
      // 2 assigned on monday, 1 completed
      const result = generateCompletionData(
        [WEEK1],
        (day) => (day === 'monday' ? ['ex1', 'ex2'] : []),
        (date) =>
          date === '2025-01-06'
            ? { exercises: [{ completed: true }, { completed: false }] }
            : undefined
      )
      expect(result[0]!.completionRate).toBe(50)
    })

    it('rounds completion rate to nearest integer', () => {
      // 3 assigned, 1 completed => 33.33... => 33
      const result = generateCompletionData(
        [WEEK1],
        (day) => (day === 'monday' ? ['ex1', 'ex2', 'ex3'] : []),
        (date) =>
          date === '2025-01-06'
            ? { exercises: [{ completed: true }, { completed: false }, { completed: false }] }
            : undefined
      )
      expect(result[0]!.completionRate).toBe(33)
    })
  })

  // ── Time range filtering ───────────────────────────────────────────────────

  describe('getWeeksInRange', () => {
    it('generates correct weeks for a 4-week range', () => {
      const weeks = getWeeksInRange('2025-01-06', '2025-02-02')
      expect(weeks).toHaveLength(4)
      expect(weeks[0]).toBe('2025-01-06')
      expect(weeks[1]).toBe('2025-01-13')
      expect(weeks[2]).toBe('2025-01-20')
      expect(weeks[3]).toBe('2025-01-27')
    })

    it('handles single-week range', () => {
      const weeks = getWeeksInRange('2025-01-06', '2025-01-10')
      expect(weeks).toHaveLength(1)
      expect(weeks[0]).toBe('2025-01-06')
    })

    it('excludes data outside the time range via generateRepsData', () => {
      const weeks = getWeeksInRange('2025-01-13', '2025-01-19')
      // Only WEEK2 should be in range
      const perfs = [
        makePerf('2025-01-06', { actualReps: 99 }), // WEEK1 - outside range
        makePerf('2025-01-14', { actualReps: 10 }), // WEEK2 - inside range
      ]
      const result = generateRepsData(weeks, perfs)
      expect(result).toHaveLength(1)
      expect(result[0]!.averageReps).toBe(10)
    })

    it('aligns start date to Monday of the containing week', () => {
      // 2025-01-08 is a Wednesday; its Monday is 2025-01-06
      const weeks = getWeeksInRange('2025-01-08', '2025-01-14')
      expect(weeks[0]).toBe('2025-01-06')
    })

    it('generates correct week labels via formatWeekLabel', () => {
      const weeks = getWeeksInRange(WEEK1, WEEK4)
      const result = generateRepsData(weeks, [])
      expect(result[0]!.weekLabel).toBe('Jan 6')
      expect(result[1]!.weekLabel).toBe('Jan 13')
      expect(result[2]!.weekLabel).toBe('Jan 20')
      expect(result[3]!.weekLabel).toBe('Jan 27')
    })
  })
})
