'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Star,
  Users,
  BookOpen,
  Award,
  Loader2,
  MessageCircle,
  UserCheck,
  UserPlus,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { trainersApi } from '@/lib/api/trainersApi'
import { ExpertsFilterModal } from '@/components/shared/ExpertsFilterModal'
import type { ExpertsFilterParams } from '@/lib/api/trainersApi'
import { followsApi } from '@/lib/api/friendsApi'
import { PublicTrainerDto } from '@/types/trainer'
import { FriendDto } from '@/types/friend'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { cn } from '@/lib/utils/cn'

interface ExpertsContentProps {
  basePath: string
}

export function ExpertsContent({ basePath }: ExpertsContentProps) {
  const router = useRouter()
  const accent = useAccentColors()
  const t = useTranslations('experts')
  const tc = useTranslations('common')
  const { user: currentUser } = useAuth()
  const [trainers, setTrainers] = useState<PublicTrainerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'Trainer' | 'Nutritionist'>('all')
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const [followLoading, setFollowLoading] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState<ExpertsFilterParams>({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const loadingMoreRef = useRef(false)
  const activeFilterCount = [filters.country, filters.city, filters.gender, filters.specialization, filters.minRating && filters.minRating > 0 ? 'r' : ''].filter(Boolean).length
  const PAGE_SIZE = 20

  const fetchData = useCallback(async (showSpinner = true) => {
      try {
        if (showSpinner) setLoading(true)
        setError(null)
        const [data, followingData] = await Promise.all([
          trainersApi.getAll(1, PAGE_SIZE, filters),
          followsApi.getMyFollowing(1, 100).catch(() => ({ items: [] as FriendDto[], totalCount: 0, page: 1, pageSize: 100 })),
        ])
        setTrainers(data.items)
        setPage(1)
        setHasMore(data.items.length < data.totalCount)
        setFollowedIds(new Set(followingData.items.map((f) => f.id)))
      } catch (err) {
        console.error('Failed to fetch trainers:', err)
        setError(t('failedToLoad'))
      } finally {
        if (showSpinner) setLoading(false)
      }
    }, [filters, t])

  useEffect(() => {
    fetchData(true)
  }, [fetchData])

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return

    try {
      loadingMoreRef.current = true
      setLoadingMore(true)
      const nextPage = page + 1
      const data = await trainersApi.getAll(nextPage, PAGE_SIZE, filters)
      setTrainers(prev => {
        const existingIds = new Set(prev.map((trainer) => trainer.id))
        const nextItems = data.items.filter((trainer) => !existingIds.has(trainer.id))
        return [...prev, ...nextItems]
      })
      setPage(data.page)
      setHasMore(data.page * data.pageSize < data.totalCount)
    } catch (err) {
      console.error('Failed to load more:', err)
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [filters, hasMore, loading, page])

  const infiniteScrollRef = useInfiniteScroll({
    enabled: !loading && !error && hasMore,
    onLoadMore: loadMore,
  })

  useRealtimeScopeRefresh(['follows'], () => {
    fetchData(false)
  })

  // Re-sort trainers when currentUser becomes available (push own card first)
  useEffect(() => {
    if (currentUser?.id && trainers.length > 0) {
      setTrainers(prev =>
        [...prev].sort((a, b) => (a.userId === currentUser.id ? -1 : b.userId === currentUser.id ? 1 : 0))
      )
    }
  }, [currentUser?.id])

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    if (followLoading) return
    setFollowLoading(userId)
    try {
      if (followedIds.has(userId)) {
        await followsApi.unfollowTrainer(userId)
        setFollowedIds(prev => { const s = new Set(prev); s.delete(userId); return s })
      } else {
        await followsApi.followTrainer(userId)
        setFollowedIds(prev => new Set(prev).add(userId))
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err)
    } finally {
      setFollowLoading(null)
    }
  }

  const handleMessage = (e: React.MouseEvent, trainer: PublicTrainerDto) => {
    e.stopPropagation()
    const params = new URLSearchParams({ userId: trainer.userId })
    if (trainer.name) params.set('userName', trainer.name)
    if (trainer.avatarUrl) params.set('userAvatar', trainer.avatarUrl)
    router.push(`${basePath}/messages?${params.toString()}`)
  }

  const filteredTrainers = useMemo(() => trainers.filter((trainer) => {
    const matchesSearch =
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.primaryTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    const normalizedRole = String(trainer.role ?? '').trim().toLowerCase()
    const matchesRole = roleFilter === 'all' || normalizedRole === roleFilter.toLowerCase()
    return matchesSearch && matchesRole
  }), [roleFilter, searchQuery, trainers])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-6 h-6 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4 pb-10">
        {/* ─── Header ─── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {/* ─── Search + Filters bar ─── */}
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-3 sm:p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-surface-2 ring-1 ring-inset ring-border-subtle rounded-xl text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-[background-color,color] duration-200 ease-out-expo"
              aria-label="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-1"
                  style={{ background: accent.primary }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Role chips */}
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-border-subtle">
              {([
                { key: 'all' as const, label: t('filterAll'), text: 'text-foreground', ring: 'ring-border-subtle' },
                { key: 'Trainer' as const, label: t('filterTrainers'), text: 'text-trainer-600 dark:text-trainer-300', ring: 'ring-trainer-500/30' },
                { key: 'Nutritionist' as const, label: t('filterNutritionists'), text: 'text-nutritionist-600 dark:text-nutritionist-300', ring: 'ring-nutritionist-500/30' },
              ]).map(({ key, label, text, ring }) => {
                const isActive = roleFilter === key
                return (
                  <button
                    key={key}
                    onClick={() => setRoleFilter(key)}
                    className={cn(
                      'inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ease-out-expo',
                      isActive
                        ? cn('bg-surface-1 shadow-xs ring-1 ring-inset', text, ring)
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 mb-4">
              <Search className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{t('errorLoading')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className={`inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r ${accent.gradient} text-white text-sm font-semibold hover:opacity-90 transition-opacity`}
            >
              {tc('tryAgain')}
            </button>
          </div>
        )}

        {/* Trainers Grid */}
        {!loading && !error && (
          <>
            {filteredTrainers.length === 0 ? (
              <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{t('noTrainers')}</h3>
                <p className="text-sm text-muted-foreground">{t('tryDifferentSearch')}</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filteredTrainers.map((trainer, index) => {
                  const trainerAccent = getAccentColorsByRole(trainer.role)
                  const isSelf = trainer.userId === currentUser?.id
                  const isFollowing = followedIds.has(trainer.userId)
                  const roleLabel = trainer.primaryTitle || (trainer.role === 'Nutritionist' ? t('nutritionistRole') : t('trainerRole'))

                  return (
                    <motion.div
                      key={trainer.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => router.push(`${basePath}/profile/${trainer.userId}`)}
                      className="group relative flex flex-col rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden hover:ring-border-strong hover:shadow-lg hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-300 ease-out-expo cursor-pointer"
                    >
                      {/* Accent strip */}
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{ background: `linear-gradient(to right, ${trainerAccent.primary}, ${trainerAccent.secondary})` }}
                      />

                      <div className="p-4 sm:p-5 flex items-start gap-3.5">
                        {trainer.avatarUrl ? (
                          <img
                            src={getMediaUrl(trainer.avatarUrl) || '/default-avatar.png'}
                            alt={trainer.name}
                            className={cn('w-14 h-14 rounded-2xl object-cover ring-2 ring-offset-2 ring-offset-surface-1', getRoleRingClass(trainer.role))}
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-2xl grid place-items-center ring-2 ring-offset-2 ring-offset-surface-1"
                            style={{
                              background: `linear-gradient(to bottom right, ${trainerAccent.primary}, ${trainerAccent.secondary})`,
                              // @ts-expect-error tw color
                              '--tw-ring-color': `${trainerAccent.primary}55`,
                            }}
                          >
                            <span className="text-white text-lg font-bold">{trainer.name.charAt(0)}</span>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h3 className={cn('font-semibold text-foreground truncate transition-colors', trainerAccent.groupHoverText)}>
                            {trainer.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">{roleLabel}</p>
                          {trainer.location && (
                            <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-faint-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{trainer.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Specs */}
                      {trainer.specializations.length > 0 && (
                        <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1">
                          {trainer.specializations.slice(0, 3).map((spec, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground text-[10px] font-medium">
                              {spec}
                            </span>
                          ))}
                          {trainer.specializations.length > 3 && (
                            <span className="px-2 py-0.5 rounded-md bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground text-[10px] font-medium">
                              +{trainer.specializations.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mt-auto px-4 sm:px-5 py-3 border-t border-border-subtle flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span className="font-medium text-foreground tabular-nums">
                              {trainer.ratingValue > 0 ? trainer.ratingValue.toFixed(1) : '0'}
                            </span>
                            <span className="text-faint-foreground tabular-nums">({trainer.reviewsCount})</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span className="tabular-nums">{trainer.programsCount}</span>
                          </span>
                          {trainer.experienceYears != null && trainer.experienceYears > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              <span className="tabular-nums">{trainer.experienceYears}+</span>
                            </span>
                          )}
                        </div>

                        {!isSelf && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => handleMessage(e, trainer)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
                              aria-label="Message"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleFollow(e, trainer.userId)}
                              disabled={followLoading === trainer.userId}
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 h-8 text-[11px] font-semibold rounded-lg transition-all disabled:opacity-50',
                                isFollowing
                                  ? cn('bg-surface-2 ring-1 ring-inset ring-border-subtle', trainerAccent.text, 'hover:ring-border-strong')
                                  : `text-white hover:opacity-90 bg-gradient-to-r ${trainerAccent.gradient}`,
                              )}
                            >
                              {followLoading === trainer.userId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isFollowing ? (
                                <UserCheck className="w-3.5 h-3.5" />
                              ) : (
                                <UserPlus className="w-3.5 h-3.5" />
                              )}
                              {isFollowing ? t('following') : t('follow')}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {!loading && !error && (
          <div ref={infiniteScrollRef} className="flex min-h-12 justify-center pt-2">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('loading')}
              </div>
            ) : !hasMore && trainers.length > 0 ? (
              <p className="text-xs text-faint-foreground">{tc('allItemsLoaded')}</p>
            ) : null}
          </div>
        )}
      </div>

      <ExpertsFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </>
  )
}
