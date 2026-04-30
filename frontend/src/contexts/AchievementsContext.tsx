'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMyAchievements } from '@/lib/api/achievementApi'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import type { AchievementAwardedEvent, AchievementDto, MyAchievementsResponse } from '@/types/achievement'

interface AchievementsContextValue {
  data: MyAchievementsResponse | null
  loading: boolean
  error: string | null
  unlocked: AchievementDto[]
  locked: AchievementDto[]
  unlockedCount: number
  totalCount: number
  refresh: () => Promise<void>
  applyAwardedAchievement: (event: AchievementAwardedEvent) => void
}

const AchievementsContext = createContext<AchievementsContextValue | null>(null)

const rarityRank: Record<string, number> = {
  Legendary: 4,
  Epic: 3,
  Rare: 2,
  Common: 1,
}

function sortAchievements(items: AchievementDto[]): AchievementDto[] {
  return [...items].sort((a, b) => {
    if (a.isUnlocked !== b.isUnlocked) {
      return a.isUnlocked ? -1 : 1
    }

    if (a.isUnlocked && b.isUnlocked) {
      const aTime = a.awardedAt ? new Date(a.awardedAt).getTime() : 0
      const bTime = b.awardedAt ? new Date(b.awardedAt).getTime() : 0
      if (aTime !== bTime) return bTime - aTime
    }

    const rarityDiff = (rarityRank[b.rarity] ?? 0) - (rarityRank[a.rarity] ?? 0)
    if (rarityDiff !== 0) return rarityDiff

    return a.title.localeCompare(b.title)
  })
}

function normalize(response: MyAchievementsResponse): MyAchievementsResponse {
  const all = sortAchievements(response.all)
  const unlockedCount = all.filter((a) => a.isUnlocked).length
  return {
    all,
    unlockedCount,
    totalCount: all.length,
  }
}

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<MyAchievementsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getMyAchievements()
      setData(normalize(response))
      setError(null)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load achievements'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useRealtimeScopeRefresh(['achievements', 'profile'], refresh)

  const applyAwardedAchievement = useCallback((event: AchievementAwardedEvent) => {
    setData((prev) => {
      if (!prev) return prev

      const awardedAt = new Date().toISOString()
      const index = prev.all.findIndex((a) => a.id === event.id || a.code === event.code)

      let updatedAll: AchievementDto[]
      if (index >= 0) {
        updatedAll = prev.all.map((achievement, i) => {
          if (i !== index) return achievement
          return {
            ...achievement,
            title: event.title || achievement.title,
            description: event.description || achievement.description,
            iconKey: event.iconKey || achievement.iconKey,
            colorKey: event.colorKey || achievement.colorKey,
            rarity: event.rarity || achievement.rarity,
            xpReward: event.xpReward ?? achievement.xpReward,
            isUnlocked: true,
            awardedAt: achievement.awardedAt || awardedAt,
          }
        })
      } else {
        updatedAll = [
          ...prev.all,
          {
            id: event.id,
            code: event.code,
            title: event.title,
            description: event.description,
            iconKey: event.iconKey,
            colorKey: event.colorKey,
            rarity: event.rarity,
            xpReward: event.xpReward,
            targetRole: null,
            isUnlocked: true,
            awardedAt,
          },
        ]
      }

      return normalize({
        all: updatedAll,
        unlockedCount: prev.unlockedCount,
        totalCount: prev.totalCount,
      })
    })
  }, [])

  const value = useMemo<AchievementsContextValue>(() => {
    const all = data?.all ?? []
    const unlocked = all.filter((a) => a.isUnlocked)
    const locked = all.filter((a) => !a.isUnlocked)

    return {
      data,
      loading,
      error,
      unlocked,
      locked,
      unlockedCount: data?.unlockedCount ?? 0,
      totalCount: data?.totalCount ?? 0,
      refresh,
      applyAwardedAchievement,
    }
  }, [data, loading, error, refresh, applyAwardedAchievement])

  return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>
}

export function useAchievements() {
  const context = useContext(AchievementsContext)
  if (!context) {
    throw new Error('useAchievements must be used within AchievementsProvider')
  }
  return context
}

export function useAchievementsOptional() {
  return useContext(AchievementsContext)
}
