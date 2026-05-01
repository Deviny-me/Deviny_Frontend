import { API_URL, fetchWithAuth } from '../config'
import { ConversationListItemDto, MessageDto, SendMessageDto, ChatFileUploadResult, UserPresenceDto } from '@/types/message'
import { PagedResponse } from '@/types/pagination'

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(`${API_URL}${endpoint}`, options)

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `HTTP error! status: ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return await response.json()
}

export const messagesApi = {
  /** Get all my conversations (ordered by latest message, paginated). */
  getMyConversations: (page = 1, pageSize = 30): Promise<PagedResponse<ConversationListItemDto>> =>
    apiRequest<PagedResponse<ConversationListItemDto>>(`/me/chats?page=${page}&pageSize=${pageSize}`),

  /** Get or create a direct conversation with another user. */
  getOrCreateConversation: (otherUserId: string): Promise<{ conversationId: string }> =>
    apiRequest<{ conversationId: string }>(`/me/chats/direct/${otherUserId}`, { method: 'POST' }),

  /** Get messages (cursor-based). Pass cursor=oldest-message-createdAt for next page. */
  getConversationMessages: (
    conversationId: string,
    cursor?: string,
    pageSize = 50
  ): Promise<MessageDto[]> => {
    const params = new URLSearchParams()
    if (cursor) params.set('cursor', cursor)
    params.set('pageSize', String(pageSize))
    return apiRequest<MessageDto[]>(
      `/me/chats/${conversationId}/messages?${params.toString()}`
    )
  },

  /** Send a message via REST (alternative to SignalR). */
  sendMessage: (conversationId: string, dto: SendMessageDto): Promise<MessageDto> =>
    apiRequest<MessageDto>(`/me/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  /** Mark all messages as read. */
  markMessagesAsRead: (conversationId: string): Promise<void> =>
    apiRequest<void>(`/me/chats/${conversationId}/read`, { method: 'POST' }),

  /** Get total unread messages count (server-authoritative). */
  getUnreadCount: (): Promise<{ unreadCount: number }> =>
    apiRequest<{ unreadCount: number }>('/me/chats/unread-count'),

  /** Get realtime presence snapshot for a user. */
  getUserPresence: (userId: string): Promise<UserPresenceDto> =>
    apiRequest<UserPresenceDto>(`/me/chats/presence/${userId}`),

  /** Upload a file for a chat message. */
  uploadChatFile: async (file: File): Promise<ChatFileUploadResult> => {
    const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')) : null
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch(`${API_URL}/chat/files/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    })
    if (!response.ok) {
      const err = await response.text()
      throw new Error(err || 'File upload failed')
    }
    return response.json()
  },
}
