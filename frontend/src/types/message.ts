// ── DTOs matching the new backend ──

export interface PeerUserDto {
  id: string
  fullName: string
  avatarUrl: string | null
  role?: string | null
  isOnline?: boolean
  lastSeenAtUtc?: string | null
}

export interface UserPresenceDto {
  userId: string
  isOnline: boolean
  lastSeenAtUtc: string | null
}

export interface ReplyDto {
  id: string
  text: string
  senderName: string
}

export interface MessageDto {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null
  senderRole?: string | null
  text: string
  attachmentUrl: string | null
  attachmentFileName: string | null
  attachmentContentType: string | null
  attachmentSize: number | null
  createdAt: string
  readAt: string | null
  replyTo: ReplyDto | null
}

export interface ConversationListItemDto {
  id: string
  peerUser: PeerUserDto
  lastMessageText: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface SendMessageDto {
  text: string
  replyToMessageId?: string
  attachmentUrl?: string
  attachmentFileName?: string
  attachmentContentType?: string
  attachmentSize?: number
}

export interface ChatFileUploadResult {
  url: string
  fileName: string
  contentType: string
  size: number
}
