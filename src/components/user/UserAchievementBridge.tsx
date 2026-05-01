'use client'

import { useLevel } from '@/components/level/LevelProvider'
import { useUser } from '@/components/user/UserProvider'
import { AchievementNotificationProvider } from '@/components/shared/AchievementNotificationProvider'
import { AchievementsProvider, useAchievements } from '@/contexts/AchievementsContext'
import { useEffect } from 'react'

/**
 * Wraps AchievementNotificationProvider and wires onLevelChange to both
 * LevelProvider.refreshLevel() and UserProvider.refreshUser()
 * so XP/level bar and user data update automatically when an achievement is awarded.
 */
function UserAchievementBridgeInner({ children }: { children: React.ReactNode }) {
  const { refreshLevel } = useLevel()
  const { refreshUser, updateUser } = useUser()
  const { unlockedCount, applyAwardedAchievement, refresh } = useAchievements()

  useEffect(() => {
    updateUser({ achievementsCount: unlockedCount })
  }, [unlockedCount, updateUser])

  const handleLevelChange = async () => {
    await Promise.all([refreshLevel(), refreshUser()])
  }

  const handleAchievementAwarded = async (data: Parameters<typeof applyAwardedAchievement>[0]) => {
    applyAwardedAchievement(data)
    await refresh()
  }

  return (
    <AchievementNotificationProvider
      onLevelChange={handleLevelChange}
      onAchievementAwarded={handleAchievementAwarded}
    >
      {children}
    </AchievementNotificationProvider>
  )
}

export function UserAchievementBridge({ children }: { children: React.ReactNode }) {
  return (
    <AchievementsProvider>
      <UserAchievementBridgeInner>{children}</UserAchievementBridgeInner>
    </AchievementsProvider>
  )
}
