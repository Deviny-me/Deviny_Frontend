'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { 
  PlayCircle,
  BookOpen,
  Loader2,
  Dumbbell,
  Apple,
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
  const [filter, setFilter] = useState<'all' | 'training' | 'meal'>('all')

  const loadPurchases = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await purchasesApi.getMyPurchases()
      setPrograms(data)
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

  const filteredPrograms = programs.filter(p => {
    if (filter === 'all') return true
    return p.programType === filter
  })

  const trainingCount = programs.filter(p => p.programType === 'training').length
  const mealCount = programs.filter(p => p.programType === 'meal').length

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {/* Filter Tabs (only if there are programs) */}
        {!isLoading && !error && programs.length > 0 && (
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1">
            <button
              onClick={() => setFilter('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#0c8de6] text-foreground'
                  : 'bg-surface-3 text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {tc('all')} ({programs.length})
            </button>
            {trainingCount > 0 && (
              <button
                onClick={() => setFilter('training')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'training'
                    ? 'bg-orange-500 text-foreground'
                    : 'bg-surface-3 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Dumbbell className="w-4 h-4" /> {t('training')} ({trainingCount})
              </button>
            )}
            {mealCount > 0 && (
              <button
                onClick={() => setFilter('meal')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  filter === 'meal'
                    ? 'bg-green-600 text-foreground'
                    : 'bg-surface-3 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                <Apple className="w-4 h-4" /> {t('nutrition')} ({mealCount})
              </button>
            )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#0c8de6] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 bg-surface-3 rounded-xl border border-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('errorLoading')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={loadPurchases}
              className="px-6 py-2 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {tc('tryAgain')}
            </button>
          </div>
        )}

        {/* Programs Grid */}
        {!isLoading && !error && filteredPrograms.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPrograms.map((program) => (
              <div
                key={program.purchaseId}
                onClick={() => router.push(`/user/journey/${program.purchaseId}`)}
                className="bg-surface-3 rounded-xl border border-border overflow-hidden cursor-pointer hover:border-[#0c8de6]/50 transition-all group"
              >
                {/* Cover */}
                <div className="relative h-40">
                  {program.coverImageUrl ? (
                    <img
                      src={getMediaUrl(program.coverImageUrl) || ''}
                      alt={program.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0c8de6]/20 to-[#0070c4]/20 flex items-center justify-center">
                      {program.programType === 'training' 
                        ? <Dumbbell className="w-12 h-12 text-gray-600" />
                        : <Apple className="w-12 h-12 text-gray-600" />
                      }
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded text-foreground ${
                      program.programType === 'training' ? 'bg-orange-500' : 'bg-green-600'
                    }`}>
                      {program.programType === 'training' ? t('training') : t('nutrition')}
                    </span>
                  </div>
                  {/* Tier badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded text-foreground ${
                      program.tier === 'Pro' ? 'bg-purple-600'
                        : program.tier === 'Standard' ? 'bg-blue-700'
                        : 'bg-gray-600'
                    }`}>
                      {program.tier}
                    </span>
                  </div>
                  {/* Video count */}
                  {program.videoUrls.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs text-foreground">
                      <Video className="w-3 h-3" />
                      {program.videoUrls.length}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-foreground line-clamp-2 min-h-[3rem]">{program.title}</h3>
                  {/* Rating */}
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm text-foreground font-medium">
                      {program.averageRating > 0 ? program.averageRating.toFixed(1) : '—'}
                    </span>
                    {program.totalReviews > 0 && (
                      <span className="text-xs text-faint-foreground">({program.totalReviews})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {program.trainerAvatarUrl ? (
                      <img
                        src={getMediaUrl(program.trainerAvatarUrl) || ''}
                        alt={program.trainerName}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-700" />
                    )}
                    <span className="text-sm text-muted-foreground truncate">{program.trainerName}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-xs text-faint-foreground">
                      {t('purchased')} {new Date(program.purchasedAt).toLocaleDateString()}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-xs font-medium text-foreground">
                      <PlayCircle className="h-3.5 w-3.5 text-[#0c8de6]" />
                      Open
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && programs.length === 0 && (
          <div className="text-center py-12 bg-surface-3 rounded-xl border border-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-faint-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('noPrograms')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('startJourney')}</p>
            <button
              onClick={() => router.push('/user/programs')}
              className="px-6 py-2 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              {t('browsePrograms')}
            </button>
          </div>
        )}

        {/* No results for filter */}
        {!isLoading && !error && programs.length > 0 && filteredPrograms.length === 0 && (
          <div className="text-center py-8 bg-surface-3 rounded-xl border border-border">
            <p className="text-muted-foreground">{t('noResultsFilter')}</p>
          </div>
        )}
      </div>
    </>
  )
}
