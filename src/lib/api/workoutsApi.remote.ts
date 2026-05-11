// Real HTTP implementation of the workouts API.
//
// Activated automatically when `NEXT_PUBLIC_WORKOUTS_API=1`.
// Contract documented in /workouts-api.md at the repo root.
//
// Method shapes intentionally mirror `localWorkoutsApi` (the localStorage
// mock) so the UI doesn't need to change when switching back-ends.

import type {
  ExerciseLog,
  SetLog,
  WorkoutSession,
  WorkoutTemplate,
} from '@/types/workout'
import { API_URL, getAuthHeader } from '@/lib/config'
import type { WorkoutsApi } from './workoutsApi'

const UNIT_KEY = 'deviny.workouts.unit.v1'
const CUSTOM_NAMES_KEY = 'deviny.workouts.customNames.v1'

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ─── HTTP helpers ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const auth = getAuthHeader()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...auth,
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  if (res.status === 204) {
    // No content
    return undefined as unknown as T
  }

  // Try to parse JSON regardless of status so we can read the error message
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : null) || `Workouts API error (${res.status})`
    throw new Error(message)
  }

  return data as T
}

/**
 * The list endpoints may return either a bare array or `{ items, total }`.
 * Normalize to a flat array for the caller.
 */
function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (
    payload &&
    typeof payload === 'object' &&
    'items' in payload &&
    Array.isArray((payload as { items: unknown }).items)
  ) {
    return (payload as { items: T[] }).items
  }
  return []
}

// ─── API ────────────────────────────────────────────────────────────────

export const remoteWorkoutsApi: WorkoutsApi = {
  // Device-local prefs — never go to the server. localStorage only.
  getUnit(): 'kg' | 'lb' {
    if (typeof window === 'undefined') return 'kg'
    return (localStorage.getItem(UNIT_KEY) as 'kg' | 'lb') || 'kg'
  },
  setUnit(unit: 'kg' | 'lb') {
    if (typeof window !== 'undefined') localStorage.setItem(UNIT_KEY, unit)
  },
  getCustomNames(): string[] {
    if (typeof window === 'undefined') return []
    return safeParse<string[]>(localStorage.getItem(CUSTOM_NAMES_KEY), [])
  },
  saveCustomName(name: string) {
    if (typeof window === 'undefined') return
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = this.getCustomNames().filter((n) => n !== trimmed)
    localStorage.setItem(CUSTOM_NAMES_KEY, JSON.stringify([trimmed, ...existing].slice(0, 10)))
  },

  // ── Sessions ─────────────────────────────────────────────────────────
  async listSessions(): Promise<WorkoutSession[]> {
    const payload = await request<unknown>('/workouts/sessions')
    return unwrapList<WorkoutSession>(payload)
  },

  async getSession(id: string): Promise<WorkoutSession | null> {
    try {
      return await request<WorkoutSession>(`/workouts/sessions/${encodeURIComponent(id)}`)
    } catch (err) {
      if (err instanceof Error && /404/.test(err.message)) return null
      throw err
    }
  },

  async createSession(opts?: {
    name?: string
    date?: string
    templateId?: string
  }): Promise<WorkoutSession> {
    return request<WorkoutSession>('/workouts/sessions', {
      method: 'POST',
      body: JSON.stringify(opts ?? {}),
    })
  },

  async updateSession(
    id: string,
    patch: Partial<Omit<WorkoutSession, 'id'>>,
  ): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(`/workouts/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  async deleteSession(id: string): Promise<void> {
    await request<void>(`/workouts/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  // ── Exercise-log operations on a session ─────────────────────────────
  async addExercise(sessionId: string, exerciseId: string): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises`,
      { method: 'POST', body: JSON.stringify({ exerciseId }) },
    )
  },

  async removeExercise(sessionId: string, exerciseLogId: string): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseLogId)}`,
      { method: 'DELETE' },
    )
  },

  async updateExerciseLog(
    sessionId: string,
    exerciseLogId: string,
    patch: Partial<Omit<ExerciseLog, 'id' | 'exerciseId'>>,
  ): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseLogId)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    )
  },

  async addSet(sessionId: string, exerciseLogId: string): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseLogId)}/sets`,
      { method: 'POST' },
    )
  },

  async updateSet(
    sessionId: string,
    exerciseLogId: string,
    setId: string,
    patch: Partial<Omit<SetLog, 'id'>>,
  ): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseLogId)}/sets/${encodeURIComponent(setId)}`,
      { method: 'PATCH', body: JSON.stringify(patch) },
    )
  },

  async removeSet(
    sessionId: string,
    exerciseLogId: string,
    setId: string,
  ): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseLogId)}/sets/${encodeURIComponent(setId)}`,
      { method: 'DELETE' },
    )
  },

  async moveExercise(
    sessionId: string,
    exerciseLogId: string,
    direction: 'up' | 'down',
  ): Promise<WorkoutSession | null> {
    return request<WorkoutSession>(
      `/workouts/sessions/${encodeURIComponent(sessionId)}/exercises/${encodeURIComponent(exerciseLogId)}/move`,
      { method: 'POST', body: JSON.stringify({ direction }) },
    )
  },

  async getPreviousBest(
    exerciseId: string,
    excludeSessionId?: string,
  ): Promise<{ date: string; reps: number; weight: number } | null> {
    const qs = excludeSessionId
      ? `?excludeSessionId=${encodeURIComponent(excludeSessionId)}`
      : ''
    try {
      const data = await request<
        | { date: string; reps: number; weight: number }
        | { data: { date: string; reps: number; weight: number } | null }
        | null
      >(`/workouts/exercises/${encodeURIComponent(exerciseId)}/previous-best${qs}`)
      if (!data) return null
      // Accept either bare object or `{ data: ... }`
      if ('data' in data) return data.data ?? null
      return data
    } catch (err) {
      if (err instanceof Error && /404/.test(err.message)) return null
      throw err
    }
  },

  // ── Templates ────────────────────────────────────────────────────────
  async listTemplates(): Promise<WorkoutTemplate[]> {
    const payload = await request<unknown>('/workouts/templates')
    return unwrapList<WorkoutTemplate>(payload)
  },

  async createTemplate(
    input: Omit<WorkoutTemplate, 'id' | 'createdAt'>,
  ): Promise<WorkoutTemplate> {
    return request<WorkoutTemplate>('/workouts/templates', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async deleteTemplate(id: string): Promise<void> {
    await request<void>(`/workouts/templates/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
