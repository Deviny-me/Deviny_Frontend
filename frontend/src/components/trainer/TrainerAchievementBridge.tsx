'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'
import { AchievementsProvider, useAchievements } from '@/contexts/AchievementsContext'

/**
 * @deprecated Use AchievementBridge from '@/components/shared/AchievementBridge' instead.
 * Kept for backward compatibility with trainer layout.
 */
function TrainerAchievementBridgeInner({ children }: { children: React.ReactNode }) {
  const { refreshLevel } = useLevel()
  const { applyAwardedAchievement, refresh } = useAchievements()

  const handleAchievementAwarded = async (data: Parameters<typeof applyAwardedAchievement>[0]) => {
    applyAwardedAchievement(data)
    await refresh()
  }

  return (
    <AchievementNotificationProvider
      onLevelChange={refreshLevel}
      onAchievementAwarded={handleAchievementAwarded}
    >
      {children}
    </AchievementNotificationProvider>
  )
}

export function TrainerAchievementBridge({ children }: { children: React.ReactNode }) {
  return (
    <AchievementsProvider>
      <TrainerAchievementBridgeInner>{children}</TrainerAchievementBridgeInner>
    </AchievementsProvider>
  )
}
