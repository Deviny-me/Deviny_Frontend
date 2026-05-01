'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'
import { AchievementsProvider, useAchievements } from '@/contexts/AchievementsContext'

/**
 * Wraps AchievementNotificationProvider and wires onLevelChange to LevelProvider.refreshLevel()
 * so XP/level bar updates automatically when an achievement is awarded.
 * Shared between Trainer and Nutritionist layouts.
 */
function AchievementBridgeInner({ children }: { children: React.ReactNode }) {
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

export function AchievementBridge({ children }: { children: React.ReactNode }) {
  return (
    <AchievementsProvider>
      <AchievementBridgeInner>{children}</AchievementBridgeInner>
    </AchievementsProvider>
  )
}
