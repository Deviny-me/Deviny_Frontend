'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Trophy,
  Users,
  Dumbbell,
  Apple,
  Loader2,
  Globe2,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import {
  ratingsApi,
  LeaderboardCategory,
  LeaderboardEntryDto,
  LeaderboardScope,
  LeaderboardPeriod,
  MyLeaderboardPosition,
} from '@/lib/api/ratingsApi'
import { useAccentColors, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { getMediaUrl } from '@/lib/config'

interface Props {
  /** Used for routing to a profile when a row is clicked. */
  basePath: '/user' | '/trainer' | '/nutritionist'
}

const LIMIT = 100

type SortKey = 'rank' | 'score' | 'stars' | 'reviews' | 'name'
type MinReviews = 'all' | 'rated' | 'min10' | 'min50'

const CATEGORY_TABS: { key: LeaderboardCategory; role: string; icon: typeof Users }[] = [
  { key: 'user', role: 'user', icon: Users },
  { key: 'trainer', role: 'trainer', icon: Dumbbell },
  { key: 'nutritionist', role: 'nutritionist', icon: Apple },
]

const PERIOD_TABS: { key: LeaderboardPeriod; labelKey: string }[] = [
  { key: 'week', labelKey: 'period_week' },
  { key: 'month', labelKey: 'period_month' },
  { key: 'season', labelKey: 'period_season' },
  { key: 'all', labelKey: 'period_all' },
]

const SCOPE_TABS: { key: LeaderboardScope; icon: typeof Globe2 }[] = [
  { key: 'local', icon: MapPin },
  { key: 'global', icon: Globe2 },
]

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: 'rank', labelKey: 'sort_rank' },
  { key: 'score', labelKey: 'sort_score' },
  { key: 'stars', labelKey: 'sort_stars' },
  { key: 'reviews', labelKey: 'sort_reviews' },
  { key: 'name', labelKey: 'sort_name' },
]

const MIN_REVIEWS_OPTIONS: { key: MinReviews; labelKey: string }[] = [
  { key: 'all', labelKey: 'filter_all' },
  { key: 'rated', labelKey: 'filter_rated' },
  { key: 'min10', labelKey: 'filter_min10' },
  { key: 'min50', labelKey: 'filter_min50' },
]

const DEFAULT_SCOPE: LeaderboardScope = 'global'
const DEFAULT_SORT: SortKey = 'rank'
const DEFAULT_MIN_REVIEWS: MinReviews = 'all'

/** Medal styling for top-3 badges. */
const MEDAL = {
  1: {
    grad: 'linear-gradient(135deg, #ffe082 0%, #f5b428 55%, #a96f0c 100%)',
    border: 'rgba(255, 224, 130, 0.85)',
    glow: '0 0 14px -2px rgba(245, 180, 40, 0.7)',
  },
  2: {
    grad: 'linear-gradient(135deg, #f1f1f4 0%, #b9b9c1 55%, #6c6c75 100%)',
    border: 'rgba(220, 220, 228, 0.85)',
    glow: '0 0 12px -2px rgba(200, 200, 210, 0.55)',
  },
  3: {
    grad: 'linear-gradient(135deg, #f3b07a 0%, #c87435 55%, #6e3a13 100%)',
    border: 'rgba(232, 156, 102, 0.85)',
    glow: '0 0 12px -2px rgba(200, 116, 53, 0.55)',
  },
} as const

function formatRelativeTime(iso: string | null): string | null {
  if (!iso) return null
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return null
  const diff = Math.max(0, Date.now() - ts)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d}d`
}

function RankBadge({ place }: { place: number }) {
  if (place === 1 || place === 2 || place === 3) {
    const m = MEDAL[place as 1 | 2 | 3]
    return (
      <span
        className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
        style={{
          background: m.grad,
          boxShadow: `inset 0 0 0 2px ${m.border}, ${m.glow}`,
          textShadow: '0 1px 1px rgba(0,0,0,0.4)',
        }}
        aria-label={`#${place}`}
      >
        {place}
      </span>
    )
  }
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-inset ring-border-subtle text-xs font-bold text-muted-foreground tabular-nums">
      {place}
    </span>
  )
}

function Avatar({
  url,
  name,
  className,
  fallbackBg,
}: {
  url?: string | null
  name: string
  className: string
  fallbackBg: string
}) {
  if (url) {
    return (
      <img src={getMediaUrl(url) || url} alt={name} className={`${className} object-cover`} />
    )
  }
  return (
    <div
      className={`${className} flex items-center justify-center font-bold text-white`}
      style={{ background: fallbackBg }}
    >
      {(name || '?').slice(0, 1).toUpperCase()}
    </div>
  )
}

export function LeaderboardPage({ basePath }: Props) {
  const router = useRouter()
  const t = useTranslations('leaderboardSidebar')
  const accent = useAccentColors()

  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('user')
  const [activeScope, setActiveScope] = useState<LeaderboardScope>(DEFAULT_SCOPE)
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('week')
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([])
  const [total, setTotal] = useState(0)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [me, setMe] = useState<MyLeaderboardPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT)
  const [minReviews, setMinReviews] = useState<MinReviews>(DEFAULT_MIN_REVIEWS)

  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  // Close filters popover on outside click / Escape.
  useEffect(() => {
    if (!filtersOpen) return
    const onDown = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [filtersOpen])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ratingsApi
      .getLeaderboard(activeCategory, LIMIT, activeScope, activePeriod)
      .then((data) => {
        if (cancelled) return
        setEntries(data.items)
        setTotal(data.total)
        setGeneratedAt(data.generatedAt)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load leaderboard', err)
        setEntries([])
        setTotal(0)
        setGeneratedAt(null)
        setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeCategory, activeScope, activePeriod])

  useEffect(() => {
    let cancelled = false
    ratingsApi
      .getMyLeaderboardPosition(activeCategory, activeScope, activePeriod)
      .then((data) => {
        if (!cancelled) setMe(data)
      })
      .catch(() => {
        if (!cancelled) setMe(null)
      })
    return () => {
      cancelled = true
    }
  }, [activeCategory, activeScope, activePeriod])

  const goToProfile = (id: string) => router.push(`${basePath}/profile/${id}`)

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let list = entries
    if (q) {
      list = list.filter((e) => (e.fullName || '').toLowerCase().includes(q))
    }
    if (minReviews !== 'all') {
      const threshold = minReviews === 'rated' ? 1 : minReviews === 'min10' ? 10 : 50
      list = list.filter((e) => e.ratingCount >= threshold)
    }
    const sorted = [...list]
    switch (sortKey) {
      case 'score':
        sorted.sort((a, b) => b.overallScore - a.overallScore)
        break
      case 'stars':
        sorted.sort(
          (a, b) => b.starRating - a.starRating || b.ratingCount - a.ratingCount,
        )
        break
      case 'reviews':
        sorted.sort((a, b) => b.ratingCount - a.ratingCount)
        break
      case 'name':
        sorted.sort((a, b) =>
          (a.fullName || '').localeCompare(b.fullName || '', undefined, {
            sensitivity: 'base',
          }),
        )
        break
      case 'rank':
      default:
        sorted.sort((a, b) => (a.rank || 9999) - (b.rank || 9999))
        break
    }
    return sorted
  }, [entries, searchQuery, sortKey, minReviews])

  // Active "secondary" filters (the ones hidden in the popover).
  const activeFilterCount =
    (sortKey !== DEFAULT_SORT ? 1 : 0) +
    (minReviews !== DEFAULT_MIN_REVIEWS ? 1 : 0)

  const hasSearchOrFilters = searchQuery.trim().length > 0 || activeFilterCount > 0

  const resetSecondary = () => {
    setSortKey(DEFAULT_SORT)
    setMinReviews(DEFAULT_MIN_REVIEWS)
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Page header */}
      <div>
        <h1 className="page-title">{t('pageTitle')}</h1>
        <p className="page-subtitle">
          {t('pageSubtitle')}
          {generatedAt && (
            <> · {t('updatedAgo', { time: formatRelativeTime(generatedAt) ?? '' })}</>
          )}
          {total > 0 && <> · {t('resultsCount', { shown: total, total })}</>}
        </p>
      </div>

      {/* Category segmented — primary axis */}
      <div
        role="tablist"
        className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1 border border-border-subtle"
      >
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.key
          const tabAccent = getAccentColorsByRole(tab.role)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(tab.key)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${tabAccent.primary}, ${tabAccent.secondary})`,
                    }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              <span className="leading-none truncate">{t(`tab_${tab.key}`)}</span>
            </button>
          )
        })}
      </div>

      {/* Compact toolbar: search + filters */}
      <div className="flex items-center gap-2">
        {/* Search — desktop only */}
        <div className="relative flex-1 hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className={`w-full bg-surface-2 border border-border-subtle rounded-lg pl-10 pr-9 py-2 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none ${accent.focusBorder}`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters button + popover */}
        <div className="relative flex-1 sm:flex-none" ref={filtersRef}>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className={`relative inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors sm:w-auto ${
              activeFilterCount > 0
                ? `${accent.bg} text-white border-transparent`
                : 'bg-surface-2 text-foreground border-border-subtle hover:border-border'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{t('filters')}</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-xs font-bold tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div
              role="dialog"
              className="absolute right-0 z-30 mt-2 w-[min(92vw,320px)] origin-top-right rounded-xl border border-border-subtle bg-surface-2 p-4 shadow-xl"
            >
              {/* Mobile-only: Search */}
              <div className="mb-4 sm:hidden">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint-foreground">
                  {t('searchPlaceholder')}
                </p>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className={`w-full bg-background border border-border-subtle rounded-md pl-10 pr-9 py-2 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none ${accent.focusBorder}`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                      aria-label="Clear"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Period */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint-foreground">
                  {t('periodAria')}
                </p>
                <div
                  role="tablist"
                  aria-label={t('periodAria')}
                  className="grid grid-cols-4 gap-1 rounded-lg bg-background p-1 border border-border-subtle"
                >
                  {PERIOD_TABS.map((p) => {
                    const isActive = activePeriod === p.key
                    return (
                      <button
                        key={p.key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActivePeriod(p.key)}
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-surface-2 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t(p.labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Scope */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint-foreground">
                  {t('scopeLabel')}
                </p>
                <div
                  role="tablist"
                  aria-label={t('scopeAria')}
                  className="grid grid-cols-2 gap-1 rounded-lg bg-background p-1 border border-border-subtle"
                >
                  {SCOPE_TABS.map((s) => {
                    const isActive = activeScope === s.key
                    const Icon = s.icon
                    return (
                      <button
                        key={s.key}
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveScope(s.key)}
                        className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-surface-2 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="leading-none">{t(`scope_${s.key}`)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Min reviews */}
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint-foreground">
                  {t('minReviewsLabel')}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {MIN_REVIEWS_OPTIONS.map((o) => {
                    const isActive = minReviews === o.key
                    return (
                      <button
                        key={o.key}
                        onClick={() => setMinReviews(o.key)}
                        className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${
                          isActive
                            ? `${accent.bg} text-white`
                            : 'bg-background text-muted-foreground hover:text-foreground border border-border-subtle'
                        }`}
                      >
                        {t(o.labelKey)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint-foreground">
                  {t('sortBy')}
                </p>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className={`w-full bg-background border border-border-subtle rounded-md px-3 py-2 text-sm font-medium text-foreground focus:outline-none ${accent.focusBorder}`}
                  aria-label={t('sortBy')}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {t(o.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetSecondary}
                  className="mt-3 w-full rounded-md py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  {t('clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips (only when something is set) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {minReviews !== DEFAULT_MIN_REVIEWS && (
            <FilterChip
              label={t(`filter_${minReviews}`)}
              onClear={() => setMinReviews(DEFAULT_MIN_REVIEWS)}
            />
          )}
          {sortKey !== DEFAULT_SORT && (
            <FilterChip
              label={`${t('sortBy')}: ${t(`sort_${sortKey}`)}`}
              onClear={() => setSortKey(DEFAULT_SORT)}
            />
          )}
          <button
            type="button"
            onClick={resetSecondary}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {t('clearFilters')}
          </button>
        </div>
      )}

      {/* List card */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-6 h-6 ${accent.text} animate-spin`} />
          </div>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <Trophy className="mx-auto w-12 h-12 text-gray-600 mb-4" strokeWidth={1.5} />
            <h3 className="text-foreground font-semibold mb-2">{t('emptyTitle')}</h3>
            <p className="text-muted-foreground text-sm">{t('emptyHint')}</p>
            {error && <p className="mt-2 text-xs text-faint-foreground">{error}</p>}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">{t('noResults')}</p>
          </div>
        ) : (
          <>
            {hasSearchOrFilters && (
              <div className="mb-3 text-xs text-faint-foreground tabular-nums">
                {t('resultsCount', {
                  shown: visibleEntries.length,
                  total: entries.length,
                })}
              </div>
            )}
            <ul className="space-y-1.5">
              {visibleEntries.map((entry, idx) => {
                const rowAccent = getAccentColorsByRole(entry.role || activeCategory)
                const place = entry.rank || idx + 1
                const fallbackBg = `linear-gradient(135deg, ${rowAccent.primary}, ${rowAccent.secondary})`
                const isTop3 = place >= 1 && place <= 3
                return (
                  <li key={entry.userId}>
                    <button
                      onClick={() => goToProfile(entry.userId)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all hover:border-border ${
                        isTop3
                          ? 'border-border-subtle bg-background/60'
                          : 'border-transparent hover:bg-background/40'
                      }`}
                    >
                      <RankBadge place={place} />

                      <Avatar
                        url={entry.avatarUrl}
                        name={entry.fullName}
                        className="h-11 w-11 shrink-0 rounded-full text-sm"
                        fallbackBg={fallbackBg}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground leading-tight">
                          {entry.fullName}
                        </p>
                        {entry.ratingCount > 0 && (
                          <p className="mt-0.5 text-xs text-muted-foreground leading-none tabular-nums">
                            {entry.starRating.toFixed(1)} ★ · {entry.ratingCount}
                          </p>
                        )}
                      </div>

                      <span
                        className="ml-1 shrink-0 text-base font-bold tabular-nums"
                        style={{ color: rowAccent.primary }}
                      >
                        {entry.overallScore.toFixed(1)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {/* My position card */}
      {me && (
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4">
          {(() => {
            const myAccent = getAccentColorsByRole(me.role || activeCategory)
            const fallbackBg = `linear-gradient(135deg, ${myAccent.primary}, ${myAccent.secondary})`
            return (
              <button
                onClick={() => goToProfile(me.userId)}
                className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-background/40"
              >
                <span
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ background: fallbackBg }}
                  aria-label={me.rank ? `#${me.rank}` : '—'}
                >
                  {me.rank ?? '—'}
                </span>

                <Avatar
                  url={me.avatarUrl}
                  name={me.fullName}
                  className="h-10 w-10 shrink-0 rounded-full text-sm"
                  fallbackBg={fallbackBg}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-faint-foreground leading-none">
                    {t('myPosition')}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground leading-tight">
                    {me.rank
                      ? t('myRankOf', { rank: me.rank, total: me.total })
                      : t('myUnranked')}
                  </p>
                </div>

                <span
                  className="ml-1 shrink-0 text-base font-bold tabular-nums"
                  style={{ color: myAccent.primary }}
                >
                  {me.overallScore.toFixed(1)}
                </span>
              </button>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 border border-border-subtle px-3 py-1 text-xs font-medium text-foreground">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

export default LeaderboardPage
