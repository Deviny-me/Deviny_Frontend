'use client'

import { useUser } from '@/components/user/UserProvider'
import { useLevel } from '@/components/level/LevelProvider'
import { 
  Camera,
  MapPin,
  Zap,
  Grid,
  List,
  Loader2,
  X,
  Play,
  Heart,
  MessageCircle,
  Repeat2,
  Trash2,
  Settings,
  Award,
  Trophy,
  ShieldAlert,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { postsApi } from '@/lib/api/postsApi'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'
import { useLanguage } from '@/components/language/LanguageProvider'
import { localizeCityName, localizeCountryName } from '@/lib/data/countries'
import { ProfileReviewsTab } from '@/components/shared/ProfileReviewsTab'
import { getMyAchievements } from '@/lib/api/achievementApi'
import type { MyAchievementsResponse } from '@/types/achievement'
import { getIcon, getRarityBorder, getRarityGlow, getRarityLabelColor } from '@/components/shared/achievementUtils'
import { useAchievementsOptional } from '@/contexts/AchievementsContext'

// ─── Grid cell with optimistic likes ───
function GridCell({
  postId,
  onSelect,
  onDelete,
  deletingPostId,
}: {
  postId: string
  onSelect: (postId: string) => void
  onDelete?: (postId: string) => void
  deletingPostId?: string | null
}) {
  const tPosts = useTranslations('posts')
  const post = usePost(postId)
  const dispatch = usePostDispatch()
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const isMountedRef = useRef(true)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLikedByMe)
      setLikeCount(post.likeCount)
      setCommentCount(post.commentCount)
    }
  }, [post?.isLikedByMe, post?.likeCount, post?.commentCount])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  const doLike = useCallback(async () => {
    if (!post || isLikeLoading) return
    const wasLiked = isLiked
    const prevCount = likeCount

    setIsLiked(!wasLiked)
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1)
    dispatch({
      type: 'UPDATE_POST',
      postId,
      partial: { isLikedByMe: !wasLiked, likeCount: wasLiked ? prevCount - 1 : prevCount + 1 },
    })
    setIsLikeLoading(true)

    try {
      const stats = wasLiked
        ? await postsApi.unlikePost(postId)
        : await postsApi.likePost(postId)
      if (isMountedRef.current) {
        setIsLiked(stats.isLikedByMe)
        setLikeCount(stats.likeCount)
        setCommentCount(stats.commentCount)
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: {
            likeCount: stats.likeCount,
            commentCount: stats.commentCount,
            repostCount: stats.repostCount,
            isLikedByMe: stats.isLikedByMe,
            isRepostedByMe: stats.isRepostedByMe,
          },
        })
      }
    } catch {
      if (isMountedRef.current) {
        setIsLiked(wasLiked)
        setLikeCount(prevCount)
        dispatch({ type: 'UPDATE_POST', postId, partial: { isLikedByMe: wasLiked, likeCount: prevCount } })
      }
    } finally {
      if (isMountedRef.current) setIsLikeLoading(false)
    }
  }, [post, postId, dispatch, isLikeLoading, isLiked, likeCount])

  if (!post) return null

  const media = post.isRepost && post.originalPost?.media?.[0]
    ? post.originalPost.media[0]
    : post.media[0]

  if (post.isRepost && !post.originalPost) {
    return (
      <div className="relative aspect-square bg-background overflow-hidden flex flex-col items-center justify-center text-center p-2">
        <Repeat2 className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-600 leading-tight">{tPosts('deleted')}</p>
      </div>
    )
  }

  if (!media) return null

  return (
    <div
      className="relative aspect-square bg-background overflow-hidden group cursor-pointer rounded-lg"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        onSelect(postId)
      }}
    >
      <div className="w-full h-full">
        {media.mediaType === MediaType.Image ? (
          <img
            src={getMediaUrl(media.url) || ''}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <>
            {media.thumbnailUrl ? (
              <img
                src={getMediaUrl(media.thumbnailUrl) || ''}
                alt={post.caption || 'Video thumbnail'}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <video
                src={getMediaUrl(media.url) || ''}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                muted
                playsInline
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-5 h-5 text-foreground ml-0.5" fill="white" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); doLike() }}
          disabled={isLikeLoading}
          className={`flex items-center gap-1 text-foreground transition-all hover:scale-110 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : ''}`} fill={isLiked ? 'currentColor' : 'white'} />
          <span className="font-semibold">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(postId) }}
          className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-blue-400"
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(postId) }}
            disabled={deletingPostId === postId}
            className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-red-500"
          >
            {deletingPostId === postId ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Post detail modal ───
function PostDetailModal({ postId, onClose, onDelete, deletingPostId }: { postId: string; onClose: () => void; onDelete?: (postId: string) => void; deletingPostId?: string | null }) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 text-foreground/70 hover:text-foreground transition-colors">
        <X className="w-8 h-8" />
      </button>
      <div className="w-fit max-w-full rounded-xl transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <PostCard
          postId={postId}
          variant="modal"
          isOwnProfile
          showDeleteInHeader
          onDelete={onDelete}
          deletingPostId={deletingPostId}
          playingVideoId={playingVideoId}
          onVideoToggle={setPlayingVideoId}
          onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
        />
      </div>
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}
    </div>
  )
}

// ─── Main page ───
export default function UserProfilePage() {
  const { user } = useUser()
  const { level } = useLevel()
  const achievements = useAchievementsOptional()
  const { language } = useLanguage()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tc = useTranslations('common')
  const tp = useTranslations('profile')
  const tPosts = useTranslations('posts')

  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [mainTab, setMainTab] = useState<'posts' | 'reviews' | 'injuries' | 'achievements'>('posts')
  const [postTab, setPostTab] = useState<ProfilePostTab>('all')
  const [achievementsData, setAchievementsData] = useState<MyAchievementsResponse | null>(null)
  const [isLoadingAchievements, setIsLoadingAchievements] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [toastData, setToastData] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isRefreshingPosts = isLoadingPosts && page === 1 && postIds.length > 0

  // Calculate level progress from LevelProvider
  const currentLevel = level?.currentLevel ?? user?.level ?? 1
  const currentXp = level?.currentXp ?? user?.xp ?? 0
  const requiredXp = level?.requiredXpForNextLevel ?? user?.xpToNextLevel ?? 1000
  const levelProgress = Math.min(100, Math.max(0, requiredXp > 0 ? (currentXp / requiredXp) * 100 : 0))

  const localizedCountry = localizeCountryName(user?.country, language)
  const localizedCity = localizeCityName(user?.city, user?.country, language)
  const achievementsCount = achievements?.unlockedCount ?? (user?.achievementsCount || 0)

  const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    // Abort previous request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setIsLoadingPosts(true)
      const response = await postsApi.getMyPosts(pageNum, 12, postTab, controller.signal)
      if (controller.signal.aborted) return
      const ids = upsertPosts(response.posts)
      if (append) {
        setPostIds(prev => [...prev, ...ids])
      } else {
        setPostIds(ids)
      }
      setTotalPosts(response.totalCount)
      setHasMore(response.hasMore)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Failed to load posts:', error)
    } finally {
      if (!controller.signal.aborted) setIsLoadingPosts(false)
    }
  }, [postTab, upsertPosts])

  const handlePostTabChange = useCallback((tab: ProfilePostTab) => {
    setPostTab(tab)
    setPage(1)
    setHasMore(true)
    setIsLoadingPosts(true)
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  const handleLoadMore = useCallback(() => {
    if (!isLoadingPosts && hasMore && postIds.length > 0) {
      const nextPage = page + 1
      setPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoadingPosts, hasMore, page, postIds.length, loadPosts])

  const handleDeletePost = async (postId: string) => {
    if (!confirm(tPosts('deleteConfirm'))) return
    try {
      setDeletingPostId(postId)
      await postsApi.deletePost(postId)
      dispatch({ type: 'REMOVE_POST', postId })
      setPostIds(prev => prev.filter(id => id !== postId))
      setSelectedPostId(null)
      setToastData({ message: tPosts('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tPosts('deleteError')
      setToastData({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isLoadingPosts) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMore() },
      { threshold: 0.1 }
    )
    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoadingPosts, handleLoadMore])

  // Load achievements when tab is active
  useEffect(() => {
    if (mainTab !== 'achievements' || achievementsData !== null || isLoadingAchievements) return
    setIsLoadingAchievements(true)
    getMyAchievements()
      .then(setAchievementsData)
      .catch(console.error)
      .finally(() => setIsLoadingAchievements(false))
  }, [mainTab, achievementsData, isLoadingAchievements])

  return (
    <>
      <div className="space-y-4 pb-6">
        {/* Profile Header */}
        <div className="-mx-3 -mt-2 overflow-hidden bg-surface-2/35 sm:-mx-4 md:mx-0 md:mt-0 md:rounded-xl md:border md:border-border md:bg-surface-3">
          <div className="relative h-32 sm:h-40 bg-gradient-to-r from-[#0c8de6] to-[#0070c4] overflow-hidden">
            {user?.bannerUrl && (
              <img
                src={getMediaUrl(user.bannerUrl) || ''}
                alt="Profile banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          <div className="relative px-4 pb-4 sm:px-6 sm:pb-5">
            {/* Avatar + Info row */}
            <div className="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:gap-4">
              {/* Avatar */}
              <div className="relative z-10 flex-shrink-0 self-center sm:self-start">
                {user?.avatarUrl ? (
                  <img
                    src={getMediaUrl(user.avatarUrl) || ''}
                    alt={user?.fullName || 'User'}
                    className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-[#1A1A1A] shadow-xl ring-2 ring-white/10 sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-[#0c8de6] to-[#0070c4] shadow-xl dark:border-[#1A1A1A] sm:h-24 sm:w-24">
                    <span className="text-xl font-bold text-white sm:text-2xl">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* Name + Stats inline */}
              <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0 sm:pt-[3rem]">
                <div className="min-w-0 text-center sm:text-left">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-2.5">
                    <h2 className="page-title-compact truncate">{user?.fullName || 'User'}</h2>
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-[#0c8de6] to-[#0070c4] rounded-full whitespace-nowrap">
                      Lv. {currentLevel}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <span className="inline-flex items-center gap-1 text-center">
                      <MapPin className="w-3 h-3" />
                      {[localizedCity, localizedCountry].filter(Boolean).join(', ') || tp('notSpecified')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-center">
                      <Zap className="w-3 h-3 text-[#0c8de6]" />
                      {currentXp.toLocaleString()} / {requiredXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:grid sm:grid-cols-4 sm:gap-2 md:gap-3">
                  <Link href="/user/journey" className="group rounded-xl border border-border-subtle bg-surface-1 px-2 py-2 text-center">
                    <p className="text-sm font-bold text-foreground transition-colors group-hover:text-[#0c8de6] md:text-base">{(user?.workoutsCompleted || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{tp('workouts')}</p>
                  </Link>
                  <Link href="/user/friends?tab=followers" className="group rounded-xl border border-border-subtle bg-surface-1 px-2 py-2 text-center">
                    <p className="text-sm font-bold text-foreground transition-colors group-hover:text-[#0c8de6] md:text-base">{(user?.followersCount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{tp('followers')}</p>
                  </Link>
                  <Link href="/user/friends?tab=following" className="group rounded-xl border border-border-subtle bg-surface-1 px-2 py-2 text-center">
                    <p className="text-sm font-bold text-foreground transition-colors group-hover:text-[#0c8de6] md:text-base">{(user?.followingCount || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{tp('following')}</p>
                  </Link>
                  <Link href="/user/achievements" className="group rounded-xl border border-border-subtle bg-surface-1 px-2 py-2 text-center">
                    <p className="text-sm font-bold text-foreground transition-colors group-hover:text-[#0c8de6] md:text-base">{achievementsCount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{tp('achievements')}</p>
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats row for mobile */}
            <div className="mt-4 grid grid-cols-4 gap-1 bg-surface-1/45 p-1.5 sm:hidden sm:rounded-xl sm:border sm:border-border-subtle sm:bg-surface-1 sm:p-2">
              <Link href="/user/journey" className="rounded-lg px-1.5 py-2 text-center">
                <p className="text-sm font-bold text-foreground">{(user?.workoutsCompleted || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{tp('workouts')}</p>
              </Link>
              <Link href="/user/friends?tab=followers" className="rounded-lg px-1.5 py-2 text-center">
                <p className="text-sm font-bold text-foreground">{(user?.followersCount || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{tp('followers')}</p>
              </Link>
              <Link href="/user/friends?tab=following" className="rounded-lg px-1.5 py-2 text-center">
                <p className="text-sm font-bold text-foreground">{(user?.followingCount || 0).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{tp('following')}</p>
              </Link>
              <Link href="/user/achievements" className="rounded-lg px-1.5 py-2 text-center">
                <p className="text-sm font-bold text-foreground">{achievementsCount.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">{tp('achievements')}</p>
              </Link>
            </div>

            {/* About Me */}
            <div className="mt-4 bg-surface-1/45 p-3 dark:bg-white/[0.02] sm:rounded-xl sm:border sm:border-border-subtle sm:bg-surface-1 sm:p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{user?.bio || tp('addDescription')}</p>
            </div>

            {/* Profile Settings Button */}
            <Link
              href="/user/profile/settings"
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0c8de6] to-[#0070c4] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Settings className="w-4 h-4" />
              {tp('profileSettings')}
            </Link>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-border pb-1 scrollbar-hide">
          {(['posts', 'reviews', 'injuries', 'achievements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`relative shrink-0 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium capitalize transition-all ${
                mainTab === tab
                  ? 'bg-[#0c8de6]/10 text-[#0c8de6]'
                  : 'text-muted-foreground hover:bg-surface-1 hover:text-foreground'
              }`}
            >
              {tab === 'posts' ? tp('posts') : tab === 'reviews' ? tp('reviews') : tab === 'injuries' ? tp('injuries') : tp('achievements')}
              {mainTab === tab && (
                <motion.div
                  layoutId="userProfileTab"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-[#0c8de6] to-[#0070c4]"
                />
              )}
            </button>
          ))}
        </div>

        {/* Posts Tab Content */}
        {mainTab === 'posts' && (
          <div className="overflow-hidden bg-surface-2/35 sm:rounded-xl sm:border sm:border-border sm:bg-surface-3">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-[#0c8de6]" />
                <h3 className="font-semibold text-foreground">{tPosts('postsTab')}</h3>
                {totalPosts > 0 && <span className="text-xs text-faint-foreground">({totalPosts})</span>}
              </div>
              <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-[#0c8de6]' : 'text-faint-foreground hover:text-muted-foreground'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-[#0c8de6]' : 'text-faint-foreground hover:text-muted-foreground'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ProfilePostTabs activeTab={postTab} onTabChange={handlePostTabChange} disabled={isLoadingPosts} />

            <div className="relative">
              {postIds.length === 0 && !isLoadingPosts ? (
                <div className="py-12 text-center">
                  <Camera className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">{tPosts('noPublications')}</p>
                  <p className="text-sm text-faint-foreground mt-1">{tp('uploadPhotoOrVideo')}</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div>
                  <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
                    {postIds.map((id) => (
                      <GridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
                    ))}
                  </div>
                  {!isRefreshingPosts && (isLoadingPosts || hasMore) && (
                    <div ref={observerRef} className="py-8 flex justify-center">
                      {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#0c8de6] animate-spin" />}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 space-y-3">
                  {postIds.map((id) => (
                    <PostCard
                      key={id}
                      postId={id}
                      isOwnProfile
                      showDeleteInHeader
                      onDelete={handleDeletePost}
                      deletingPostId={deletingPostId}
                      onRepostSuccess={() => loadPosts(1)}
                      playingVideoId={playingVideoId}
                      onVideoToggle={setPlayingVideoId}
                      onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
                    />
                  ))}
                  {!isRefreshingPosts && (isLoadingPosts || hasMore) && (
                    <div ref={observerRef} className="py-8 flex justify-center">
                      {isLoadingPosts && <Loader2 className="w-6 h-6 text-[#0c8de6] animate-spin" />}
                    </div>
                  )}
                </div>
              )}

              {isRefreshingPosts && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface-3/72 backdrop-blur-[1px]">
                  <Loader2 className="w-7 h-7 text-[#0c8de6] animate-spin" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab Content */}
        {mainTab === 'reviews' && (
          <ProfileReviewsTab
            expertId={user?.id ?? ''}
            accentText="text-[#0c8de6]"
            accentGradient="from-[#0c8de6]/10 to-[#0070c4]/10"
          />
        )}

        {/* Injuries Tab Content */}
        {mainTab === 'injuries' && (
          <div className="text-center py-12">
            <ShieldAlert className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-muted-foreground">{tp('noInjuries')}</p>
            <p className="text-sm text-faint-foreground mt-1">{tp('injuriesDescription')}</p>
          </div>
        )}

        {/* Achievements Tab Content */}
        {mainTab === 'achievements' && (
          <div className="space-y-4">
            {isLoadingAchievements ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-[#0c8de6] animate-spin" />
              </div>
            ) : achievementsData ? (
              achievementsData.all.filter(a => a.isUnlocked).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {achievementsData.all.filter(a => a.isUnlocked).map((achievement) => {
                    const Icon = getIcon(achievement.iconKey)
                    return (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-xl border ${getRarityBorder(achievement.rarity)} ${getRarityGlow(achievement.rarity)} bg-surface-3`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#0c8de6]/20">
                            <Icon className="w-5 h-5 text-[#0c8de6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-semibold text-sm truncate ${getRarityLabelColor(achievement.rarity)}`}>
                              {achievement.title}
                            </h4>
                            <p className="text-xs text-faint-foreground mt-0.5 line-clamp-2">{achievement.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">{tp('noAchievements')}</p>
                  <p className="text-sm text-faint-foreground mt-1">{tp('achievementsWillAppear')}</p>
                </div>
              )
            ) : null}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}

      {/* Toast Notifications */}
      {toastData && (
        <Toast
          message={toastData.message}
          type={toastData.type}
          onClose={() => setToastData(null)}
        />
      )}
    </>
  )
}
