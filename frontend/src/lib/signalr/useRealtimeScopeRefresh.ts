'use client'

import { useEffect, useMemo, useRef } from 'react'
import { chatConnection, type EntityChangedEvent } from '@/lib/signalr/chatConnection'

interface UseRealtimeScopeRefreshOptions {
  enabled?: boolean
  debounceMs?: number
}

export function useRealtimeScopeRefresh(
  scopes: string[],
  onRefresh: () => void,
  options?: UseRealtimeScopeRefreshOptions,
) {
  const enabled = options?.enabled ?? true
  const debounceMs = options?.debounceMs ?? 500
  const refreshRef = useRef(onRefresh)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  refreshRef.current = onRefresh

  const scopeSet = useMemo(() => new Set(scopes.map(s => s.toLowerCase())), [scopes])

  useEffect(() => {
    if (!enabled || scopeSet.size === 0) {
      return
    }

    const scheduleRefresh = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => refreshRef.current(), debounceMs)
    }

    const handleEntityChanged = (event: EntityChangedEvent) => {
      const scope = event.scope?.toLowerCase()
      if (!scope) {
        return
      }
      if (scopeSet.has(scope) || scopeSet.has('*')) {
        scheduleRefresh()
      }
    }

    const handleReconnected = () => {
      scheduleRefresh()
    }

    chatConnection.onEntityChanged(handleEntityChanged)
    chatConnection.onReconnected(handleReconnected)
    chatConnection.start().catch(err => console.error('[Realtime] SignalR start failed:', err))

    return () => {
      chatConnection.off('EntityChanged', handleEntityChanged)
      chatConnection.offReconnected(handleReconnected)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [enabled, debounceMs, scopeSet])
}
