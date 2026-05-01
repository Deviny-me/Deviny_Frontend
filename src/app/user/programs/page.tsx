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
      <div className="space-y-4 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-surface-3 rounded-xl border border-border p-4 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-faint-foreground" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:border-[#0c8de6]/50"
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="relative flex items-center justify-center w-12 h-[42px] bg-background border border-border rounded-lg hover:border-[#0c8de6]/50 transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center"
                  style={{ background: '#0c8de6' }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            {/* Type Filters */}
            <div className="-mx-1 overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-1 rounded-lg bg-background p-1">
                <button
                  onClick={() => setFilterType('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-[#0c8de6] text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tc('all')}
                </button>
                {([
                  { cat: 'Training' as FilterType, icon: Dumbbell, label: t('training'), count: allPrograms.filter(p => p.category === 'Training').length, activeColor: 'bg-[#f07915]' },
                  { cat: 'Diet' as FilterType, icon: Apple, label: t('nutrition'), count: allPrograms.filter(p => p.category === 'Diet').length, activeColor: 'bg-[#28bf68]' },
                  { cat: 'Consultation' as FilterType, icon: MessageSquare, label: t('consultation'), count: allPrograms.filter(p => p.category === 'Consultation').length, activeColor: 'bg-[#0c8de6]' },
                ]).map(({ cat, icon: Icon, label, count, activeColor }) => (
                  <button
                    key={cat}
                    onClick={() => setFilterType(cat)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filterType === cat 
                        ? `${activeColor} text-foreground` 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="w-full sm:w-auto lg:min-w-[220px]">
              <div className="relative">
                <SortAsc className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-12 w-full appearance-none rounded-2xl border border-[rgba(148,163,184,0.18)] bg-background pl-10 pr-10 text-sm font-medium text-foreground transition-colors focus:border-[rgba(148,163,184,0.28)] focus:outline-none"
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
        </div>

        {/* Programs List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#0c8de6] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-surface-3 rounded-xl border border-border">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadAllPrograms}
              className="px-4 py-2 bg-[#0c8de6] text-foreground rounded-lg hover:bg-[#FF8555] transition-colors"
            >
              {tc('tryAgain')}
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12 bg-surface-3 rounded-xl border border-border">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-background flex items-center justify-center">
              <Search className="w-8 h-8 text-faint-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {totalCount === 0 ? t('noPrograms') : t('noProgramsFound')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {totalCount === 0 ? t('checkBackLater') : t('adjustSearchFilters')}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrograms.map((program) => (
              <div
                key={`${program.category}-${program.id}`}
                className="bg-surface-3 rounded-xl border border-border overflow-hidden hover:border-border transition-colors cursor-pointer"
                onClick={() => router.push(`/user/programs/${program.id}?category=${program.category}`)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Cover Image */}
                  <div className="h-48 w-full flex-shrink-0 bg-background relative sm:h-40 sm:w-40">
                    {program.coverImageUrl ? (
                      <img
                        src={getMediaUrl(program.coverImageUrl) || ''}
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {program.category === 'Training' ? (
                          <Dumbbell className="w-10 h-10 text-gray-600" />
                        ) : program.category === 'Diet' ? (
                          <Apple className="w-10 h-10 text-gray-600" />
                        ) : (
                          <MessageSquare className="w-10 h-10 text-gray-600" />
                        )}
                      </div>
                    )}
                    {/* Category badge — color based on creator role */}
                    <span
                      className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded text-foreground flex items-center gap-0.5"
                      style={{ backgroundColor: getAccentColorsByRole(program.trainerRole).primary }}
                    >
                      {program.category === 'Training' ? (
                        <><Dumbbell className="w-2.5 h-2.5" />{t('training')}</>
                      ) : program.category === 'Diet' ? (
                        <><Apple className="w-2.5 h-2.5" />{t('nutrition')}</>
                      ) : (
                        <><MessageSquare className="w-2.5 h-2.5" />{t('consultation')}</>
                      )}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2">{program.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {program.trainerAvatarUrl ? (
                          <img
                            src={getMediaUrl(program.trainerAvatarUrl) || ''}
                            alt={program.trainerName}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${getAccentColorsByRole(program.trainerRole).primary}, ${getAccentColorsByRole(program.trainerRole).secondary})` }}>
                            <span className="text-foreground text-[10px] font-bold">
                              {program.trainerName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground">{program.trainerName}</span>
                      </div>
                      <p className="text-sm text-faint-foreground mt-2 line-clamp-2">{program.description}</p>

                    </div>

                    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-foreground">
                            {(program.averageRating ?? 0) > 0 ? (program.averageRating ?? 0).toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-faint-foreground">({program.totalReviews ?? 0})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span className="text-sm">{program.totalPurchases ?? 0}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end">
                        {(() => {
                          // Collect all available tier prices (only non-null tiers)
                          const availablePrices: number[] = []
                          if (program.price > 0) availablePrices.push(program.price)
                          if (program.standardPrice != null && program.standardPrice > 0) availablePrices.push(program.standardPrice)
                          if (program.proPrice != null && program.proPrice > 0) availablePrices.push(program.proPrice)

                          // If no tier has a price > 0, show $0.00
                          if (availablePrices.length === 0) {
                            return <span className="text-lg font-bold text-[#0c8de6]">$0.00</span>
                          }

                          const minPrice = Math.min(...availablePrices)
                          const hasMultiplePrices = availablePrices.length > 1
                          return (
                            <span className="text-lg font-bold text-[#0c8de6]">
                              {hasMultiplePrices && (
                                <span className="text-sm font-normal text-muted-foreground mr-1">{tc('from')}</span>
                              )}
                              {`$${minPrice.toFixed(2)}`}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              <p className="text-sm text-faint-foreground">{tc('allItemsLoaded')}</p>
            ) : null}
          </div>
        )}

        {/* Results Count */}
        {!isLoading && !error && totalCount > 0 && (
          <p className="text-center text-sm text-faint-foreground">
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
