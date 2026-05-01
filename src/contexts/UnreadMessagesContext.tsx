'use client'

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react'
import { chatConnection } from '@/lib/signalr/chatConnection'
import { usePathname } from 'next/navigation'
import { messagesApi } from '@/lib/api/messagesApi'

interface UnreadMessagesContextType {
  unreadCount: number
  incrementUnread: () => void
  resetUnread: () => void
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined)

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0)
  const prevUnreadCountRef = useRef(0)
  const pathname = usePathname()
  const isMessagesPage = pathname?.includes('/messages')

  // Fetch server-authoritative unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await messagesApi.getUnreadCount()
      console.log('[Unread] Server count:', result.unreadCount)
      setUnreadCount(result.unreadCount)
    } catch (error) {
      console.error('[Unread] Failed to load count:', error)
    }
  }, [])

  // 1) Initial load from REST
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // 2) Re-fetch from server when user navigates to messages page
  //    (MarkRead will fire UnreadCountUpdated, but we also re-fetch for accuracy)
  useEffect(() => {
    if (isMessagesPage) {
      fetchUnreadCount()
    }
  }, [isMessagesPage, fetchUnreadCount])

  // 3) SignalR subscription — register handler, then start connection
  useEffect(() => {
    if (typeof window === 'undefined') return
    let mounted = true

    const handleUnreadCountUpdated = (data: { totalUnreadCount: number }) => {
      if (mounted) {
        // Play notification sound when unread count increases
        if (data.totalUnreadCount > prevUnreadCountRef.current) {
          try {
            const audio = new Audio('/sounds/message.wav')
            audio.volume = 0.5
            audio.play().catch(() => {})
          } catch {}
        }
        prevUnreadCountRef.current = data.totalUnreadCount
        setUnreadCount(data.totalUnreadCount)
      }
    }

    const handleReconnected = () => {
      console.log('[Unread] 🔄 Reconnected, re-fetching...')
      if (mounted) fetchUnreadCount()
    }

    // Register handlers BEFORE start — they get stored in the Map
    // and re-applied on new connections / reconnects
    chatConnection.on('UnreadCountUpdated', handleUnreadCountUpdated)
    chatConnection.onReconnected(handleReconnected)

    // Fire and forget — if connection already active, start() is a no-op
    chatConnection.start().catch(err => console.error('[Unread] SignalR start failed:', err))

    return () => {
      mounted = false
      chatConnection.off('UnreadCountUpdated', handleUnreadCountUpdated)
      chatConnection.offReconnected(handleReconnected)
    }
  }, [fetchUnreadCount])

  const incrementUnread = useCallback(() => setUnreadCount(prev => prev + 1), [])
  const resetUnread = useCallback(() => setUnreadCount(0), [])

  const value = useMemo(() => ({ unreadCount, incrementUnread, resetUnread }), [unreadCount, incrementUnread, resetUnread])

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext)
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider')
  }
  return context
}
