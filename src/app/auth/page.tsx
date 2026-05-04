'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, Dumbbell, Apple, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { saveRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'

interface RoleEntry {
  type: RoleType
  icon: typeof User
  label: string
  description: string
  iconBg: string
  iconColor: string
  hoverRing: string
  accent: string
}

export default function AuthPage() {
  const t = useTranslations('auth')
  const [loadingRole, setLoadingRole] = useState<RoleType | null>(null)

  const roles: RoleEntry[] = [
    {
      type: 'user',
      icon: User,
      label: t('roles.user.title'),
      description: t('roles.user.description'),
      iconBg: 'bg-user-500/10',
      iconColor: 'text-user-600 dark:text-user-300',
      hoverRing: 'group-hover:ring-user-500/40',
      accent: 'bg-user-500',
    },
    {
      type: 'trainer',
      icon: Dumbbell,
      label: t('roles.trainer.title'),
      description: t('roles.trainer.description'),
      iconBg: 'bg-trainer-500/10',
      iconColor: 'text-trainer-600 dark:text-trainer-300',
      hoverRing: 'group-hover:ring-trainer-500/40',
      accent: 'bg-trainer-500',
    },
    {
      type: 'nutritionist',
      icon: Apple,
      label: t('roles.nutritionist.title'),
      description: t('roles.nutritionist.description'),
      iconBg: 'bg-nutritionist-500/10',
      iconColor: 'text-nutritionist-600 dark:text-nutritionist-300',
      hoverRing: 'group-hover:ring-nutritionist-500/40',
      accent: 'bg-nutritionist-500',
    },
  ]

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in-up">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
          {t('heroTitle')}
        </h1>
        <p className="mt-3 text-muted-foreground text-base">{t('chooseRole')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {roles.map(({ type, icon: Icon, label, description, iconBg, iconColor, hoverRing, accent }) => {
          const isLoading = loadingRole === type
          const isDimmed = loadingRole && !isLoading
          return (
            <Link
              key={type}
              href={`/auth/login?role=${type}`}
              onClick={() => { saveRole(type); setLoadingRole(type) }}
              className={cn(
                'group relative flex items-center gap-4 p-4 sm:p-5',
                'rounded-2xl',
                // Card surface — follows theme
                'bg-surface-1 dark:bg-surface-1/70 dark:backdrop-blur-xl',
                // Visible border + shadow so it reads as a button
                'ring-1 ring-border dark:ring-border-subtle',
                'shadow-md shadow-zinc-900/[0.06] dark:shadow-lg dark:shadow-black/30',
                'transition-[transform,box-shadow,border-color,opacity] duration-250 ease-out-expo',
                'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-900/[0.08] dark:hover:shadow-black/40',
                hoverRing,
                'active:translate-y-0 active:duration-75',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isDimmed && 'opacity-40 pointer-events-none',
              )}
            >
              {/* Accent rail */}
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full opacity-0 transition-opacity duration-300 group-hover:opacity-100',
                  accent,
                )}
              />

              <div className={cn('flex-shrink-0 grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-xl', iconBg)}>
                <Icon className={cn('h-6 w-6 sm:h-7 sm:w-7', iconColor)} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-base sm:text-lg tracking-tight">{label}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </div>

              {isLoading ? (
                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin flex-shrink-0" />
              ) : (
                <span className="flex-shrink-0 grid place-items-center h-9 w-9 rounded-full bg-surface-2 text-muted-foreground transition-[transform,background-color,color] duration-200 ease-out-expo group-hover:bg-surface-4 group-hover:text-foreground group-hover:translate-x-0.5">
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

