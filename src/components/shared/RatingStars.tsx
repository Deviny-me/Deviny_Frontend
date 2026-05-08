'use client'

import { Star } from 'lucide-react'

interface Props {
  /** 0..5 with 0.5 increments. */
  value: number
  /** Tailwind size classes for each star, e.g. 'w-3 h-3'. */
  sizeClassName?: string
  /** Color of empty/background star. */
  emptyClassName?: string
  /** Color of filled portion. */
  filledClassName?: string
  className?: string
}

/**
 * Renders 5 stars supporting half-star increments.
 * Use `starRating` from the backend ratings API as `value`.
 */
export function RatingStars({
  value,
  sizeClassName = 'w-3.5 h-3.5',
  emptyClassName = 'text-faint-foreground',
  filledClassName = 'text-amber-400 fill-amber-400',
  className = '',
}: Props) {
  const states: ('full' | 'half' | 'empty')[] = []
  let remaining = Math.max(0, Math.min(5, value || 0))
  for (let i = 0; i < 5; i++) {
    if (remaining >= 1) {
      states.push('full')
      remaining -= 1
    } else if (remaining >= 0.5) {
      states.push('half')
      remaining = 0
    } else {
      states.push('empty')
    }
  }
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {states.map((s, i) => (
        <span key={i} className={`relative inline-block ${sizeClassName}`}>
          <Star className={`absolute inset-0 ${sizeClassName} ${emptyClassName}`} />
          {s !== 'empty' && (
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: s === 'full' ? '100%' : '50%' }}
            >
              <Star className={`${sizeClassName} ${filledClassName}`} />
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

export default RatingStars
