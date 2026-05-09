'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trophy, Star, Users, Dumbbell, Apple, Loader2, Crown, Globe2, MapPin } from 'lucide-react'
import {
  ratingsApi,
  LeaderboardCategory,
  LeaderboardEntryDto,
  LeaderboardScope,
} from '@/lib/api/ratingsApi'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { getMediaUrl } from '@/lib/config'

interface Props {
  /** Used only for the route prefix when navigating to a profile. */
  basePath: '/user' | '/trainer' | '/nutritionist'
}

const CATEGORY_TABS: { key: LeaderboardCategory; role: string; icon: typeof Users }[] = [
  { key: 'user', role: 'user', icon: Users },
  { key: 'trainer', role: 'trainer', icon: Dumbbell },
  { key: 'nutritionist', role: 'nutritionist', icon: Apple },
]

const SCOPE_TABS: { key: LeaderboardScope; icon: typeof Globe2 }[] = [
  { key: 'local', icon: MapPin },
  { key: 'global', icon: Globe2 },
]

/** Medal/podium gradients per place. */
const PODIUM = {
  1: {
    grad: 'linear-gradient(135deg, #ffd166, #d49824)',
    ring: 'ring-amber-400/60',
    glow: '0 0 24px -6px rgba(255, 196, 69, 0.55)',
  },
  2: {
    grad: 'linear-gradient(135deg, #d8d8e0, #9a9aa3)',
    ring: 'ring-zinc-300/50',
    glow: '0 0 18px -8px rgba(220, 220, 230, 0.45)',
  },
  3: {
    grad: 'linear-gradient(135deg, #d68a4c, #8a4f1e)',
    ring: 'ring-orange-700/40',
    glow: '0 0 18px -8px rgba(214, 138, 76, 0.45)',
  },
} as const

/** Brand gold (matches the Deviny logo) used for the header trophy and the scope toggle. */
const GOLD = {
  primary: '#e3b53d', // logo highlight
  secondary: '#b8851e', // logo shadow
  glow: 'rgba(212, 162, 50, 0.35)',
} as const

function StarRow({ value, size = 'sm' }: { value: number; size?: 'sm' | 'xs' }) {
  // value can have 0.5 increments
  const dim = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'
  const stars: ('full' | 'half' | 'empty')[] = []
  let remaining = Math.max(0, Math.min(5, value))
  for (let i = 0; i < 5; i++) {
    if (remaining >= 1) {
      stars.push('full')
      remaining -= 1
    } else if (remaining >= 0.5) {
      stars.push('half')
      remaining = 0
    } else {
      stars.push('empty')
    }
  }
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s, i) => (
        <span key={i} className={`relative inline-block ${dim}`}>
          <Star className={`absolute inset-0 ${dim} text-faint-foreground`} />
          {s !== 'empty' && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: s === 'full' ? '100%' : '50%' }}
            >
              <Star className={`${dim} text-amber-400 fill-amber-400`} />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

function PodiumCard({
  entry,
  place,
  role,
  onClick,
}: {
  entry: LeaderboardEntryDto
  place: 1 | 2 | 3
  role: string
  onClick: () => void
}) {
  const accent = getAccentColorsByRole(entry.role || role)
  const medal = PODIUM[place]
  const heightCls = place === 1 ? 'pt-2' : 'pt-4'
  const avatarSize = place === 1 ? 'h-12 w-12' : 'h-10 w-10'
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-1 flex-col items-center ${heightCls} focus:outline-none`}
      title={entry.fullName}
    >
      {/* Medal/rank pill */}
      <span
        className="absolute -top-0.5 left-1/2 -translate-x-1/2 inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
        style={{ background: medal.grad }}
      >
        {place === 1 ? <Crown className="w-3 h-3" /> : place}
      </span>

      {/* Avatar */}
      <div
        className={`relative ${avatarSize} rounded-full ring-2 ${medal.ring} overflow-hidden transition-transform group-hover:scale-105`}
        style={{ boxShadow: place === 1 ? medal.glow : undefined }}
      >
        {entry.avatarUrl ? (
          <img
            src={getMediaUrl(entry.avatarUrl) || entry.avatarUrl}
            alt={entry.fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
          >
            {(entry.fullName || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="mt-1.5 max-w-full truncate text-[11px] font-semibold leading-tight text-foreground px-0.5">
        {entry.fullName}
      </p>

      {/* Score */}
      <span
        className="mt-0.5 text-[11px] font-bold tabular-nums leading-none"
        style={{ color: accent.primary }}
      >
        {entry.overallScore.toFixed(1)}
      </span>

      {/* Mini stars */}
      <div className="mt-0.5">
        <StarRow value={entry.starRating} size="xs" />
      </div>
    </button>
  )
}

export function LeaderboardSidebar({ basePath }: Props) {
  const router = useRouter()
  const t = useTranslations('leaderboardSidebar')
  const [activeCategory, setActiveCategory] = useState<LeaderboardCategory>('user')
  const [activeScope, setActiveScope] = useState<LeaderboardScope>('global')
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ratingsApi
      .getLeaderboard(activeCategory, 10, activeScope)
      .then((data) => {
        if (cancelled) return
        setEntries(Array.isArray(data) ? data : [])
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
  }, [activeCategory, activeScope])

  // Place ordering for the podium: silver | gold | bronze (visually centered)
  const podiumOrder: Array<{ place: 1 | 2 | 3; entry?: LeaderboardEntryDto }> = [
    { place: 2, entry: entries[1] },
    { place: 1, entry: entries[0] },
    { place: 3, entry: entries[2] },
  ]
  const restEntries = entries.slice(3)

  const goToProfile = (id: string) => router.push(`${basePath}/profile/${id}`)

  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden">
      {/* Header */}
      <div className="relative px-4 pt-4 pb-3">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: `radial-gradient(120% 60% at 50% -20%, ${GOLD.glow}, transparent 70%)`,
          }}
        />
        <div className="relative flex items-center gap-2">
          <div
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.secondary})`,
            }}
          >
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-tight text-foreground">{t('title')}</h3>
            <p className="text-[10px] text-faint-foreground leading-tight">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Scope toggle (Local / Global) */}
      <div className="px-3">
        <div
          role="tablist"
          aria-label={t('scopeAria')}
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-border-subtle"
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
                className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${GOLD.primary}, ${GOLD.secondary})`,
                      }
                    : undefined
                }
                title={t(`scope_${s.key}`)}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="leading-none">{t(`scope_${s.key}`)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category tabs */}
      <div className="grid grid-cols-3 gap-1 px-3 mt-2">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.key
          const accent = getAccentColorsByRole(tab.role)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`group flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground'
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
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span className="leading-none">{t(`tab_${tab.key}`)}</span>
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="px-2 pb-2 pt-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Trophy className="mx-auto w-8 h-8 text-faint-foreground mb-2" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">{t('emptyTitle')}</p>
            <p className="mt-1 text-[10px] text-faint-foreground">{t('emptyHint')}</p>
            {error && (
              <p className="mt-2 text-[10px] text-faint-foreground">{error}</p>
            )}
          </div>
        ) : (
          <>
            {/* Podium (top 3) */}
            <div className="px-1.5">
              <div className="flex items-end justify-between gap-1.5">
                {podiumOrder.map(({ place, entry }) =>
                  entry ? (
                    <PodiumCard
                      key={entry.userId}
                      entry={entry}
                      place={place}
                      role={activeCategory}
                      onClick={() => goToProfile(entry.userId)}
                    />
                  ) : (
                    <div
                      key={`empty-${place}`}
                      className="flex flex-1 flex-col items-center pt-4 opacity-40"
                    >
                      <div className="h-10 w-10 rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle" />
                      <p className="mt-1.5 text-[10px] text-faint-foreground leading-none">—</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Divider */}
            {restEntries.length > 0 && (
              <div className="my-3 h-px bg-border-subtle/60" />
            )}

            {/* Rest list (4..10) */}
            {restEntries.length > 0 && (
              <ul className="space-y-0.5">
                {restEntries.map((entry, idx) => {
                  const accent = getAccentColorsByRole(entry.role || activeCategory)
                  const place = entry.rank || idx + 4
                  return (
                    <li key={entry.userId}>
                      <button
                        onClick={() => goToProfile(entry.userId)}
                        className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                      >
                        {/* Rank */}
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle text-[10px] font-bold text-muted-foreground tabular-nums">
                          {place}
                        </span>

                        {/* Avatar */}
                        {entry.avatarUrl ? (
                          <img
                            src={getMediaUrl(entry.avatarUrl) || entry.avatarUrl}
                            alt={entry.fullName}
                            className="h-7 w-7 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{
                              background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
                            }}
                          >
                            {(entry.fullName || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        {/* Name + stars */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-foreground leading-tight">
                            {entry.fullName}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <StarRow value={entry.starRating} size="xs" />
                            {entry.ratingCount > 0 && (
                              <span className="text-[9px] text-faint-foreground">
                                ({entry.ratingCount})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <span
                          className="ml-1 shrink-0 text-[11px] font-semibold tabular-nums"
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
          </>
        )}
      </div>
    </div>
  )
}

export default LeaderboardSidebar
