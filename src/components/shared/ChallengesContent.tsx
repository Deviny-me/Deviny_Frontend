'use client'

import { useEffect, useState } from 'react'
import { Target, CheckCircle2, Loader2, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getMyChallenges } from '@/lib/api/achievementApi'
import type { MyChallengesResponse, UserChallengeProgressDto } from '@/types/achievement'
import { getIcon, getGradient } from '@/components/shared/achievementUtils'
import { useAccentColors } from '@/lib/theme/useAccentColors'

export default function ChallengesContent() {
  const [data, setData] = useState<MyChallengesResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = useTranslations('challenges')
  const accent = useAccentColors()
  const accentGradient = accent.gradient
  const accentIcon = accent.text
  const spinnerColor = accent.loader

  useEffect(() => {
    getMyChallenges()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-8 h-8 ${spinnerColor} animate-spin`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 mb-2">Failed to load challenges</p>
          <p className="text-sm text-faint-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.challenges.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-border-subtle flex items-center justify-center mx-auto mb-4">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('noChallenges')}</h2>
          <p className="text-muted-foreground">{t('checkBackLater')}</p>
        </div>
      </div>
    )
  }

  const active = data.challenges.filter(c => c.status !== 'Completed')
  const completed = data.challenges.filter(c => c.status === 'Completed')

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">Complete challenges to earn achievements and XP</p>
      </div>

      <div className="bg-gradient-to-br from-gray-100 to-gray-50 dark:from-[#1A1A1A] dark:to-[#0A0A0A] rounded-xl border border-border-subtle p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t('completed')}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>
              {data.completedCount}/{data.totalCount}
            </div>
            <p className="text-sm text-muted-foreground">{t('completed')}</p>
          </div>
        </div>
      </div>

      {/* Active challenges */}
      {active.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className={`w-5 h-5 ${accentIcon}`} />
            {t('active')} ({active.length})
          </h3>
          <div className="space-y-4">
            {active.map(item => (
              <ChallengeCard key={item.challenge.id} item={item} accentGradient={accentGradient} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Completed challenges */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            {t('completed')} ({completed.length})
          </h3>
          <div className="space-y-4">
            {completed.map(item => (
              <ChallengeCard key={item.challenge.id} item={item} accentGradient={accentGradient} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ChallengeCard({ item, accentGradient, t }: { item: UserChallengeProgressDto; accentGradient: string; t: (key: string) => string }) {
  const isCompleted = item.status === 'Completed'
  const c = item.challenge
  const IconCmp = c.achievementIconKey ? getIcon(c.achievementIconKey) : Trophy
  const gradient = c.achievementColorKey ? getGradient(c.achievementColorKey) : accentGradient

  return (
    <div className={`bg-surface-2 rounded-xl border ${isCompleted ? 'border-green-500/30' : 'border-border-subtle'} p-5 hover:border-border transition-all`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 ${isCompleted ? '' : 'opacity-70'}`}>
          <IconCmp className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-foreground">{c.title}</h4>
            {isCompleted && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('done')}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{c.description}</p>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs text-faint-foreground mb-1">
              <span>{t('progress')}</span>
              <span>{item.currentValue}/{item.targetValue}</span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : `bg-gradient-to-r ${accentGradient}`
                }`}
                style={{ width: `${item.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Reward badge */}
          {c.achievementTitle && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-border-subtle rounded-full">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-muted-foreground">{t('reward')} {c.achievementTitle}</span>
            </div>
          )}

          {/* Completed date */}
          {isCompleted && item.completedAt && (
            <p className="text-[11px] text-faint-foreground mt-2">
              Completed {new Date(item.completedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
