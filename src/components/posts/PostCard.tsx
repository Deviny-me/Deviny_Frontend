'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, usePathname } from 'next/navigation'
import { Video, Repeat2, Trash2, Loader2, MoreHorizontal, Pencil, X } from 'lucide-react'
import { PostType, MediaType } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { postsApi } from '@/lib/api/postsApi'
import { PostActions } from './PostActions'
import { PostCommentsPanel } from './PostCommentsPanel'
import { usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { getAccentColorsByRole, getRoleRingClass } from '@/lib/theme/useAccentColors'

interface PostCardProps {
  postId: string
  /** Layout variant: 'feed' expands to 2-column for comments; 'modal' stacks comments below */
  variant?: 'feed' | 'modal'
  /** Home feed portrait media layout */
  mediaPreset?: 'default' | 'home-portrait'
  /** Current viewer ID for ownership checks. */
  currentUserId?: string | null
  /** Show delete button in header */
  showDeleteInHeader?: boolean
  /** Skip ownership check (e.g. on own profile where all posts are yours) */
  isOwnProfile?: boolean
  /** Callback when delete is clicked */
  onDelete?: (postId: string) => void
  /** Post ID currently being deleted (for loading spinner) */
  deletingPostId?: string | null
  /** Callback when repost succeeds */
  onRepostSuccess?: () => void
  /** Currently playing video post ID */
  playingVideoId?: string | null
  /** Toggle video playback */
  onVideoToggle?: (postId: string | null) => void
  /** Open photo lightbox */
  onPhotoClick?: (url: string, caption?: string) => void
}

/**
 * Shared post card component used across feeds and profiles.
 * Reads all post data from PostStore — keeps no local interaction state.
 * When comments are open, expands into a 2-column grid layout (inline, no overlay).
 */
function getUserIdFromToken(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    if (!token) return undefined
    const payload = JSON.parse(atob(token.split('.')[1]))
    return (
      payload.sub ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    ) as string | undefined
  } catch {
    return undefined
  }
}

const normalizeId = (id: string | undefined | null): string | undefined =>
  id?.toString().trim().toLowerCase() || undefined

function PostCardComponent({
  postId,
  mediaPreset = 'default',
  currentUserId,
  showDeleteInHeader = false,
  isOwnProfile = false,
  onDelete,
  deletingPostId,
  onRepostSuccess,
  playingVideoId,
  onVideoToggle,
  onPhotoClick,
}: PostCardProps) {
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const resolvedUserId = useMemo(
    () => currentUserId ?? (isOwnProfile ? undefined : getUserIdFromToken()),
    [currentUserId, isOwnProfile],
  )

  // Lock body scroll when comments modal is open
  // Must be called before any early return to satisfy Rules of Hooks
  useEffect(() => {
    if (commentsOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [commentsOpen])

  const handleCommentCountChange = useCallback((delta: number) => {
    if (!post) return
    dispatch({
      type: 'UPDATE_POST',
      postId: post.id,
      partial: { commentCount: post.commentCount + delta },
    })
  }, [dispatch, post])

  const handleAuthorClick = useCallback(() => {
    if (!post) return
    const basePath = pathname?.startsWith('/trainer')
      ? '/trainer'
      : pathname?.startsWith('/nutritionist')
        ? '/nutritionist'
        : '/user'
    const normResolved = normalizeId(resolvedUserId)
    const owner = isOwnProfile || (!!normResolved && (
      normalizeId(post.userId) === normResolved ||
      normalizeId(post.author?.id) === normResolved
    ))

    if (owner) {
      router.push(`${basePath}/profile`)
    } else {
      router.push(`${basePath}/profile/${post.userId}`)
    }
  }, [isOwnProfile, pathname, post, resolvedUserId, router])

  const closeComments = useCallback(() => setCommentsOpen(false), [])
  const toggleComments = useCallback(() => setCommentsOpen(prev => !prev), [])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  const openEditModal = useCallback(() => {
    if (!post) return
    setEditCaption(post.caption ?? '')
    setEditError(null)
    setEditOpen(true)
    setMenuOpen(false)
  }, [post])

  const closeEditModal = useCallback(() => {
    if (editSaving) return
    setEditOpen(false)
    setEditError(null)
  }, [editSaving])

  const handleSaveCaption = useCallback(async () => {
    if (!post || editSaving) return
    setEditSaving(true)
    setEditError(null)
    try {
      const updated = await postsApi.updatePost(post.id, {
        caption: editCaption.trim() ? editCaption : '',
      })
      dispatch({
        type: 'UPDATE_POST',
        postId: post.id,
        partial: { caption: updated.caption ?? null },
      })
      setEditOpen(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setEditSaving(false)
    }
  }, [dispatch, editCaption, editSaving, post])

  if (!post) return null

  const authorName = post.author?.fullName || `${post.author?.firstName ?? ''} ${post.author?.lastName ?? ''}`.trim() || 'User'
  const authorAvatarUrl = post.author?.avatarUrl
  const authorInitials = (post.author?.firstName?.charAt(0) || 'U').toUpperCase()

  const isRepost = post.type === PostType.Repost || post.isRepost
  const originalDeleted = isRepost && !post.originalPost

  // --- Robust ownership detection ---
  const normResolved = normalizeId(resolvedUserId)
  const isOwner = isOwnProfile || (!!normResolved && (
    normalizeId(post.userId) === normResolved ||
    normalizeId(post.author?.id) === normResolved
  ))

  // Hide repost button when current user authored the post (or its original) —
  // backend rejects self-reposts, so the action would always fail.
  const isOriginalAuthor = !!normResolved && (
    normalizeId(post.originalPost?.userId) === normResolved ||
    normalizeId(post.originalPost?.author?.id) === normResolved
  )
  const hideRepostButton = isOwner || isOriginalAuthor

  // Determine avatar color based on author's role, not current user's role
  const authorRole = post.author?.role
  const authorAccent = getAccentColorsByRole(authorRole)
  
  const displayMedia = isRepost ? post.originalPost?.media : post.media
  const displayCaption = isRepost ? post.originalPost?.caption : post.caption

  const isHomePortrait = mediaPreset === 'home-portrait'
  const portraitCardStyle = isHomePortrait
    ? { width: 'min(100%, calc(min(72vh, 54rem) * 3 / 4))' }
    : undefined

  // ===== Portal comments modal =====
  const commentsModal = commentsOpen && !originalDeleted && typeof window !== 'undefined' && createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={closeComments}
    >
      <div
        className="bg-surface-2 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-[780px] border border-border-subtle shadow-2xl overflow-hidden flex flex-col sm:flex-row"
        style={{ maxHeight: 'clamp(60vh, 88vh, 820px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left: post preview (desktop only) ── */}
        <div className="hidden sm:flex flex-col w-[360px] flex-shrink-0 border-r border-border-subtle overflow-hidden">
          {/* Repost indicator */}
          {isRepost && (
            <div className="px-4 pt-3 flex items-center gap-1.5 text-faint-foreground text-xs flex-shrink-0">
              <Repeat2 className="w-3.5 h-3.5" />
              <span>Репост</span>
            </div>
          )}
          {/* Header */}
          <div className="p-3.5 flex items-center gap-2 border-b border-border-subtle flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={handleAuthorClick}>
              {authorAvatarUrl ? (
                <img src={authorAvatarUrl} alt={authorName} className={`w-9 h-9 rounded-full object-cover ${getRoleRingClass(authorRole)}`} />
              ) : (
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${authorAccent.gradient} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-bold">{authorInitials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{authorName}</p>
                <p className="text-xs text-faint-foreground">
                  {new Date(post.createdAt).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
          {/* Media */}
          {displayMedia && displayMedia[0] && (
            <div className="relative flex-1 min-h-0 overflow-hidden">
              {displayMedia[0].mediaType === MediaType.Image ? (
                <img
                  src={getMediaUrl(displayMedia[0].url) || ''}
                  alt={displayCaption || 'Post image'}
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={getMediaUrl(displayMedia[0].url) || ''}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              )}
            </div>
          )}
          {/* Caption */}
          {displayCaption && (
            <div className="px-4 py-3 flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed">{displayCaption}</p>
            </div>
          )}
          {/* Actions */}
          <div className="px-3 py-2 border-t border-border-subtle flex-shrink-0 mt-auto">
            <PostActions
              postId={post.id}
              onCommentClick={closeComments}
              onRepostSuccess={onRepostSuccess}
              hideRepost={hideRepostButton}
            />
          </div>
        </div>

        {/* ── Right: comments panel ── */}
        <div className="flex flex-col flex-1 min-h-0" style={{ height: 'clamp(60vh, 88vh, 820px)' }}>
          {/* Mobile drag handle */}
          <div className="flex sm:hidden justify-center py-2.5 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>
          <PostCommentsPanel
            postId={post.id}
            commentCount={post.commentCount}
            onCommentCountChange={handleCommentCountChange}
            onClose={closeComments}
          />
        </div>
      </div>
    </div>,
    document.body
  )

  return (
    <>
      <div style={portraitCardStyle} className={`bg-surface-2 rounded-xl border border-border-subtle overflow-hidden transition-colors hover:border-border ${
        isHomePortrait ? 'mx-auto' : ''
      }`}>
        {/* Repost indicator */}
        {isRepost && (
          <div className="px-4 pt-2.5 flex items-center gap-1.5 text-faint-foreground text-xs">
            <Repeat2 className="w-3.5 h-3.5" />
            <span>Репост</span>
          </div>
        )}

        {/* If original was deleted, show placeholder */}
        {originalDeleted ? (
          <div className="px-4 py-6 text-center relative">
            {isOwner && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(post.id) }}
                disabled={deletingPostId === post.id}
                className="absolute top-2 right-2 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                title="Удалить репост"
              >
                {deletingPostId === post.id ? (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-faint-foreground group-hover:text-red-500 transition-colors" />
                )}
              </button>
            )}
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-border-subtle flex items-center justify-center">
              <Repeat2 className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-sm text-faint-foreground">Публикация была удалена</p>
          </div>
        ) : (
          <>
            {/* Post Header */}
            <div className="p-3.5 hover:bg-hover-overlay transition-colors">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 flex-1 cursor-pointer"
                  onClick={handleAuthorClick}
                >
                  {authorAvatarUrl ? (
                    <img
                      src={authorAvatarUrl}
                      alt={authorName}
                      className={`w-8 h-8 rounded-full object-cover ${getRoleRingClass(authorRole)}`}
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${authorAccent.gradient} flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold">{authorInitials}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{authorName}</p>
                    <p className="text-xs text-faint-foreground">
                      {new Date(post.createdAt).toLocaleDateString('ru-RU', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Owner actions in header */}
                {showDeleteInHeader && isOwner && (
                  isRepost ? (
                    onDelete && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(post.id) }}
                        disabled={deletingPostId === post.id}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors group"
                        title="Удалить публикацию"
                      >
                        {deletingPostId === post.id ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-faint-foreground group-hover:text-red-500 transition-colors" />
                        )}
                      </button>
                    )
                  ) : (
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev) }}
                        disabled={deletingPostId === post.id}
                        className="p-1.5 hover:bg-hover-overlay rounded-lg transition-colors"
                        title="Действия"
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                      >
                        {deletingPostId === post.id ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        ) : (
                          <MoreHorizontal className="w-4 h-4 text-faint-foreground" />
                        )}
                      </button>
                      {menuOpen && (
                        <div
                          role="menu"
                          className="absolute right-0 top-full mt-1 z-20 min-w-[180px] bg-surface-2 border border-border-subtle rounded-xl shadow-lg overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            role="menuitem"
                            onClick={openEditModal}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-hover-overlay transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>Редактировать</span>
                          </button>
                          {onDelete && (
                            <button
                              role="menuitem"
                              onClick={() => { setMenuOpen(false); onDelete(post.id) }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Удалить</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Post Media Preview */}
            {displayMedia && displayMedia[0] && (
              <div
                className={`relative bg-black cursor-pointer ${isHomePortrait ? 'aspect-[3/4] max-h-[72vh]' : 'aspect-video'}`}
                onClick={(e) => {
                  e.stopPropagation()
                  if (displayMedia[0].mediaType === MediaType.Video) {
                    onVideoToggle?.(playingVideoId === post.id ? null : post.id)
                  } else {
                    onPhotoClick?.(
                      getMediaUrl(displayMedia[0].url) || '',
                      displayCaption || undefined
                    )
                  }
                }}
              >
                {displayMedia[0].mediaType === MediaType.Image ? (
                  <img
                    src={getMediaUrl(displayMedia[0].url) || ''}
                    alt={displayCaption || 'Post image'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <video
                      src={getMediaUrl(displayMedia[0].url) || ''}
                      className="w-full h-full object-cover"
                      controls={playingVideoId === post.id}
                      autoPlay={playingVideoId === post.id}
                      muted={playingVideoId !== post.id}
                      playsInline
                      onEnded={() => onVideoToggle?.(null)}
                    />
                    {playingVideoId !== post.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors">
                          <Video className="w-8 h-8 text-foreground ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Post Caption */}
            {displayCaption && (
              <div className="px-4 py-2.5">
                <p className="text-sm text-muted-foreground leading-relaxed">{displayCaption}</p>
              </div>
            )}

            {/* Post Actions */}
            <div className="px-3 py-1.5 border-t border-border-subtle">
              <PostActions
                postId={post.id}
                onCommentClick={toggleComments}
                onRepostSuccess={onRepostSuccess}
                hideRepost={hideRepostButton}
              />
            </div>
          </>
        )}
      </div>

      {/* Comments modal portal */}
      {commentsModal}

      {/* Edit caption modal */}
      {editOpen && typeof window !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={closeEditModal}
        >
          <div
            className="w-full sm:max-w-md bg-surface-2 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border-subtle flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-subtle">
              <span className="text-[15px] font-semibold text-foreground">Редактировать публикацию</span>
              <button
                onClick={closeEditModal}
                disabled={editSaving}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-hover-overlay hover:bg-border-subtle transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4 text-faint-foreground" />
              </button>
            </div>

            <div className="p-4">
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Добавить подпись..."
                disabled={editSaving}
                rows={5}
                maxLength={2000}
                className="w-full resize-none rounded-xl bg-surface-1 border border-border-subtle px-3 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:border-border disabled:opacity-60"
                autoFocus
              />
              <div className="flex justify-between items-center mt-1">
                {editError ? (
                  <span className="text-xs text-red-500">{editError}</span>
                ) : <span />}
                <span className="text-xs text-faint-foreground">{editCaption.length}/2000</span>
              </div>
            </div>

            <div className="flex gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-border-subtle">
              <button
                onClick={closeEditModal}
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hover-overlay hover:bg-border-subtle text-sm font-medium text-foreground transition-colors disabled:opacity-50"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveCaption}
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-sm font-semibold text-primary-foreground transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {editSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export const PostCard = memo(PostCardComponent)
PostCard.displayName = 'PostCard'
