'use client'

import {
  Camera,
  Grid,
  List,
  Loader2,
  Heart,
  MessageCircle,
  Play,
  Repeat2,
  X,
  Mail,
  Ban,
  Award,
  Briefcase,
  Star,
  Globe,
  Phone,
  Calendar,
  FileText,
  ShieldAlert,
  Trophy,
} from 'lucide-react'
import { Tabs } from '@/components/ui/Tabs'
import type { AccentRole } from '@/components/ui/Tabs'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { postsApi } from '@/lib/api/postsApi'
import { friendsApi, followsApi, blocksApi } from '@/lib/api/friendsApi'
import { studentsApi } from '@/lib/api/studentsApi'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import type { RelationshipStatus } from '@/types/friend'
import { API_URL, fetchWithAuth, getMediaUrl } from '@/lib/config'
import { localizeCityName, localizeCountryName } from '@/lib/data/countries'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { getRoleRingClass, getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useTranslations } from 'next-intl'
import { useLanguage } from '@/components/language/LanguageProvider'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { ProfileReviewsTab } from '@/components/shared/ProfileReviewsTab'
import { UserReceivedReviewsTab } from '@/components/shared/UserReceivedReviewsTab'

// ─── Expert profile type (returned when user is Trainer/Nutritionist) ───
interface ExpertProfileData {
  primaryTitle: string | null
  secondaryTitle: string | null
  aboutText: string | null
  experienceYears: number | null
  slug: string
  programsCount: number
  gender: string | null
  phone: string | null
  specializations: { id: string; name: string }[]
  certificates: { id: string; title: string; issuer: string | null; year: number; fileUrl: string | null; fileName: string | null }[]
  ratingValue: number
  reviewsCount: number
}

// ─── Grid cell with like overlay ───
function GridCell({
  postId,
  onSelect,
}: {
  postId: string
  onSelect: (postId: string) => void
}) {
  const t = useTranslations('posts')
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
      partial: {
        isLikedByMe: !wasLiked,
        likeCount: wasLiked ? prevCount - 1 : prevCount + 1,
      },
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
    } catch (error) {
      if (isMountedRef.current) {
        setIsLiked(wasLiked)
        setLikeCount(prevCount)
        dispatch({
          type: 'UPDATE_POST',
          postId,
          partial: { isLikedByMe: wasLiked, likeCount: prevCount },
        })
      }
      console.error('Failed to update like:', error)
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
        <p className="text-[10px] text-gray-600 leading-tight">{t('postDeleted')}</p>
      </div>
    )
  }

  if (!media) return null

  return (
    <div
      className="relative aspect-square bg-background overflow-hidden group cursor-pointer"
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
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            doLike()
          }}
          disabled={isLikeLoading}
          className={`flex items-center gap-1 text-foreground transition-all hover:scale-110 ${
            isLikeLoading ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500'
          }`}
          title={isLiked ? t('removeLike') : t('addLike')}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${isLiked ? 'text-red-500' : ''}`}
            fill={isLiked ? 'currentColor' : 'white'}
          />
          <span className="font-semibold">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(postId)
          }}
          className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-blue-400"
          title={t('openComments')}
        >
          <MessageCircle className="w-5 h-5" fill="white" />
          <span className="font-semibold">{commentCount}</span>
        </button>
      </div>
    </div>
  )
}

// ─── Post detail modal ───
function PostDetailModal({
  postId,
  onClose,
}: {
  postId: string
  onClose: () => void
}) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-foreground/70 hover:text-foreground transition-colors"
      >
        <X className="w-8 h-8" />
      </button>
      <div
        className="w-fit max-w-full rounded-xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <PostCard
          postId={postId}
          variant="modal"
          playingVideoId={playingVideoId}
          onVideoToggle={setPlayingVideoId}
          onPhotoClick={(url: string, caption?: string) => setViewingPhoto({ url, caption })}
        />
      </div>
      {viewingPhoto && (
        <PhotoLightbox
          imageUrl={viewingPhoto.url}
          caption={viewingPhoto.caption}
          onClose={() => setViewingPhoto(null)}
        />
      )}
    </div>
  )
}

// ─── Main public profile component ───
interface PublicProfileContentProps {
  /** Route identifier: nickname slug (preferred) or legacy UUID */
  profileIdentifier: string
  /** The ID of the currently logged-in user */
  currentUserId: string | undefined
  /** Base path for the current viewer's section (e.g. '/user', '/trainer', '/nutritionist') */
  basePath: string
  /** Redirect path when viewing own profile */
  ownProfilePath: string
}

export function PublicProfileContent({
  profileIdentifier,
  currentUserId,
  basePath,
  ownProfilePath,
}: PublicProfileContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const upsertPosts = useUpsertPosts()
  const tPosts = useTranslations('posts')
  const tc = useTranslations('common')
  const tp = useTranslations('profile')
  const tUp = useTranslations('userProfile')
  const tExp = useTranslations('experts')

  // Tab state from URL
  const tabParam = (searchParams.get('tab') || 'all') as ProfilePostTab
  const [activeTab, setActiveTab] = useState<ProfilePostTab>(
    ['all', 'videos', 'reposts'].includes(tabParam) ? tabParam : 'all'
  )

  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  /** Top-level profile tab. "about" only used when the viewed user is an expert. */
  const [mainTab, setMainTab] = useState<'posts' | 'reviews' | 'about' | 'injuries' | 'achievements'>('posts')
  const observerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const isRefreshingPosts = isLoading && page === 1 && postIds.length > 0

  // ─── Fetch user profile from API ───
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<{
    id: string
    slug: string | null
    fullName: string
    firstName: string
    avatarUrl: string | null
    bannerUrl: string | null
    role: string | null
    country: string | null
    city: string | null
    createdAt: string | null
    followingCount: number
    followersCount: number
    achievementsCount: number
    postsCount: number
    expertProfile: ExpertProfileData | null
  } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileReloadVersion, setProfileReloadVersion] = useState(0)
  const [selectedCertificate, setSelectedCertificate] = useState<{ fileUrl: string; title: string } | null>(null)
  const [studentMedicalInfo, setStudentMedicalInfo] = useState<{ hasInjuries: boolean; injuryDocUrl?: string | null } | null>(null)

  useEffect(() => {
    // Defensive reset: route transitions after full-screen overlays can leave body scroll locked.
    document.body.style.overflow = ''
    document.documentElement.style.overflow = ''
  }, [])

  useEffect(() => {
    if (!profileIdentifier) return
    let cancelled = false
    ;(async () => {
      try {
        setProfileLoading(true)
        const encodedIdentifier = encodeURIComponent(profileIdentifier)
        const response = await fetchWithAuth(`${API_URL}/users/${encodedIdentifier}/profile`)
        if (response.ok && !cancelled) {
          const data = await response.json()
          setResolvedUserId(data.id)
          setProfileData({
            id: data.id,
            slug: data.slug || null,
            fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || tc('user'),
            firstName: data.firstName || '',
            avatarUrl: data.avatarUrl || null,
            bannerUrl: data.bannerUrl || null,
            role: data.role || null,
            country: data.country || null,
            city: data.city || null,
            createdAt: data.createdAt || null,
            followingCount: data.followingCount ?? 0,
            followersCount: data.followersCount ?? 0,
            achievementsCount: data.achievementsCount ?? 0,
            postsCount: data.postsCount ?? 0,
            expertProfile: data.expertProfile || null,
          })
        }
      } catch (err) {
        console.error('Failed to load user profile:', err)
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [profileIdentifier, tc, profileReloadVersion])

  const authorName = profileData?.fullName || tc('user')
  const authorInitials = (profileData?.firstName?.charAt(0) || authorName?.charAt(0) || 'U').toUpperCase()
  const authorAvatar = profileData?.avatarUrl ? getMediaUrl(profileData.avatarUrl) : null
  const authorBanner = profileData?.bannerUrl ? getMediaUrl(profileData.bannerUrl) : null
  const profileAccent = getAccentColorsByRole(profileData?.role)
  const localizedCountry = localizeCountryName(profileData?.country, language)
  const localizedCity = localizeCityName(profileData?.city, profileData?.country, language)

  /** Accent role for the Tabs component (matches the viewed user's role). */
  const accentRole: AccentRole = (() => {
    const r = String(profileData?.role ?? '').toLowerCase()
    if (r === 'trainer' || r === '1') return 'trainer'
    if (r === 'nutritionist' || r === '3') return 'nutritionist'
    return 'user'
  })()
  const isExpert = Boolean(profileData?.expertProfile)
  // Reset to a safe tab when switching between expert/non-expert profiles
  useEffect(() => {
    if (!isExpert && mainTab === 'about') setMainTab('posts')
  }, [isExpert, mainTab])

  // Redirect to own profile if viewing self
  useEffect(() => {
    if (currentUserId && resolvedUserId && resolvedUserId.toLowerCase() === currentUserId.toLowerCase()) {
      router.replace(ownProfilePath)
    }
  }, [currentUserId, resolvedUserId, router, ownProfilePath])

  // Redirect legacy UUID / stale identifier routes to canonical slug route when available.
  useEffect(() => {
    if (!profileData?.slug) return

    const requested = profileIdentifier.toLowerCase()
    const canonical = profileData.slug.toLowerCase()
    if (requested === canonical) return

    const query = searchParams.toString()
    const suffix = query ? `?${query}` : ''
    router.replace(`${basePath}/profile/${profileData.slug}${suffix}`)
  }, [profileData?.slug, profileIdentifier, searchParams, router, basePath])

  const targetUserId = resolvedUserId

  useEffect(() => {
    if (basePath !== '/trainer' || !targetUserId || !currentUserId || targetUserId.toLowerCase() === currentUserId.toLowerCase()) {
      setStudentMedicalInfo(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const data = await studentsApi.getStudentMedicalInfo(targetUserId)
        if (!cancelled) {
          setStudentMedicalInfo(data)
        }
      } catch {
        if (!cancelled) {
          setStudentMedicalInfo(null)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [basePath, targetUserId, currentUserId])

  // ─── Relationship status ───
  const [relationship, setRelationship] = useState<RelationshipStatus | null>(null)
  const [relationshipLoading, setRelationshipLoading] = useState(true)
  const [relationshipReloadVersion, setRelationshipReloadVersion] = useState(0)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  useEffect(() => {
    if (!targetUserId || !currentUserId || targetUserId.toLowerCase() === currentUserId.toLowerCase()) return
    let cancelled = false
    ;(async () => {
      try {
        setRelationshipLoading(true)
        const status = await friendsApi.getRelationshipStatus(targetUserId)
        if (!cancelled) setRelationship(status)
      } catch (err) {
        console.error('Failed to load relationship status:', err)
      } finally {
        if (!cancelled) setRelationshipLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [targetUserId, currentUserId, relationshipReloadVersion])

  // ─── Social actions ───

  const handleFollow = useCallback(async () => {
    if (!targetUserId) return
    if (actionLoading) return
    setActionLoading(true)
    try {
      await followsApi.followTrainer(targetUserId)
      setRelationship(prev => prev ? { ...prev, isFollowing: true } : prev)
      setToast({ message: tUp('nowFollowing'), type: 'success' })
    } catch (err) {
      setToast({ message: tUp('errorFollowing'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [targetUserId, actionLoading, tUp])

  const handleUnfollow = useCallback(async () => {
    if (!targetUserId) return
    if (actionLoading) return
    setActionLoading(true)
    try {
      await followsApi.unfollowTrainer(targetUserId)
      setRelationship(prev => prev ? { ...prev, isFollowing: false } : prev)
      setToast({ message: tUp('unfollowed'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorUnfollowing'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [targetUserId, actionLoading, tUp])

  const handleBlock = useCallback(async () => {
    if (!targetUserId) return
    if (actionLoading) return
    setActionLoading(true)
    try {
      await blocksApi.blockUser(targetUserId)
      setRelationship(prev => prev ? { ...prev, isBlocked: true } : prev)
      setToast({ message: tUp('userBlocked'), type: 'info' })
    } catch (err) {
      setToast({ message: tUp('errorBlocking'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [targetUserId, actionLoading, tUp])

  const handleUnblock = useCallback(async () => {
    if (!targetUserId) return
    if (actionLoading) return
    setActionLoading(true)
    try {
      await blocksApi.unblockUser(targetUserId)
      setRelationship(prev => prev ? { ...prev, isBlocked: false } : prev)
      setToast({ message: tUp('userUnblocked'), type: 'success' })
    } catch (err) {
      setToast({ message: tUp('errorUnblocking'), type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }, [targetUserId, actionLoading, tUp])

  // ─── Posts loading ───
  const loadPosts = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        setIsLoading(true)
        if (!targetUserId) return
        const response = await postsApi.getUserPosts(targetUserId, pageNum, 12, activeTab, controller.signal)
        if (controller.signal.aborted) return
        const ids = upsertPosts(response.posts)
        if (append) {
          setPostIds((prev) => [...prev, ...ids])
        } else {
          setPostIds(ids)
        }
        setTotalPosts(response.totalCount)
        setHasMore(response.hasMore)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        console.error('Failed to load user posts:', error)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    },
    [targetUserId, upsertPosts, activeTab]
  )

  const handleTabChange = useCallback((tab: ProfilePostTab) => {
    setActiveTab(tab)
    setPage(1)
    setHasMore(true)
    setIsLoading(true)
    const url = new URL(window.location.href)
    if (tab === 'all') {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', tab)
    }
    window.history.replaceState({}, '', url.toString())
  }, [])

  useEffect(() => {
    if (targetUserId) loadPosts(1)
  }, [targetUserId, loadPosts])

  useRealtimeScopeRefresh(['posts', 'friends', 'follows', 'profile'], () => {
    if (targetUserId) {
      loadPosts(1)
      setProfileReloadVersion(v => v + 1)
      setRelationshipReloadVersion(v => v + 1)
    }
  })

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && postIds.length > 0) {
      const nextPage = page + 1
      setPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoading, hasMore, page, postIds.length, loadPosts])

  const handlePhotoClick = useCallback((url: string, caption?: string) => {
    setViewingPhoto({ url, caption })
  }, [])

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore()
      },
      { threshold: 0.1 }
    )
    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [hasMore, isLoading, handleLoadMore])

  // Use the viewed user's accent color for the section icons
  const accentColor = profileAccent.primary

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: profileAccent.primary }} />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3 pb-6">
        {/* Profile Header — same shape as own profile */}
        <div className="overflow-hidden rounded-none sm:rounded-2xl">
          {/* Banner */}
          <div className={`relative h-28 sm:h-36 bg-gradient-to-br ${profileAccent.gradient} overflow-hidden`}>
            {authorBanner && (
              <img
                src={authorBanner}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Card body */}
          <div className="bg-surface-1 border-x-0 sm:border sm:border-t-0 sm:border-border-subtle rounded-b-none sm:rounded-b-2xl px-4 pb-4 sm:px-6 sm:pb-5">
            {/* Avatar + primary action row */}
            <div className="-mt-10 sm:-mt-14 flex items-end justify-between mb-3">
              <div className="relative z-10">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className={`h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-background shadow-xl ${getRoleRingClass(profileData?.role)}`}
                  />
                ) : (
                  <div className={`h-20 w-20 sm:h-28 sm:w-28 rounded-full ring-4 ring-background shadow-xl bg-gradient-to-br ${profileAccent.gradient} flex items-center justify-center`}>
                    <span className="text-2xl sm:text-3xl font-bold text-white">{authorInitials}</span>
                  </div>
                )}
              </div>

              {/* Top-right primary actions (Follow / Message / Block) */}
              {!relationshipLoading && relationship && !relationship.isBlockedByThem && (
                <div className="flex items-center gap-2">
                  {relationship.isFollowing ? (
                    <button
                      onClick={handleUnfollow}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold ring-1 ring-inset ring-border bg-surface-2 text-foreground hover:bg-surface-3 hover:text-red-500 hover:ring-red-500/30 active:scale-95 transition-[background-color,box-shadow] duration-200 ease-out-expo disabled:opacity-50"
                    >
                      <span>{tUp('following')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleFollow}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${profileAccent.primary}, ${profileAccent.secondary})` }}
                    >
                      <span>{tUp('follow')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!targetUserId) return
                      router.push(`${basePath}/messages?userId=${targetUserId}`)
                    }}
                    disabled={!targetUserId}
                    className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold ring-1 ring-inset ring-border bg-surface-2 text-foreground hover:bg-surface-3 hover:ring-border-strong active:scale-95 transition-[background-color,box-shadow] duration-200 ease-out-expo disabled:opacity-50"
                    aria-label={tUp('message')}
                  >
                    <Mail className="w-4 h-4" />
                    <span className="hidden xs:inline sm:inline">{tUp('message')}</span>
                  </button>
                  {relationship.isBlocked ? (
                    <button
                      onClick={handleUnblock}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-red-500/10 ring-1 ring-inset ring-red-500/20 text-red-500 hover:bg-red-500/15 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      <span className="hidden sm:inline">{tUp('unblock')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleBlock}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-red-500 hover:ring-red-500/30 active:scale-95 transition-all disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      <span className="hidden sm:inline">{tUp('block')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Name + rating pill */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none truncate">{authorName}</h1>
              {profileData?.expertProfile && profileData.expertProfile.ratingValue > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-surface-2 ring-1 ring-inset ring-border-subtle">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-foreground tabular-nums">{profileData.expertProfile.ratingValue.toFixed(1)}</span>
                </span>
              )}
              {relationship?.isFriend && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 text-emerald-500">
                  {tUp('friends')}
                </span>
              )}
            </div>

            {/* Location / joined */}
            {(profileData?.country || profileData?.city || profileData?.createdAt) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
                {(profileData?.country || profileData?.city) && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    {[localizedCity, localizedCountry].filter(Boolean).join(', ')}
                  </span>
                )}
                {profileData?.createdAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    {new Date(profileData.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Stats — same shape as own user profile: Workouts / Followers / Following / Achievements */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {([
                { value: 0, label: tp('workouts') },
                { value: profileData?.followersCount || 0, label: tp('followers') },
                { value: profileData?.followingCount || 0, label: tp('following') },
                { value: profileData?.achievementsCount || 0, label: tp('achievements') },
              ] as const).map(({ value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center rounded-xl py-2.5 px-1 bg-surface-2/60 dark:bg-surface-2/40 ring-1 ring-inset ring-border-subtle transition-[background-color,box-shadow] duration-200 ease-out-expo"
                >
                  <span className="text-base sm:text-lg font-bold text-foreground tabular-nums leading-none">
                    {value.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 text-center leading-none">{label}</span>
                </div>
              ))}
            </div>

            {/* Bio placeholder for spacing alignment */}
          </div>
        </div>

        {/* ─── Main Tabs (mirrors own-profile layout) ─── */}
        <Tabs
          items={[
            { value: 'posts', label: tp('posts') },
            { value: 'reviews', label: tp('reviews') },
            ...(isExpert ? [{ value: 'about', label: tExp('about') }] as const : []),
            { value: 'injuries', label: tp('injuries') },
            { value: 'achievements', label: tp('achievements') },
          ]}
          value={mainTab}
          onChange={(v) => setMainTab(v as typeof mainTab)}
          variant="underline"
          accent={accentRole}
        />

        {/* ─── Tab content ─── */}
        {mainTab === 'reviews' && isExpert && (
          <ProfileReviewsTab
            expertId={targetUserId ?? ''}
            accentText={profileAccent.text}
            accentPrimary={profileAccent.primary}
            accentSecondary={profileAccent.secondary}
          />
        )}
        {mainTab === 'reviews' && !isExpert && (
          <UserReceivedReviewsTab userId={targetUserId ?? ''} />
        )}

        {mainTab === 'about' && isExpert && profileData?.expertProfile && (
          <div className="space-y-3">
            {/* About */}
            <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
              {profileData.expertProfile.primaryTitle && (
                <p className="text-sm font-semibold mb-3" style={{ color: profileAccent.primary }}>{profileData.expertProfile.primaryTitle}</p>
              )}
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{tExp('about')}</h2>
              {profileData.expertProfile.aboutText ? (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{profileData.expertProfile.aboutText}</p>
              ) : (
                <p className="text-sm text-faint-foreground italic">{tExp('noDescription')}</p>
              )}
            </div>

            {/* Specializations */}
            <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{tExp('specializations')}</h2>
              {profileData.expertProfile.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileData.expertProfile.specializations.map((spec) => (
                    <span
                      key={spec.id}
                      className="px-3 py-1.5 rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle text-xs font-medium text-foreground"
                    >
                      {spec.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint-foreground italic">{tExp('noSpecializations')}</p>
              )}
            </div>

            {/* Certificates */}
            <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{tExp('certificates')}</h2>
              {profileData.expertProfile.certificates.length > 0 ? (
                <div className="space-y-2">
                  {profileData.expertProfile.certificates.map((cert) => (
                    <div key={cert.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle hover:ring-border transition-all">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: `linear-gradient(135deg, ${profileAccent.primary}, ${profileAccent.secondary})` }}>
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-foreground truncate">{cert.title}</h3>
                        {cert.issuer && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{cert.issuer} • {cert.year}</p>
                        )}
                        {cert.fileUrl && cert.fileName && (
                          <button
                            onClick={() => setSelectedCertificate({ fileUrl: cert.fileUrl!, title: cert.title })}
                            className="text-xs font-medium hover:underline mt-1.5 inline-block"
                            style={{ color: profileAccent.primary }}
                          >
                            {tExp('viewCertificate')}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-faint-foreground italic">{tExp('noCertificates')}</p>
              )}
            </div>
          </div>
        )}

        {mainTab === 'injuries' && (
          basePath === '/trainer' && studentMedicalInfo ? (
            <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{tp('medicalInfo')}</h2>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{tp('hasExistingInjuries')}:</span>{' '}
                  {studentMedicalInfo.hasInjuries ? tp('yes') : tp('no')}
                </div>
                {studentMedicalInfo.hasInjuries && studentMedicalInfo.injuryDocUrl ? (
                  <a
                    href={getMediaUrl(studentMedicalInfo.injuryDocUrl) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-sm font-medium ${profileAccent.text} hover:underline`}
                  >
                    <FileText className="w-4 h-4" />
                    {tp('viewMedicalCertificate')}
                  </a>
                ) : studentMedicalInfo.hasInjuries ? (
                  <p className="text-sm text-faint-foreground italic">{tp('noMedicalCertificate')}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                <ShieldAlert className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">{tp('noInjuries')}</p>
              <p className="text-sm text-muted-foreground mt-1">{tp('injuriesDescription')}</p>
            </div>
          )
        )}

        {mainTab === 'achievements' && (
          <div className="rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-16 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
              <Trophy className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              {(profileData?.achievementsCount ?? 0) > 0
                ? tp('achievements') + ': ' + (profileData?.achievementsCount ?? 0)
                : tp('noAchievements')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{tp('achievementsWillAppear')}</p>
          </div>
        )}

        {/* Posts Section */}
        {mainTab === 'posts' && (
        <div className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
          <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4" style={{ color: accentColor }} />
              <h3 className="font-semibold text-sm text-foreground">{tPosts('postsTab')}</h3>
              {totalPosts > 0 && (
                <span className="text-xs text-faint-foreground tabular-nums">({totalPosts})</span>
              )}
            </div>
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-2 p-0.5 ring-1 ring-inset ring-border-subtle">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-surface-1 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={viewMode === 'grid' ? { color: accentColor } : undefined}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-surface-1 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={viewMode === 'list' ? { color: accentColor } : undefined}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Post type tabs */}
          <ProfilePostTabs activeTab={activeTab} onTabChange={handleTabChange} />

          <div className="relative min-h-[280px]">
            {postIds.length === 0 && !isLoading ? (
              <div className="py-16 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                  <Camera className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">{tPosts('noPublications')}</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div>
                <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3">
                  {postIds.map((id) => (
                    <GridCell key={id} postId={id} onSelect={setSelectedPostId} />
                  ))}
                </div>
                {!isRefreshingPosts && (isLoading || hasMore) && (
                  <div ref={observerRef} className="py-8 flex justify-center">
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {postIds.map((id) => (
                  <PostCard
                    key={id}
                    postId={id}
                    playingVideoId={playingVideoId === id ? id : null}
                    onVideoToggle={setPlayingVideoId}
                    onPhotoClick={handlePhotoClick}
                  />
                ))}
                {!isRefreshingPosts && (isLoading || hasMore) && (
                  <div ref={observerRef} className="py-8 flex justify-center">
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" style={{ color: accentColor }} />}
                  </div>
                )}
              </div>
            )}

            {isRefreshingPosts && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface-1/80 backdrop-blur-[1px]">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: accentColor }} />
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
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
      {/* Certificate Modal */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCertificate(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-surface-2 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border-subtle">
              <h3 className="text-foreground font-semibold">{selectedCertificate.title}</h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <img
                src={getMediaUrl(selectedCertificate.fileUrl) || ''}
                alt={selectedCertificate.title}
                className="w-full h-auto rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
