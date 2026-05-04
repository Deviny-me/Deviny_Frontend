'use client'

import { Trophy, Lock, Award, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import type { AchievementDto } from '@/types/achievement'
import { getIcon, getRarityLabelColor } from '@/components/shared/achievementUtils'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { useAchievements } from '@/contexts/AchievementsContext'

export default function AchievementsContent() {
  const { data, loading, error, unlocked, locked, unlockedCount, totalCount, markSeen } = useAchievements()
  const t = useTranslations('achievements')
  const accent = useAccentColors()

  useEffect(() => {
    if (!loading && data) {
      markSeen()
    }
  }, [loading, data, markSeen])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className={`w-6 h-6 ${accent.loader} animate-spin`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-8 text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle">
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Failed to load achievements</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
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
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('unlocked')}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {unlockedCount} <span className="text-base font-medium text-muted-foreground">/ {totalCount}</span>
              </p>
            </div>
          </div>
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('unlocked')}</span>
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

      {/* Unlocked */}
      <Section
        title={t('unlocked')}
        count={unlocked.length}
        icon={<Trophy className="h-4 w-4 text-foreground" />}
        emptyIcon={<Trophy className="h-5 w-5 text-muted-foreground" />}
        emptyTitle={t('noAchievements')}
        emptyText={t('completeToUnlock')}
        items={unlocked}
        accent={accent}
      />

      {/* Locked */}
      <Section
        title={t('locked')}
        count={locked.length}
        icon={<Lock className="h-4 w-4 text-muted-foreground" />}
        emptyIcon={<Award className="h-5 w-5 text-muted-foreground" />}
        emptyTitle={t('allUnlocked')}
        emptyText=""
        items={locked}
        accent={accent}
      />
    </div>
  )
}

interface SectionProps {
  title: string
  count: number
  icon: React.ReactNode
  emptyIcon: React.ReactNode
  emptyTitle: string
  emptyText: string
  items: AchievementDto[]
  accent: ReturnType<typeof useAccentColors>
}

function Section({ title, count, icon, emptyIcon, emptyTitle, emptyText, items, accent }: SectionProps) {
  if (count === 0) {
    return (
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 ring-1 ring-border-subtle">
            {icon}
          </span>
          {title}
          <span className="text-sm font-normal text-muted-foreground">({count})</span>
        </h3>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-10 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle">
            {emptyIcon}
          </div>
          <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
          {emptyText && <p className="mt-1 text-xs text-muted-foreground">{emptyText}</p>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight text-foreground sm:text-lg">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-surface-2 ring-1 ring-border-subtle">
          {icon}
        </span>
        {title}
        <span className="text-sm font-normal text-muted-foreground">({count})</span>
      </h3>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
        {items.map(a => (
          <AchievementCard key={a.id} achievement={a} accent={accent} />
        ))}
      </div>
    </div>
  )
}

function AchievementCard({
  achievement,
  accent,
}: {
  achievement: AchievementDto
  accent: ReturnType<typeof useAccentColors>
}) {
  const Icon = getIcon(achievement.iconKey)
  const rarityColor = getRarityLabelColor(achievement.rarity)
  const isUnlocked = achievement.isUnlocked

  return (
    <div
      className={`group relative flex flex-col items-center rounded-2xl bg-surface-1 ring-1 ring-inset p-4 text-center transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 ${
        isUnlocked ? 'ring-border-subtle hover:ring-border-strong' : 'ring-border-subtle/60'
      }`}
    >
      {/* Icon tile */}
      <div className="relative mb-3">
        {isUnlocked ? (
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
          >
            <Icon className="h-6 w-6" />
          </div>
        ) : (
          <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
            <Icon className="h-6 w-6 text-faint-foreground" />
            <div className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface-1 ring-1 ring-border-subtle">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <h4
        className={`mb-1 line-clamp-2 text-sm font-semibold ${
          isUnlocked ? 'text-foreground' : 'text-muted-foreground'
        }`}
      >
        {achievement.title}
      </h4>
      <p
        className={`mb-3 line-clamp-2 text-[11px] leading-snug ${
          isUnlocked ? 'text-muted-foreground' : 'text-faint-foreground'
        }`}
      >
        {achievement.description}
      </p>

      <div className="mt-auto flex flex-wrap items-center justify-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${rarityColor}`}
        >
          {achievement.rarity}
        </span>
        {achievement.xpReward > 0 && (
          <span
            className={`inline-flex items-center rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2 py-0.5 text-[10px] font-semibold ${accent.text}`}
          >
            +{achievement.xpReward} XP
          </span>
        )}
      </div>

      {isUnlocked && achievement.awardedAt && (
        <p className="mt-2 text-[10px] text-faint-foreground tabular-nums">
          {new Date(achievement.awardedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
