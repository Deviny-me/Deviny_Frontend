'use client'

import { 
  Image as ImageIcon,
  Video,
  Flame,
  Loader2,
  Upload,
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

  const controlButtons = (
    <>
      <button
        onClick={() => photoInputRef.current?.click()}
        disabled={isUploading}
        className="group flex min-h-[48px] min-w-[150px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#0c8de6]/35 hover:bg-[#0c8de6]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c8de6]/12 transition-colors group-hover:bg-[#0c8de6]/18">
            <ImageIcon className="h-4.5 w-4.5 text-[#0c8de6] transition-transform group-hover:scale-110" strokeWidth={1.9} />
          </span>
          <span className="text-[13px] font-semibold text-foreground">{tf('photo')}</span>
        </span>
        <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#0c8de6]" />
      </button>
      <button
        onClick={() => videoInputRef.current?.click()}
        disabled={isUploading}
        className="group flex min-h-[48px] min-w-[150px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#0c8de6]/35 hover:bg-[#0c8de6]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0c8de6]/12 transition-colors group-hover:bg-[#0c8de6]/18">
            <Video className="h-4.5 w-4.5 text-[#0c8de6] transition-transform group-hover:scale-110" strokeWidth={1.9} />
          </span>
          <span className="text-[13px] font-semibold text-foreground">{tf('video')}</span>
        </span>
        <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#0c8de6]" />
      </button>
    </>
  )

  return (
    <div className="pb-8 lg:flex lg:items-start lg:gap-5">
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

      <aside className="mb-4 lg:sticky lg:top-4 lg:order-2 lg:mb-0 lg:w-[176px] lg:flex-shrink-0">
        {isUploading && uploadProgress && (
          <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[#0c8de6]/10 bg-[#0c8de6]/[0.06] px-3 py-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-[#0c8de6]" />
            <span className="text-sm text-muted-foreground">{uploadProgress}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {controlButtons}
        </div>
      </aside>

      <div className="lg:order-1 lg:min-w-0 lg:flex-1">
        {feedLoading ? (
          <div className="flex min-h-[72vh] items-center justify-center">
            <Loader2 className="w-7 h-7 text-[#0c8de6] animate-spin" />
          </div>
        ) : feedPostIds.length > 0 ? (
          <div className="space-y-5">
            {feedPostIds.map((id) => (
              <div key={id} className="flex justify-center">
                <PostCard
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
              </div>
            ))}
            <div ref={infiniteScrollRef} className="flex min-h-12 justify-center pt-2">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-[#0c8de6]" />
                  {tc('loading')}
                </div>
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
    </div>
  )
}
