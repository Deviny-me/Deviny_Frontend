'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { EXERCISES, EQUIPMENT_LIST, MUSCLE_GROUPS } from '@/lib/data/exercises'
import type { Equipment, Exercise, MuscleGroup } from '@/types/workout'
import { ExerciseMedia } from './ExerciseMedia'
import { MuscleIcon } from './MuscleIcon'
import { cn } from '@/lib/utils/cn'

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
}

function localized(name: Exercise['name'], locale: string): string {
  if (locale.startsWith('ru')) return name.ru
  if (locale.startsWith('az')) return name.az
  return name.en
}

/**
 * Bottom-sheet style exercise picker with fuzzy(ish) search and filters.
 */
export function ExercisePicker({ open, onClose, onPick }: ExercisePickerProps) {
  const t = useTranslations('workouts')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all')

  useEffect(() => {
    if (open) {
      setQuery('')
      setMuscle('all')
      setEquipment('all')
    }
  }, [open])

  // Lock body scroll while picker is open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return EXERCISES.filter((ex) => {
      if (muscle !== 'all' && ex.primaryMuscle !== muscle && !(ex.secondaryMuscles?.includes(muscle))) {
        return false
      }
      if (equipment !== 'all' && ex.equipment !== equipment) return false
      if (!q) return true
      const aliasParts = [
        ...(ex.aliases?.en ?? []),
        ...(ex.aliases?.ru ?? []),
        ...(ex.aliases?.az ?? []),
      ].join(' ')
      const haystack = [
        ex.name.en,
        ex.name.ru,
        ex.name.az,
        ex.slug,
        ex.primaryMuscle,
        ...(ex.secondaryMuscles ?? []),
        ex.equipment,
        // Localized muscle/equipment labels so users can search by translated
        // category names (e.g. "пресс", "грудь", "штанга", "ştanq").
        t(`muscles.${ex.primaryMuscle}`),
        t(`equipment.${ex.equipment}`),
        aliasParts,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [query, muscle, equipment, t])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm md:items-center">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex h-[100dvh] w-full max-w-2xl flex-col bg-surface-1 shadow-2xl ring-1 ring-inset ring-border-subtle md:h-[88vh] md:max-w-4xl md:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('pickExercise')}</h2>
            <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">{results.length} {t('exercisesFound')}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground transition hover:bg-hover-overlay hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="space-y-3 border-b border-border-subtle px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchExercise')}
              className="h-11 w-full rounded-xl bg-surface-2 pl-10 pr-4 text-sm text-foreground outline-none ring-1 ring-inset ring-border-subtle transition focus:ring-2 focus:ring-user-500"
            />
          </div>

          {/* Muscle filter */}
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            <Chip active={muscle === 'all'} onClick={() => setMuscle('all')}>
              {t('all')}
            </Chip>
            {MUSCLE_GROUPS.map((m) => (
              <Chip key={m.key} active={muscle === m.key} onClick={() => setMuscle(m.key)}>
                <MuscleIcon muscle={m.key} className="mr-1.5" />
                {t(`muscles.${m.key}`)}
              </Chip>
            ))}
          </div>

          {/* Equipment filter */}
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-1">
            <Chip active={equipment === 'all'} onClick={() => setEquipment('all')} small>
              {t('all')}
            </Chip>
            {EQUIPMENT_LIST.map((e) => (
              <Chip key={e} active={equipment === e} onClick={() => setEquipment(e)} small>
                {t(`equipment.${e}`)}
              </Chip>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">{t('noResults')}</p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {results.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => {
                      onPick(ex)
                      onClose()
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl bg-surface-2 p-3 text-left ring-1 ring-inset ring-border-subtle transition hover:bg-surface-3 hover:ring-user-500/50 md:flex-col md:items-start md:gap-3 md:p-4"
                  >
                    <ExerciseMedia frames={ex.mediaFrames} alt={ex.name.en} size="md" className="md:h-32 md:w-full md:rounded-xl" />
                    <div className="min-w-0 flex-1 md:flex-none">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {localized(ex.name, locale)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {t(`muscles.${ex.primaryMuscle}`)} · {t(`equipment.${ex.equipment}`)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 font-medium transition',
        small ? 'h-7 text-xs' : 'h-8 text-xs',
        active
          ? 'bg-user-500 text-white shadow-sm'
          : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
