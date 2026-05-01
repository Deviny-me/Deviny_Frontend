'use client'

import { useTranslations } from 'next-intl'
import { 
  Image as ImageIcon,
  Video,
  Flame,
  Loader2,
  Upload,
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { PostType } from '@/types/post'
import { fetchNutritionistProfile } from '@/lib/api/nutritionistProfileApi'
import { PostCard } from '@/components/posts/PostCard'
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { getMediaUrl } from '@/lib/config'
import { Toast } from '@/components/ui/Toast'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { useUpsertPosts, usePostDispatch } from '@/contexts/PostStoreContext'
import { useLevel } from '@/components/level/LevelProvider'
import { useAuth } from '@/features/auth/AuthContext'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { useInfiniteScroll } from '@/lib/hooks/useInfiniteScroll'

export function NutritionistHomeFeed() {
  const t = useTranslations('feed')
  const tp = useTranslations('posts')
  const tc = useTranslations('common')
  const tNav = useTranslations('nav')
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const { refreshLevel } = useLevel()
  const { user: authUser } = useAuth()
  
  // Profile state
  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  
  // Load profile on mount
  useEffect(() => {
    loadProfile()
    
    const handleAvatarUpdate = () => { loadProfile() }
    window.addEventListener('nutritionistAvatarUpdated', handleAvatarUpdate)
    return () => window.removeEventListener('nutritionistAvatarUpdated', handleAvatarUpdate)
  }, [])
  
  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const data = await fetchNutritionistProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }
  
  // Derived values from profile
  const nutritionistName = profile?.trainer?.fullName || tNav('nutritionist')
  const nutritionistInitials = profile?.trainer?.initials || nutritionistName.charAt(0)
  const avatarUrl = getMediaUrl(profile?.trainer?.avatarUrl)
  
  // File input refs
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  
  // State — only IDs; data in store
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

  useRealtimeScopeRefresh(['posts', 'profile'], () => {
    loadFeed(1)
    loadProfile()
  })

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (!confirm(tp('deleteConfirm'))) return

    try {
      setDeletingPostId(postId)
      console.log('[Delete] Attempting to delete post:', postId, 'userId:', authUser?.id)
      await postsApi.deletePost(postId)
      console.log('[Delete] Post deleted successfully:', postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setFeedPostIds(prev => prev.filter(id => id !== postId))
      setToast({ message: tp('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tp('deleteError')
      setToast({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: PostType) => {
    const file = event.target.files?.[0]
    if (!file) return

    event.target.value = ''

    const validation = postsApi.validateFile(file, type)
    if (!validation.valid) {
      setToast({ message: validation.error!, type: 'error' })
      return
    }

    setIsUploading(true)
    setUploadProgress(type === PostType.Photo ? t('uploadingPhoto') : t('uploadingVideo'))

    try {
      const newPost = await postsApi.createMediaPost({ file, type })
      setToast({ message: t('postUploaded'), type: 'success' })
      const ids = upsertPosts([newPost])
      setFeedPostIds(prev => [...ids, ...prev])
      // Refresh XP/level after posting
      await refreshLevel()
    } catch (error) {
      const message = error instanceof Error ? error.message : t('uploadError')
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
        className="group flex min-h-[48px] min-w-[150px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#28bf68]/35 hover:bg-[#28bf68]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#28bf68]/12 transition-colors group-hover:bg-[#28bf68]/18">
            <ImageIcon className="h-4.5 w-4.5 text-[#28bf68] transition-transform group-hover:scale-110" strokeWidth={1.9} />
          </span>
          <span className="text-[13px] font-semibold text-foreground">{t('photo')}</span>
        </span>
        <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#28bf68]" />
      </button>
      <button
        onClick={() => videoInputRef.current?.click()}
        disabled={isUploading}
        className="group flex min-h-[48px] min-w-[150px] items-center justify-between gap-3 rounded-xl border border-dashed border-[rgba(148,163,184,0.22)] bg-background px-3.5 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)] transition-all hover:border-[#28bf68]/35 hover:bg-[#28bf68]/[0.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#28bf68]/12 transition-colors group-hover:bg-[#28bf68]/18">
            <Video className="h-4.5 w-4.5 text-[#28bf68] transition-transform group-hover:scale-110" strokeWidth={1.9} />
          </span>
          <span className="text-[13px] font-semibold text-foreground">{t('video')}</span>
        </span>
        <Upload className="h-4 w-4 text-faint-foreground transition-transform group-hover:-translate-y-0.5 group-hover:text-[#28bf68]" />
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
          <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-[#28bf68]/10 bg-[#28bf68]/[0.06] px-3 py-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-[#28bf68]" />
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
            <Loader2 className="w-7 h-7 text-[#28bf68] animate-spin" />
          </div>
        ) : feedPostIds.length > 0 ? (
          <div className="space-y-5">
            {feedPostIds.map((id) => (
              <div key={id} className="flex justify-center">
                <PostCard
                  postId={id}
                  mediaPreset="home-portrait"
                  currentUserId={authUser?.id}
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
                  <Loader2 className="h-4 w-4 animate-spin text-[#28bf68]" />
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
            <h3 className="text-base font-semibold text-foreground mb-1.5">{t('noPosts')}</h3>
            <p className="text-sm text-faint-foreground max-w-xs mx-auto">{t('noPostsDescription')}</p>
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
