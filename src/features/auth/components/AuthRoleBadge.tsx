'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { RoleType } from '../types/role.types'

interface AuthRoleBadgeProps {
  role: RoleType
  Icon: LucideIcon
  title: string
  subtitle?: string
  className?: string
}

const ROLE_BADGE_STYLES: Record<RoleType, { bg: string; ring: string; icon: string; halo: string; gradientText: string }> = {
  user: {
    bg: 'bg-gradient-to-br from-user-50 to-user-100/60 dark:from-user-500/20 dark:to-user-600/10',
    ring: 'ring-1 ring-inset ring-user-500/20 dark:ring-user-400/20',
    icon: 'text-user-600 dark:text-user-300',
    halo: 'from-user-500/45',
    gradientText: 'from-user-500 to-user-700 dark:from-user-200 dark:to-user-400',
  },
  trainer: {
    bg: 'bg-gradient-to-br from-trainer-50 to-trainer-100/60 dark:from-trainer-500/20 dark:to-trainer-600/10',
    ring: 'ring-1 ring-inset ring-trainer-500/20 dark:ring-trainer-400/20',
    icon: 'text-trainer-600 dark:text-trainer-300',
    halo: 'from-trainer-500/45',
    gradientText: 'from-trainer-500 to-trainer-700 dark:from-trainer-200 dark:to-trainer-400',
  },
  nutritionist: {
    bg: 'bg-gradient-to-br from-nutritionist-50 to-nutritionist-100/60 dark:from-nutritionist-500/20 dark:to-nutritionist-600/10',
    ring: 'ring-1 ring-inset ring-nutritionist-500/20 dark:ring-nutritionist-400/20',
    icon: 'text-nutritionist-600 dark:text-nutritionist-300',
    halo: 'from-nutritionist-500/45',
    gradientText: 'from-nutritionist-500 to-nutritionist-700 dark:from-nutritionist-200 dark:to-nutritionist-400',
  },
}

/**
 * Hero badge shown atop login / register / forgot-password forms.
 * Premium icon tile with soft halo glow + gradient title text.
 * Adapts to both light and dark themes; size scales gracefully on mobile.
 */
export function AuthRoleBadge({ role, Icon, title, subtitle, className }: AuthRoleBadgeProps) {
  const styles = ROLE_BADGE_STYLES[role]

  return (
    <div className={cn('flex flex-col items-center mb-7 sm:mb-8', className)}>
      <div className="relative">
        {/* Halo glow */}
        <span
          aria-hidden
          className={cn(
            'absolute -inset-3 rounded-full bg-gradient-to-br to-transparent blur-2xl opacity-70',
            styles.halo,
          )}
        />
        {/* Icon tile */}
        <div
          className={cn(
            'relative grid place-items-center h-14 w-14 sm:h-16 sm:w-16 rounded-2xl mb-4',
            styles.bg,
            styles.ring,
            'shadow-sm shadow-black/5 dark:shadow-black/30',
          )}
        >
          <Icon className={cn('h-7 w-7 sm:h-8 sm:w-8', styles.icon)} strokeWidth={2} />
        </div>
      </div>

      <h1 className="text-[22px] leading-[1.15] sm:text-3xl font-semibold tracking-tight text-center">
        <span className={cn('bg-gradient-to-b bg-clip-text text-transparent', styles.gradientText)}>
          {title}
        </span>
      </h1>
      {subtitle && (
        <p className="text-[13px] sm:text-sm text-muted-foreground mt-2 text-center max-w-xs">
          {subtitle}
        </p>
      )}
    </div>
  )
}
