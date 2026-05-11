'use client'

import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ExerciseMediaProps {
  /** Two-frame animation. If only one frame is needed, repeat the URL. */
  frames?: [string, string] | readonly [string, string]
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Cross-fade interval in ms. Set to 0 to disable animation. */
  intervalMs?: number
  /** How the image fills the container. Defaults to 'cover'. */
  fit?: 'cover' | 'contain'
}

const SIZES = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-full aspect-square',
  xl: 'w-24 h-24',
}

/**
 * Animated exercise preview: cross-fades between two static frames to create
 * a GIF-like loop. Falls back to a stylized gradient placeholder if the
 * images fail to load (e.g. offline / blocked CDN).
 */
export function ExerciseMedia({
  frames,
  alt,
  size = 'md',
  className,
  intervalMs = 700,
  fit = 'cover',
}: ExerciseMediaProps) {
  const [failed, setFailed] = useState(false)
  const [tick, setTick] = useState(0)

  const hasTwo = !!frames && frames[0] !== frames[1] && intervalMs > 0
  useEffect(() => {
    if (!hasTwo) return
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [hasTwo, intervalMs])

  const showImage = frames && !failed
  const showSecond = hasTwo && tick % 2 === 1

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle',
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <>
          {/* Frame A */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frames[0]}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className={cn(
              'absolute inset-0 h-full w-full transition-opacity duration-500',
              fit === 'contain' ? 'object-contain' : 'object-cover',
              showSecond ? 'opacity-0' : 'opacity-100',
            )}
          />
          {/* Frame B */}
          {hasTwo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frames[1]}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className={cn(
                'absolute inset-0 h-full w-full transition-opacity duration-500',
                fit === 'contain' ? 'object-contain' : 'object-cover',
                showSecond ? 'opacity-100' : 'opacity-0',
              )}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-user-500/20 via-user-600/10 to-transparent">
          <Dumbbell className="h-1/2 w-1/2 text-user-500/60" />
        </div>
      )}
    </div>
  )
}
