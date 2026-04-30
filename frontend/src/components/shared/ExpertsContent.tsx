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
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="page-title mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-surface-2 border border-border-subtle rounded-xl pl-12 pr-4 py-3 text-foreground placeholder:text-faint-foreground focus:outline-none ${accent.focusBorder}`}
          />
        </div>
        <button
          onClick={() => setShowFilterModal(true)}
          className="relative flex items-center justify-center w-12 h-12 bg-surface-2 border border-border-subtle rounded-xl hover:border-border transition-colors shrink-0"
        >
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          {activeFilterCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
              style={{ background: accent.primary }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Role Filter */}
      <div className="flex gap-2">
        {(['all', 'Trainer', 'Nutritionist'] as const).map((role) => {
          const isActive = roleFilter === role
          const roleAccent = role === 'all' ? null : getAccentColorsByRole(role)
          return (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? role === 'all'
                    ? 'bg-white text-black'
                    : `bg-gradient-to-r ${roleAccent!.gradient} text-white`
                  : 'bg-surface-2 border border-border-subtle text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {role === 'all' ? t('filterAll') : role === 'Trainer' ? t('filterTrainers') : t('filterNutritionists')}
            </button>
          )
        })}
      </div>

      {/* Error State */}
      {error && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t('errorLoading')}</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className={`mt-4 px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white rounded-lg text-sm`}
          >
            {tc('tryAgain')}
          </button>
        </div>
      )}

      {/* Trainers Grid */}
      {!loading && !error && (
        <>
          {filteredTrainers.length === 0 ? (
            <div className="bg-surface-2 rounded-xl border border-border-subtle p-8 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-foreground font-semibold mb-2">{t('noTrainers')}</h3>
              <p className="text-muted-foreground text-sm">{t('tryDifferentSearch')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTrainers.map((trainer, index) => {
                const trainerAccent = getAccentColorsByRole(trainer.role)
                return (
                  <motion.div
                    key={trainer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => router.push(`${basePath}/profile/${trainer.userId}`)}
                    className={`bg-surface-2 rounded-xl border border-border-subtle p-5 ${trainerAccent.hoverBorder} transition-all cursor-pointer group`}
                  >
                    <div className="flex items-start gap-4">
                      {trainer.avatarUrl ? (
                        <img
                          src={getMediaUrl(trainer.avatarUrl) || '/default-avatar.png'}
                          alt={trainer.name}
                          className={`w-16 h-16 rounded-xl object-cover ${getRoleRingClass(trainer.role)}`}
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${trainerAccent.gradient} flex items-center justify-center`}>
                          <span className="text-white text-xl font-bold">{trainer.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold text-foreground ${trainerAccent.groupHoverText} transition-colors`}>
                            {trainer.name}
                          </h3>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                          {trainer.primaryTitle || (trainer.role === 'Nutritionist' ? t('nutritionistRole') : t('trainerRole'))}
                          {trainer.location && ` • ${trainer.location}`}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {trainer.specializations.slice(0, 3).map((spec, i) => (
                            <span key={i} className="px-2 py-0.5 bg-border-subtle text-muted-foreground text-[10px] rounded">
                              {spec}
                            </span>
                          ))}
                          {trainer.specializations.length > 3 && (
                            <span className="px-2 py-0.5 bg-border-subtle text-muted-foreground rounded text-[10px]">
                              +{trainer.specializations.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-foreground font-medium">{trainer.ratingValue > 0 ? trainer.ratingValue.toFixed(1) : '0.0'}</span>
                          <span>({trainer.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{trainer.programsCount} {t('programs')}</span>
                        </div>
                        {trainer.experienceYears && (
                          <div className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>{trainer.experienceYears}+ {t('years')}</span>
                          </div>
                        )}
                      </div>

                      {trainer.userId !== currentUser?.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleFollow(e, trainer.userId)}
                            disabled={followLoading === trainer.userId}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
                              followedIds.has(trainer.userId)
                                ? `${trainerAccent.bgMuted} ${trainerAccent.text} hover:opacity-80`
                                : `bg-gradient-to-r ${trainerAccent.gradient} text-white hover:opacity-90`
                            }`}
                          >
                            {followLoading === trainer.userId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : followedIds.has(trainer.userId) ? (
                              <UserCheck className="w-3.5 h-3.5" />
                            ) : (
                              <UserPlus className="w-3.5 h-3.5" />
                            )}
                            {followedIds.has(trainer.userId) ? t('following') : t('follow')}
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
        <div ref={infiniteScrollRef} className="flex min-h-12 justify-center pt-4">
          {loadingMore ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('loading')}
            </div>
          ) : !hasMore && trainers.length > 0 ? (
            <p className="text-sm text-faint-foreground">{tc('allItemsLoaded')}</p>
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
