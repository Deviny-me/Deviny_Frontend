'use client'

import { Grid, Repeat2, Video } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ProfilePostTab } from '@/types/post'
import { useAccentColors } from '@/lib/theme/useAccentColors'

interface ProfilePostTabsProps {
  activeTab: ProfilePostTab
  onTabChange: (tab: ProfilePostTab) => void
  disabled?: boolean
}

export function ProfilePostTabs({ activeTab, onTabChange, disabled }: ProfilePostTabsProps) {
  const accent = useAccentColors()
  const tPosts = useTranslations('posts')

  const tabs: { key: ProfilePostTab; label: string; icon: typeof Grid }[] = [
    { key: 'all', label: tPosts('allPosts'), icon: Grid },
    { key: 'videos', label: tPosts('videosTab'), icon: Video },
    { key: 'reposts', label: tPosts('repostsTab'), icon: Repeat2 },
  ]

  return (
    <div className="grid grid-cols-3 gap-1 border-b border-border-subtle bg-surface-1 p-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key

        return (
          <button
            key={tab.key}
            disabled={disabled && !isActive}
            onClick={() => onTabChange(tab.key)}
            className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-[12px] font-medium leading-tight transition-colors sm:flex-row sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
              isActive
                ? `${accent.text} bg-background shadow-sm`
                : disabled
                  ? 'cursor-not-allowed text-gray-600'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-2 break-words">{tab.label}</span>
            {isActive && (
              <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full ${accent.bg}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}
