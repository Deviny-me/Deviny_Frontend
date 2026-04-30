'use client'

import { useEffect, useCallback } from 'react'
import { chatConnection } from '@/lib/signalr/chatConnection'
import { AchievementToastContainer, useAchievementToast } from '@/components/shared/AchievementToast'
import type { AchievementAwardedEvent } from '@/types/achievement'

interface Props {
  children: React.ReactNode
  /** Called after an achievement is awarded (use to refresh level/XP). */
  onLevelChange?: () => void
  /** Optional immediate sync hook for local achievement state stores. */
  onAchievementAwarded?: (data: AchievementAwardedEvent) => void
}

/**
 * Listens for AchievementAwarded SignalR events and shows toast notifications.
 * Place inside a layout that wraps authenticated pages.
 */
export function AchievementNotificationProvider({ children, onLevelChange, onAchievementAwarded }: Props) {
  const { toasts, show, dismiss } = useAchievementToast()

  const handleAchievementAwarded = useCallback(
    (data: AchievementAwardedEvent) => {
      console.log('[Achievement] Awarded:', data)
      show(data)
      onAchievementAwarded?.(data)

      // Refresh level/XP data after a short delay so the backend has committed the XP transaction
      if (onLevelChange) {
        setTimeout(() => onLevelChange(), 500)
      }
    },
    [show, onLevelChange, onAchievementAwarded]
  )

  useEffect(() => {
    chatConnection.onAchievementAwarded(handleAchievementAwarded)

    return () => {
      chatConnection.off('AchievementAwarded', handleAchievementAwarded)
    }
  }, [handleAchievementAwarded])

  return (
    <>
      {children}
      <AchievementToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}
