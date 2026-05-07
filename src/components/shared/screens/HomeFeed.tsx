'use client'

import {
  Image as ImageIcon,
  Video,
  Flame,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { PostType } from '@/types/post'
import { Toast } from '@/components/ui/Toast'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { PostCard } from '@/components/posts/PostCard'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'

interface HomeFeedProps {
  currentUserId?: string
  onPostUploaded?: () => Promise<void> | void
  accentColor?: 'blue' | 'orange' | 'green'
}

const accentStyles = {
  blue: {
    button: 'bg-[#0c8de6] shadow-[#0c8de6]/40 hover:bg-[#0a7dd4]',
    optionHover: 'hover:bg-[#0c8de6]/15',
    optionIconBg: 'bg-[#0c8de6]/15 group-hover:bg-[#0c8de6]/25',
    optionIcon: 'text-[#0c8de6]',
    spinner: 'text-[#0c8de6]',
  },
  orange: {
    button: 'bg-[#d4722a] shadow-[#d4722a]/40 hover:bg-[#b85e1e]',
    optionHover: 'hover:bg-[#d4722a]/15',
    optionIconBg: 'bg-[#d4722a]/15 group-hover:bg-[#d4722a]/25',
    optionIcon: 'text-[#d4722a]',
    spinner: 'text-[#d4722a]',
  },
  green: {
    button: 'bg-[#28bf68] shadow-[#28bf68]/40 hover:bg-[#1c9e52]',
    optionHover: 'hover:bg-[#28bf68]/15',
    optionIconBg: 'bg-[#28bf68]/15 group-hover:bg-[#28bf68]/25',
    optionIcon: 'text-[#28bf68]',
    spinner: 'text-[#28bf68]',
  },
}

export function HomeFeed({ currentUserId, onPostUploaded, accentColor = 'blue' }: HomeFeedProps) {
  const accent = accentStyles[accentColor]
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tf = useTranslations('feed')
  const tPosts = useTranslations('posts')
  const tc = useTranslations('common')

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [feedLoading, setFeedLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [feedPostIds, setFeedPostIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [composeFile, setComposeFile] = useState<{ file: File; type: PostType; previewUrl: string } | null>(null)
  const [composeCaption, setComposeCaption] = useState('')
  const loadingMoreRef = useRef(false)
  const PAGE_SIZE = 20

  const loadFeed = useCallback(async (pageNum = 1, isInitial = false, append = false) => {
    try {
      if (isInitial) setFeedLoading(true)
      const response = await postsApi.getFeed(pageNum, PAGE_SIZE)
      const ids = upsertPosts(response.posts)
      setFeedPostIds(prev => {
        if (!append) return ids
        const existingIds = new Set(prev)
        return [...prev, ...ids.filter((id) => !existingIds.has(id))]
      })
      setPage(response.page)
      setHasMore(response.hasMore)
    } catch (error) {
      console.error('Failed to load feed:', error)
    } finally {
      if (isInitial) setFeedLoading(false)
    }
  }, [upsertPosts])

  useEffect(() => {
    loadFeed(1, true)
  }, [loadFeed])

  const loadMore = useCallback(async () => {
    if (feedLoading || loadingMoreRef.current || !hasMore) return

    try {
      loadingMoreRef.current = true
      setLoadingMore(true)
      await loadFeed(page + 1, false, true)
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [feedLoading, hasMore, loadFeed, page])

  const infiniteScrollRef = useInfiniteScroll({
    enabled: !feedLoading && hasMore,
    onLoadMore: loadMore,
  })

  useRealtimeScopeRefresh(['posts'], () => {
    loadFeed(1)
  })

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!confirm(tPosts('deleteConfirm'))) return
    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setFeedPostIds(prev => prev.filter(id => id !== postId))
      setToast({ message: tPosts('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tPosts('deleteError')
      setToast({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }, [dispatch, tPosts])

  const handleRepostSuccess = useCallback(() => {
    loadFeed(1)
  }, [loadFeed])

  const handlePhotoClick = useCallback((url: string, caption?: string) => {
    setViewingPhoto({ url, caption })
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: PostType) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    const validation = postsApi.validateFile(file, type)
    if (!validation.valid) {
      setToast({ message: validation.error!, type: 'error' })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setComposeFile({ file, type, previewUrl })
    setComposeCaption('')
  }

  const closeCompose = useCallback(() => {
    setComposeFile(prev => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
    setComposeCaption('')
  }, [])

  const handlePublish = async () => {
    if (!composeFile || isUploading) return
    setIsUploading(true)
    try {
      const newPost = await postsApi.createMediaPost({
        file: composeFile.file,
        type: composeFile.type,
        caption: composeCaption.trim() || undefined,
      })
      setToast({ message: tf('postUploaded'), type: 'success' })
      const ids = upsertPosts([newPost])
      setFeedPostIds(prev => [...ids, ...prev])
      await onPostUploaded?.()
      closeCompose()
    } catch (error) {
      const message = error instanceof Error ? error.message : tf('uploadError')
      setToast({ message, type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (composeFile) URL.revokeObjectURL(composeFile.previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="pb-8">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, PostType.Photo)}
        disabled={isUploading}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => handleFileSelect(e, PostType.Video)}
        disabled={isUploading}
      />

      <div className="w-full max-w-[620px] mx-auto lg:-translate-x-[132px]">
        {feedLoading ? (
          <div className="flex min-h-[72vh] items-center justify-center">
            <Loader2 className={`w-7 h-7 ${accent.spinner} animate-spin`} />
          </div>
        ) : feedPostIds.length > 0 ? (
          <div className="space-y-4">
            {feedPostIds.map((id) => (
              <PostCard
                key={id}
                postId={id}
                mediaPreset="home-portrait"
                currentUserId={currentUserId}
                showDeleteInHeader
                onDelete={handleDeletePost}
                deletingPostId={deletingPostId === id ? id : null}
                onRepostSuccess={handleRepostSuccess}
                playingVideoId={playingVideoId === id ? id : null}
                onVideoToggle={setPlayingVideoId}
                onPhotoClick={handlePhotoClick}
              />
            ))}
            <div ref={infiniteScrollRef} className="flex min-h-12 justify-center items-center pt-2">
              {loadingMore ? (
                <Loader2 className={`h-5 w-5 animate-spin ${accent.spinner}`} />
              ) : !hasMore ? (
                <p className="text-sm text-faint-foreground">{tc('allItemsLoaded')}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="bg-surface-2 rounded-2xl border border-border-subtle p-8 sm:p-16 text-center">
            <div className="w-14 h-14 rounded-full bg-border-subtle flex items-center justify-center mx-auto mb-4">
              <Flame className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">{tf('noPosts')}</h3>
            <p className="text-sm text-faint-foreground max-w-xs mx-auto">{tf('noPostsDescription')}</p>
          </div>
        )}
      </div>

      {viewingPhoto && (
        <PhotoLightbox
          imageUrl={viewingPhoto.url}
          caption={viewingPhoto.caption}
          onClose={() => setViewingPhoto(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <button
        onClick={() => setShowMediaModal(true)}
        disabled={isUploading}
        aria-label={tf('addPost')}
        className={`fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-8 lg:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${accent.button}`}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Plus className="h-6 w-6 text-white" strokeWidth={2.2} />
        )}
      </button>

      {showMediaModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMediaModal(false)}
        >
          <div
            className="w-full sm:w-80 bg-[#111827] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <span className="text-[15px] font-semibold text-white">{tf('addPost')}</span>
              <button
                onClick={() => setShowMediaModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
            <div className="flex flex-col gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
              <button
                onClick={() => { photoInputRef.current?.click(); setShowMediaModal(false) }}
                className={`group flex items-center gap-4 rounded-2xl bg-white/[0.05] px-4 py-4 transition-colors active:scale-[0.98] ${accent.optionHover}`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors flex-shrink-0 ${accent.optionIconBg}`}>
                  <ImageIcon className={`h-5 w-5 ${accent.optionIcon}`} strokeWidth={1.8} />
                </span>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-white">{tf('photo')}</p>
                </div>
              </button>
              <button
                onClick={() => { videoInputRef.current?.click(); setShowMediaModal(false) }}
                className={`group flex items-center gap-4 rounded-2xl bg-white/[0.05] px-4 py-4 transition-colors active:scale-[0.98] ${accent.optionHover}`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors flex-shrink-0 ${accent.optionIconBg}`}>
                  <Video className={`h-5 w-5 ${accent.optionIcon}`} strokeWidth={1.8} />
                </span>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-white">{tf('video')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {composeFile && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => { if (!isUploading) closeCompose() }}
        >
          <div
            className="w-full sm:max-w-md bg-surface-2 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border-subtle flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-subtle">
              <span className="text-[15px] font-semibold text-foreground">{tf('newPostTitle')}</span>
              <button
                onClick={closeCompose}
                disabled={isUploading}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-hover-overlay hover:bg-border-subtle transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4 text-faint-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="relative bg-black aspect-square w-full">
                {composeFile.type === PostType.Photo ? (
                  <img
                    src={composeFile.previewUrl}
                    alt="preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={composeFile.previewUrl}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                  />
                )}
              </div>

              <div className="p-4">
                <textarea
                  value={composeCaption}
                  onChange={(e) => setComposeCaption(e.target.value)}
                  placeholder={tf('captionPlaceholder')}
                  disabled={isUploading}
                  rows={4}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl bg-surface-1 border border-border-subtle px-3 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:border-border disabled:opacity-60"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-faint-foreground">{composeCaption.length}/2000</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t border-border-subtle">
              <button
                onClick={closeCompose}
                disabled={isUploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-hover-overlay hover:bg-border-subtle text-sm font-medium text-foreground transition-colors disabled:opacity-50"
              >
                {tc('cancel')}
              </button>
              <button
                onClick={handlePublish}
                disabled={isUploading}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${accent.button}`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tf('uploading')}
                  </>
                ) : (
                  tf('publish')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
