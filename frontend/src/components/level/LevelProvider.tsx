'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react'
import { UserLevelDto } from '@/types/level'
import { getMyLevel } from '@/lib/api/levelApi'
import { chatConnection } from '@/lib/signalr/chatConnection'

interface LevelContextType {
  level: UserLevelDto | null
  loading: boolean
  refreshLevel: () => Promise<void>
}

const LevelContext = createContext<LevelContextType | undefined>(undefined)

export function LevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevel] = useState<UserLevelDto | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshLevel = useCallback(async () => {
    try {
      const data = await getMyLevel()
      setLevel(data)
    } catch (error) {
      console.error('Failed to fetch level:', error)
    }
  }, [])

  useEffect(() => {
    const fetchLevel = async () => {
      setLoading(true)
      await refreshLevel()
      setLoading(false)
    }

    fetchLevel()
  }, [refreshLevel])

  // Listen for real-time XP updates via SignalR
  useEffect(() => {
    const handleXpUpdated = (data: { xpAdded: number; leveledUp: boolean; newLevel: number; currentState: UserLevelDto }) => {
      console.log('[LevelProvider] XpUpdated:', data.xpAdded, 'XP, leveledUp:', data.leveledUp)
      // Directly update from the payload — no extra API call needed
      setLevel(data.currentState)
    }

    chatConnection.onXpUpdated(handleXpUpdated)

    return () => {
      chatConnection.off('XpUpdated', handleXpUpdated)
    }
  }, [])

  const value = useMemo(() => ({ level, loading, refreshLevel }), [level, loading, refreshLevel])

  return (
    <LevelContext.Provider value={value}>
      {children}
    </LevelContext.Provider>
  )
}

export function useLevel() {
  const context = useContext(LevelContext)
  if (context === undefined) {
    throw new Error('useLevel must be used within a LevelProvider')
  }
  return context
}
