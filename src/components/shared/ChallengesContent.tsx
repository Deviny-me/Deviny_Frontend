'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2,
  Flame,
  Loader2,
  Lock,
  RefreshCcw,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { getMyChallenges } from '@/lib/api/achievementApi'
import type { MyChallengesResponse, UserChallengeProgressDto } from '@/types/achievement'
import { getIcon, getGradient } from '@/components/shared/achievementUtils'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { cn } from '@/lib/utils/cn'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeIcon(type: string) {
  if (type === 'Streak') return Flame
  if (type === 'Counter') return Target
  return CheckCircle2
}

function typeBadgeClass(type: string) {
  if (type === 'Streak') return 'bg-orange-500/10 text-orange-400 ring-orange-500/20'
  if (type === 'Counter') return 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
  return 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
        <CheckCircle2 className="h-3 w-3" /> {t('completed')}
      </span>
    )
  }
  if (status === 'Expired') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20 px-2 py-0.5 text-[10px] font-semibold">
        <Lock className="h-3 w-3" /> Expired
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-400 ring-1 ring-inset ring-blue-500/20 px-2 py-0.5 text-[10px] font-semibold">
      <Zap className="h-3 w-3" /> {t('active')}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChallengesContent() {
  const t = useTranslations('challenges')
  const accent = useAccentColors()
  const [data, setData] = useState<MyChallengesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getMyChallenges()
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load challenges')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={cn('w-6 h-6 animate-spin', accent.loader)} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-8 text-center max-w-xs">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle">
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Failed to load challenges</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border-subtle hover:bg-surface-3 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { challenges, completedCount, totalCount } = data
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const filtered = filter === 'active'
    ? challenges.filter(c => c.status === 'Active')
    : filter === 'completed'
      ? challenges.filter(c => c.status === 'Completed')
      : challenges

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* Progress card */}
      <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
            >
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('completed')}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {completedCount}{' '}
                <span className="text-base font-medium text-muted-foreground">/ {totalCount}</span>
              </p>
            </div>
          </div>
          <div className="flex-1 sm:max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('progress')}</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle">
              <div
                className="h-full rounded-full transition-[width] duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${accent.primary}, ${accent.secondary})`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border-subtle">
        {(['all', 'active', 'completed'] as const).map((f) => {
          const labels = { all: 'All', active: t('active'), completed: t('completed') }
          const counts = {
            all: challenges.length,
            active: challenges.filter(c => c.status === 'Active').length,
            completed: completedCount,
          }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'relative pb-2.5 pt-1 px-3 text-sm font-medium transition-colors',
                filter === f ? accent.text : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {labels[f]}
              <span className="ml-1.5 text-[11px] text-faint-foreground">({counts[f]})</span>
              {filter === f && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${accent.primary}, ${accent.secondary})` }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle">
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">{t('noChallenges')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('checkBackLater')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
          {filtered.map(cp => (
            <ChallengeCard key={cp.challenge.id} cp={cp} t={t} accent={accent} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Challenge card ───────────────────────────────────────────────────────────

const TYPE_GRADIENTS: Record<string, string> = {
  Streak: 'from-orange-500 to-red-500',
  Counter: 'from-blue-500 to-indigo-600',
  OneTime: 'from-emerald-500 to-teal-600',
}

function ChallengeCard({
  cp,
  t,
  accent,
}: {
  cp: UserChallengeProgressDto
  t: (k: string) => string
  accent: ReturnType<typeof useAccentColors>
}) {
  const { challenge, currentValue, targetValue, status, progressPercent, completedAt } = cp
  const isCompleted = status === 'Completed'
  const isExpired = status === 'Expired'
  const TypeIcon = typeIcon(challenge.type)
  const RewardIcon = challenge.achievementIconKey ? getIcon(challenge.achievementIconKey) : Trophy
  const rewardGradient = challenge.achievementColorKey ? getGradient(challenge.achievementColorKey) : 'from-yellow-400 to-amber-500'
  const typeGradient = TYPE_GRADIENTS[challenge.type] ?? 'from-slate-500 to-slate-600'
  const showProgress = challenge.type !== 'OneTime'
  const pct = Math.min(progressPercent ?? 0, 100)

  return (
    <div
      className={cn(
        'group relative flex flex-col rounded-2xl bg-surface-1 ring-1 ring-inset p-4',
        'transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5',
        isCompleted
          ? 'ring-emerald-500/35 shadow-[0_0_20px_0px_rgba(16,185,129,0.15)]'
          : isExpired
            ? 'ring-border-subtle/40 opacity-60'
            : 'ring-border-subtle hover:shadow-md hover:shadow-black/10',
      )}
    >
      {/* Header: icon + title + badges */}
      <div className="flex items-start gap-3.5 mb-2.5">
        {/* Gradient icon tile — same as AchievementCard */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              'inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br',
              isCompleted ? 'from-emerald-500 to-teal-600' : typeGradient,
            )}
          >
            <TypeIcon className="h-6 w-6 drop-shadow-sm" />
          </div>
          {isCompleted && (
            <div className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 shadow-sm ring-2 ring-surface-1">
              <CheckCircle2 className="h-2.5 w-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Title + badges */}
        <div className="flex-1 min-w-0 pt-0.5">
          <h3 className="mb-1.5 text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {challenge.title}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                typeBadgeClass(challenge.type),
              )}
            >
              {challenge.type}
            </span>
            <StatusBadge status={status} t={t} />
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
        {challenge.description}
      </p>

      {/* Progress — same bar style as achievements page */}
      {showProgress && (
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('progress')}</span>
            <span className="tabular-nums font-semibold text-foreground">{currentValue} / {targetValue}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${pct}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981, #14b8a6)'
                  : `linear-gradient(90deg, ${accent.primary}, ${accent.secondary})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Reward — same chip style as XP badge in AchievementCard */}
      {(challenge.achievementTitle || challenge.achievementIconKey) && (
        <div className="mt-auto flex items-center gap-2 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-2.5">
          <div
            className={cn(
              'flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-sm bg-gradient-to-br',
              rewardGradient,
            )}
          >
            <RewardIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-widest text-faint-foreground font-semibold">{t('reward')}</p>
            <p className="text-xs font-semibold text-foreground truncate">
              {challenge.achievementTitle || 'Achievement'}
            </p>
          </div>
          <span className="inline-flex items-center rounded-full bg-surface-1 ring-1 ring-inset ring-border-subtle px-2 py-0.5 text-[10px] font-semibold text-amber-400">
            +XP
          </span>
        </div>
      )}

      {/* Date */}
      {isCompleted && completedAt && (
        <p className="mt-2 text-[10px] text-faint-foreground tabular-nums">
          {new Date(completedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
