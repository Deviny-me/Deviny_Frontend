'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Send, Trash2, Loader2, ChevronDown, Heart, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { postsApi } from '@/lib/api/postsApi'
import type { PostCommentDto } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import {
  useAccentColors,
  getRoleRingClass,
  getAccentColorsByRole,
} from '@/lib/theme/useAccentColors'

interface PostCommentsProps {
  postId: string
  className?: string
  onCommentCountChange?: (delta: number) => void
}

const PAGE_SIZE = 15
const REPLIES_PAGE_SIZE = 20
const MAX_VISUAL_INDENT_LEVEL = 4 // beyond this we keep nesting logically but stop indenting

function formatTimeAgo(dateStr: string): string {
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

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
}

// ─────────────────────────────────────────────────────────────────────────────
// CommentItem — recursive, supports likes, replies, lazy loading of children.
// ─────────────────────────────────────────────────────────────────────────────

interface CommentItemProps {
  comment: PostCommentDto
  postId: string
  level: number
  onDelete: (commentId: string, parentId: string | null | undefined) => void
  onCountDelta: (delta: number) => void
}

function CommentItem({
  comment: initialComment,
  postId,
  level,
  onDelete,
  onCountDelta,
}: CommentItemProps) {
  const accent = useAccentColors()

  // Local copy so we can update like/reply counts without parent re-render.
  // Intentionally NOT synced back from the prop — the parent re-rendering with a
  // new object reference (same data) must never overwrite locally-managed state
  // such as isLikedByMe after an optimistic update.
  const [comment, setComment] = useState<PostCommentDto>(initialComment)

  const [replies, setReplies] = useState<PostCommentDto[]>([])
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [repliesOpen, setRepliesOpen] = useState(false)
  const [repliesPage, setRepliesPage] = useState(1)
  const [repliesHasMore, setRepliesHasMore] = useState(false)
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)

  const [isLikeBusy, setIsLikeBusy] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const replyInputRef = useRef<HTMLInputElement>(null)

  const loadReplies = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        setIsLoadingReplies(true)
        const res = await postsApi.getReplies(comment.id, pageNum, REPLIES_PAGE_SIZE)
        setReplies((prev) => (append ? [...prev, ...res.comments] : res.comments))
        setRepliesHasMore(res.hasMore)
        setRepliesPage(pageNum)
        setRepliesLoaded(true)
      } catch (err) {
        console.error('Failed to load replies', err)
      } finally {
        setIsLoadingReplies(false)
      }
    },
    [comment.id],
  )

  const toggleReplies = useCallback(() => {
    if (!repliesOpen) {
      setRepliesOpen(true)
      if (!repliesLoaded) loadReplies(1, false)
    } else {
      setRepliesOpen(false)
    }
  }, [repliesOpen, repliesLoaded, loadReplies])

  const handleToggleLike = useCallback(async () => {
    if (isLikeBusy) return
    const prevLiked = comment.isLikedByMe
    const prevCount = comment.likeCount
    // Optimistic
    setComment((c) => ({
      ...c,
      isLikedByMe: !prevLiked,
      likeCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    }))
    setIsLikeBusy(true)
    try {
      const stats = prevLiked
        ? await postsApi.unlikeComment(comment.id)
        : await postsApi.likeComment(comment.id)
      // Only sync likeCount from the server — never isLikedByMe.
      // The server may return a stale isLikedByMe value; the optimistic value
      // we already set is always correct for the action the user just performed.
      if (stats !== null && stats.likeCount !== undefined) {
        setComment((c) => ({ ...c, likeCount: stats.likeCount }))
      }
    } catch (err) {
      console.error('Failed to toggle comment like', err)
      // Rollback only on genuine API errors
      setComment((c) => ({ ...c, isLikedByMe: prevLiked, likeCount: prevCount }))
    } finally {
      setIsLikeBusy(false)
    }
  }, [comment.id, comment.isLikedByMe, comment.likeCount, isLikeBusy])

  const openReply = useCallback(() => {
    setIsReplying(true)
    // Pre-fill with @mention for clarity (visible, but server stores literally).
    const mention = `@${comment.author.firstName} `
    setReplyDraft((d) => (d ? d : mention))
    setTimeout(() => replyInputRef.current?.focus(), 0)
  }, [comment.author.firstName])

  const cancelReply = useCallback(() => {
    setIsReplying(false)
    setReplyDraft('')
  }, [])

  const handleSubmitReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const content = replyDraft.trim()
      if (!content || isSubmittingReply) return
      setIsSubmittingReply(true)
      try {
        const created = await postsApi.addComment(postId, {
          content,
          parentCommentId: comment.id,
        })
        // Make sure the replies list is open and contains the new reply.
        setReplies((prev) => [created, ...prev])
        setRepliesLoaded(true)
        setRepliesOpen(true)
        setComment((c) => ({ ...c, replyCount: (c.replyCount || 0) + 1 }))
        onCountDelta(1)
        setReplyDraft('')
        setIsReplying(false)
      } catch (err) {
        console.error('Failed to reply', err)
      } finally {
        setIsSubmittingReply(false)
      }
    },
    [comment.id, postId, replyDraft, isSubmittingReply, onCountDelta],
  )

  const handleDeleteSelf = useCallback(async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await postsApi.deleteComment(comment.id)
      onDelete(comment.id, comment.parentCommentId ?? null)
    } catch (err) {
      console.error('Failed to delete comment', err)
      setIsDeleting(false)
    }
  }, [comment.id, comment.parentCommentId, isDeleting, onDelete])

  // Local handler for nested replies' deletion: removes from `replies` state.
  const handleNestedDelete = useCallback(
    (childId: string, _parentId: string | null | undefined) => {
      setReplies((prev) => prev.filter((r) => r.id !== childId))
      setComment((c) => ({ ...c, replyCount: Math.max(0, (c.replyCount || 0) - 1) }))
    },
    [],
  )

  const indentClass =
    level === 0 ? '' : level <= MAX_VISUAL_INDENT_LEVEL ? 'pl-7 sm:pl-9' : 'pl-7 sm:pl-9'

  const totalReplyCount = comment.replyCount || 0

  return (
    <div className={cn('flex flex-col', indentClass)}>
      <div className="flex gap-2.5 group">
        {/* Avatar */}
        {comment.author.avatarUrl ? (
          <img
            src={getMediaUrl(comment.author.avatarUrl) || comment.author.avatarUrl}
            alt={`${comment.author.firstName} ${comment.author.lastName}`}
            className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${getRoleRingClass(comment.author.role)}`}
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAccentColorsByRole(comment.author.role).gradient} flex items-center justify-center flex-shrink-0`}
          >
            <span className="text-[10px] font-bold text-white">
              {getInitials(comment.author.firstName, comment.author.lastName)}
            </span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-2xl px-3 py-2">
            <p className="text-xs font-semibold text-foreground">
              {comment.author.firstName} {comment.author.lastName}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-0.5">
              {comment.content}
            </p>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3 mt-1 px-2">
            <span className="text-[11px] text-faint-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>

            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLikeBusy}
              className={cn(
                'inline-flex items-center gap-1 text-[11px] transition-colors',
                comment.isLikedByMe
                  ? 'text-red-400 hover:text-red-300'
                  : 'text-faint-foreground hover:text-foreground',
              )}
              aria-label={comment.isLikedByMe ? 'Убрать лайк' : 'Лайкнуть'}
            >
              <Heart
                className={cn(
                  'w-3.5 h-3.5 transition-transform',
                  comment.isLikedByMe && 'fill-current scale-110',
                )}
              />
              {comment.likeCount > 0 && (
                <span className="tabular-nums">{comment.likeCount}</span>
              )}
            </button>

            <button
              type="button"
              onClick={openReply}
              className="inline-flex items-center gap-1 text-[11px] text-faint-foreground hover:text-foreground transition-colors"
              aria-label="Ответить"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ответить</span>
            </button>

            {comment.canDelete && (
              <button
                type="button"
                onClick={handleDeleteSelf}
                disabled={isDeleting}
                className="text-[11px] text-faint-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Удалить комментарий"
              >
                {isDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>
            )}
          </div>

          {/* Reply input */}
          {isReplying && (
            <form
              onSubmit={handleSubmitReply}
              className="mt-2 flex items-center gap-2"
            >
              <input
                ref={replyInputRef}
                type="text"
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder="Написать ответ..."
                className={`flex-1 px-3 py-1.5 text-sm bg-border-subtle border border-border-subtle rounded-full text-foreground placeholder-gray-500 focus:outline-none focus:ring-1 ${accent.focusBorder}`}
                disabled={isSubmittingReply}
                maxLength={1000}
              />
              <button
                type="button"
                onClick={cancelReply}
                className="p-1.5 rounded-full text-faint-foreground hover:text-foreground"
                aria-label="Отмена"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!replyDraft.trim() || isSubmittingReply}
                className={cn(
                  'p-1.5 rounded-full transition-colors flex-shrink-0',
                  replyDraft.trim() && !isSubmittingReply
                    ? `${accent.bg} text-foreground hover:opacity-90`
                    : 'bg-white/5 text-gray-600 cursor-not-allowed',
                )}
                aria-label="Отправить"
              >
                {isSubmittingReply ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}

          {/* Replies toggle */}
          {totalReplyCount > 0 && (
            <button
              onClick={toggleReplies}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 transition-transform',
                  repliesOpen && 'rotate-180',
                )}
              />
              {repliesOpen
                ? 'Скрыть ответы'
                : `Показать ответы (${totalReplyCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Replies list */}
      {repliesOpen && (
        <div className="mt-3 space-y-3">
          {isLoadingReplies && replies.length === 0 ? (
            <div className="pl-7 sm:pl-9">
              <Loader2 className="w-4 h-4 animate-spin text-faint-foreground" />
            </div>
          ) : (
            <>
              {replies.map((r) => (
                <CommentItem
                  key={r.id}
                  comment={r}
                  postId={postId}
                  level={level + 1}
                  onDelete={handleNestedDelete}
                  onCountDelta={onCountDelta}
                />
              ))}
              {repliesHasMore && (
                <button
                  onClick={() => loadReplies(repliesPage + 1, true)}
                  disabled={isLoadingReplies}
                  className="ml-7 sm:ml-9 text-[11px] text-faint-foreground hover:text-muted-foreground inline-flex items-center gap-1"
                >
                  {isLoadingReplies ? (
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
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PostComments — top-level list + composer.
// ─────────────────────────────────────────────────────────────────────────────

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

  const inputRef = useRef<HTMLInputElement>(null)

  const loadComments = useCallback(
    async (pageNum: number) => {
      try {
        if (pageNum === 1) setIsLoading(true)
        else setIsLoadingMore(true)

        const response = await postsApi.getComments(postId, pageNum, PAGE_SIZE)
        if (pageNum === 1) setComments(response.comments)
        else setComments((prev) => [...prev, ...response.comments])

        setHasMore(response.hasMore)
        setPage(pageNum)
      } catch (error) {
        console.error('Failed to load comments:', error)
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [postId],
  )

  useEffect(() => {
    setComments([])
    setPage(1)
    setHasMore(false)
    loadComments(1)
  }, [postId, loadComments])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) loadComments(page + 1)
  }, [isLoadingMore, hasMore, page, loadComments])

  const handleSubmitComment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const content = newComment.trim()
      if (!content || isSubmitting) return
      setIsSubmitting(true)
      try {
        const comment = await postsApi.addComment(postId, { content })
        setComments((prev) => [comment, ...prev])
        setNewComment('')
        onCommentCountChange?.(1)
      } catch (error) {
        console.error('Failed to add comment:', error)
      } finally {
        setIsSubmitting(false)
        inputRef.current?.focus()
      }
    },
    [postId, newComment, isSubmitting, onCommentCountChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmitComment(e as unknown as React.FormEvent)
      }
    },
    [handleSubmitComment],
  )

  const handleTopLevelDelete = useCallback(
    (commentId: string, _parentId: string | null | undefined) => {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      onCommentCountChange?.(-1)
    },
    [onCommentCountChange],
  )

  const handleCountDelta = useCallback(
    (delta: number) => {
      onCommentCountChange?.(delta)
    },
    [onCommentCountChange],
  )

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
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                postId={postId}
                level={0}
                onDelete={handleTopLevelDelete}
                onCountDelta={handleCountDelta}
              />
            ))}

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

      {/* Composer */}
      <form
        onSubmit={handleSubmitComment}
        className="px-4 py-3 border-t border-border-subtle flex gap-2 flex-shrink-0"
      >
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
              : 'bg-white/5 text-gray-600 cursor-not-allowed',
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
