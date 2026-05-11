'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { 
  PlayCircle,
  BookOpen,
  Loader2,
  Dumbbell,
  Apple,
  MessageSquare,
  Video,
  Star,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { purchasesApi, PurchasedProgramDto } from '@/lib/api/purchasesApi'
import { getMediaUrl } from '@/lib/config'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export default function MyJourneyPage() {
  const t = useTranslations('journey')
  const tc = useTranslations('common')
  const router = useRouter()
  const [programs, setPrograms] = useState<PurchasedProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'training' | 'meal' | 'consultation'>('all')

  const loadPurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await purchasesApi.getMyPurchases()
      const seen = new Set<string>()
      const unique = data.filter(p => {
        if (seen.has(p.purchaseId)) return false
        seen.add(p.purchaseId)
        return true
      })
      setPrograms(unique)
    } catch (err) {
      console.error('Failed to fetch purchased programs:', err)
      setError(t('errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  useRealtimeScopeRefresh(['purchases', 'programs'], () => {
    loadPurchases()
  })

  const isConsultation = (p: PurchasedProgramDto) => p.category === 'Consultation'

  const filteredPrograms = programs.filter(p => {
    if (filter === 'all') return true
    if (filter === 'consultation') return isConsultation(p)
    if (filter === 'meal') return p.programType === 'meal' && !isConsultation(p)
    return p.programType === 'training' && !isConsultation(p)
  })

  const trainingCount = programs.filter(p => p.programType === 'training' && !isConsultation(p)).length
  const mealCount = programs.filter(p => p.programType === 'meal' && !isConsultation(p)).length
  const consultationCount = programs.filter(isConsultation).length

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Filter chips */}
      {!isLoading && !error && programs.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
              filter === 'all'
                ? 'bg-user-500 text-white shadow-sm'
                : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
            }`}
          >
            {tc('all')} ({programs.length})
          </button>
          {trainingCount > 0 && (
            <button
              onClick={() => setFilter('training')}
              className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filter === 'training'
                  ? 'bg-user-500 text-white shadow-sm'
                  : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              <Dumbbell className="h-3 w-3" /> {t('training')} ({trainingCount})
            </button>
          )}
          {mealCount > 0 && (
            <button
              onClick={() => setFilter('meal')}
              className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filter === 'meal'
                  ? 'bg-user-500 text-white shadow-sm'
                  : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              <Apple className="h-3 w-3" /> {t('nutrition')} ({mealCount})
            </button>
          )}
          {consultationCount > 0 && (
            <button
              onClick={() => setFilter('consultation')}
              className={`shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                filter === 'consultation'
                  ? 'bg-user-500 text-white shadow-sm'
                  : 'bg-surface-2 text-muted-foreground ring-1 ring-inset ring-border-subtle hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-3 w-3" /> {t('consultation')} ({consultationCount})
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-user-500" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-base font-semibold text-foreground">{t('errorLoading')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            onClick={loadPurchases}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-user-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-user-600 active:scale-95"
          >
            {tc('tryAgain')}
          </button>
        </div>
      )}

      {/* Programs grid */}
      {!isLoading && !error && filteredPrograms.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPrograms.map((program) => (
            <button
              key={program.purchaseId}
              onClick={() => router.push(`/user/journey/${program.purchaseId}`)}
              className="group relative flex flex-col text-left rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden hover:ring-border-strong hover:shadow-lg hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-user-500/60"
            >
              {/* Cover */}
              <div className="relative aspect-video w-full overflow-hidden bg-surface-2">
                {program.coverImageUrl ? (
                  <img
                    src={getMediaUrl(program.coverImageUrl) || ''}
                    alt={program.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {program.programType === 'training' || isConsultation(program)
                      ? <Dumbbell className="h-10 w-10 text-muted-foreground/40" />
                      : <Apple className="h-10 w-10 text-muted-foreground/40" />
                    }
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute left-2 top-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    isConsultation(program)
                      ? 'bg-violet-500'
                      : program.programType === 'training' ? 'bg-orange-500' : 'bg-emerald-500'
                  }`}>
                    {isConsultation(program)
                      ? t('consultation')
                      : program.programType === 'training' ? t('training') : t('nutrition')}
                  </span>
                </div>

                {/* Tier badge */}
                <div className="absolute right-2 top-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    program.tier === 'Pro' ? 'bg-violet-500'
                      : program.tier === 'Standard' ? 'bg-user-500'
                      : 'bg-surface-3/80'
                  }`}>
                    {program.tier}
                  </span>
                </div>

                {/* Video count */}
                {program.videoUrls.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
                    <Video className="h-3 w-3" />
                    {program.videoUrls.length}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
                  {program.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-semibold text-foreground">
                    {program.averageRating > 0 ? program.averageRating.toFixed(1) : '—'}
                  </span>
                  {program.totalReviews > 0 && (
                    <span className="text-xs text-muted-foreground">({program.totalReviews})</span>
                  )}
                </div>

                {/* Trainer */}
                <div className="flex items-center gap-1.5 min-w-0">
                  {program.trainerAvatarUrl ? (
                    <img
                      src={getMediaUrl(program.trainerAvatarUrl) || ''}
                      alt={program.trainerName}
                      className="h-5 w-5 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-5 w-5 shrink-0 rounded-full bg-surface-3" />
                  )}
                  <span className="truncate text-xs text-muted-foreground">{program.trainerName}</span>
                </div>

                {/* Footer */}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    {t('purchased')} {new Date(program.purchasedAt).toLocaleDateString()}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-user-500/10 px-2.5 py-1 text-[11px] font-semibold text-user-500">
                    <PlayCircle className="h-3.5 w-3.5" />
                    {tc('open')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty — no purchases at all */}
      {!isLoading && !error && programs.length === 0 && (
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground">{t('noPrograms')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('startJourney')}</p>
          <button
            onClick={() => router.push('/user/programs')}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-user-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-user-600 active:scale-95"
          >
            {t('browsePrograms')}
          </button>
        </div>
      )}

      {/* Empty — filter has no results */}
      {!isLoading && !error && programs.length > 0 && filteredPrograms.length === 0 && (
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-10 text-center">
          <p className="text-sm text-muted-foreground">{t('noResultsFilter')}</p>
        </div>
      )}
    </div>
  )
}
