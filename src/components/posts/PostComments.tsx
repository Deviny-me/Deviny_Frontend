'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Send, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { postsApi } from '@/lib/api/postsApi'
import { PostCommentDto } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors, getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'

interface PostCommentsProps {
  postId: string
  className?: string
  onCommentCountChange?: (delta: number) => void
}

/**
 * Comments section for a post (dark theme).
 * Uses server-side canDelete for delete permissions.
 */
export function PostComments({
  postId,
  className,
  onCommentCountChange,
}: PostCommentsProps) {
  const accent = useAccentColors()
  const [comments, setComments] = useState<PostCommentDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  
  const inputRef = useRef<HTMLInputElement>(null)
  const PAGE_SIZE = 15

  // Load initial comments
  useEffect(() => {
    setComments([])
    setPage(1)
    setHasMore(false)
    loadComments(1)
  }, [postId])

  const loadComments = useCallback(async (pageNum: number) => {
    try {
      if (pageNum === 1) setIsLoading(true)
      else setIsLoadingMore(true)

      const response = await postsApi.getComments(postId, pageNum, PAGE_SIZE)
      
      if (pageNum === 1) setComments(response.comments)
      else setComments(prev => [...prev, ...response.comments])
      
      setHasMore(response.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [postId])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) loadComments(page + 1)
  }, [isLoadingMore, hasMore, page, loadComments])

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newComment.trim()
    if (!content || isSubmitting) return
    setIsSubmitting(true)
    try {
      const comment = await postsApi.addComment(postId, { content })
      setComments(prev => [comment, ...prev])
      setNewComment('')
      onCommentCountChange?.(1)
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setIsSubmitting(false)
      inputRef.current?.focus()
    }
  }, [postId, newComment, isSubmitting, onCommentCountChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment(e as unknown as React.FormEvent)
    }
  }, [handleSubmitComment])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (deletingIds.has(commentId)) return
    setDeletingIds(prev => new Set(prev).add(commentId))
    try {
      await postsApi.deleteComment(commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      onCommentCountChange?.(-1)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(commentId)
        return next
      })
    }
  }, [deletingIds, onCommentCountChange])

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'сейчас'
    if (diffMins < 60) return `${diffMins}м`
    if (diffHours < 24) return `${diffHours}ч`
    if (diffDays < 7) return `${diffDays}д`
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <div className={cn('flex justify-center py-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-faint-foreground" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {comments.length === 0 ? (
          <p className="text-center text-faint-foreground py-8 text-sm">
            Пока нет комментариев. Будьте первым!
          </p>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2.5 group">
                {/* Avatar */}
                {comment.author.avatarUrl ? (
                  <img
                    src={getMediaUrl(comment.author.avatarUrl) || comment.author.avatarUrl}
                    alt={`${comment.author.firstName} ${comment.author.lastName}`}
                    className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${getRoleRingClass(comment.author.role)}`}
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAccentColorsByRole(comment.author.role).gradient} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[10px] font-bold text-white">
                      {getInitials(comment.author.firstName, comment.author.lastName)}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white/5 rounded-2xl px-3 py-2">
                    <p className="text-xs font-semibold text-foreground">
                      {comment.author.firstName} {comment.author.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-0.5">
                      {comment.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-2">
                    <span className="text-[11px] text-faint-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                    
                    {/* Delete — canDelete from server */}
                    {comment.canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingIds.has(comment.id)}
                        className="text-[11px] text-faint-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        aria-label="Удалить комментарий"
                      >
                        {deletingIds.has(comment.id) ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full py-2 text-xs text-faint-foreground hover:text-muted-foreground transition-colors flex items-center justify-center gap-1"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Загрузить ещё
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Input — fixed at bottom */}
      <form onSubmit={handleSubmitComment} className="px-4 py-3 border-t border-border-subtle flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать комментарий..."
          className={`flex-1 px-4 py-2 text-sm bg-border-subtle border border-border-subtle rounded-full text-foreground placeholder-gray-500 focus:outline-none focus:ring-1 ${accent.focusBorder}`}
          disabled={isSubmitting}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className={cn(
            'p-2 rounded-full transition-colors flex-shrink-0',
            newComment.trim() && !isSubmitting
              ? `${accent.bg} text-foreground hover:opacity-90`
              : 'bg-white/5 text-gray-600 cursor-not-allowed'
          )}
          aria-label="Отправить"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  )
}
