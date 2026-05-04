'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  Search,
  Star,
  Users,
  Loader2,
  SortAsc,
  ChevronDown,
  Dumbbell,
  Apple,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { PublicProgramDto, PublicMealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { ProgramsFilterModal } from '@/components/shared/ProgramsFilterModal'
import type { ProgramsFilterParams } from '@/lib/api/programsApi'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'
import { cn } from '@/lib/utils/cn'

type SortOption = 'newest' | 'popular' | 'rating' | 'price-low' | 'price-high'
type FilterType = 'all' | 'Training' | 'Diet' | 'Consultation'

// Unified type for displaying both program types
type UnifiedPublicProgram = {
  id: string
  title: string
  description: string
  price: number
  standardPrice?: number
  proPrice?: number
  maxStandardSpots?: number
  maxProSpots?: number
  standardSpotsRemaining?: number
  proSpotsRemaining?: number
  code: string
  coverImageUrl: string
  createdAt: string
  trainerId: string
  trainerName: string
  trainerAvatarUrl: string
  trainerSlug: string
  trainerRole: string
  category: ProgramCategory
  // Training-specific (optional)
  averageRating?: number
  totalReviews?: number
  totalPurchases?: number
  latestReviewComment?: string
  latestReviewRating?: number
  latestReviewUserName?: string
  latestReviewCreatedAt?: string
}

function fromTraining(p: PublicProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    standardSpotsRemaining: p.standardSpotsRemaining,
    proSpotsRemaining: p.proSpotsRemaining,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Training',
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
    totalPurchases: p.totalPurchases,
    latestReviewComment: p.latestReviewComment,
    latestReviewRating: p.latestReviewRating,
    latestReviewUserName: p.latestReviewUserName,
    latestReviewCreatedAt: p.latestReviewCreatedAt,
  }
}

function fromMeal(p: PublicMealProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    standardSpotsRemaining: p.standardSpotsRemaining,
    proSpotsRemaining: p.proSpotsRemaining,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Diet',
    averageRating: p.averageRating ?? 0,
    totalReviews: p.totalReviews ?? 0,
    totalPurchases: p.totalPurchases ?? 0,
    latestReviewComment: p.latestReviewComment,
    latestReviewRating: p.latestReviewRating,
    latestReviewUserName: p.latestReviewUserName,
    latestReviewCreatedAt: p.latestReviewCreatedAt,
  }
}

export default function ProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const t = useTranslations('userPrograms')
  const tc = useTranslations('common')

  const [trainingPrograms, setTrainingPrograms] = useState<PublicProgramDto[]>([])
  const [mealPrograms, setMealPrograms] = useState<PublicMealProgramDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [trainingPage, setTrainingPage] = useState(1)
  const [mealPage, setMealPage] = useState(1)
  const [trainingTotalCount, setTrainingTotalCount] = useState(0)
  const [mealTotalCount, setMealTotalCount] = useState(0)
  const [hasMoreTraining, setHasMoreTraining] = useState(false)
  const [hasMoreMeal, setHasMoreMeal] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState<ProgramsFilterParams>({})
  const [showFilterModal, setShowFilterModal] = useState(false)
  const loadingMoreRef = useRef(false)
  const activeFilterCount = [
    filters.minPrice != null ? 'p' : '',
    filters.maxPrice != null ? 'p' : '',
    filters.minRating && filters.minRating > 0 ? 'r' : '',
    filters.tier ? 't' : '',
  ].filter(Boolean).length
  const PAGE_SIZE = 20

  const loadAllPrograms = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [trainingRes, mealRes] = await Promise.all([
        programsApi.getAllPublic(1, PAGE_SIZE, filters),
        mealProgramsApi.getAllPublic(1, PAGE_SIZE, filters),
      ])
      setTrainingPrograms(trainingRes.items)
      setMealPrograms(mealRes.items)
      setTrainingPage(1)
      setMealPage(1)
      setTrainingTotalCount(trainingRes.totalCount)
      setMealTotalCount(mealRes.totalCount)
      setHasMoreTraining(trainingRes.items.length < trainingRes.totalCount)
      setHasMoreMeal(mealRes.items.length < mealRes.totalCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load programs')
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useRealtimeScopeRefresh(['programs', 'purchases'], () => {
    loadAllPrograms()
  })

  // Reload programs on every navigation to this page
  useEffect(() => {
    loadAllPrograms()
  }, [loadAllPrograms, pathname])

  // Reload when tab/window regains focus (user switched back from trainer page)
  useEffect(() => {
    const handleFocus = () => {
      loadAllPrograms()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loadAllPrograms])

  // Deep link: ?program=<id> -> redirect to detail page
  useEffect(() => {
    const programId = searchParams.get('program')
    if (!programId) return
    router.replace(`/user/programs/${programId}`)
  }, [searchParams, router])

  const loadMore = useCallback(async () => {
    if (isLoading || loadingMoreRef.current || (!hasMoreTraining && !hasMoreMeal)) return

    try {
      loadingMoreRef.current = true
      setLoadingMore(true)
      const nextTrainingPage = hasMoreTraining ? trainingPage + 1 : trainingPage
      const nextMealPage = hasMoreMeal ? mealPage + 1 : mealPage

      const [trainingRes, mealRes] = await Promise.all([
        hasMoreTraining ? programsApi.getAllPublic(nextTrainingPage, PAGE_SIZE, filters) : null,
        hasMoreMeal ? mealProgramsApi.getAllPublic(nextMealPage, PAGE_SIZE, filters) : null,
      ])

      if (trainingRes) {
        setTrainingPrograms(prev => {
          const existingIds = new Set(prev.map((program) => program.id))
          const nextItems = trainingRes.items.filter((program) => !existingIds.has(program.id))
          return [...prev, ...nextItems]
        })
        setTrainingPage(trainingRes.page)
        setTrainingTotalCount(trainingRes.totalCount)
        setHasMoreTraining(trainingRes.page * trainingRes.pageSize < trainingRes.totalCount)
      }
      if (mealRes) {
        setMealPrograms(prev => {
          const existingIds = new Set(prev.map((program) => program.id))
          const nextItems = mealRes.items.filter((program) => !existingIds.has(program.id))
          return [...prev, ...nextItems]
        })
        setMealPage(mealRes.page)
        setMealTotalCount(mealRes.totalCount)
        setHasMoreMeal(mealRes.page * mealRes.pageSize < mealRes.totalCount)
      }
    } catch (err) {
      console.error('Failed to load more programs:', err)
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [filters, hasMoreMeal, hasMoreTraining, isLoading, mealPage, trainingPage])

  const infiniteScrollRef = useInfiniteScroll({
    enabled: !isLoading && !error && (hasMoreTraining || hasMoreMeal),
    onLoadMore: loadMore,
  })

  // Build filtered + sorted list
  const allPrograms = useMemo(() => [
    ...trainingPrograms.map(fromTraining),
    ...mealPrograms.map(fromMeal),
  ], [mealPrograms, trainingPrograms])

  const filteredPrograms = useMemo((): UnifiedPublicProgram[] => {
    let result: UnifiedPublicProgram[] = filterType === 'all'
      ? allPrograms
      : allPrograms.filter(p => p.category === filterType)

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.trainerName.toLowerCase().includes(q)
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'popular':
        result.sort((a, b) => (b.totalPurchases ?? 0) - (a.totalPurchases ?? 0))
        break
      case 'rating':
        result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        break
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
    }

    return result
  }, [allPrograms, filterType, searchQuery, sortBy])

  const loadedCount = trainingPrograms.length + mealPrograms.length
  const totalCount = trainingTotalCount + mealTotalCount

  const formatPrice = (price: number) => {
    if (price === 0) return tc('free')
    return `$${price.toFixed(2)}`
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
          {/* Search row */}
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
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-user-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Category chips + Sort */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-border-subtle">
                <button
                  onClick={() => setFilterType('all')}
                  className={cn(
                    'inline-flex items-center px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ease-out-expo',
                    filterType === 'all'
                      ? 'bg-surface-1 text-foreground shadow-xs ring-1 ring-inset ring-border-subtle'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {tc('all')}
                  <span className="ml-1.5 text-[10px] opacity-60 tabular-nums">({allPrograms.length})</span>
                </button>
                {([
                  { cat: 'Training' as FilterType, icon: Dumbbell, label: t('training'), count: allPrograms.filter(p => p.category === 'Training').length, activeText: 'text-trainer-600 dark:text-trainer-300', activeRing: 'ring-trainer-500/30' },
                  { cat: 'Diet' as FilterType, icon: Apple, label: t('nutrition'), count: allPrograms.filter(p => p.category === 'Diet').length, activeText: 'text-nutritionist-600 dark:text-nutritionist-300', activeRing: 'ring-nutritionist-500/30' },
                  { cat: 'Consultation' as FilterType, icon: MessageSquare, label: t('consultation'), count: allPrograms.filter(p => p.category === 'Consultation').length, activeText: 'text-violet-600 dark:text-violet-300', activeRing: 'ring-violet-500/30' },
                ]).map(({ cat, icon: Icon, label, count, activeText, activeRing }) => (
                  <button
                    key={cat}
                    onClick={() => setFilterType(cat)}
                    className={cn(
                      'inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ease-out-expo',
                      filterType === cat
                        ? cn('bg-surface-1 shadow-xs ring-1 ring-inset', activeText, activeRing)
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    <span className="text-[10px] opacity-60 tabular-nums">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="relative w-full sm:w-auto lg:min-w-[220px]">
              <SortAsc className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-10 w-full appearance-none rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle pl-10 pr-10 text-sm font-medium text-foreground transition-[box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] cursor-pointer"
              >
                <option value="newest">{t('newest')}</option>
                <option value="popular">{t('mostPopular')}</option>
                <option value="rating">{t('highestRated')}</option>
                <option value="price-low">{t('priceLowToHigh')}</option>
                <option value="price-high">{t('priceHighToLow')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* ─── Programs List ─── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-user-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 mb-4">
              <Search className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <button
              onClick={loadAllPrograms}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-user-600 text-white text-sm font-semibold hover:bg-user-700 transition-colors"
            >
              {tc('tryAgain')}
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">
              {totalCount === 0 ? t('noPrograms') : t('noProgramsFound')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalCount === 0 ? t('checkBackLater') : t('adjustSearchFilters')}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPrograms.map((program) => {
              const accent = getAccentColorsByRole(program.trainerRole)
              const categoryAccent =
                program.category === 'Training' ? { ring: 'ring-trainer-500/20', text: 'text-trainer-600 dark:text-trainer-300', bg: 'bg-trainer-500/10' } :
                program.category === 'Diet' ? { ring: 'ring-nutritionist-500/20', text: 'text-nutritionist-600 dark:text-nutritionist-300', bg: 'bg-nutritionist-500/10' } :
                { ring: 'ring-violet-500/20', text: 'text-violet-600 dark:text-violet-300', bg: 'bg-violet-500/10' }

              const availablePrices: number[] = []
              if (program.price > 0) availablePrices.push(program.price)
              if (program.standardPrice != null && program.standardPrice > 0) availablePrices.push(program.standardPrice)
              if (program.proPrice != null && program.proPrice > 0) availablePrices.push(program.proPrice)
              const minPrice = availablePrices.length > 0 ? Math.min(...availablePrices) : 0
              const hasMultiplePrices = availablePrices.length > 1

              const CategoryIcon = program.category === 'Training' ? Dumbbell : program.category === 'Diet' ? Apple : MessageSquare
              const categoryLabel = program.category === 'Training' ? t('training') : program.category === 'Diet' ? t('nutrition') : t('consultation')

              return (
                <button
                  type="button"
                  key={`${program.category}-${program.id}`}
                  onClick={() => router.push(`/user/programs/${program.id}?category=${program.category}`)}
                  className="group relative flex flex-col text-left rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden hover:ring-border-strong hover:shadow-lg hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)]"
                >
                  {/* Cover */}
                  <div className="relative aspect-[16/9] w-full bg-surface-2 overflow-hidden">
                    {program.coverImageUrl ? (
                      <img
                        src={getMediaUrl(program.coverImageUrl) || ''}
                        alt={program.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <CategoryIcon className="w-10 h-10 text-faint-foreground" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* Category badge */}
                    <span
                      className={cn(
                        'absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md ring-1 ring-inset',
                        'bg-white/85 dark:bg-black/55',
                        categoryAccent.text,
                        categoryAccent.ring,
                      )}
                    >
                      <CategoryIcon className="w-2.5 h-2.5" />
                      {categoryLabel}
                    </span>
                    {/* Price badge */}
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-md ring-1 ring-inset ring-border-subtle text-foreground text-xs font-bold tabular-nums">
                      {availablePrices.length === 0 ? (
                        tc('free')
                      ) : (
                        <>
                          {hasMultiplePrices && <span className="text-[10px] font-normal text-muted-foreground">{tc('from')}</span>}
                          ${minPrice.toFixed(2)}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                    <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-user-600 dark:group-hover:text-user-300 transition-colors">
                      {program.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {program.description}
                    </p>

                    {/* Trainer */}
                    <div className="mt-3 flex items-center gap-2">
                      {program.trainerAvatarUrl ? (
                        <img
                          src={getMediaUrl(program.trainerAvatarUrl) || ''}
                          alt={program.trainerName}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-border-subtle"
                        />
                      ) : (
                        <div
                          className="w-6 h-6 rounded-full grid place-items-center ring-1 ring-border-subtle"
                          style={{ background: `linear-gradient(to bottom right, ${accent.primary}, ${accent.secondary})` }}
                        >
                          <span className="text-white text-[10px] font-bold">{program.trainerName.charAt(0)}</span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground truncate">{program.trainerName}</span>
                    </div>

                    {/* Stats */}
                    <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="font-medium text-foreground tabular-nums">
                            {(program.averageRating ?? 0) > 0 ? (program.averageRating ?? 0).toFixed(1) : '–'}
                          </span>
                          <span className="text-faint-foreground tabular-nums">({program.totalReviews ?? 0})</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{program.totalPurchases ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {!isLoading && !error && (
          <div ref={infiniteScrollRef} className="flex min-h-12 justify-center pt-2">
            {loadingMore ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {tc('loading')}
              </div>
            ) : !(hasMoreTraining || hasMoreMeal) && loadedCount > 0 ? (
              <p className="text-xs text-faint-foreground">{tc('allItemsLoaded')}</p>
            ) : null}
          </div>
        )}

        {!isLoading && !error && totalCount > 0 && (
          <p className="text-center text-xs text-faint-foreground tabular-nums">
            {tc('showingXofY', { shown: filteredPrograms.length, total: totalCount })}
          </p>
        )}
      </div>

      <ProgramsFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </>
  )
}
