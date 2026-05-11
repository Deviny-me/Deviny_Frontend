// Workout / training log domain types.
// All shapes are mock-first; backend contract will mirror this when implemented.

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'fullBody'
  | 'cardio'

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'band'
  | 'other'

export type WeightUnit = 'kg' | 'lb'

export interface LocalizedString {
  en: string
  ru: string
  az: string
}

/**
 * Catalog exercise — comes from a global library (later: backend).
 */
export interface Exercise {
  id: string
  slug: string
  name: LocalizedString
  primaryMuscle: MuscleGroup
  secondaryMuscles?: MuscleGroup[]
  equipment: Equipment
  /**
   * Two-frame animation URLs. The UI alternates between them to create a
   * GIF-like animated preview.
   */
  mediaFrames?: [string, string]
  /** Short coaching cue. */
  instructions?: LocalizedString
  /** True if exercise is bodyweight-only (weight input disabled by default). */
  isBodyweight?: boolean
  /**
   * Extra search terms per locale (e.g. RU colloquial names like "пресс"
   * for core exercises). Matched together with the localized name in the
   * exercise picker search box.
   */
  aliases?: { en?: string[]; ru?: string[]; az?: string[] }
}

export interface SetLog {
  id: string
  reps: number | null
  weight: number | null
  rpe?: number | null
  isWarmup?: boolean
  completed: boolean
}

export interface ExerciseLog {
  id: string
  exerciseId: string
  order: number
  /** Default rest in seconds, applied to all sets unless overridden. */
  restSec: number
  notes?: string
  sets: SetLog[]
}

export type SessionStatus = 'inProgress' | 'finished' | 'cancelled'

export interface WorkoutSession {
  id: string
  userId?: string
  name: string
  /** ISO datetime. */
  startedAt: string
  /** ISO datetime — present only when finished. */
  finishedAt?: string
  /** Convenience cache so history list does not need to sum sets. */
  durationSec?: number
  status: SessionStatus
  notes?: string
  bodyWeight?: number
  unit: WeightUnit
  exercises: ExerciseLog[]
  /** Optional link back to a template / muscle-day. */
  templateId?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  /** Optional emoji or short tag (e.g. "Push", "Legs"). */
  tag?: string
  exerciseIds: string[]
  createdAt: string
}

/** Aggregated previous-best info shown above set rows. */
export interface PreviousBest {
  /** ISO date of the last session this exercise was performed. */
  date: string
  /** Best single-set reps × weight from the previous session. */
  reps: number
  weight: number
}
