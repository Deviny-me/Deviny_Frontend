'use client'

import { useTranslations } from 'next-intl'
import { Info } from 'lucide-react'
import { RatingStars } from './RatingStars'

export type RatingKind = 'activity' | 'professional' | 'program'

interface Props {
  /** 0..5 with 0.5 increments. */
  starRating: number
  /** Precise score, e.g. 4.73 */
  overallScore: number
  /** Number of underlying inputs counted by backend. */
  ratingCount: number
  /**
   * Which rating bucket this is. Affects the tooltip copy and label.
   * - activity: reputation/engagement of any user
   * - professional: trainer/nutritionist program quality
   * - program: a specific training/meal program
   */
  kind?: RatingKind
  /** Compact vs default sizing. */
  size?: 'sm' | 'md'
  /** Hide the (count) suffix. */
  hideCount?: boolean
  className?: string
}

/**
 * Single source of truth for displaying a backend rating value.
 * Always renders 5 stars (the scale), the precise score, and the count
 * of inputs that fed the rating. A hover/tap tooltip explains exactly
 * what the count means so users don't think "10 = 10 stars".
 */
export function RatingBadge({
  starRating,
  overallScore,
  ratingCount,
  kind = 'activity',
  size = 'sm',
  hideCount = false,
  className = '',
}: Props) {
  const t = useTranslations('rating')

  const starSize = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  const text = size === 'md' ? 'text-sm' : 'text-[11px]'
  const tooltipKey =
    kind === 'professional'
      ? 'tooltipProfessional'
      : kind === 'program'
        ? 'tooltipProgram'
        : 'tooltipActivity'

  return (
    <span
      className={`group/rating relative inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-inset ring-amber-500/20 ${text} ${className}`}
      title={t(tooltipKey, { count: ratingCount, score: overallScore.toFixed(2) })}
    >
      <RatingStars value={starRating} sizeClassName={starSize} />
      <span className="tabular-nums">{overallScore.toFixed(1)}</span>
      {!hideCount && (
        <span className="text-faint-foreground tabular-nums">({ratingCount})</span>
      )}
      <Info className="w-3 h-3 opacity-0 group-hover/rating:opacity-60 transition-opacity" />

      {/* Custom tooltip (richer than the native title) */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-60 rounded-lg bg-surface-2 ring-1 ring-inset ring-border-subtle shadow-lg p-3 text-left opacity-0 group-hover/rating:opacity-100 transition-opacity"
      >
        <span className="block text-[11px] font-semibold text-foreground mb-1">
          {t(`label_${kind}`)}
        </span>
        <span className="block text-[11px] leading-snug text-muted-foreground">
          {t(tooltipKey, { count: ratingCount, score: overallScore.toFixed(2) })}
        </span>
      </span>
    </span>
  )
}

export default RatingBadge
