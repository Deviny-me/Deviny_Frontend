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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg w-full text-center"
      >
        {/* Animated Icon */}
        <motion.div
          className="relative w-32 h-32 mx-auto mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${accent.gradient} rounded-full blur-2xl opacity-30 animate-pulse`} />
          <div className={`relative w-full h-full bg-gradient-to-br ${accent.gradient} rounded-full flex items-center justify-center`}>
            <MainIcon className="w-16 h-16 text-white" />
          </div>
          <motion.div
            className="absolute -top-2 -right-2 w-10 h-10 bg-surface-2 border border-border-subtle rounded-full flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Globe className={`w-5 h-5 ${accent.text}`} />
          </motion.div>
          <motion.div
            className="absolute -bottom-2 -left-2 w-10 h-10 bg-surface-2 border border-border-subtle rounded-full flex items-center justify-center"
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            <Users className={`w-5 h-5 ${accent.textSecondary}`} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {t('title')}{' '}
          <span className={`bg-gradient-to-r ${accent.gradient} bg-clip-text text-transparent`}>
            {tc('comingSoon')}
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          className="text-muted-foreground text-lg mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {t('teaser')}
        </motion.p>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {featureCards.map((feature, i) => {
            const Icon = feature.icon
            const bgClasses = [accent.bgMuted, accent.featureCard2Bg ?? accent.bgMuted, accent.featureCard1Bg ?? accent.bgMuted]
            const textClasses = [accent.text, accent.textSecondary ?? accent.text, accent.featureCard1Text ?? accent.text]
            return (
              <div key={i} className="bg-surface-2 border border-border-subtle rounded-xl p-4">
                <div className={`w-10 h-10 ${bgClasses[i % 3]} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <Icon className={`w-5 h-5 ${textClasses[i % 3]}`} />
                </div>
                <h3 className="text-foreground font-medium mb-1">{t(feature.titleKey)}</h3>
                <p className="text-xs text-faint-foreground">{t(feature.descKey)}</p>
              </div>
            )
          })}
        </motion.div>

        {/* Notify button */}
        <motion.button
          className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${accent.gradient} text-white font-medium rounded-xl hover:opacity-90 transition-opacity`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Bell className="w-5 h-5" />
          {tc('notifyOnLaunch')}
        </motion.button>

        {/* Progress indicator */}
        <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          <div className="flex items-center justify-center gap-2 text-sm text-faint-foreground">
            <div className={`w-2 h-2 ${accent.bg} rounded-full animate-pulse`} />
            <span>{tc('inDevelopment')}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
