'use client'

import { motion } from 'framer-motion'
import { Bell, Globe, Users, TrendingUp, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { LucideIcon } from 'lucide-react'

interface FeatureItem {
  icon: LucideIcon
  titleKey: string
  descKey: string
}

interface ComingSoonPageProps {
  /** Main icon shown in the hero circle */
  icon: LucideIcon
  /** i18n namespace for this specific page (e.g. 'discovery', 'live', 'leaderboards') */
  ns: string
  /** Feature cards to show — defaults to generic discover/community/inspiration */
  features?: FeatureItem[]
}

export function ComingSoonPage({ icon: MainIcon, ns, features }: ComingSoonPageProps) {
  const accent = useAccentColors()
  const t = useTranslations(ns)
  const tc = useTranslations('common')

  const defaultFeatures: FeatureItem[] = [
    { icon: TrendingUp, titleKey: 'trends', descKey: 'trendsDesc' },
    { icon: Users, titleKey: 'community', descKey: 'communityDesc' },
    { icon: Sparkles, titleKey: 'inspiration', descKey: 'inspirationDesc' },
  ]

  const featureCards = features ?? defaultFeatures

  return (
    <div className="min-h-[78vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-xl w-full text-center"
      >
        {/* Hero icon */}
        <motion.div
          className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="absolute -inset-6 rounded-full opacity-30 blur-2xl"
            style={{ background: `radial-gradient(closest-side, ${accent.primary}55, transparent 70%)` }}
          />
          <div
            className="relative w-full h-full rounded-3xl grid place-items-center ring-1 ring-inset ring-border-subtle bg-surface-1 shadow-md shadow-zinc-900/[0.04] dark:shadow-black/30"
          >
            <div
              className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl grid place-items-center"
              style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
            >
              <MainIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
          </div>
          <motion.div
            className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-surface-1 ring-1 ring-inset ring-border-subtle grid place-items-center shadow-sm"
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
          >
            <Globe className={`w-3.5 h-3.5 ${accent.text}`} />
          </motion.div>
        </motion.div>

        {/* Pre-title */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-surface-1 ring-1 ring-inset ring-border-subtle text-[11px] font-medium text-muted-foreground"
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: accent.primary }}
          />
          {tc('inDevelopment')}
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t('title')}{' '}
          <span className={`bg-gradient-to-r ${accent.gradient} bg-clip-text text-transparent`}>
            {tc('comingSoon')}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-sm sm:text-base text-muted-foreground mb-7 leading-relaxed max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('teaser')}
        </motion.p>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-7"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {featureCards.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 text-left hover:ring-border-strong hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-300 ease-out-expo"
              >
                <div className={`inline-flex w-9 h-9 items-center justify-center rounded-xl ${accent.bgMuted} ring-1 ring-inset ring-border-subtle mb-2.5`}>
                  <Icon className={`w-4 h-4 ${accent.text}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">{t(feature.titleKey)}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
              </div>
            )
          })}
        </motion.div>

        {/* Notify button */}
        <motion.button
          className={`inline-flex items-center gap-2 px-5 h-11 bg-gradient-to-r ${accent.gradient} text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-md`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Bell className="w-4 h-4" />
          {tc('notifyOnLaunch')}
        </motion.button>
      </motion.div>
    </div>
  )
}
