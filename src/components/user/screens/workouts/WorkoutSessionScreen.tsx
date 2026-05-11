'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  ChevronDown,
  Info,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { workoutsApi } from '@/lib/api/workoutsApi'
import { EXERCISES_BY_ID } from '@/lib/data/exercises'
import type { Exercise, ExerciseLog, SetLog, WorkoutSession } from '@/types/workout'
import { ExerciseMedia } from './ExerciseMedia'
import { ExercisePicker } from './ExercisePicker'
import { cn } from '@/lib/utils/cn'

type PreviousBest = { date: string; reps: number; weight: number } | null

function localizedName(name: Exercise['name'], locale: string): string {
  if (locale.startsWith('ru')) return name.ru
  if (locale.startsWith('az')) return name.az
  return name.en
}

function localizedText(
  text: { en: string; ru: string; az: string } | undefined,
  locale: string,
): string | undefined {
  if (!text) return undefined
  if (locale.startsWith('ru')) return text.ru
  if (locale.startsWith('az')) return text.az
  return text.en
}

function isoToDateInput(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function dateInputToIso(value: string, previousIso?: string): string {
  const [y, m, d] = value.split('-').map(Number)
  const base = previousIso ? new Date(previousIso) : new Date()
  const out = new Date(base)
  out.setFullYear(y, (m ?? 1) - 1, d ?? 1)
  if (!previousIso) out.setHours(12, 0, 0, 0)
  return out.toISOString()
}

interface WorkoutSessionScreenProps {
  sessionId: string
}

export function WorkoutSessionScreen({ sessionId }: WorkoutSessionScreenProps) {
  const router = useRouter()
  const t = useTranslations('workouts')
  const locale = useLocale()

  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detailsFor, setDetailsFor] = useState<Exercise | null>(null)
  const [previous, setPrevious] = useState<Record<string, PreviousBest>>({})
  const [confirmDialog, setConfirmDialog] = useState<{
    message: string
    onConfirm: () => void
  } | null>(null)

  const refresh = useCallback(async () => {
    const s = await workoutsApi.getSession(sessionId)
    setSession(s)
    if (s && s.exercises.length === 0) {
      setEditing(true)
      setIsNew(true)
    }
    setLoading(false)
  }, [sessionId])

  useEffect(() => {
    window.scrollTo(0, 0)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!session) return
    let cancelled = false
    ;(async () => {
      const map: Record<string, PreviousBest> = { ...previous }
      for (const ex of session.exercises) {
        if (map[ex.exerciseId] !== undefined) continue
        map[ex.exerciseId] = await workoutsApi.getPreviousBest(ex.exerciseId, session.id)
      }
      if (!cancelled) setPrevious(map)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.exercises.map((e) => e.exerciseId).join('|')])

  // ── mutations ────────────────────────────────────────────────────────
  const addExercise = async (ex: Exercise) => {
    const next = await workoutsApi.addExercise(sessionId, ex.id)
    if (next) {
      setSession(next)
      setIsNew(false)
    }
  }

  const removeExercise = async (logId: string) => {
    setConfirmDialog({
      message: t('removeExerciseConfirm'),
      onConfirm: async () => {
        const next = await workoutsApi.removeExercise(sessionId, logId)
        if (next) setSession(next)
      },
    })
  }

  const moveExercise = async (logId: string, dir: 'up' | 'down') => {
    const next = await workoutsApi.moveExercise(sessionId, logId, dir)
    if (next) setSession(next)
  }

  const addSet = async (logId: string) => {
    const next = await workoutsApi.addSet(sessionId, logId)
    if (next) setSession(next)
  }

  const updateSet = async (logId: string, setId: string, patch: Partial<SetLog>) => {
    const next = await workoutsApi.updateSet(sessionId, logId, setId, patch)
    if (next) setSession(next)
  }

  const removeSet = async (logId: string, setId: string) => {
    const next = await workoutsApi.removeSet(sessionId, logId, setId)
    if (next) setSession(next)
  }

  const updateName = async (name: string) => {
    if (!session) return
    setSession({ ...session, name })
    await workoutsApi.updateSession(session.id, { name })
  }

  const updateDate = async (dateValue: string) => {
    if (!session || !dateValue) return
    const startedAt = dateInputToIso(dateValue, session.startedAt)
    setSession({ ...session, startedAt, finishedAt: startedAt })
    await workoutsApi.updateSession(session.id, { startedAt, finishedAt: startedAt })
  }

  const deleteWorkout = () => {
    if (!session) return
    setConfirmDialog({
      message: t('deleteSessionConfirm'),
      onConfirm: async () => {
        await workoutsApi.deleteSession(session.id)
        router.push('/user/workouts')
      },
    })
  }

  const cancelEditing = () => {
    if (isNew) {
      // New session — confirm and discard (delete) the just-created session
      setConfirmDialog({
        message: t('discardWorkoutConfirm'),
        onConfirm: async () => {
          if (session) await workoutsApi.deleteSession(session.id)
          router.push('/user/workouts')
        },
      })
      return
    }
    // Existing session — just exit edit mode (changes auto-save live)
    setEditing(false)
  }

  const toggleUnit = async () => {
    if (!session) return
    const next: 'kg' | 'lb' = session.unit === 'kg' ? 'lb' : 'kg'
    setSession({ ...session, unit: next })
    await workoutsApi.updateSession(session.id, { unit: next })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-user-500" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="px-4 py-12 text-center text-muted-foreground">
        <p>{t('sessionNotFound')}</p>
        <button
          onClick={() => router.push('/user/workouts')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-user-500 px-4 py-2 text-sm font-semibold text-white hover:bg-user-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToWorkouts')}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full px-3 pb-12 sm:px-4">
      {/* Header */}
      <div className="sticky top-0 z-20 -mx-3 mb-3 border-b border-border-subtle bg-background/85 px-3 pb-2.5 pt-2.5 backdrop-blur sm:-mx-4 sm:px-4 sm:pb-3 sm:pt-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => router.push('/user/workouts')}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-hover-overlay hover:text-foreground active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                value={session.name}
                onChange={(e) => setSession({ ...session, name: e.target.value })}
                onBlur={(e) => updateName(e.target.value)}
                placeholder={t('workoutName')}
                className="w-full bg-transparent text-base font-bold text-foreground outline-none placeholder:text-muted-foreground sm:text-lg"
              />
            ) : (
              <p className="truncate text-base font-bold text-foreground sm:text-lg">{session.name}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              <CalendarDays className="mr-1 inline h-3 w-3" />
              {editing ? (
                <input
                  type="date"
                  value={isoToDateInput(session.startedAt)}
                  onChange={(e) => updateDate(e.target.value)}
                  className="bg-transparent text-[11px] tabular-nums text-muted-foreground outline-none"
                />
              ) : (
                new Date(session.startedAt).toLocaleDateString(locale, {
                  day: 'numeric', month: 'long', year: 'numeric',
                })
              )}
            </p>
          </div>
          {editing ? (
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500 sm:text-xs">
                {isNew ? t('creating') : t('editing')}
              </span>
              <button
                onClick={cancelEditing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface-2 px-2 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border-subtle transition hover:bg-surface-3 hover:text-foreground active:scale-95 sm:px-3"
                aria-label={t('cancelEditing')}
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('cancelEditing')}</span>
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => { setEditing(true); setPickerOpen(true) }}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-user-500 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-user-600 active:scale-95 sm:px-3"
                aria-label={t('addExercise')}
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('addExercise')}</span>
              </button>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-surface-2 px-2.5 py-2 text-xs font-semibold text-foreground ring-1 ring-inset ring-border-subtle transition hover:bg-surface-3 active:scale-95 sm:px-3"
                aria-label={t('edit')}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('edit')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {session.exercises.map((log, i) => {
          const exercise = EXERCISES_BY_ID[log.exerciseId]
          if (!exercise) return null
          return (
            <ExerciseCard
              key={log.id}
              exercise={exercise}
              log={log}
              unit={session.unit}
              locale={locale}
              t={t}
              editing={editing}
              isFirst={i === 0}
              isLast={i === session.exercises.length - 1}
              onMoveUp={() => moveExercise(log.id, 'up')}
              onMoveDown={() => moveExercise(log.id, 'down')}
              onRemove={() => removeExercise(log.id)}
              onOpenDetails={() => setDetailsFor(exercise)}
              onAddSet={() => addSet(log.id)}
              onUpdateSet={(setId, patch) => updateSet(log.id, setId, patch)}
              onRemoveSet={(setId) => removeSet(log.id, setId)}
              onToggleUnit={toggleUnit}
            />
          )
        })}

        {editing && (
          <button
            onClick={() => setPickerOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-subtle bg-surface-1/40 px-4 py-4 text-sm font-semibold text-muted-foreground transition hover:border-user-500/60 hover:bg-user-500/5 hover:text-user-500"
          >
            <Plus className="h-4 w-4" />
            {t('addExercise')}
          </button>
        )}

        {session.exercises.length === 0 && (
          <p className="px-2 py-3 text-center text-sm text-muted-foreground">
            {t('emptySessionHint')}
          </p>
        )}
      </div>

      {/* Save + Delete */}
      {editing && (
        <div className="mt-4 flex items-center justify-center gap-2.5">
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
          >
            {t('save')}
          </button>
          <button
            onClick={deleteWorkout}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-4 py-1.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-border-subtle transition hover:bg-red-500/10 hover:ring-red-500/40 active:scale-95"
          >
            <Trash2 className="h-3 w-3" />
            {t('deleteWorkout')}
          </button>
        </div>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={addExercise}
      />

      {detailsFor && (
        <ExerciseDetailsModal
          exercise={detailsFor}
          locale={locale}
          onClose={() => setDetailsFor(null)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={() => {
            confirmDialog.onConfirm()
            setConfirmDialog(null)
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  )
}

// ─── Per-exercise card ────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise
  log: ExerciseLog
  unit: string
  locale: string
  t: ReturnType<typeof useTranslations>
  editing: boolean
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onOpenDetails: () => void
  onAddSet: () => void
  onUpdateSet: (setId: string, patch: Partial<SetLog>) => void
  onRemoveSet: (setId: string) => void
  onToggleUnit: () => void
}

function ExerciseCard({
  exercise,
  log,
  unit,
  locale,
  t,
  editing,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onOpenDetails,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
  onToggleUnit,
}: ExerciseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const workSets = log.sets.filter((s) => !s.isWarmup)

  return (
    <div className="relative rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
      {/* Header row */}
      <div
        className={cn('flex items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4', log.sets.length > 0 && 'cursor-pointer select-none')}
        onClick={log.sets.length > 0 ? () => setCollapsed((c) => !c) : undefined}
      >
        {/* Square animated thumbnail */}
        <div className="shrink-0 overflow-hidden rounded-2xl ring-1 ring-inset ring-border-subtle">
          <ExerciseMedia
            frames={exercise.mediaFrames}
            alt={exercise.name.en}
            size="xl"
            fit="cover"
          />
        </div>

        {/* Name / subtitle */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">
            {localizedName(exercise.name, locale)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t(`muscles.${exercise.primaryMuscle}`)} · {t(`equipment.${exercise.equipment}`)}
          </p>
          <button
            type="button"
            onClick={onOpenDetails}
            className="mt-1 text-[11px] font-medium text-user-500 transition hover:text-user-400"
          >
            {t('details')}
          </button>
        </div>

        {/* Controls */}
        <div className="flex shrink-0 items-center gap-0.5">
          {!editing && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
              className="rounded-xl p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"
              aria-label="Remove exercise"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {log.sets.length > 0 && (
            <ChevronDown
              className={cn('h-4 w-4 text-muted-foreground transition-transform', collapsed && '-rotate-90')}
            />
          )}
          {editing && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-hover-overlay hover:text-foreground"
                aria-label="More"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl bg-surface-1 shadow-lg ring-1 ring-inset ring-border-subtle">
                    <button
                      onClick={() => { setMenuOpen(false); onOpenDetails() }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-hover-overlay"
                    >
                      <Info className="h-4 w-4 text-user-500" />
                      {t('details')}
                    </button>
                    <button
                      disabled={isFirst}
                      onClick={() => { setMenuOpen(false); onMoveUp() }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-hover-overlay disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                      {t('moveUp')}
                    </button>
                    <button
                      disabled={isLast}
                      onClick={() => { setMenuOpen(false); onMoveDown() }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground transition hover:bg-hover-overlay disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                      {t('moveDown')}
                    </button>
                    <div className="h-px bg-border-subtle" />
                    <button
                      onClick={() => { setMenuOpen(false); onRemove() }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('removeExercise')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {(log.sets.length > 0 || editing) && !collapsed && (
        <div className="px-2 pb-3 sm:px-3">
            {log.sets.length > 0 && (
              <div className={cn(
                'grid items-center gap-1.5 px-1 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:gap-2',
                editing
                  ? 'grid-cols-[40px_1fr_1fr_40px] sm:grid-cols-[48px_1fr_1fr_44px]'
                  : 'grid-cols-[40px_1fr_1fr] sm:grid-cols-[48px_1fr_1fr]',
              )}>
                <span className="text-center">{t('setShort')}</span>
                <span className="text-center">{t('weight')}</span>
                <span className="text-center">{t('reps')}</span>
                {editing && <span />}
              </div>
            )}
            <ul className="space-y-1">
              {log.sets.map((setItem, i) => (
                <SetRow
                  key={setItem.id}
                  index={i + 1}
                  set={setItem}
                  unit={unit}
                  editing={editing}
                  warmupLabel={t('warmupShort')}
                  onChange={(patch) => onUpdateSet(setItem.id, patch)}
                  onRemove={() => onRemoveSet(setItem.id)}
                  onToggleUnit={onToggleUnit}
                />
              ))}
            </ul>
            {editing && (
              <button
                onClick={onAddSet}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-2 text-xs font-semibold text-muted-foreground ring-1 ring-inset ring-border-subtle transition hover:bg-surface-3 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('addSet')}
              </button>
            )}
        </div>
      )}
    </div>
  )
}

// ─── Set row ──────────────────────────────────────────────────────────

interface SetRowProps {
  index: number
  set: SetLog
  unit: string
  editing: boolean
  warmupLabel: string
  onChange: (patch: Partial<SetLog>) => void
  onRemove: () => void
  onToggleUnit: () => void
}

function SetRow({
  index,
  set,
  unit,
  editing,
  warmupLabel,
  onChange,
  onRemove,
  onToggleUnit,
}: SetRowProps) {
  const isWarmup = !!set.isWarmup
  return (
    <li
      className={cn(
        'grid items-center gap-1.5 rounded-xl px-1 py-1.5 transition sm:gap-2',
        editing
          ? 'grid-cols-[40px_1fr_1fr_40px] sm:grid-cols-[48px_1fr_1fr_44px]'
          : 'grid-cols-[40px_1fr_1fr] sm:grid-cols-[48px_1fr_1fr]',
        isWarmup ? 'bg-amber-500/5' : 'hover:bg-surface-2',
      )}
    >
      {/* Set badge — tap to toggle warmup (only in edit mode) */}
      <button
        type="button"
        onClick={() => editing && onChange({ isWarmup: !isWarmup })}
        title={isWarmup ? warmupLabel : undefined}
        aria-pressed={isWarmup}
        className={cn(
          'mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition',
          isWarmup
            ? 'bg-amber-500/20 text-amber-400 ring-1 ring-inset ring-amber-500/40'
            : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle',
          editing && !isWarmup && 'hover:bg-surface-3 hover:text-foreground',
        )}
      >
        {isWarmup ? 'W' : index}
      </button>
      <NumberCell
        value={set.weight}
        placeholder="—"
        unit={unit}
        onCommit={(v) => onChange({ weight: v })}
        onUnitClick={editing ? onToggleUnit : undefined}
        readOnly={!editing}
      />
      <NumberCell
        value={set.reps}
        placeholder="—"
        unit="x"
        onCommit={(v) => onChange({ reps: v })}
        integer
        readOnly={!editing}
      />
      {editing ? (
        <button
          type="button"
          onClick={onRemove}
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-red-500/10 hover:text-red-400"
          aria-label="Remove set"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </li>
  )
}

interface NumberCellProps {
  value: number | null
  placeholder?: string
  integer?: boolean
  readOnly?: boolean
  unit?: string
  onUnitClick?: () => void
  onCommit: (v: number | null) => void
}

function NumberCell({ value, placeholder, integer, readOnly, unit, onUnitClick, onCommit }: NumberCellProps) {
  const [local, setLocal] = useState<string>(value == null ? '' : String(value))
  useEffect(() => {
    setLocal(value == null ? '' : String(value))
  }, [value])

  if (readOnly) {
    return (
      <div className="relative flex h-9 w-full items-center rounded-xl bg-surface-2/50 ring-1 ring-inset ring-border-subtle">
        {value != null ? (
          <>
            <span className={cn('pl-3 text-sm font-semibold tabular-nums text-foreground', unit ? 'pr-7' : 'w-full text-center')}>{value}</span>
            {unit && (
              onUnitClick
                ? <button type="button" onClick={onUnitClick} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-user-500 transition hover:text-user-400 active:scale-95">{unit}</button>
                : <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-foreground">{unit}</span>
            )}
          </>
        ) : (
          <span className="w-full text-center text-sm font-semibold text-muted-foreground">—</span>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="number"
        inputMode={integer ? 'numeric' : 'decimal'}
        step={integer ? 1 : 'any'}
        min={0}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const trimmed = local.trim()
          if (trimmed === '') {
            onCommit(null)
            return
          }
          const num = Number(trimmed)
          if (Number.isFinite(num) && num >= 0) onCommit(integer ? Math.round(num) : num)
          else setLocal(value == null ? '' : String(value))
        }}
        className={cn(
          'h-9 w-full rounded-xl bg-surface-2 text-sm font-semibold tabular-nums text-foreground outline-none ring-1 ring-inset ring-border-subtle transition focus:bg-surface-3 focus:ring-2 focus:ring-user-500/60',
          unit ? 'pl-3 pr-7' : 'px-3 text-center',
        )}
      />
      {unit && (
        onUnitClick
          ? <button type="button" onClick={onUnitClick} className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-user-500 transition hover:text-user-400 active:scale-95">{unit}</button>
          : <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm font-semibold tabular-nums text-foreground">{unit}</span>
      )}
    </div>
  )
}

// ─── Confirm dialog ───────────────────────────────────────────────────

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useTranslations('common')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
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

// ─── Details modal ────────────────────────────────────────────────────

interface ExerciseDetailsModalProps {
  exercise: Exercise
  locale: string
  onClose: () => void
}

function ExerciseDetailsModal({ exercise, locale, onClose }: ExerciseDetailsModalProps) {
  const t = useTranslations('workouts')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
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

  const instruction = localizedText(exercise.instructions, locale)

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-surface-1 shadow-2xl ring-1 ring-inset ring-border-subtle md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
          <p className="text-sm font-bold text-foreground">{t('details')}</p>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-hover-overlay hover:text-foreground active:scale-95"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          <div className="mx-auto w-full max-w-xs sm:max-w-sm overflow-hidden rounded-2xl ring-1 ring-inset ring-border-subtle">
            <ExerciseMedia
              frames={exercise.mediaFrames}
              alt={exercise.name.en}
              size="lg"
              intervalMs={800}
            />
          </div>
          <h3 className="mt-4 text-xl font-bold text-foreground">
            {localizedName(exercise.name, locale)}
          </h3>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <DetailRow label={t('primaryMuscle')}>
              {t(`muscles.${exercise.primaryMuscle}`)}
            </DetailRow>
            <DetailRow label={t('equipmentLabel')}>
              {t(`equipment.${exercise.equipment}`)}
            </DetailRow>
            {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
              <DetailRow label={t('secondaryMuscles')} colSpan>
                {exercise.secondaryMuscles.map((m) => t(`muscles.${m}`)).join(' · ')}
              </DetailRow>
            )}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('instructions')}
            </p>
            <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {instruction ?? t('noInstructions')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  children,
  colSpan,
}: {
  label: string
  children: React.ReactNode
  colSpan?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl bg-surface-2 px-3 py-2 ring-1 ring-inset ring-border-subtle',
        colSpan && 'col-span-2',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{children}</p>
    </div>
  )
}
