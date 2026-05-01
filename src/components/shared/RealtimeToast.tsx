'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { X, MessageCircle, UserPlus, UserCheck, Bell, Phone } from 'lucide-react'
import { chatConnection } from '@/lib/signalr/chatConnection'
import { getMediaUrl } from '@/lib/config'

interface ToastItem {
  id: string
  type: 'message' | 'friendRequest' | 'friendAccepted' | 'notification' | 'call'
  title: string
  body: string
  avatar: string | null
  href: string
  createdAt: number
}

const TOAST_DURATION = 10_000
const MAX_TOASTS = 4
const PENDING_INCOMING_CALL_STORAGE_KEY = 'deviny.pendingIncomingCall'
const CALL_RING_TIMEOUT_MS = 30_000

function getUserIdFromToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (
      payload.sub ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? null
    )
  } catch {
    return null
  }
}

function getBasePath(pathname: string | null): string {
  if (pathname?.startsWith('/trainer')) return '/trainer'
  if (pathname?.startsWith('/nutritionist')) return '/nutritionist'
  return '/user'
}

function isRtcDescription(value: unknown): value is RTCSessionDescriptionInit {
  if (!value || typeof value !== 'object') return false
  const description = value as RTCSessionDescriptionInit
  return typeof description.type === 'string' && typeof description.sdp === 'string'
}

function isRtcCandidate(value: unknown): value is RTCIceCandidateInit {
  return !!value && typeof value === 'object' && typeof (value as RTCIceCandidateInit).candidate === 'string'
}

const toastIcons = {
  message: <MessageCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />,
  friendRequest: <UserPlus className="w-5 h-5 text-green-400 flex-shrink-0" />,
  friendAccepted: <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
  notification: <Bell className="w-5 h-5 text-amber-400 flex-shrink-0" />,
  call: <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
}

export function RealtimeToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    currentUserIdRef.current = getUserIdFromToken()
  }, [])

  const addToast = useCallback((toast: Omit<ToastItem, 'id' | 'createdAt'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts(prev => {
      const next = [{ ...toast, id, createdAt: Date.now() }, ...prev]
      return next.slice(0, MAX_TOASTS)
    })
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return
    const interval = setInterval(() => {
      const now = Date.now()
      setToasts(prev => prev.filter(t => now - t.createdAt < TOAST_DURATION))
    }, 1000)
    return () => clearInterval(interval)
  }, [toasts.length])

  // SignalR event listeners
  useEffect(() => {
    const basePath = getBasePath(pathname)
    const myId = currentUserIdRef.current?.toLowerCase()

    // 1) New message — show toast via ConversationUpdated (sent to personal user group)
    const handleConversationUpdated = (data: {
      conversationId: string
      lastMessageText: string
      lastMessageAt: string
      senderId: string
      senderName?: string
      senderAvatarUrl?: string | null
      messageId: string
    }) => {
      if (data.senderId.toLowerCase() === myId) return
      // Don't show if user is on the messages page (they see it in chat)
      if (pathname?.includes('/messages')) return

      const text = data.lastMessageText || ''
      const truncatedText = text.length > 80 ? text.slice(0, 80) + '…' : text
      addToast({
        type: 'message',
        title: data.senderName || 'New message',
        body: truncatedText,
        avatar: data.senderAvatarUrl ?? null,
        href: `${basePath}/messages?userId=${data.senderId}`,
      })
    }

    // 2) Friend request received
    const handleFriendRequest = (data: { requestId: number; senderId: string; senderName: string; senderAvatar: string | null }) => {
      addToast({
        type: 'friendRequest',
        title: 'Friend Request',
        body: `${data.senderName} sent you a friend request`,
        avatar: data.senderAvatar,
        href: `${basePath}/profile/${data.senderId}`,
      })
    }

    // 3) Friend request accepted
    const handleFriendAccepted = (data: { requestId: number; acceptorId: string; acceptorName: string; acceptorAvatar: string | null }) => {
      addToast({
        type: 'friendAccepted',
        title: 'Friend Request Accepted',
        body: `${data.acceptorName} accepted your friend request`,
        avatar: data.acceptorAvatar,
        href: `${basePath}/profile/${data.acceptorId}`,
      })
    }

    const handleCallOffer = (data: { conversationId: string; fromUserId: string; fromUserName: string; callType: 'audio' | 'video'; offer: RTCSessionDescriptionInit }) => {
      if (data.fromUserId.toLowerCase() === myId) return
      if (pathname?.includes('/messages')) return
      if (!isRtcDescription(data.offer) || (data.callType !== 'audio' && data.callType !== 'video')) return

      try {
        sessionStorage.setItem(PENDING_INCOMING_CALL_STORAGE_KEY, JSON.stringify({
          ...data,
          receivedAt: Date.now(),
          expiresAt: Date.now() + CALL_RING_TIMEOUT_MS,
          iceCandidates: [],
        }))
      } catch (error) {
        console.error('[RealtimeToast] Failed to persist pending incoming call:', error)
      }

      const params = new URLSearchParams({
        userId: data.fromUserId,
        userName: data.fromUserName,
      })

      addToast({
        type: 'call',
        title: 'Incoming call',
        body: `${data.fromUserName} is calling you`,
        avatar: null,
        href: `${basePath}/messages?${params.toString()}`,
      })
    }

    const handleCallIceCandidate = (data: { conversationId: string; fromUserId: string; candidate: RTCIceCandidateInit }) => {
      if (pathname?.includes('/messages')) return
      if (!isRtcCandidate(data.candidate)) return

      try {
        const rawPendingCall = sessionStorage.getItem(PENDING_INCOMING_CALL_STORAGE_KEY)
        if (!rawPendingCall) return

        const pendingCall = JSON.parse(rawPendingCall) as {
          conversationId?: string
          fromUserId?: string
          expiresAt?: number
          iceCandidates?: RTCIceCandidateInit[]
        }

        if (
          pendingCall.conversationId?.toLowerCase() !== data.conversationId.toLowerCase() ||
          pendingCall.fromUserId?.toLowerCase() !== data.fromUserId.toLowerCase() ||
          (pendingCall.expiresAt && Date.now() > pendingCall.expiresAt)
        ) {
          return
        }

        const iceCandidates = Array.isArray(pendingCall.iceCandidates)
          ? pendingCall.iceCandidates.filter(isRtcCandidate)
          : []
        iceCandidates.push(data.candidate)
        sessionStorage.setItem(PENDING_INCOMING_CALL_STORAGE_KEY, JSON.stringify({
          ...pendingCall,
          iceCandidates: iceCandidates.slice(-50),
        }))
      } catch (error) {
        console.error('[RealtimeToast] Failed to persist pending ICE candidate:', error)
      }
    }

    // 4) Generic notification (program updates, etc.)
    //    Skip types that have dedicated handlers above to avoid duplicate toasts
    const SKIP_NOTIFICATION_TYPES = ['FriendRequestReceived', 'FriendRequestAccepted', 'FriendRequestDeclined']
    const handleNotification = (data: { id: string; type: string; title: string; message: string; relatedEntityType: string | null; relatedEntityId: string | null; isRead: boolean; createdAt: string }) => {
      if (SKIP_NOTIFICATION_TYPES.includes(data.type)) return
      if (data.type === 'IncomingCall' && data.relatedEntityType === 'Conversation') return

      let href = `${basePath}/settings` // fallback
      if (data.relatedEntityType === 'User' && data.relatedEntityId) {
        href = `${basePath}/profile/${data.relatedEntityId}`
      } else if (data.relatedEntityType === 'Program' && data.relatedEntityId) {
        href = `${basePath}/programs/${data.relatedEntityId}`
      } else if (data.relatedEntityType === 'ScheduleEvent') {
        href = `${basePath}/schedule`
      }

      addToast({
        type: 'notification',
        title: data.title,
        body: data.message,
        avatar: null,
        href,
      })
    }

    chatConnection.on('ConversationUpdated', handleConversationUpdated)
    chatConnection.onFriendRequestReceived(handleFriendRequest)
    chatConnection.onFriendRequestAccepted(handleFriendAccepted)
    chatConnection.onCallOffer(handleCallOffer)
    chatConnection.onCallIceCandidate(handleCallIceCandidate)
    chatConnection.onNotificationReceived(handleNotification)

    return () => {
      chatConnection.off('ConversationUpdated', handleConversationUpdated)
      chatConnection.off('FriendRequestReceived', handleFriendRequest)
      chatConnection.off('FriendRequestAccepted', handleFriendAccepted)
      chatConnection.off('CallOffer', handleCallOffer)
      chatConnection.off('CallIceCandidate', handleCallIceCandidate)
      chatConnection.off('NotificationReceived', handleNotification)
    }
  }, [pathname, addToast])

  const handleClick = (toast: ToastItem) => {
    removeToast(toast.id)
    router.push(toast.href)
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          onClick={() => handleClick(toast)}
          className="pointer-events-auto cursor-pointer bg-surface-2 border border-border-subtle rounded-xl p-3.5 shadow-xl shadow-black/30 backdrop-blur-lg animate-in slide-in-from-right fade-in duration-300 hover:border-border transition-colors"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            {toast.avatar ? (
              <img
                src={getMediaUrl(toast.avatar) || toast.avatar}
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-1 flex items-center justify-center flex-shrink-0">
                {toastIcons[toast.type]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{toast.title}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); removeToast(toast.id) }}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{toast.body}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-0.5 bg-border-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-muted-foreground/40 rounded-full"
              style={{
                animation: `shrink ${TOAST_DURATION}ms linear forwards`,
              }}
            />
          </div>
        </div>
      ))}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}
