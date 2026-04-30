'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Loader2, Smile, Phone, Video } from 'lucide-react';
import { messagesApi } from '@/lib/api/messagesApi';
import { chatConnection } from '@/lib/signalr/chatConnection';
import { MessageDto, UserPresenceDto } from '@/types/message';
import { MEDIA_BASE_URL } from '@/lib/config';
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useLocale, useTranslations } from 'next-intl'

interface ChatModalProps {
  otherUserId: string;
  otherUserName: string;
  otherUserAvatarUrl: string | null;
  otherUserRole?: string | null;
  onClose: () => void;
}

function formatLastSeen(
  lastSeenAtUtc: string | null | undefined,
  t: (key: string, values?: any) => any,
  locale: string
): string {
  if (!lastSeenAtUtc) return t('lastSeenRecently')
  const seenAt = new Date(lastSeenAtUtc)
  if (Number.isNaN(seenAt.getTime())) return t('lastSeenRecently')

  const diffMs = Date.now() - seenAt.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return t('lastSeenJustNow')
  if (minutes < 60) return t('lastSeenMinutesAgo', { count: minutes })

  const sameDay = seenAt.toDateString() === new Date().toDateString()
  const time = seenAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  if (sameDay) {
    return t('lastSeenAt', { time })
  }

  const date = seenAt.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  return t('lastSeenDateTime', { date, time })
}

export default function ChatModal({ otherUserId, otherUserName, otherUserAvatarUrl, otherUserRole, onClose }: ChatModalProps) {
  const QUICK_EMOJIS = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👏', '🙏', '🔥', '❤️', '🎉']
  const accent = useAccentColors()
  const t = useTranslations('chat')
  const locale = useLocale()
  const peerAccent = otherUserRole ? getAccentColorsByRole(otherUserRole) : accent
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [callNotice, setCallNotice] = useState<string | null>(null)
  const [presence, setPresence] = useState<UserPresenceDto | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const router = useRouter()
  const pathname = usePathname()

  // Keep ref in sync
  useEffect(() => { conversationIdRef.current = conversationId }, [conversationId])

  // Get current user ID from token
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(
          (payload.sub ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'])?.toLowerCase()
        );
      } catch (err) {
        console.error('Error parsing token:', err);
      }
    }
  }, []);

  // Load conversation and messages
  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get or create conversation
        const { conversationId: convId } = await messagesApi.getOrCreateConversation(otherUserId);
        setConversationId(convId);

        // Load messages
        const msgs = await messagesApi.getConversationMessages(convId);
        setMessages(msgs);

        // Mark messages as read
        await messagesApi.markMessagesAsRead(convId);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoadConversation'));
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    };

    loadConversation();
  }, [otherUserId, t]);

  // ─── SignalR: real-time message receiving ───
  useEffect(() => {
    const handleReceiveMessage = (msg: MessageDto) => {
      const activeConvId = conversationIdRef.current
      if (!activeConvId || msg.conversationId.toLowerCase() !== activeConvId.toLowerCase()) return

      setMessages(prev => {
        // Deduplicate (message may come from both REST response and SignalR broadcast)
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })

      // Auto-mark as read if from other user
      if (msg.senderId.toLowerCase() !== currentUserId) {
        chatConnection.markRead(msg.conversationId).catch(() => {})
      }
    }

    chatConnection.onReceiveMessage(handleReceiveMessage)

    // Re-join conversation group on reconnect
    const handleReconnected = () => {
      const activeConvId = conversationIdRef.current
      if (activeConvId) {
        chatConnection.joinConversation(activeConvId).catch(() => {})
      }
    }
    chatConnection.onReconnected(handleReconnected)

    chatConnection.start().catch(console.error)

    return () => {
      chatConnection.off('ReceiveMessage', handleReceiveMessage)
      chatConnection.offReconnected(handleReconnected)
    }
  }, [currentUserId])

  useEffect(() => {
    let cancelled = false

    const applyPresence = (data: UserPresenceDto) => {
      if (data.userId.toLowerCase() !== otherUserId.toLowerCase()) return
      setPresence(data)
    }

    const init = async () => {
      try {
        const snapshot = await messagesApi.getUserPresence(otherUserId)
        if (!cancelled) setPresence(snapshot)
      } catch {
        // ignore initial snapshot failures
      }

      try {
        await chatConnection.start()
        if (cancelled) return
        chatConnection.onPresenceUpdated(applyPresence)
        await chatConnection.subscribePresence(otherUserId)
      } catch {
        // keep modal usable without realtime
      }
    }

    init()

    return () => {
      cancelled = true
      chatConnection.off('PresenceUpdated', applyPresence)
      chatConnection.unsubscribePresence(otherUserId).catch(() => {})
    }
  }, [otherUserId])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    let stopped = false

    const startHeartbeat = async () => {
      try {
        await chatConnection.start()
      } catch {
        return
      }

      if (stopped) return

      chatConnection.heartbeat().catch(() => {})
      timer = setInterval(() => {
        chatConnection.heartbeat().catch(() => {})
      }, 25_000)
    }

    startHeartbeat()

    return () => {
      stopped = true
      if (timer) clearInterval(timer)
    }
  }, [])

  // Join/leave conversation group for real-time messages
  useEffect(() => {
    if (!conversationId) return
    chatConnection.joinConversation(conversationId).catch(() => {})
    return () => {
      chatConnection.leaveConversation(conversationId).catch(() => {})
    }
  }, [conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!emojiPickerRef.current) return
      if (!emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePickEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
  }

  const handleCallClick = (type: 'audio' | 'video') => {
    const basePath = pathname?.startsWith('/trainer')
      ? '/trainer'
      : pathname?.startsWith('/nutritionist')
      ? '/nutritionist'
      : '/user'

    const params = new URLSearchParams({
      userId: otherUserId,
      userName: otherUserName,
      startCall: type,
    })

    if (otherUserAvatarUrl) {
      params.set('userAvatar', otherUserAvatarUrl)
    }

    onClose()
    router.push(`${basePath}/messages?${params.toString()}`)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending || !conversationId) return;

    const text = newMessage.trim();

    try {
      setIsSending(true);
      setNewMessage('');

      const message = await messagesApi.sendMessage(conversationId, { text });
      // The message will also arrive via SignalR ReceiveMessage; deduplicate above handles it
      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToSendMessage'));
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface-2 rounded-xl border border-border-subtle w-full max-w-2xl h-[600px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            {otherUserAvatarUrl ? (
              <img
                src={`${MEDIA_BASE_URL}${otherUserAvatarUrl}`}
                alt={otherUserName}
                className={`w-10 h-10 rounded-full object-cover ${getRoleRingClass(otherUserRole)}`}
              />
            ) : (
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${peerAccent.gradient} flex items-center justify-center`}>
                <span className="text-white text-sm font-bold">
                  {otherUserName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{otherUserName}</h3>
              <div className="text-xs text-muted-foreground mt-0.5">
                {presence?.isOnline ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {t('online')}
                  </span>
                ) : (
                  <span>{formatLastSeen(presence?.lastSeenAtUtc, t, locale)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleCallClick('audio')}
              className={`p-2 rounded-lg text-muted-foreground ${accent.hoverText} transition-colors`}
              title={t('startAudioCall')}
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleCallClick('video')}
              className={`p-2 rounded-lg text-muted-foreground ${accent.hoverText} transition-colors`}
              title={t('startVideoCall')}
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-hover-overlay transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        {callNotice && (
          <div className="px-4 py-2 border-b border-border-subtle">
            <p className={`text-xs ${accent.text}`}>{callNotice}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-muted-foreground">{t('noMessagesYet')}</p>
              <p className="text-xs text-faint-foreground mt-1">{t('sendMessageToStart')}</p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.senderId.toLowerCase() === currentUserId;
              return (
                <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%]`}>
                    {/* Reply preview */}
                    {message.replyTo && (
                      <div className={`mb-1 px-3 py-1.5 border-l-2 ${accent.border} bg-border-subtle rounded text-xs text-muted-foreground`}>
                        <span className="font-medium text-muted-foreground">{message.replyTo.senderName}</span>
                        <p className="truncate">{message.replyTo.text}</p>
                      </div>
                    )}
                    <div
                      className={`rounded-2xl p-3 ${
                        isMe
                          ? `${accent.bg} text-foreground rounded-br-sm`
                          : 'border-2 border-gray-700 bg-surface-2 text-foreground rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    <p className="text-xs text-faint-foreground mt-1 px-1">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {isMe && message.readAt && ` · ${t('read')}`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-2 relative" ref={emojiPickerRef}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              disabled={isSending}
              className={`p-2 text-muted-foreground ${accent.hoverText} transition-colors disabled:opacity-50`}
              title={t('addEmoji')}
            >
              <Smile className="w-5 h-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-20 bg-background border border-border-subtle rounded-xl p-2 shadow-xl w-56">
                <div className="grid grid-cols-6 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handlePickEmoji(emoji)}
                      className="p-1.5 rounded hover:bg-white/10 transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('typeMessagePlaceholder')}
              className={`flex-1 bg-background text-foreground rounded-lg px-4 py-2 text-sm focus:outline-none ${accent.focusBorder}`}
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className={`p-2 bg-gradient-to-r ${accent.gradient} text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
