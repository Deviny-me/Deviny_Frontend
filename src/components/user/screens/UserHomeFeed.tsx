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
import { useUser } from '@/components/user/UserProvider'
import { postsApi } from '@/lib/api/postsApi'
import { PostType } from '@/types/post'
import { Toast } from '@/components/ui/Toast'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { PostCard } from '@/components/posts/PostCard'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'

export function UserHomeFeed() {
  const { user } = useUser()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tf = useTranslations('feed')
  const tPosts = useTranslations('posts')
  const tc = useTranslations('common')
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State — only keep ordered IDs; actual data lives in the store
  const [feedLoading, setFeedLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [feedPostIds, setFeedPostIds] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
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

  // Load feed on mount
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

  const handleDeletePost = async (postId: string) => {
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
  }

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: PostType) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset input
    event.target.value = ''

    // Validate file
    const validation = postsApi.validateFile(file, type)
    if (!validation.valid) {
      setToast({ message: validation.error!, type: 'error' })
      return
    }

    // Upload file
    setIsUploading(true)
    setUploadProgress(type === PostType.Photo ? tf('uploadingPhoto') : tf('uploadingVideo'))

    try {
      const newPost = await postsApi.createMediaPost({ file, type })
      
      setToast({ message: tf('postUploaded'), type: 'success' })
      
      // Add to store + prepend to feed
      const ids = upsertPosts([newPost])
      setFeedPostIds(prev => [...ids, ...prev])
      
    } catch (error) {
      const message = error instanceof Error ? error.message : tf('uploadError')
      setToast({ message, type: 'error' })
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  return (
    <div className="pb-8">
      {/* Hidden file inputs */}
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

      <div className="w-full max-w-[620px] mx-auto">
        {feedLoading ? (
          <div className="flex min-h-[72vh] items-center justify-center">
            <Loader2 className="w-7 h-7 text-[#0c8de6] animate-spin" />
          </div>
        ) : feedPostIds.length > 0 ? (
          <div className="space-y-4">
            {feedPostIds.map((id) => (
              <PostCard
                key={id}
                postId={id}
                mediaPreset="home-portrait"
                currentUserId={user?.id}
                showDeleteInHeader
                onDelete={handleDeletePost}
                deletingPostId={deletingPostId}
                onRepostSuccess={() => loadFeed(1)}
                playingVideoId={playingVideoId}
                onVideoToggle={setPlayingVideoId}
                onPhotoClick={(url, caption) => setViewingPhoto({ url, caption })}
              />
            ))}
            <div ref={infiniteScrollRef} className="flex min-h-12 justify-center items-center pt-2">
              {loadingMore ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#0c8de6]" />
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

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox
          imageUrl={viewingPhoto.url}
          caption={viewingPhoto.caption}
          onClose={() => setViewingPhoto(null)}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* FAB — create post */}
      <button
        onClick={() => setShowMediaModal(true)}
        disabled={isUploading}
        aria-label={tf('addPost')}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-8 lg:right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0c8de6] shadow-lg shadow-[#0c8de6]/40 transition-all hover:bg-[#0a7dd4] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Plus className="h-6 w-6 text-white" strokeWidth={2.2} />
        )}
      </button>

      {/* Media picker modal */}
      {showMediaModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMediaModal(false)}
        >
          <div
            className="w-full sm:w-80 bg-[#111827] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <span className="text-[15px] font-semibold text-white">{tf('addPost')}</span>
              <button
                onClick={() => setShowMediaModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] hover:bg-white/[0.14] transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
            {/* Options */}
            <div className="flex flex-col gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
              <button
                onClick={() => { photoInputRef.current?.click(); setShowMediaModal(false) }}
                className="group flex items-center gap-4 rounded-2xl bg-white/[0.05] px-4 py-4 hover:bg-[#0c8de6]/15 transition-colors active:scale-[0.98]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c8de6]/15 group-hover:bg-[#0c8de6]/25 transition-colors flex-shrink-0">
                  <ImageIcon className="h-5 w-5 text-[#0c8de6]" strokeWidth={1.8} />
                </span>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-white">{tf('photo')}</p>
                </div>
              </button>
              <button
                onClick={() => { videoInputRef.current?.click(); setShowMediaModal(false) }}
                className="group flex items-center gap-4 rounded-2xl bg-white/[0.05] px-4 py-4 hover:bg-[#0c8de6]/15 transition-colors active:scale-[0.98]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0c8de6]/15 group-hover:bg-[#0c8de6]/25 transition-colors flex-shrink-0">
                  <Video className="h-5 w-5 text-[#0c8de6]" strokeWidth={1.8} />
                </span>
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-white">{tf('video')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
