// Mock workouts API — backed entirely by localStorage so the UX can be
// validated end-to-end before a backend exists. Every method is Promise-based
// so the future real API can drop in without UI changes.
//
// Workouts here are logged **after the fact**: there is no "active session" /
// timer concept. Each record represents a finished workout with a chosen date.

import type {
  ExerciseLog,
  SetLog,
  WorkoutSession,
  WorkoutTemplate,
} from '@/types/workout'

const SESSIONS_KEY = 'deviny.workouts.sessions.v1'
const TEMPLATES_KEY = 'deviny.workouts.templates.v1'
const UNIT_KEY = 'deviny.workouts.unit.v1'
const CUSTOM_NAMES_KEY = 'deviny.workouts.customNames.v1'

function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readSessions(): WorkoutSession[] {
  if (!isBrowser()) return []
  return safeParse<WorkoutSession[]>(localStorage.getItem(SESSIONS_KEY), [])
}

function writeSessions(list: WorkoutSession[]) {
  if (!isBrowser()) return
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(list))
}

function readTemplates(): WorkoutTemplate[] {
  if (!isBrowser()) return []
  return safeParse<WorkoutTemplate[]>(localStorage.getItem(TEMPLATES_KEY), [])
}

function writeTemplates(list: WorkoutTemplate[]) {
  if (!isBrowser()) return
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list))
}

function emptySet(): SetLog {
  return { id: uid('set'), reps: null, weight: null, completed: true }
}

function defaultWorkoutName(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long' })
}

export const localWorkoutsApi = {
  // ── Unit preference ──────────────────────────────────────────────────
  getUnit(): 'kg' | 'lb' {
    if (!isBrowser()) return 'kg'
    return (localStorage.getItem(UNIT_KEY) as 'kg' | 'lb') || 'kg'
  },
  setUnit(unit: 'kg' | 'lb') {
    if (!isBrowser()) return
    localStorage.setItem(UNIT_KEY, unit)
  },

  // ── Custom workout name history ───────────────────────────────────────
  getCustomNames(): string[] {
    if (!isBrowser()) return []
    return safeParse<string[]>(localStorage.getItem(CUSTOM_NAMES_KEY), [])
  },
  saveCustomName(name: string) {
    if (!isBrowser()) return
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = this.getCustomNames().filter((n) => n !== trimmed)
    // keep most recent 10, newest first
    localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify([trimmed, ...existing].slice(0, 10)))
  },

  // ── Sessions ─────────────────────────────────────────────────────────
  async listSessions(): Promise<WorkoutSession[]> {
    return readSessions().sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    )
  },

  async getSession(id: string): Promise<WorkoutSession | null> {
    return readSessions().find((s) => s.id === id) ?? null
  },

  /**
   * Create a new (finished) workout log. By default it is dated today; the
   * caller may override via `date` (ISO `YYYY-MM-DD` or full ISO datetime).
   */
  async createSession(opts?: {
    name?: string
    date?: string
    templateId?: string
  }): Promise<WorkoutSession> {
    const date = opts?.date ? new Date(opts.date) : new Date()
    const session: WorkoutSession = {
      id: uid('ws'),
      name: opts?.name?.trim() || defaultWorkoutName(date),
      startedAt: date.toISOString(),
      finishedAt: date.toISOString(),
      status: 'finished',
      unit: this.getUnit(),
      exercises: [],
      templateId: opts?.templateId,
    }

    if (opts?.templateId) {
      const tpl = readTemplates().find((t) => t.id === opts.templateId)
      if (tpl) {
        session.exercises = tpl.exerciseIds.map((exerciseId, i) => ({
          id: uid('el'),
          exerciseId,
          order: i,
          restSec: 0,
          sets: [emptySet(), emptySet(), emptySet()],
        }))
      }
    }

    const list = readSessions()
    list.push(session)
    writeSessions(list)
    return session
  },

  async updateSession(
    id: string,
    patch: Partial<Omit<WorkoutSession, 'id'>>,
  ): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...patch }
    writeSessions(list)
    return list[idx]
  },

  async deleteSession(id: string): Promise<void> {
    writeSessions(readSessions().filter((s) => s.id !== id))
  },

  // ── Exercise-log operations on a session ─────────────────────────────
  async addExercise(sessionId: string, exerciseId: string): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    const log: ExerciseLog = {
      id: uid('el'),
      exerciseId,
      order: list[idx].exercises.length,
      restSec: 0,
      sets: [emptySet()],
    }
    list[idx] = { ...list[idx], exercises: [...list[idx].exercises, log] }
    writeSessions(list)
    return list[idx]
  },

  async removeExercise(sessionId: string, exerciseLogId: string): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    const exercises = list[idx].exercises
      .filter((e) => e.id !== exerciseLogId)
      .map((e, i) => ({ ...e, order: i }))
    list[idx] = { ...list[idx], exercises }
    writeSessions(list)
    return list[idx]
  },

  async updateExerciseLog(
    sessionId: string,
    exerciseLogId: string,
    patch: Partial<Omit<ExerciseLog, 'id' | 'exerciseId'>>,
  ): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    list[idx] = {
      ...list[idx],
      exercises: list[idx].exercises.map((e) =>
        e.id === exerciseLogId ? { ...e, ...patch } : e,
      ),
    }
    writeSessions(list)
    return list[idx]
  },

  async addSet(sessionId: string, exerciseLogId: string): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    list[idx] = {
      ...list[idx],
      exercises: list[idx].exercises.map((e) => {
        if (e.id !== exerciseLogId) return e
        const last = e.sets[e.sets.length - 1]
        const next: SetLog = last
          ? { id: uid('set'), reps: last.reps, weight: last.weight, completed: true }
          : emptySet()
        return { ...e, sets: [...e.sets, next] }
      }),
    }
    writeSessions(list)
    return list[idx]
  },

  async updateSet(
    sessionId: string,
    exerciseLogId: string,
    setId: string,
    patch: Partial<Omit<SetLog, 'id'>>,
  ): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    list[idx] = {
      ...list[idx],
      exercises: list[idx].exercises.map((e) =>
        e.id !== exerciseLogId
          ? e
          : { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
      ),
    }
    writeSessions(list)
    return list[idx]
  },

  async removeSet(
    sessionId: string,
    exerciseLogId: string,
    setId: string,
  ): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    list[idx] = {
      ...list[idx],
      exercises: list[idx].exercises.map((e) =>
        e.id !== exerciseLogId ? e : { ...e, sets: e.sets.filter((s) => s.id !== setId) },
      ),
    }
    writeSessions(list)
    return list[idx]
  },

  /**
   * Move an exercise log up or down within a session. No-op if it's already
   * at the boundary.
   */
  async moveExercise(
    sessionId: string,
    exerciseLogId: string,
    direction: 'up' | 'down',
  ): Promise<WorkoutSession | null> {
    const list = readSessions()
    const idx = list.findIndex((s) => s.id === sessionId)
    if (idx === -1) return null
    const exs = [...list[idx].exercises]
    const at = exs.findIndex((e) => e.id === exerciseLogId)
    if (at === -1) return list[idx]
    const target = direction === 'up' ? at - 1 : at + 1
    if (target < 0 || target >= exs.length) return list[idx]
    ;[exs[at], exs[target]] = [exs[target], exs[at]]
    list[idx] = {
      ...list[idx],
      exercises: exs.map((e, i) => ({ ...e, order: i })),
    }
    writeSessions(list)
    return list[idx]
  },

  /**
   * Best historical (heaviest) set for an exercise across all logs except
   * the one being edited. Used to show a "previous best" hint while logging.
   */
  async getPreviousBest(
    exerciseId: string,
    excludeSessionId?: string,
  ): Promise<{ date: string; reps: number; weight: number } | null> {
    const sessions = readSessions().filter((s) => s.id !== excludeSessionId)
    let best: { date: string; reps: number; weight: number } | null = null
    for (const s of sessions) {
      for (const log of s.exercises) {
        if (log.exerciseId !== exerciseId) continue
        for (const set of log.sets) {
          if (set.reps == null || set.weight == null) continue
          if (!best || set.weight > best.weight) {
            best = { date: s.startedAt, reps: set.reps, weight: set.weight }
          }
        }
      }
    }
    return best
  },

  // ── Templates (reserved for future) ──────────────────────────────────
  async listTemplates(): Promise<WorkoutTemplate[]> {
    return readTemplates()
  },

  async createTemplate(input: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<WorkoutTemplate> {
    const tpl: WorkoutTemplate = {
      ...input,
      id: uid('tpl'),
      createdAt: new Date().toISOString(),
    }
    const list = readTemplates()
    list.push(tpl)
    writeTemplates(list)
    return tpl
  },

  async deleteTemplate(id: string): Promise<void> {
    writeTemplates(readTemplates().filter((t) => t.id !== id))
  },
}

export type WorkoutsApi = typeof localWorkoutsApi

// ─── Runtime switch ─────────────────────────────────────────────────────
// When `NEXT_PUBLIC_WORKOUTS_API=1`, route all calls to the real HTTP backend
// (see `workoutsApi.remote.ts` and `workouts-api.md`). Otherwise fall back
// to the localStorage mock above. No UI changes needed — same shape.
import { remoteWorkoutsApi } from './workoutsApi.remote'

const useRemote =
  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WORKOUTS_API === '1'

export const workoutsApi: WorkoutsApi = useRemote ? remoteWorkoutsApi : localWorkoutsApi
