'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Trophy, Star, Users, Dumbbell, Apple, Loader2, Crown } from 'lucide-react'
import { ratingsApi, LeaderboardCategory, LeaderboardEntryDto } from '@/lib/api/ratingsApi'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { getMediaUrl } from '@/lib/config'

interface Props {
  /** Used only for the route prefix when navigating to a profile. */
  basePath: '/user' | '/trainer' | '/nutritionist'
}

const TABS: { key: LeaderboardCategory; role: string; icon: typeof Users }[] = [
  { key: 'user', role: 'user', icon: Users },
  { key: 'trainer', role: 'trainer', icon: Dumbbell },
  { key: 'nutritionist', role: 'nutritionist', icon: Apple },
]

function StarRow({ value }: { value: number }) {
  // value can have 0.5 increments
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
        <span key={i} className="relative inline-block w-3 h-3">
          <Star className="absolute inset-0 w-3 h-3 text-faint-foreground" />
          {s !== 'empty' && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: s === 'full' ? '100%' : '50%' }}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

export function LeaderboardSidebar({ basePath }: Props) {
  const router = useRouter()
  const t = useTranslations('leaderboardSidebar')
  const [activeTab, setActiveTab] = useState<LeaderboardCategory>('user')
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    ratingsApi
      .getLeaderboard(activeTab, 10)
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
  }, [activeTab])

  const tabAccent = useMemo(() => getAccentColorsByRole(activeTab), [activeTab])

  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white"
          style={{
            background: `linear-gradient(135deg, ${tabAccent.primary}, ${tabAccent.secondary})`,
          }}
        >
          <Trophy className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 px-3">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const accent = getAccentColorsByRole(tab.role)
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {/* List */}
      <div className="px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Trophy className="mx-auto w-8 h-8 text-faint-foreground mb-2" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">{t('emptyTitle')}</p>
            <p className="mt-1 text-[10px] text-faint-foreground">{t('emptyHint')}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {entries.map((entry, idx) => {
              const accent = getAccentColorsByRole(entry.role || activeTab)
              const isTop = idx < 3
              return (
                <li key={entry.userId}>
                  <button
                    onClick={() => router.push(`${basePath}/profile/${entry.userId}`)}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-2"
                  >
                    {/* Rank */}
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        isTop
                          ? 'text-white'
                          : 'bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground'
                      }`}
                      style={
                        isTop
                          ? {
                              background:
                                idx === 0
                                  ? 'linear-gradient(135deg, #f6c344, #d49824)'
                                  : idx === 1
                                  ? 'linear-gradient(135deg, #c8c8d0, #8a8a93)'
                                  : 'linear-gradient(135deg, #c87b3a, #8a4f1e)',
                            }
                          : undefined
                      }
                    >
                      {idx === 0 ? <Crown className="w-3 h-3" /> : entry.rank ?? idx + 1}
                    </span>

                    {/* Avatar */}
                    {entry.avatarUrl ? (
                      <img
                        src={getMediaUrl(entry.avatarUrl) || entry.avatarUrl}
                        alt={entry.fullName}
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
                        }}
                      >
                        {(entry.fullName || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    {/* Name + stars */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {entry.fullName}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <StarRow value={entry.starRating} />
                        {entry.ratingCount > 0 && (
                          <span className="text-[10px] text-faint-foreground">
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

        {error && !loading && entries.length === 0 && (
          <p className="px-3 pb-3 text-center text-[10px] text-faint-foreground">{error}</p>
        )}
      </div>
    </div>
  )
}

export default LeaderboardSidebar
