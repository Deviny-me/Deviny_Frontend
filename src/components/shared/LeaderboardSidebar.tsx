'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trophy, Users, Dumbbell, Apple, Loader2, ArrowRight } from 'lucide-react'
import {
  ratingsApi,
  LeaderboardCategory,
  LeaderboardEntryDto,
} from '@/lib/api/ratingsApi'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { getMediaUrl } from '@/lib/config'

interface Props {
  /** Used for routing to a profile and to the full leaderboard page. */
  basePath: '/user' | '/trainer' | '/nutritionist'
}

const LIMIT = 10

const CATEGORY_TABS: { key: LeaderboardCategory; role: string; icon: typeof Users }[] = [
  { key: 'user', role: 'user', icon: Users },
  { key: 'trainer', role: 'trainer', icon: Dumbbell },
  { key: 'nutritionist', role: 'nutritionist', icon: Apple },
]

/** Medal styling for top-3. */
const MEDAL = {
  1: {
    grad: 'linear-gradient(135deg, #ffe082 0%, #f5b428 55%, #a96f0c 100%)',
    border: 'rgba(255, 224, 130, 0.85)',
    glow: '0 0 10px -2px rgba(245, 180, 40, 0.6)',
  },
  2: {
    grad: 'linear-gradient(135deg, #f1f1f4 0%, #b9b9c1 55%, #6c6c75 100%)',
    border: 'rgba(220, 220, 228, 0.85)',
    glow: '0 0 8px -2px rgba(200, 200, 210, 0.5)',
  },
  3: {
    grad: 'linear-gradient(135deg, #f3b07a 0%, #c87435 55%, #6e3a13 100%)',
    border: 'rgba(232, 156, 102, 0.85)',
    glow: '0 0 8px -2px rgba(200, 116, 53, 0.5)',
  },
} as const

function RankBadge({ place }: { place: number }) {
  if (place === 1 || place === 2 || place === 3) {
    const m = MEDAL[place as 1 | 2 | 3]
    return (
      <span
        className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
        style={{
          background: m.grad,
          boxShadow: `inset 0 0 0 1.5px ${m.border}, ${m.glow}`,
          textShadow: '0 1px 1px rgba(0,0,0,0.35)',
        }}
        aria-label={`#${place}`}
      >
        {place}
      </span>
    )
  }
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background ring-1 ring-inset ring-border-subtle text-[11px] font-bold text-muted-foreground tabular-nums">
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
      <img
        src={getMediaUrl(url) || url}
        alt={name}
        className={`${className} object-cover`}
      />
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

export function LeaderboardSidebar({ basePath }: Props) {
  const router = useRouter()
  const t = useTranslations('leaderboardSidebar')
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('user')
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ratingsApi
      .getLeaderboard(activeCategory, LIMIT, 'global', 'week')
      .then((data) => {
        if (cancelled) return
        setEntries(data.items)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Failed to load leaderboard', err)
        setEntries([])
        setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeCategory])

  const goToProfile = (id: string) => router.push(`${basePath}/profile/${id}`)

  return (
    <div className="bg-surface-2 rounded-xl border border-border-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-tight text-foreground truncate">
            {t('sidebarTitle')}
          </h3>
          <p className="text-[11px] text-faint-foreground leading-tight truncate">
            {t('sidebarSubtitle')}
          </p>
        </div>
        <Link
          href={`${basePath}/leaderboards`}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
        >
          {t('viewAll')}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Category tabs */}
      <div className="px-3">
        <div
          role="tablist"
          className="grid grid-cols-3 gap-1 rounded-lg bg-background p-1 border border-border-subtle"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.key
            const accent = getAccentColorsByRole(tab.role)
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.key)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
                      }
                    : undefined
                }
                title={t(`tab_${tab.key}`)}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                <span className="leading-none truncate">{t(`tab_${tab.key}`)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Body — top 10 */}
      <div className="px-2 pb-2 pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Trophy className="mx-auto w-8 h-8 text-faint-foreground mb-2" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">{t('emptyTitle')}</p>
            <p className="mt-1 text-[10px] text-faint-foreground">{t('emptyHint')}</p>
            {error && <p className="mt-2 text-[10px] text-faint-foreground">{error}</p>}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((entry, idx) => {
              const accent = getAccentColorsByRole(entry.role || activeCategory)
              const place = entry.rank || idx + 1
              const fallbackBg = `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`
              return (
                <li key={entry.userId}>
                  <button
                    onClick={() => goToProfile(entry.userId)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-background"
                  >
                    <RankBadge place={place} />

                    <Avatar
                      url={entry.avatarUrl}
                      name={entry.fullName}
                      className="h-8 w-8 shrink-0 rounded-full text-xs"
                      fallbackBg={fallbackBg}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground leading-tight">
                        {entry.fullName}
                      </p>
                      {entry.ratingCount > 0 && (
                        <p className="mt-0.5 text-[10px] text-faint-foreground leading-none tabular-nums">
                          {entry.starRating.toFixed(1)} ★ · {entry.ratingCount}
                        </p>
                      )}
                    </div>

                    <span
                      className="ml-1 shrink-0 text-sm font-semibold tabular-nums"
                      style={{ color: accent.primary }}
                    >
                      {entry.overallScore.toFixed(1)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default LeaderboardSidebar
