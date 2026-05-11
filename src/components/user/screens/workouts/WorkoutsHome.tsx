'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { workoutsApi } from '@/lib/api/workoutsApi'
import { EXERCISES_BY_ID } from '@/lib/data/exercises'
import type { Exercise, WorkoutSession } from '@/types/workout'
import { ExerciseMedia } from './ExerciseMedia'

/** Built-in workout-name templates the user can pick when creating a session. */
const NAME_TEMPLATE_KEYS = [
  'chestDay',
  'backBiceps',
  'legDay',
  'shoulders',
  'armsDay',
  'pushDay',
  'pullDay',
  'fullBody',
  'cardio',
] as const

function localizedName(name: Exercise['name'], locale: string): string {
  if (locale.startsWith('ru')) return name.ru
  if (locale.startsWith('az')) return name.az
  return name.en
}

function formatDateLabel(
  iso: string,
  locale: string,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return todayLabel
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return yesterdayLabel
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function WorkoutsHome() {
  const router = useRouter()
  const t = useTranslations('workouts')
  const locale = useLocale()
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filterKey, setFilterKey] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const list = await workoutsApi.listSessions()
    setSessions(list)
    setUnit(workoutsApi.getUnit())
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createWith = async (name?: string) => {
    setCreating(true)
    const s = await workoutsApi.createSession(name ? { name } : undefined)
    router.push(`/user/workouts/${s.id}`)
  }

  const deleteSession = async (id: string) => {
    setConfirmId(id)
  }

  const confirmDelete = async () => {
    if (!confirmId) return
    await workoutsApi.deleteSession(confirmId)
    setConfirmId(null)
    refresh()
  }

  const toggleUnit = () => {
    const next = unit === 'kg' ? 'lb' : 'kg'
    workoutsApi.setUnit(next)
    setUnit(next)
  }

  const stats = useMemo(() => {
    const total = sessions.length
    const now = new Date()
    const monthAgo = new Date(now)
    monthAgo.setDate(monthAgo.getDate() - 30)
    const last30 = sessions.filter((s) => new Date(s.startedAt) >= monthAgo).length
    return { total, last30 }
  }, [sessions])

  // Which template keys actually have sessions
  const usedKeys = useMemo(() => {
    return NAME_TEMPLATE_KEYS.filter((key) => {
      const label = t(`nameTemplates.${key}`).toLowerCase()
      return sessions.some((s) => s.name.trim().toLowerCase() === label)
    })
  }, [sessions, t])

  // Custom names (not matching any template exactly)
  const usedCustomNames = useMemo(() => {
    const templateLabels = NAME_TEMPLATE_KEYS.map((k) => t(`nameTemplates.${k}`).toLowerCase())
    const names = sessions
      .map((s) => s.name.trim())
      .filter((name) => !templateLabels.includes(name.toLowerCase()))
    return [...new Set(names)]
  }, [sessions, t])

  const filteredSessions = useMemo(() => {
    if (!filterKey) return sessions
    if (filterKey.startsWith('custom:')) {
      const name = filterKey.slice('custom:'.length)
      return sessions.filter((s) => s.name.trim() === name)
    }
    const label = t(`nameTemplates.${filterKey}`).toLowerCase()
    return sessions.filter((s) => s.name.trim().toLowerCase() === label)
  }, [sessions, filterKey, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-user-500" />
      </div>
    )
  }

  return (
    <div className="w-full px-3 pb-8 sm:px-4">
      {/* Hero + Stats */}
      <div className="relative overflow-hidden rounded-3xl bg-surface-2 p-4 ring-1 ring-inset ring-border-subtle sm:p-6">
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
            {t('title')}
          </p>
          <h1 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">{t('heroTitle')}</h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{t('heroSubtitle')}</p>

          {/* Stats + actions row */}
          <div className="mt-4 flex flex-col gap-3 border-t border-border-subtle pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-user-500" />
                <span className="text-sm text-muted-foreground">{t('totalWorkouts')}:</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{stats.total}</span>
              </div>
              <div className="h-3.5 w-px bg-border-subtle" />
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-user-500" />
                <span className="text-sm text-muted-foreground">{t('last30days')}:</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{stats.last30}</span>
              </div>
            </div>
            {/* Actions */}
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                onClick={toggleUnit}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-surface-3 px-3.5 py-2 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border-subtle transition hover:bg-hover-overlay hover:text-foreground active:scale-95"
              >
                {t('unit')}: {unit.toUpperCase()}
              </button>
              <button
                onClick={() => setSheetOpen(true)}
                disabled={creating}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-user-500 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-user-600 active:scale-95 disabled:opacity-70 sm:flex-none"
              >
                {creating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {t('addWorkout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="mt-6">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('history')}
        </h2>

        {/* Filter chips — only shown when there are tagged sessions */}
        {(usedKeys.length > 0 || usedCustomNames.length > 0) && (
          <div className="mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
            <button
              onClick={() => setFilterKey(null)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filterKey === null
                  ? 'bg-user-500 text-white shadow-sm'
                  : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              {t('all')}
            </button>
            {usedKeys.map((key) => (
              <button
                key={key}
                onClick={() => setFilterKey(filterKey === key ? null : key)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filterKey === key
                    ? 'bg-user-500 text-white shadow-sm'
                    : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
                }`}
              >
                {t(`nameTemplates.${key}`)}
              </button>
            ))}
            {usedCustomNames.map((name) => {
              const fk = `custom:${name}`
              return (
                <button
                  key={fk}
                  onClick={() => setFilterKey(filterKey === fk ? null : fk)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filterKey === fk
                      ? 'bg-user-500 text-white shadow-sm'
                      : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
                  }`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        )}

        {filteredSessions.length === 0 ? (
          <div className="mt-3 rounded-2xl border-2 border-dashed border-border-subtle bg-surface-1/40 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-user-500/10 text-user-500">
              <Dumbbell className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">{t('emptyHistoryTitle')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t('emptyHistorySubtitle')}</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {filteredSessions.map((s) => (
              <li key={s.id}>
                <SessionCard
                  session={s}
                  locale={locale}
                  onOpen={() => router.push(`/user/workouts/${s.id}`)}
                  onDelete={() => deleteSession(s.id)}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {sheetOpen && (
        <NewWorkoutSheet
          onClose={() => setSheetOpen(false)}
          onPick={(name) => createWith(name)}
        />
      )}

      {confirmId && (
        <ConfirmDialog
          message={t('deleteSessionConfirm')}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-surface-1 p-3 ring-1 ring-inset ring-border-subtle sm:p-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-user-500">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-foreground sm:text-xl">{value}</p>
    </div>
  )
}

interface SessionCardProps {
  session: WorkoutSession
  locale: string
  onOpen: () => void
  onDelete: () => void
  t: ReturnType<typeof useTranslations>
}

function SessionCard({ session, locale, onOpen, onDelete, t }: SessionCardProps) {
  const dateLabel = formatDateLabel(session.startedAt, locale, t('today'), t('yesterday'))
  const previewExercises = session.exercises.slice(0, 4)

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle transition hover:ring-user-500/40">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start gap-3 p-3 sm:p-4">
          <div className="flex flex-1 flex-col">
            <p className="text-xs text-muted-foreground">{dateLabel}</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{session.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {session.exercises.length} {t('exercises')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              className="rounded-xl p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {previewExercises.length > 0 && (
          <div className="flex gap-2 px-3 pb-3 sm:px-4">
            {previewExercises.map((log) => {
              const ex = EXERCISES_BY_ID[log.exerciseId]
              if (!ex) return null
              return (
                <div key={log.id} title={localizedName(ex.name, locale)}>
                  <ExerciseMedia frames={ex.mediaFrames} alt={ex.name.en} size="sm" />
                </div>
              )
            })}
            {session.exercises.length > previewExercises.length && (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border-subtle">
                +{session.exercises.length - previewExercises.length}
              </div>
            )}
          </div>
        )}
      </button>

    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTranslations('common')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-surface-1 shadow-2xl ring-1 ring-inset ring-border-subtle">
        <div className="px-5 py-5">
          <p className="text-sm font-medium text-foreground">{message}</p>
        </div>
        <div className="flex border-t border-border-subtle">
          <button
            onClick={onCancel}
            className="flex-1 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-hover-overlay"
          >
            {t('cancel')}
          </button>
          <div className="w-px bg-border-subtle" />
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── New-workout sheet ─────────────────────────────────────────────────

interface NewWorkoutSheetProps {
  onClose: () => void
  onPick: (name?: string) => void
}

function NewWorkoutSheet({ onClose, onPick }: NewWorkoutSheetProps) {
  const t = useTranslations('workouts')
  const [custom, setCustom] = useState('')
  const [savedCustomNames, setSavedCustomNames] = useState<string[]>([])
  const trimmed = custom.trim()

  useEffect(() => {
    setSavedCustomNames(workoutsApi.getCustomNames())
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Measure scrollbar width before locking so we can compensate and avoid
    // the ~17px layout shift that makes the sidebar jump.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prev = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      document.body.style.paddingRight = prevPad
    }
  }, [onClose])

  const submitCustom = () => {
    if (trimmed) workoutsApi.saveCustomName(trimmed)
    onPick(trimmed || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-surface-1 ring-1 ring-inset ring-border-subtle mx-4">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-bold text-foreground">{t('newWorkout')}</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-hover-overlay hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('pickTemplate')}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {NAME_TEMPLATE_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => onPick(t(`nameTemplates.${key}`))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground ring-1 ring-inset ring-border-subtle transition hover:bg-user-500/15 hover:text-user-500 hover:ring-user-500/40"
              >
                {t(`nameTemplates.${key}`)}
              </button>
            ))}
            {trimmed && (
              <button
                onClick={submitCustom}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-user-500/50 bg-user-500/10 px-3 py-2 text-xs font-semibold text-user-500 transition hover:bg-user-500/20 active:scale-95"
              >
                {trimmed}
              </button>
            )}
            {!trimmed && savedCustomNames
              .filter((name) => !NAME_TEMPLATE_KEYS.map((k) => t(`nameTemplates.${k}`).toLowerCase()).includes(name.toLowerCase()))
              .map((name) => (
                <button
                  key={name}
                  onClick={() => { workoutsApi.saveCustomName(name); onPick(name) }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border-subtle bg-surface-2/60 px-3 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border-subtle transition hover:border-user-500/40 hover:bg-user-500/10 hover:text-user-500 active:scale-95"
                >
                  {name}
                </button>
              ))
            }
          </div>

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('customName')}
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                autoFocus
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitCustom()
                }}
                placeholder={t('workoutName')}
                className="flex-1 rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none ring-1 ring-inset ring-border-subtle placeholder:text-muted-foreground focus:ring-user-500/60"
              />
              <button
                onClick={submitCustom}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-user-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-user-600 active:scale-95"
              >
                {t('create')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
