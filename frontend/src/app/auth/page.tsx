'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { User, Dumbbell, Apple, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { saveRole } from '@/features/auth/utils/storage'
import { RoleType } from '@/features/auth/types/role.types'

export default function AuthPage() {
  const t = useTranslations('auth')
  const [loadingRole, setLoadingRole] = useState<RoleType | null>(null)
  const [hoveredRole, setHoveredRole] = useState<RoleType | null>(null)

  const roles: {
    type: RoleType
    icon: typeof User
    label: string
    description: string
    gradient: string
    iconBg: string
    iconColor: string
    hoverBorder: string
    glowColor: string
    accentGradient: string
  }[] = [
    {
      type: 'user',
      icon: User,
      label: t('roles.user.title'),
      description: t('roles.user.description'),
      gradient: 'from-user-500 to-user-600',
      iconBg: 'bg-gradient-to-br from-user-100 to-user-200 dark:from-user-500/20 dark:to-user-600/20',
      iconColor: 'text-user-600 dark:text-user-400',
      hoverBorder: 'hover:border-user-300/60 dark:hover:border-user-500/40',
      glowColor: 'group-hover:shadow-user-200/40 dark:group-hover:shadow-user-500/20',
      accentGradient: 'from-user-500 to-user-600',
    },
    {
      type: 'trainer',
      icon: Dumbbell,
      label: t('roles.trainer.title'),
      description: t('roles.trainer.description'),
      gradient: 'from-trainer-500 to-trainer-600',
      iconBg: 'bg-gradient-to-br from-trainer-100 to-trainer-200 dark:from-trainer-500/20 dark:to-trainer-600/20',
      iconColor: 'text-trainer-600 dark:text-trainer-400',
      hoverBorder: 'hover:border-trainer-300/60 dark:hover:border-trainer-500/40',
      glowColor: 'group-hover:shadow-trainer-200/40 dark:group-hover:shadow-trainer-500/20',
      accentGradient: 'from-trainer-500 to-trainer-600',
    },
    {
      type: 'nutritionist',
      icon: Apple,
      label: t('roles.nutritionist.title'),
      description: t('roles.nutritionist.description'),
      gradient: 'from-nutritionist-500 to-nutritionist-600',
      iconBg: 'bg-gradient-to-br from-nutritionist-100 to-nutritionist-200 dark:from-nutritionist-500/20 dark:to-nutritionist-600/20',
      iconColor: 'text-nutritionist-600 dark:text-nutritionist-400',
      hoverBorder: 'hover:border-nutritionist-300/60 dark:hover:border-nutritionist-500/40',
      glowColor: 'group-hover:shadow-nutritionist-200/40 dark:group-hover:shadow-nutritionist-500/20',
      accentGradient: 'from-nutritionist-500 to-nutritionist-600',
    },
  ]

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in-up">
      {/* Mobile hero */}
      {/* Скрыто на всех мобильных устройствах */}
      {/*
      <div className="xl:hidden text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100/60 dark:bg-primary-500/10 border border-primary-200/50 dark:border-primary-500/20 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-primary-500" />
          <span className="text-xs font-semibold text-primary-700 dark:text-primary-400">{t('tagline')}</span>
        </div>
      </div>
      */}

      <div className="text-center mb-10">
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('heroTitle')}
        </h2>
        <p className="mt-3 text-gray-500 dark:text-gray-400 text-base">{t('chooseRole')}</p>
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        {roles.map(({ type, icon: Icon, label, description, iconBg, iconColor, hoverBorder, glowColor, accentGradient }, index) => (
          <Link
            key={type}
            href={`/auth/login?role=${type}`}
            onClick={() => { saveRole(type); setLoadingRole(type) }}
            onMouseEnter={() => setHoveredRole(type)}
            onMouseLeave={() => setHoveredRole(null)}
            className={cn(
              `group relative flex items-center gap-3 sm:gap-5 rounded-2xl border border-gray-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-white/[0.03] backdrop-blur-md p-3 sm:p-5 md:p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-fade-in-up-delay-${index + 1}`,
              hoverBorder,
              glowColor,
              loadingRole && loadingRole !== type && 'opacity-40 pointer-events-none scale-[0.98]',
            )}
          >
            {/* Accent line on hover */}
            <div className={cn(
              'absolute left-0 top-2 sm:top-4 bottom-2 sm:bottom-4 w-0.5 sm:w-1 rounded-full bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-300',
              accentGradient
            )} />

            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                'bg-gradient-to-r from-transparent via-white/10 to-transparent',
                hoveredRole === type && 'animate-shimmer'
              )} />
            </div>

            <div className={cn('relative flex-shrink-0 w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3', iconBg)}>
              <Icon className={cn('w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-transform duration-300', iconColor)} />
            </div>
            <div className="flex-1 min-w-0 relative">
              <p className="font-bold text-gray-900 dark:text-white text-base sm:text-lg md:text-xl tracking-tight">{label}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{description}</p>
            </div>
            {loadingRole === type ? (
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin flex-shrink-0" />
            ) : (
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Mobile features hint (скрыто на всех экранах) */}
      {/*
      <div className="xl:hidden mt-10 grid grid-cols-2 gap-3 animate-fade-in-up-delay-4">
        {[
          { emoji: '💪', text: t('features.programs') },
          { emoji: '👥', text: t('features.community') },
          { emoji: '🏆', text: t('features.challenges') },
          { emoji: '💬', text: t('features.chat') },
        ].map(({ emoji, text }) => (
          <div key={text} className="flex items-center gap-2.5 rounded-xl bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200/50 dark:border-white/[0.06] p-3.5 hover:bg-white/80 dark:hover:bg-white/[0.06] transition-all duration-300">
            <span className="text-lg">{emoji}</span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{text}</span>
          </div>
        ))}
      </div>
      */}
    </div>
  )
}
