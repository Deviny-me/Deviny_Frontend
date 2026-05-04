import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant =
  | 'user'
  | 'trainer'
  | 'nutritionist'
  | 'gray'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'

type BadgeSize = 'sm' | 'md'
type BadgeTone = 'soft' | 'solid'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  tone?: BadgeTone
  dot?: boolean
}

/* Soft (default): tinted bg + text on themed surfaces.
 * Solid: filled colored chip.
 */
const SOFT: Record<BadgeVariant, string> = {
  user:         'bg-user-100/70 text-user-700 dark:bg-user-500/15 dark:text-user-300',
  trainer:      'bg-trainer-100/70 text-trainer-700 dark:bg-trainer-500/15 dark:text-trainer-300',
  nutritionist: 'bg-nutritionist-100/70 text-nutritionist-700 dark:bg-nutritionist-500/15 dark:text-nutritionist-300',
  primary:      'bg-primary-100/70 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300',
  gray:         'bg-surface-3 text-muted-foreground',
  success:      'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  warning:      'bg-amber-100/70 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  danger:       'bg-red-100/70 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  info:         'bg-sky-100/70 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  outline:      'bg-transparent text-foreground ring-1 ring-inset ring-border',
}

const SOLID: Record<BadgeVariant, string> = {
  user:         'bg-user-600 text-white',
  trainer:      'bg-trainer-600 text-white',
  nutritionist: 'bg-nutritionist-600 text-white',
  primary:      'bg-primary-600 text-white',
  gray:         'bg-foreground text-background',
  success:      'bg-emerald-600 text-white',
  warning:      'bg-amber-500 text-white',
  danger:       'bg-red-600 text-white',
  info:         'bg-sky-600 text-white',
  outline:      'bg-transparent text-foreground ring-1 ring-inset ring-border-strong',
}

const DOT_COLOR: Record<BadgeVariant, string> = {
  user:         'bg-user-500',
  trainer:      'bg-trainer-500',
  nutritionist: 'bg-nutritionist-500',
  primary:      'bg-primary-500',
  gray:         'bg-faint-foreground',
  success:      'bg-emerald-500',
  warning:      'bg-amber-500',
  danger:       'bg-red-500',
  info:         'bg-sky-500',
  outline:      'bg-foreground',
}

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-[11px] gap-1',
  md: 'h-6 px-2.5 text-xs gap-1.5',
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'gray', size = 'md', tone = 'soft', dot = false, children, ...props }, ref) => {
    const palette = tone === 'solid' ? SOLID[variant] : SOFT[variant]

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium tracking-tight whitespace-nowrap',
          SIZE_STYLES[size],
          palette,
          className,
        )}
        {...props}
      >
        {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_COLOR[variant])} aria-hidden />}
        {children}
      </span>
    )
  },
)

Badge.displayName = 'Badge'

export { Badge }
export type { BadgeProps, BadgeVariant, BadgeSize, BadgeTone }
