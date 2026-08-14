/**
 * @module cloudSync
 * @description Bridges the local IndexedDB store (source of truth for instant reads/writes)
 * with Supabase Postgres (source of truth across devices). Strategy, chosen for a single
 * user syncing between a couple of personal devices — not a multi-writer collaborative app:
 *
 * - Every local mutation is pushed to Supabase in the background (fire-and-forget from the
 *   caller's perspective — UI never waits on the network).
 * - If a push fails (offline, etc.) it's queued in localStorage and retried on the next
 *   `flushQueue()` call, which runs on app boot and on the browser's `online` event.
 * - On sign-in / app boot, `pullAndHydrate()` fetches everything from Supabase and
 *   overwrites the local IndexedDB cache, so a second device always catches up to the
 *   latest state. This is last-write-wins at the table-row level, which is sufficient
 *   because the same person is never editing the same record on two devices at once.
 *
 * All functions are safe no-ops when cloud sync isn't configured.
 */
import { getSupabase, isCloudEnabled } from './supabaseClient'
import { storageService } from './storage'
import type { Exercise, Routine, WorkoutSession } from '../stores/types'

const QUEUE_KEY = 'fittrack-sync-queue'

type QueueOp =
  | { type: 'upsertExercise'; payload: Exercise }
  | { type: 'deleteExercise'; payload: { id: string } }
  | { type: 'upsertRoutine'; payload: Routine }
  | { type: 'upsertSession'; payload: WorkoutSession }
  | { type: 'deleteSession'; payload: { id: string } }

function readQueue(): QueueOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeQueue(queue: QueueOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

function enqueue(op: QueueOp) {
  const queue = readQueue()
  queue.push(op)
  writeQueue(queue)
}

/** Row shape sent to/received from the `exercises` table. */
function toExerciseRow(userId: string, e: Exercise) {
  return {
    id: e.id,
    user_id: userId,
    name: e.name,
    target_sets: e.targetSets,
    target_reps: e.targetReps,
    target_muscle_groups: e.targetMuscleGroups,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  }
}

function fromExerciseRow(row: any): Exercise {
  return {
    id: row.id,
    name: row.name,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    targetMuscleGroups: row.target_muscle_groups ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toRoutineRow(userId: string, r: Routine) {
  return {
    id: r.id,
    user_id: userId,
    weekly_assignments: r.weeklyAssignments,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  }
}

function fromRoutineRow(row: any): Routine {
  return {
    id: row.id,
    weeklyAssignments: row.weekly_assignments ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toSessionRow(userId: string, s: WorkoutSession) {
  return {
    id: s.id,
    user_id: userId,
    date: s.date,
    exercises: s.exercises,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  }
}

function fromSessionRow(row: any): WorkoutSession {
  return {
    id: row.id,
    date: row.date,
    exercises: row.exercises ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Pushes a single exercise upsert to Supabase. Queues it for retry on failure.
 */
export async function syncUpsertExercise(userId: string, exercise: Exercise) {
  if (!isCloudEnabled()) return
  try {
    const supabase = getSupabase()!
    const { error } = await supabase.from('exercises').upsert(toExerciseRow(userId, exercise))
    if (error) throw error
  } catch {
    enqueue({ type: 'upsertExercise', payload: exercise })
  }
}

/** Pushes an exercise deletion to Supabase. Queues it for retry on failure. */
export async function syncDeleteExercise(userId: string, id: string) {
  if (!isCloudEnabled()) return
  try {
    const supabase = getSupabase()!
    const { error } = await supabase.from('exercises').delete().eq('id', id).eq('user_id', userId)
    if (error) throw error
  } catch {
    enqueue({ type: 'deleteExercise', payload: { id } })
  }
}

/** Pushes the routine upsert to Supabase. Queues it for retry on failure. */
export async function syncUpsertRoutine(userId: string, routine: Routine) {
  if (!isCloudEnabled()) return
  try {
    const supabase = getSupabase()!
    const { error } = await supabase.from('routines').upsert(toRoutineRow(userId, routine))
    if (error) throw error
  } catch {
    enqueue({ type: 'upsertRoutine', payload: routine })
  }
}

/** Pushes a workout session upsert to Supabase. Queues it for retry on failure. */
export async function syncUpsertSession(userId: string, session: WorkoutSession) {
  if (!isCloudEnabled()) return
  try {
    const supabase = getSupabase()!
    const { error } = await supabase.from('workout_sessions').upsert(toSessionRow(userId, session))
    if (error) throw error
  } catch {
    enqueue({ type: 'upsertSession', payload: session })
  }
}

/** Pushes a workout session deletion to Supabase. Queues it for retry on failure. */
export async function syncDeleteSession(userId: string, id: string) {
  if (!isCloudEnabled()) return
  try {
    const supabase = getSupabase()!
    const { error } = await supabase
      .from('workout_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw error
  } catch {
    enqueue({ type: 'deleteSession', payload: { id } })
  }
}

/**
 * Retries any queued operations left over from a previous offline period.
 * Safe to call repeatedly — clears each op from the queue only once it succeeds.
 */
export async function flushQueue(userId: string) {
  if (!isCloudEnabled()) return
  const queue = readQueue()
  if (queue.length === 0) return

  const remaining: QueueOp[] = []
  for (const op of queue) {
    try {
      const supabase = getSupabase()!
      if (op.type === 'upsertExercise') {
        const { error } = await supabase.from('exercises').upsert(toExerciseRow(userId, op.payload))
        if (error) throw error
      } else if (op.type === 'deleteExercise') {
        const { error } = await supabase
          .from('exercises')
          .delete()
          .eq('id', op.payload.id)
          .eq('user_id', userId)
        if (error) throw error
      } else if (op.type === 'upsertRoutine') {
        const { error } = await supabase.from('routines').upsert(toRoutineRow(userId, op.payload))
        if (error) throw error
      } else if (op.type === 'upsertSession') {
        const { error } = await supabase
          .from('workout_sessions')
          .upsert(toSessionRow(userId, op.payload))
        if (error) throw error
      } else if (op.type === 'deleteSession') {
        const { error } = await supabase
          .from('workout_sessions')
          .delete()
          .eq('id', op.payload.id)
          .eq('user_id', userId)
        if (error) throw error
      }
    } catch {
      remaining.push(op)
    }
  }
  writeQueue(remaining)
}

/**
 * Pulls everything from Supabase and overwrites the local IndexedDB cache. Call this
 * right after sign-in and on app boot (while authenticated) so a second device catches
 * up to the latest cloud state.
 */
export async function pullAndHydrate(userId: string) {
  if (!isCloudEnabled()) return
  const supabase = getSupabase()!

  const [exercisesRes, routineRes, sessionsRes] = await Promise.all([
    supabase.from('exercises').select('*').eq('user_id', userId),
    supabase.from('routines').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('workout_sessions').select('*').eq('user_id', userId),
  ])

  if (exercisesRes.data) {
    for (const row of exercisesRes.data) {
      await storageService.saveExercise(fromExerciseRow(row))
    }
  }
  if (routineRes.data) {
    await storageService.saveRoutine(fromRoutineRow(routineRes.data))
  }
  if (sessionsRes.data) {
    for (const row of sessionsRes.data) {
      await storageService.saveWorkoutSession(fromSessionRow(row))
    }
  }
}

// Auto-flush the queue whenever connectivity returns.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    const supabase = getSupabase()
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user.id
      if (userId) flushQueue(userId)
    })
  })
}
