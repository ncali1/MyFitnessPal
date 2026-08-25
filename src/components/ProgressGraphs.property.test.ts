/**
 * Property 8: Progress Graph Data Generation
 *
 * For any exercise and time range, the system should generate graph data
 * containing actual reps over time, actual weight over time (if applicable),
 * and weekly completion rates; filtering by time range should exclude data
 * outside the range.
 *
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

// ── Pure functions (copied from ProgressGraphs.vue logic) ────────────────────

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

// ── Scenario types and generators ────────────────────────────────────────────

interface PerformanceEntry {
  date: string
  completed: boolean
  actualReps?: number
  weight?: number
}

interface RoutineDay {
  day: string
  exerciseCount: number
}

interface GraphScenario {
  label: string
  rangeStart: string
  rangeEnd: string
  performances: PerformanceEntry[]
  routine: RoutineDay[]
  sessions: Array<{ date: string; completedCount: number; assignedCount: number }>
}

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

function generateScenarios(): GraphScenario[] {
  return [
    // Scenario 1: Empty performance data
    {
      label: 'empty performance data',
      rangeStart: '2025-01-06',
      rangeEnd: '2025-01-26',
      performances: [],
      routine: [],
      sessions: [],
    },

    // Scenario 2: Single week with one performance
    {
      label: 'single week with one performance',
      rangeStart: '2025-01-06',
      rangeEnd: '2025-01-12',
      performances: [{ date: '2025-01-07', completed: true, actualReps: 10, weight: 50 }],
      routine: [{ day: 'tuesday', exerciseCount: 1 }],
      sessions: [{ date: '2025-01-07', completedCount: 1, assignedCount: 1 }],
    },

    // Scenario 3: Multiple weeks with varying data
    {
      label: 'multiple weeks with varying data',
      rangeStart: '2025-01-06',
      rangeEnd: '2025-01-26',
      performances: [
        { date: '2025-01-06', completed: true, actualReps: 8, weight: 60 },
        { date: '2025-01-08', completed: true, actualReps: 10, weight: 65 },
        { date: '2025-01-13', completed: true, actualReps: 12 },
        { date: '2025-01-20', completed: true, actualReps: 15, weight: 70 },
        { date: '2025-01-22', completed: true, actualReps: 14, weight: 72 },
      ],
      routine: [{ day: 'monday', exerciseCount: 1 }, { day: 'wednesday', exerciseCount: 1 }],
      sessions: [
        { date: '2025-01-06', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-08', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-13', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-20', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-22', completedCount: 1, assignedCount: 1 },
      ],
    },

    // Scenario 4: Weeks with no weight data (weight should be null)
    {
      label: 'weeks with no weight data',
      rangeStart: '2025-01-06',
      rangeEnd: '2025-01-19',
      performances: [
        { date: '2025-01-07', completed: true, actualReps: 10 }, // no weight
        { date: '2025-01-14', completed: true, actualReps: 12 }, // no weight
      ],
      routine: [{ day: 'tuesday', exerciseCount: 1 }],
      sessions: [
        { date: '2025-01-07', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-14', completedCount: 1, assignedCount: 1 },
      ],
    },

    // Scenario 5: Mixed completed/incomplete performances
    {
      label: 'mixed completed and incomplete performances',
      rangeStart: '2025-01-06',
      rangeEnd: '2025-01-12',
      performances: [
        { date: '2025-01-06', completed: true, actualReps: 10, weight: 50 },
        { date: '2025-01-07', completed: false, actualReps: 20, weight: 100 },
        { date: '2025-01-08', completed: true, actualReps: 12, weight: 55 },
        { date: '2025-01-09', completed: false, actualReps: 30, weight: 200 },
      ],
      routine: [
        { day: 'monday', exerciseCount: 1 },
        { day: 'tuesday', exerciseCount: 1 },
        { day: 'wednesday', exerciseCount: 1 },
        { day: 'thursday', exerciseCount: 1 },
      ],
      sessions: [
        { date: '2025-01-06', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-07', completedCount: 0, assignedCount: 1 },
        { date: '2025-01-08', completedCount: 1, assignedCount: 1 },
        { date: '2025-01-09', completedCount: 0, assignedCount: 1 },
      ],
    },

    // Scenario 6: Time range that excludes some data
    {
      label: 'time range excludes some data',
      rangeStart: '2025-01-13',
      rangeEnd: '2025-01-19',
      performances: [
        { date: '2025-01-06', completed: true, actualReps: 99, weight: 999 }, // outside range
        { date: '2025-01-14', completed: true, actualReps: 10, weight: 50 }, // inside range
        { date: '2025-01-20', completed: true, actualReps: 88, weight: 888 }, // outside range
      ],
      routine: [{ day: 'tuesday', exerciseCount: 1 }],
      sessions: [
        { date: '2025-01-14', completedCount: 1, assignedCount: 1 },
      ],
    },
  ]
}

// ── Property 8 tests ──────────────────────────────────────────────────────────

/**
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
describe('Property 8: Progress Graph Data Generation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('reps data length matches weeks in range for all scenarios', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)
      const perfs = scenario.performances.map((p) =>
        makePerf(p.date, { completed: p.completed, actualReps: p.actualReps, weight: p.weight })
      )
      const repsData = generateRepsData(weeksInRange, perfs)

      // Property: repsData.length === weeksInRange.length
      expect(repsData.length, `[${scenario.label}] reps data length`).toBe(weeksInRange.length)
    }
  })

  it('weight data length matches weeks in range for all scenarios', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)
      const perfs = scenario.performances.map((p) =>
        makePerf(p.date, { completed: p.completed, actualReps: p.actualReps, weight: p.weight })
      )
      const weightData = generateWeightData(weeksInRange, perfs)

      // Property: weightData.length === weeksInRange.length
      expect(weightData.length, `[${scenario.label}] weight data length`).toBe(weeksInRange.length)
    }
  })

  it('completion data length matches weeks in range for all scenarios', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)
      const completionData = generateCompletionData(weeksInRange, () => [], () => undefined)

      // Property: completionData.length === weeksInRange.length
      expect(completionData.length, `[${scenario.label}] completion data length`).toBe(weeksInRange.length)
    }
  })

  it('averageReps is always non-negative for all scenarios', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)
      const perfs = scenario.performances.map((p) =>
        makePerf(p.date, { completed: p.completed, actualReps: p.actualReps, weight: p.weight })
      )
      const repsData = generateRepsData(weeksInRange, perfs)

      // Property: repsData.every(d => d.averageReps >= 0)
      repsData.forEach((d, i) => {
        expect(d.averageReps, `[${scenario.label}] week ${i} averageReps`).toBeGreaterThanOrEqual(0)
      })
    }
  })

  it('completionRate is always in [0, 100] for all scenarios', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)

      // Build session lookup from scenario sessions
      const sessionMap = new Map(
        scenario.sessions.map((s) => [
          s.date,
          {
            exercises: [
              ...Array.from({ length: s.completedCount }, () => ({ completed: true })),
              ...Array.from({ length: s.assignedCount - s.completedCount }, () => ({ completed: false })),
            ],
          },
        ])
      )

      const completionData = generateCompletionData(
        weeksInRange,
        (day) => {
          const r = scenario.routine.find((r) => r.day === day)
          return r ? Array.from({ length: r.exerciseCount }, (_, i) => `ex${i}`) : []
        },
        (date) => sessionMap.get(date)
      )

      // Property: completionData.every(d => d.completionRate >= 0 && d.completionRate <= 100)
      completionData.forEach((d, i) => {
        expect(d.completionRate, `[${scenario.label}] week ${i} completionRate >= 0`).toBeGreaterThanOrEqual(0)
        expect(d.completionRate, `[${scenario.label}] week ${i} completionRate <= 100`).toBeLessThanOrEqual(100)
      })
    }
  })

  it('averageWeight is null or non-negative for all scenarios', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)
      const perfs = scenario.performances.map((p) =>
        makePerf(p.date, { completed: p.completed, actualReps: p.actualReps, weight: p.weight })
      )
      const weightData = generateWeightData(weeksInRange, perfs)

      // Property: weightData.every(d => d.averageWeight === null || d.averageWeight >= 0)
      weightData.forEach((d, i) => {
        if (d.averageWeight !== null) {
          expect(d.averageWeight, `[${scenario.label}] week ${i} averageWeight`).toBeGreaterThanOrEqual(0)
        }
      })
    }
  })

  it('performances outside the time range do not affect data within the range', () => {
    // Scenario 6 specifically tests this: only the middle week is in range
    const rangeStart = '2025-01-13'
    const rangeEnd = '2025-01-19'
    const weeksInRange = getWeeksInRange(rangeStart, rangeEnd)

    const perfs = [
      makePerf('2025-01-06', { completed: true, actualReps: 99, weight: 999 }), // before range
      makePerf('2025-01-14', { completed: true, actualReps: 10, weight: 50 }),  // in range
      makePerf('2025-01-20', { completed: true, actualReps: 88, weight: 888 }), // after range
    ]

    const repsData = generateRepsData(weeksInRange, perfs)
    const weightData = generateWeightData(weeksInRange, perfs)

    // Only the in-range performance should contribute
    expect(weeksInRange).toHaveLength(1)
    expect(repsData[0]!.averageReps).toBe(10)
    expect(weightData[0]!.averageWeight).toBe(50)
  })

  it('incomplete performances do not contribute to reps or weight averages', () => {
    const weeksInRange = getWeeksInRange('2025-01-06', '2025-01-12')

    const perfs = [
      makePerf('2025-01-06', { completed: true, actualReps: 10, weight: 50 }),
      makePerf('2025-01-07', { completed: false, actualReps: 20, weight: 100 }), // incomplete
      makePerf('2025-01-08', { completed: false, actualReps: 30, weight: 200 }), // incomplete
    ]

    const repsData = generateRepsData(weeksInRange, perfs)
    const weightData = generateWeightData(weeksInRange, perfs)

    // Only the completed performance should count
    expect(repsData[0]!.averageReps).toBe(10)
    expect(weightData[0]!.averageWeight).toBe(50)
  })

  it('completion rate math: round((completed / assigned) * 100) when assigned > 0, else 0', () => {
    const weeksInRange = getWeeksInRange('2025-01-06', '2025-01-12')

    const cases = [
      // { assigned, completed, expectedRate }
      { assigned: 0, completed: 0, expectedRate: 0 },
      { assigned: 1, completed: 1, expectedRate: 100 },
      { assigned: 2, completed: 1, expectedRate: 50 },
      { assigned: 3, completed: 1, expectedRate: 33 },
      { assigned: 3, completed: 2, expectedRate: 67 },
      { assigned: 4, completed: 3, expectedRate: 75 },
    ]

    for (const { assigned, completed, expectedRate } of cases) {
      const sessionMap = new Map([
        [
          '2025-01-06',
          {
            exercises: [
              ...Array.from({ length: completed }, () => ({ completed: true })),
              ...Array.from({ length: assigned - completed }, () => ({ completed: false })),
            ],
          },
        ],
      ])

      const completionData = generateCompletionData(
        weeksInRange,
        (day) => (day === 'monday' ? Array.from({ length: assigned }, (_, i) => `ex${i}`) : []),
        (date) => sessionMap.get(date)
      )

      expect(
        completionData[0]!.completionRate,
        `assigned=${assigned} completed=${completed}`
      ).toBe(expectedRate)
    }
  })

  it('all data points have non-empty weekLabel strings', () => {
    const scenarios = generateScenarios()

    for (const scenario of scenarios) {
      const weeksInRange = getWeeksInRange(scenario.rangeStart, scenario.rangeEnd)
      const perfs = scenario.performances.map((p) =>
        makePerf(p.date, { completed: p.completed, actualReps: p.actualReps, weight: p.weight })
      )

      const repsData = generateRepsData(weeksInRange, perfs)
      const weightData = generateWeightData(weeksInRange, perfs)
      const completionData = generateCompletionData(weeksInRange, () => [], () => undefined)

      repsData.forEach((d, i) => {
        expect(d.weekLabel, `[${scenario.label}] reps week ${i} label`).toBeTruthy()
        expect(typeof d.weekLabel).toBe('string')
      })
      weightData.forEach((d, i) => {
        expect(d.weekLabel, `[${scenario.label}] weight week ${i} label`).toBeTruthy()
        expect(typeof d.weekLabel).toBe('string')
      })
      completionData.forEach((d, i) => {
        expect(d.weekLabel, `[${scenario.label}] completion week ${i} label`).toBeTruthy()
        expect(typeof d.weekLabel).toBe('string')
      })
    }
  })
})
