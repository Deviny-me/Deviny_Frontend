'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react'
import { notificationsApi } from '@/lib/api/notificationsApi'
import { chatConnection } from '@/lib/signalr/chatConnection'
import * as signalR from '@microsoft/signalr'

interface UnreadNotificationsContextType {
  unreadCount: number
  refreshCount: () => void
}

const UnreadNotificationsContext = createContext<UnreadNotificationsContextType | undefined>(undefined)

const POLLING_INTERVAL = 90_000 // 90 seconds fallback when realtime is unavailable

export function UnreadNotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationsApi.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('[Notifications] Failed to load unread count:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Real-time unread count updates via SignalR
  useEffect(() => {
    let mounted = true

    const handleCountUpdate = (data: { unreadCount: number }) => {
      if (mounted) {
        setUnreadCount(data.unreadCount)
      }
    }

    const handleReconnected = () => {
      if (mounted) {
        fetchUnreadCount()
      }
    }

    chatConnection.onNotificationCountUpdated(handleCountUpdate)
    chatConnection.onReconnected(handleReconnected)
    chatConnection.start().catch(err => console.error('[Notifications] SignalR start failed:', err))

    return () => {
      mounted = false
      chatConnection.off('NotificationCountUpdated', handleCountUpdate)
      chatConnection.offReconnected(handleReconnected)
    }
  }, [fetchUnreadCount])

  // Fallback polling (keeps working even if SignalR disconnects)
  useEffect(() => {
    const pollIfNeeded = () => {
      // Avoid redundant polling while SignalR is healthy.
      if (chatConnection.getState() !== signalR.HubConnectionState.Connected) {
        fetchUnreadCount()
      }
    }

    intervalRef.current = setInterval(pollIfNeeded, POLLING_INTERVAL)

    const onVisibilityChange = () => {
      if (!document.hidden) {
        pollIfNeeded()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [fetchUnreadCount])

  const refreshCount = useCallback(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  const value = useMemo(
    () => ({ unreadCount, refreshCount }),
    [unreadCount, refreshCount]
  )

  return (
    <UnreadNotificationsContext.Provider value={value}>
      {children}
    </UnreadNotificationsContext.Provider>
  )
}

export function useUnreadNotifications() {
  const context = useContext(UnreadNotificationsContext)
  if (context === undefined) {
    throw new Error('useUnreadNotifications must be used within UnreadNotificationsProvider')
  }
  return context
}
