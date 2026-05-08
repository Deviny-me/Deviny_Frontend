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
import { AnimatePresence, motion } from 'framer-motion'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
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
import { ratingsApi, RatingDto } from '@/lib/api/ratingsApi'
import { RatingBadge } from '@/components/shared/RatingBadge'
import type { MyAchievementsResponse } from '@/types/achievement'
import { getIcon, getRarityBorder, getRarityGlow, getRarityLabelColor } from '@/components/shared/achievementUtils'
import { useAchievementsOptional } from '@/contexts/AchievementsContext'
import { Tabs } from '@/components/ui/Tabs'

// в”Ђв”Ђв”Ђ Grid cell with optimistic likes в”Ђв”Ђв”Ђ
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

// в”Ђв”Ђв”Ђ Post detail modal в”Ђв”Ђв”Ђ
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

// в”Ђв”Ђв”Ђ Main page в”Ђв”Ђв”Ђ
export default function UserProfilePage() {
  const { user } = useUser()
  const { level } = useLevel()
  const achievements = useAchievementsOptional()
  const { language } = useLanguage()
  const upsertPosts = useUpsertPosts()
  const dispatch = usePostDispatch()
  const tc = useTranslations('common')
  const tp = useTranslations('profile')
  const tLevel = useTranslations('level')
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
  const [rating, setRating] = useState<RatingDto | null>(null)
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

  const handleDeletePost = useCallback(async (postId: string) => {
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
  }, [dispatch, tPosts])

  const handleRepostSuccess = useCallback(() => {
    loadPosts(1)
  }, [loadPosts])

  const handlePhotoClick = useCallback((url: string, caption?: string) => {
    setViewingPhoto({ url, caption })
  }, [])

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

  // Load activity rating
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ratingsApi
      .getUserRating(user.id)
      .then((r) => { if (!cancelled) setRating(r) })
      .catch((err) => { console.error('[UserProfile] failed to load rating', err) })
    return () => { cancelled = true }
  }, [user?.id])

  return (
    <>
      <div className="space-y-3 pb-24">
        {/* в”Ђв”Ђв”Ђ Profile Hero в”Ђв”Ђв”Ђ */}
        <div className="overflow-hidden rounded-none sm:rounded-2xl">
          {/* Banner */}
          <div className="relative h-28 sm:h-36 bg-gradient-to-br from-user-500 to-user-700 overflow-hidden">
            {user?.bannerUrl && (
              <img
                src={getMediaUrl(user.bannerUrl) || ''}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Card body */}
          <div className="bg-surface-1 border-x-0 sm:border sm:border-t-0 sm:border-border-subtle rounded-b-none sm:rounded-b-2xl px-4 pb-4 sm:px-6 sm:pb-5">
            {/* Avatar + Edit row */}
            <div className="-mt-10 sm:-mt-14 flex items-end justify-between mb-3">
              <div className="relative z-10">
                {user?.avatarUrl ? (
                  <img
                    src={getMediaUrl(user.avatarUrl) || ''}
                    alt={user?.fullName || 'User'}
                    className="h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-background shadow-xl"
                  />
                ) : (
                  <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full ring-4 ring-background shadow-xl bg-gradient-to-br from-user-400 to-user-600 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href="/user/profile/settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold ring-1 ring-inset ring-border bg-surface-2 text-foreground hover:bg-surface-3 hover:ring-border-strong transition-[background-color,box-shadow] duration-200 ease-out-expo"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">{tp('profileSettings')}</span>
              </Link>
            </div>

            {/* Name + Level */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                {user?.fullName || 'User'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-user-500/10 dark:bg-user-500/15 text-user-600 dark:text-user-300 ring-1 ring-inset ring-user-500/20">
                <Zap className="w-3 h-3" />
                {tLevel('level', { level: currentLevel })}
              </span>
              {rating && rating.ratingCount > 0 && (
                <RatingBadge
                  starRating={rating.starRating}
                  overallScore={rating.overallScore}
                  ratingCount={rating.ratingCount}
                  kind="activity"
                  size="sm"
                />
              )}
            </div>

            {/* Location */}
            {(localizedCity || localizedCountry) && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {[localizedCity, localizedCountry].filter(Boolean).join(', ')}
              </p>
            )}

            {/* XP Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{currentXp.toLocaleString()} XP</span>
                <span className="text-[11px] text-faint-foreground tabular-nums">{requiredXp.toLocaleString()} XP</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-user-400 to-user-600 transition-[width] duration-700 ease-out-expo"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {([
                { href: '/user/journey', value: user?.workoutsCompleted || 0, label: tp('workouts') },
                { href: '/user/friends?tab=followers', value: user?.followersCount || 0, label: tp('followers') },
                { href: '/user/friends?tab=following', value: user?.followingCount || 0, label: tp('following') },
                { href: '/user/achievements', value: achievementsCount, label: tp('achievements') },
              ] as const).map(({ href, value, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex flex-col items-center justify-center rounded-xl py-2.5 px-1 bg-surface-2/60 dark:bg-surface-2/40 ring-1 ring-inset ring-border-subtle hover:bg-user-500/8 hover:ring-user-500/25 transition-[background-color,box-shadow] duration-200 ease-out-expo"
                >
                  <span className="text-base sm:text-lg font-bold text-foreground group-hover:text-user-600 dark:group-hover:text-user-300 transition-colors tabular-nums leading-none">
                    {value.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 text-center leading-none">{label}</span>
                </Link>
              ))}
            </div>

            {/* Bio */}
            {user?.bio && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border-subtle pt-3">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* в”Ђв”Ђв”Ђ Main Tabs в”Ђв”Ђв”Ђ */}
        <Tabs
          items={[
            { value: 'posts', label: tp('posts') },
            { value: 'reviews', label: tp('reviews') },
            { value: 'injuries', label: tp('injuries') },
            { value: 'achievements', label: tp('achievements') },
          ]}
          value={mainTab}
          onChange={(v) => setMainTab(v as typeof mainTab)}
          variant="underline"
          accent="user"
        />

        {/* в”Ђв”Ђв”Ђ Tab Content в”Ђв”Ђв”Ђ */}
        <div className="relative min-h-[420px]">
          <AnimatePresence mode="wait" initial={false}>
            {mainTab === 'posts' && (
              <motion.div
                key="posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden"
              >
                {/* Posts header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-user-500" />
                    <span className="font-semibold text-sm text-foreground">{tPosts('postsTab')}</span>
                    {totalPosts > 0 && (
                      <span className="text-xs text-faint-foreground tabular-nums">({totalPosts})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5 ring-1 ring-inset ring-border-subtle">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        viewMode === 'grid' ? 'bg-surface-1 text-user-500 shadow-xs' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        viewMode === 'list' ? 'bg-surface-1 text-user-500 shadow-xs' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ProfilePostTabs activeTab={postTab} onTabChange={handlePostTabChange} disabled={isLoadingPosts} />

                <div className="relative min-h-[280px]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${postTab}-${viewMode}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                      {postIds.length === 0 && !isLoadingPosts ? (
                        <div className="py-16 text-center">
                          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                            <Camera className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <p className="font-medium text-foreground">{tPosts('noPublications')}</p>
                          <p className="text-sm text-muted-foreground mt-1">{tp('uploadPhotoOrVideo')}</p>
                        </div>
                      ) : viewMode === 'grid' ? (
                        <div>
                          <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3">
                            {postIds.map((id) => (
                              <GridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId === id ? id : null} />
                            ))}
                          </div>
                          {!isRefreshingPosts && (isLoadingPosts || hasMore) && (
                            <div ref={observerRef} className="py-8 flex justify-center">
                              {isLoadingPosts && <Loader2 className="w-5 h-5 text-user-500 animate-spin" />}
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
                              deletingPostId={deletingPostId === id ? id : null}
                              onRepostSuccess={handleRepostSuccess}
                              playingVideoId={playingVideoId === id ? id : null}
                              onVideoToggle={setPlayingVideoId}
                              onPhotoClick={handlePhotoClick}
                            />
                          ))}
                          {!isRefreshingPosts && (isLoadingPosts || hasMore) && (
                            <div ref={observerRef} className="py-8 flex justify-center">
                              {isLoadingPosts && <Loader2 className="w-5 h-5 text-user-500 animate-spin" />}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {isRefreshingPosts && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface-1/80 backdrop-blur-[1px]">
                      <Loader2 className="w-6 h-6 text-user-500 animate-spin" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {mainTab === 'reviews' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <ProfileReviewsTab
                  expertId={user?.id ?? ''}
                  accentText="text-user-600 dark:text-user-300"
                  accentGradient="from-user-500/10 to-user-600/10"
                />
              </motion.div>
            )}

            {mainTab === 'injuries' && (
              <motion.div
                key="injuries"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center"
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                  <ShieldAlert className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{tp('noInjuries')}</p>
                <p className="text-sm text-muted-foreground mt-1">{tp('injuriesDescription')}</p>
              </motion.div>
            )}

            {mainTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-3"
              >
                {isLoadingAchievements ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-user-500 animate-spin" />
                  </div>
                ) : achievementsData ? (
                  achievementsData.all.filter(a => a.isUnlocked).length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {achievementsData.all.filter(a => a.isUnlocked).map((achievement) => {
                        const Icon = getIcon(achievement.iconKey)
                        return (
                          <div
                            key={achievement.id}
                            className={cn(
                              'flex items-center gap-3 p-3.5 rounded-xl',
                              'bg-surface-1 ring-1 ring-inset ring-border-subtle',
                              getRarityBorder(achievement.rarity),
                            )}
                          >
                            <div className={cn('flex-shrink-0 grid place-items-center h-10 w-10 rounded-xl bg-user-500/10', getRarityGlow(achievement.rarity))}>
                              <Icon className="w-5 h-5 text-user-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn('font-semibold text-sm truncate', getRarityLabelColor(achievement.rarity))}>
                                {achievement.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
                      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                        <Trophy className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">{tp('noAchievements')}</p>
                      <p className="text-sm text-muted-foreground mt-1">{tp('achievementsWillAppear')}</p>
                    </div>
                  )
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <PostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
      )}

      {/* Photo Lightbox */}
      {viewingPhoto && (
        <PhotoLightbox imageUrl={viewingPhoto.url} caption={viewingPhoto.caption} onClose={() => setViewingPhoto(null)} />
      )}

      {/* Toast */}
      {toastData && (
        <Toast message={toastData.message} type={toastData.type} onClose={() => setToastData(null)} />
      )}
    </>
  )
}
