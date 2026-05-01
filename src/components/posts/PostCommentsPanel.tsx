'use client'

import { X } from 'lucide-react'
import { PostComments } from './PostComments'

interface PostCommentsPanelProps {
  postId: string
  commentCount: number
  onCommentCountChange: (delta: number) => void
  onClose: () => void
}

/**
 * Inline comments panel rendered inside the PostCard right column.
 * No overlay, no modal — pure inline content.
 */
export function PostCommentsPanel({
  postId,
  commentCount,
  onCommentCountChange,
  onClose,
}: PostCommentsPanelProps) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle flex-shrink-0">
        <h3 className="text-sm font-semibold text-foreground">
          Комментарии{commentCount > 0 ? ` (${commentCount})` : ''}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Закрыть комментарии"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Comments list + input */}
      <PostComments
        postId={postId}
        onCommentCountChange={onCommentCountChange}
        className="flex-1 min-h-0"
      />
    </div>
  )
}
