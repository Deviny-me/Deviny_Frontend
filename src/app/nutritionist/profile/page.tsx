'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { 
  MapPin,
  Link as LinkIcon,
  Users,
  BookOpen,
  Star,
  Calendar,
  TrendingUp,
  Heart,
  MessageCircle,
  X,
  Loader2,
  Upload,
  Plus,
  Trash2,
  Award,
  Globe,
  User,
  Briefcase,
  Copy,
  Check,
  Grid,
  List,
  Play,
  Repeat2,
  Settings,
} from 'lucide-react'
import {
  fetchNutritionistProfile,
  uploadCertificate,
  deleteCertificate,
  addSpecialization,
  deleteSpecialization,
} from '@/lib/api/nutritionistProfileApi'
import { TrainerProfileResponse, CertificateDto, SpecializationDto } from '@/types/trainerProfile'
import { postsApi } from '@/lib/api/postsApi'
import { useLanguage } from '@/components/language/LanguageProvider'
import { localizeCityName, localizeCountryName } from '@/lib/data/countries'
import { MediaType } from '@/types/post'
import type { ProfilePostTab } from '@/types/post'
import { getMediaUrl } from '@/lib/config'
import { PostCard } from '@/components/posts/PostCard'
import { ProfilePostTabs } from '@/components/posts/ProfilePostTabs'
import { PhotoLightbox } from '@/components/ui/PhotoLightbox'
import { Toast } from '@/components/ui/Toast'
import { useUpsertPosts, usePost, usePostDispatch } from '@/contexts/PostStoreContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { ProfileReviewsTab } from '@/components/shared/ProfileReviewsTab'
import { Tabs } from '@/components/ui/Tabs'
import { getIcon, getToneGradient } from '@/components/shared/achievementUtils'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

// ─── Grid cell with optimistic likes ───
function NutritionistGridCell({
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
  const tp = useTranslations('posts')
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
      <div className="relative aspect-square bg-background overflow-hidden rounded-lg flex flex-col items-center justify-center text-center p-2">
        <Repeat2 className="w-6 h-6 text-gray-600 mb-1" />
        <p className="text-[10px] text-gray-600 leading-tight">{tp('postDeleted')}</p>
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
          className="flex items-center gap-1 text-foreground transition-all hover:scale-110 hover:text-green-400"
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

// ─── Post detail modal (nutritionist) ───
function NutritionistPostDetailModal({ postId, onClose, onDelete, deletingPostId }: { postId: string; onClose: () => void; onDelete?: (postId: string) => void; deletingPostId?: string | null }) {
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

export default function NutritionistProfilePage() {
  const t = useTranslations('profile')
  const tp = useTranslations('posts')
  const tc = useTranslations('common')
  const { language } = useLanguage()
  const { user } = useAuth()
  const accent = useAccentColors()
  const upsertPosts = useUpsertPosts()
  const storeDispatch = usePostDispatch()

  const [profile, setProfile] = useState<TrainerProfileResponse | null>(null)
  const [postIds, setPostIds] = useState<string[]>([])
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [postsPage, setPostsPage] = useState(1)
  const [postsHasMore, setPostsHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [postTab, setPostTab] = useState<ProfilePostTab>('all')
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)
  const [viewingPhoto, setViewingPhoto] = useState<{ url: string; caption?: string } | null>(null)
  const postsObserverRef = useRef<HTMLDivElement>(null)
  const postsAbortRef = useRef<AbortController | null>(null)
  const isRefreshingPosts = isLoadingPosts && postsPage === 1 && postIds.length > 0
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'certificates' | 'specializations' | 'achievements' | 'reviews'>('posts')
  
  // Content modals
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [showSpecializationModal, setShowSpecializationModal] = useState(false)
  const [viewingCertificate, setViewingCertificate] = useState<string | null>(null)
  
  // Form states
  const [certTitle, setCertTitle] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [certYear, setCertYear] = useState(new Date().getFullYear().toString())
  const [certFile, setCertFile] = useState<File | null>(null)
  const [specName, setSpecName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [toastData, setToastData] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadProfile = async () => {
    try {
      setLoading(true)
      const data = await fetchNutritionistProfile()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
      setToastData({ message: t('toasts.profileLoadError'), type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    if (postsAbortRef.current) postsAbortRef.current.abort()
    const controller = new AbortController()
    postsAbortRef.current = controller

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
      setPostsHasMore(response.hasMore)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Failed to load posts:', error)
    } finally {
      if (!controller.signal.aborted) setIsLoadingPosts(false)
    }
  }, [postTab, upsertPosts])

  const handlePostTabChange = useCallback((tab: ProfilePostTab) => {
    setPostTab(tab)
    setPostsPage(1)
    setPostsHasMore(true)
    setIsLoadingPosts(true)
  }, [])

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    loadPosts(1)
  }, [loadPosts])

  useRealtimeScopeRefresh(['profile', 'posts'], () => {
    loadProfile()
    loadPosts(1)
  })

  const handleLoadMorePosts = useCallback(() => {
    if (!isLoadingPosts && postsHasMore && postIds.length > 0) {
      const nextPage = postsPage + 1
      setPostsPage(nextPage)
      loadPosts(nextPage, true)
    }
  }, [isLoadingPosts, postsHasMore, postsPage, postIds.length, loadPosts])

  useEffect(() => {
    if (!postsHasMore || isLoadingPosts || activeTab !== 'posts') return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) handleLoadMorePosts() },
      { threshold: 0.1 }
    )
    if (postsObserverRef.current) observer.observe(postsObserverRef.current)
    return () => observer.disconnect()
  }, [postsHasMore, isLoadingPosts, handleLoadMorePosts, activeTab])


  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!certFile || !certTitle) {
      setToastData({ message: t('toasts.fillRequiredFields'), type: 'error' })
      return
    }

    try {
      setSaving(true)
      await uploadCertificate(certTitle, certIssuer, parseInt(certYear), certFile)
      setToastData({ message: t('toasts.certificateAdded'), type: 'success' })
      setShowCertificateModal(false)
      setCertTitle('')
      setCertIssuer('')
      setCertYear(new Date().getFullYear().toString())
      setCertFile(null)
      loadProfile()
    } catch (error) {
      console.error('Failed to add certificate:', error)
      setToastData({ message: t('toasts.certificateAddError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCertificate = async (id: string) => {
    if (!confirm(t('toasts.deleteCertificateConfirm'))) return
    
    try {
      setDeleting(id)
      await deleteCertificate(id)
      setToastData({ message: t('toasts.certificateDeleted'), type: 'success' })
      loadProfile()
    } catch (error) {
      console.error('Failed to delete certificate:', error)
      setToastData({ message: t('toasts.certificateDeleteError'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const handleAddSpecialization = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!specName.trim()) {
      setToastData({ message: t('toasts.enterSpecializationName'), type: 'error' })
      return
    }

    try {
      setSaving(true)
      await addSpecialization(specName)
      setToastData({ message: t('toasts.specializationAdded'), type: 'success' })
      setShowSpecializationModal(false)
      setSpecName('')
      loadProfile()
    } catch (error) {
      console.error('Failed to add specialization:', error)
      setToastData({ message: t('toasts.specializationAddError'), type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSpecialization = async (id: string) => {
    try {
      setDeleting(id)
      await deleteSpecialization(id)
      setToastData({ message: t('toasts.specializationDeleted'), type: 'success' })
      loadProfile()
    } catch (error) {
      console.error('Failed to delete specialization:', error)
      setToastData({ message: t('toasts.specializationDeleteError'), type: 'error' })
    } finally {
      setDeleting(null)
    }
  }

  const handleCopyLink = async () => {
    if (profile?.trainer?.profilePublicUrl) {
      try {
        await navigator.clipboard.writeText(profile.trainer.profilePublicUrl)
        setCopied(true)
        setToastData({ message: t('toasts.linkCopied'), type: 'success' })
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!confirm(tp('deleteConfirm'))) {
      return
    }

    try {
      setDeletingPostId(postId)
      console.log('[Delete] Attempting to delete post:', postId, 'userId:', user?.id)
      await postsApi.deletePost(postId)
      console.log('[Delete] Post deleted successfully:', postId)
      storeDispatch({ type: 'REMOVE_POST', postId })
      setPostIds(prev => prev.filter(id => id !== postId))
      setSelectedPostId(null)
      setToastData({ message: tp('deleted'), type: 'success' })
    } catch (error) {
      console.error('[Delete] Failed to delete post:', postId, error)
      const message = error instanceof Error ? error.message : tp('deleteError')
      setToastData({ message, type: 'error' })
    } finally {
      setDeletingPostId(null)
    }
  }, [storeDispatch, tp, user?.id])

  const handleRepostSuccess = useCallback(() => {
    loadPosts(1)
  }, [loadPosts])

  const handlePhotoClick = useCallback((url: string, caption?: string) => {
    setViewingPhoto({ url, caption })
  }, [])

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center py-24">
          <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <div className="text-center py-24">
          <p className="text-muted-foreground">{t('toasts.profileLoadError')}</p>
        </div>
      </>
    )
  }

  const { trainer, about, certificates, achievements = [], specializations } = profile
  const localizedCountry = localizeCountryName(trainer.country, language)
  const localizedCity = localizeCityName(trainer.city, trainer.country, language)

  return (
    <>
      <div className="space-y-3 pb-24">
        {/* ─── Profile Hero (user-style) ─── */}
        <div className="overflow-hidden rounded-none sm:rounded-2xl">
          {/* Banner */}
          <div className={`relative h-28 sm:h-36 bg-gradient-to-br ${accent.gradient} overflow-hidden`}>
            {trainer.bannerUrl && (
              <img
                src={getMediaUrl(trainer.bannerUrl) || ''}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </div>

          {/* Card body */}
          <div className="bg-surface-1 border-x-0 sm:border sm:border-t-0 sm:border-border-subtle rounded-b-none sm:rounded-b-2xl px-4 pb-4 sm:px-6 sm:pb-5">
            {/* Avatar + Settings row */}
            <div className="-mt-10 sm:-mt-14 flex items-end justify-between mb-3">
              <div className="relative z-10">
                {trainer.avatarUrl ? (
                  <img
                    src={getMediaUrl(trainer.avatarUrl) || ''}
                    alt={trainer.fullName}
                    className="h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover ring-4 ring-background shadow-xl"
                  />
                ) : (
                  <div className={`h-20 w-20 sm:h-28 sm:w-28 rounded-full ring-4 ring-background shadow-xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {trainer.initials}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href="/nutritionist/profile/settings"
                className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold ring-1 ring-inset ring-border bg-surface-2 text-foreground hover:bg-surface-3 hover:ring-border-strong transition-[background-color,box-shadow] duration-200 ease-out-expo"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">{t('profileSettings')}</span>
              </Link>
            </div>

            {/* Name + Role badge + Rating */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-none">
                {trainer.fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#28bf68]/10 text-[#28bf68] ring-1 ring-inset ring-[#28bf68]/20">
                <Briefcase className="w-3 h-3" />
                {t('personalNutritionist')}
              </span>
              {trainer.ratingValue > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/10 text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
                  <Star className="w-3 h-3 fill-yellow-500" />
                  {trainer.ratingValue.toFixed(1)} · {trainer.reviewsCount}
                </span>
              )}
            </div>

            {/* Location */}
            {(localizedCity || localizedCountry || trainer.location) && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {trainer.location || [localizedCity, localizedCountry].filter(Boolean).join(', ')}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {([
                { value: trainer.programsCount, label: t('programs') },
                { value: trainer.studentsCount, label: t('students') },
                { value: trainer.ratingValue.toFixed(1), label: `${trainer.reviewsCount} ${t('reviews')}` },
                { value: trainer.achievementsCount, label: t('achievements') },
              ] as const).map(({ value, label }) => (
                <div
                  key={label}
                  className="group flex flex-col items-center justify-center rounded-xl py-2.5 px-1 bg-surface-2/60 dark:bg-surface-2/40 ring-1 ring-inset ring-border-subtle hover:bg-[#28bf68]/10 hover:ring-[#28bf68]/25 transition-[background-color,box-shadow] duration-200 ease-out-expo"
                >
                  <span className="text-base sm:text-lg font-bold text-foreground group-hover:text-[#28bf68] transition-colors tabular-nums leading-none">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 text-center leading-none">{label}</span>
                </div>
              ))}
            </div>

            {/* Bio */}
            {about?.text && (
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-border-subtle pt-3 whitespace-pre-line">
                {about.text}
              </p>
            )}
          </div>
        </div>

        {/* Experience */}
        {trainer.experienceYears !== null && trainer.experienceYears !== undefined && (
          <div className="bg-surface-1/45 p-3 sm:rounded-xl sm:border sm:border-border-subtle sm:bg-surface-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs">{t('experience')}</span>
            </div>
            <p className="text-foreground text-sm font-medium">{trainer.experienceYears} {trainer.experienceYears === 1 ? t('yearSingular') : trainer.experienceYears < 5 ? t('yearFew') : t('yearMany')}</p>
          </div>
        )}

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="bg-surface-1/45 p-3 sm:rounded-xl sm:border sm:border-border-subtle sm:bg-surface-1 sm:p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">{t('specializations')}</h3>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <span
                  key={spec.id}
                  className={`rounded-lg border ${accent.borderMuted} bg-gradient-to-r ${accent.gradientBg10} px-3 py-1.5 text-sm text-muted-foreground`}
                >
                  {spec.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Achievements Preview */}
        {achievements.length > 0 && (
          <div className="bg-surface-1/45 p-3 sm:rounded-xl sm:border sm:border-border-subtle sm:bg-surface-1 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground">{t('achievements')}</h3>
              <span className="text-xs text-faint-foreground">{achievements.length} {tc('total')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.slice(0, 6).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
                    achievement.tone === 'gold' 
                      ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
                      : achievement.tone === 'silver'
                      ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30'
                      : 'bg-white/5 border border-border'
                  }`}
                >
                  <Award className={`w-4 h-4 ${
                    achievement.tone === 'gold' ? 'text-amber-400' : 
                    achievement.tone === 'silver' ? 'text-muted-foreground' : 'text-faint-foreground'
                  }`} />
                  <div>
                    <p className={`text-sm font-medium ${
                      achievement.tone === 'gold' ? 'text-amber-300' : 
                      achievement.tone === 'silver' ? 'text-muted-foreground' : 'text-muted-foreground'
                    }`}>
                      {achievement.title}
                    </p>
                    {achievement.subtitle && (
                      <p className="text-xs text-faint-foreground">{achievement.subtitle}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          items={[
            { value: 'posts', label: t('posts') },
            { value: 'reviews', label: t('reviews') },
            { value: 'certificates', label: t('certificates') },
            { value: 'specializations', label: t('specializations') },
            { value: 'achievements', label: t('achievements') },
          ]}
          value={activeTab}
          onChange={(v) => setActiveTab(v as typeof activeTab)}
          variant="underline"
          accent="nutritionist"
        />

        {/* Content */}
        {activeTab === 'posts' && (
          <div className="overflow-hidden bg-surface-2/35 sm:rounded-xl sm:border sm:border-border sm:bg-surface-3">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Grid className={`w-5 h-5 ${accent.text}`} />
                <h3 className="font-semibold text-foreground">{t('publications')}</h3>
                {totalPosts > 0 && <span className="text-xs text-faint-foreground">({totalPosts})</span>}
              </div>
              <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? `bg-white/10 ${accent.text}` : 'text-faint-foreground hover:text-muted-foreground'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? `bg-white/10 ${accent.text}` : 'text-faint-foreground hover:text-muted-foreground'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ProfilePostTabs activeTab={postTab} onTabChange={handlePostTabChange} disabled={isLoadingPosts} />

            <div className="relative">
              {postIds.length === 0 && !isLoadingPosts ? (
                <div className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('noPosts')}</p>
                  <p className="text-sm text-faint-foreground mt-1">{t('createFirstPost')}</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div>
                  <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-3">
                    {postIds.map((id) => (
                      <NutritionistGridCell key={id} postId={id} onSelect={setSelectedPostId} onDelete={handleDeletePost} deletingPostId={deletingPostId === id ? id : null} />
                    ))}
                  </div>
                  {!isRefreshingPosts && (isLoadingPosts || postsHasMore) && (
                    <div ref={postsObserverRef} className="py-8 flex justify-center">
                      {isLoadingPosts && <Loader2 className={`w-6 h-6 ${accent.text} animate-spin`} />}
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
                  {!isRefreshingPosts && (isLoadingPosts || postsHasMore) && (
                    <div ref={postsObserverRef} className="py-8 flex justify-center">
                      {isLoadingPosts && <Loader2 className={`w-6 h-6 ${accent.text} animate-spin`} />}
                    </div>
                  )}
                </div>
              )}

              {isRefreshingPosts && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface-3/72 backdrop-blur-[1px]">
                  <Loader2 className={`w-7 h-7 ${accent.text} animate-spin`} />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowCertificateModal(true)}
              className={`w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-muted-foreground hover:text-foreground ${accent.hoverBorder} transition-colors flex items-center justify-center gap-2`}
            >
              <Upload className="w-5 h-5" />
              {t('addCertificate')}
            </button>
            
            {certificates.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="bg-surface-3 rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{cert.title}</h4>
                        {cert.issuer && <p className="text-sm text-muted-foreground">{cert.issuer}</p>}
                        <p className="text-xs text-faint-foreground">{cert.year}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCertificate(cert.id)}
                        disabled={deleting === cert.id}
                        className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        {deleting === cert.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {cert.fileUrl && (
                      <button 
                        onClick={() => setViewingCertificate(getMediaUrl(cert.fileUrl) || '')}
                        className={`text-xs ${accent.text} hover:underline`}
                      >
                        {t('viewFile')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noCertificates')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specializations' && (
          <div className="space-y-4">
            <button
              onClick={() => setShowSpecializationModal(true)}
              className={`w-full py-4 border-2 border-dashed border-white/20 rounded-xl text-muted-foreground hover:text-foreground ${accent.hoverBorder} transition-colors flex items-center justify-center gap-2`}
            >
              <Plus className="w-5 h-5" />
              {t('addSpecialization')}
            </button>
            
            {specializations.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {specializations.map((spec) => (
                  <div 
                    key={spec.id} 
                    className="px-4 py-2 bg-surface-3 rounded-xl border border-border flex items-center gap-2"
                  >
                    <span className="text-foreground">{spec.name}</span>
                    <button
                      onClick={() => handleDeleteSpecialization(spec.id)}
                      disabled={deleting === spec.id}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      {deleting === spec.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('noSpecializations')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
                {achievements.map((achievement) => {
                  const Icon = getIcon(achievement.iconKey)
                  const gradient = getToneGradient(achievement.tone)
                  const isGold = achievement.tone === 'gold'
                  return (
                    <div
                      key={achievement.id}
                      className={`group relative flex flex-col items-center rounded-2xl bg-surface-1 ring-1 ring-inset p-4 text-center transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 ${
                        isGold
                          ? 'ring-yellow-500/40 shadow-[0_0_20px_0px_rgba(234,179,8,0.18)]'
                          : 'ring-border-subtle'
                      }`}
                    >
                      <div
                        className={`mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br ${gradient}`}
                      >
                        <Icon className="h-6 w-6 drop-shadow-sm" />
                      </div>
                      <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-foreground">
                        {achievement.title}
                      </h4>
                      {achievement.subtitle && (
                        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                          {achievement.subtitle}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-4">
                  <Award className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t('noAchievements')}</p>
                <p className="text-sm text-faint-foreground mt-1">{t('achievementsWillAppear')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <ProfileReviewsTab
            expertId={trainer.userId}
            accentText={accent.text}
            accentPrimary={accent.primary}
            accentSecondary={accent.secondary}
          />
        )}

        {/* Certificate Modal */}
        {showCertificateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-3 rounded-2xl border border-border w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t('addCertificate')}</h2>
                  <button onClick={() => setShowCertificateModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddCertificate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('certificateName')}</label>
                    <input
                      type="text"
                      value={certTitle}
                      onChange={(e) => setCertTitle(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                      placeholder={t('certificateNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('organization')}</label>
                    <input
                      type="text"
                      value={certIssuer}
                      onChange={(e) => setCertIssuer(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                      placeholder={t('organizationPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('year')}</label>
                    <input
                      type="number"
                      value={certYear}
                      onChange={(e) => setCertYear(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('file')}</label>
                    <label className={`flex items-center justify-center w-full py-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer ${accent.hoverBorder} transition-colors`}>
                      <Upload className="w-5 h-5 text-muted-foreground mr-2" />
                      <span className="text-sm text-muted-foreground">
                        {certFile ? certFile.name : t('selectFile')}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {tc('add')}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Specialization Modal */}
        {showSpecializationModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-3 rounded-2xl border border-border w-full max-w-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">{t('addSpecialization')}</h2>
                  <button onClick={() => setShowSpecializationModal(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleAddSpecialization} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">{t('specializations')}</label>
                    <select
                      value={specName}
                      onChange={(e) => setSpecName(e.target.value)}
                      className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.focusBorder}`}
                    >
                      <option value="">{t('selectSpecialization')}</option>
                      <option value={t('specializationOptions.strength')}>{t('specializationOptions.strength')}</option>
                      <option value={t('specializationOptions.cardio')}>{t('specializationOptions.cardio')}</option>
                      <option value={t('specializationOptions.functional')}>{t('specializationOptions.functional')}</option>
                      <option value={t('specializationOptions.crossfit')}>{t('specializationOptions.crossfit')}</option>
                      <option value={t('specializationOptions.pilates')}>{t('specializationOptions.pilates')}</option>
                      <option value={t('specializationOptions.yoga')}>{t('specializationOptions.yoga')}</option>
                      <option value={t('specializationOptions.stretching')}>{t('specializationOptions.stretching')}</option>
                      <option value={t('specializationOptions.trx')}>{t('specializationOptions.trx')}</option>
                      <option value={t('specializationOptions.boxing')}>{t('specializationOptions.boxing')}</option>
                      <option value={t('specializationOptions.martialArts')}>{t('specializationOptions.martialArts')}</option>
                      <option value={t('specializationOptions.hiit')}>{t('specializationOptions.hiit')}</option>
                      <option value={t('specializationOptions.tabata')}>{t('specializationOptions.tabata')}</option>
                      <option value={t('specializationOptions.bodybuilding')}>{t('specializationOptions.bodybuilding')}</option>
                      <option value={t('specializationOptions.powerlifting')}>{t('specializationOptions.powerlifting')}</option>
                      <option value={t('specializationOptions.weightlifting')}>{t('specializationOptions.weightlifting')}</option>
                      <option value={t('specializationOptions.rehabilitation')}>{t('specializationOptions.rehabilitation')}</option>
                      <option value={t('specializationOptions.therapeuticExercise')}>{t('specializationOptions.therapeuticExercise')}</option>
                      <option value={t('specializationOptions.prenatal')}>{t('specializationOptions.prenatal')}</option>
                      <option value={t('specializationOptions.childFitness')}>{t('specializationOptions.childFitness')}</option>
                      <option value={t('specializationOptions.seniorFitness')}>{t('specializationOptions.seniorFitness')}</option>
                      <option value={t('specializationOptions.weightLoss')}>{t('specializationOptions.weightLoss')}</option>
                      <option value={t('specializationOptions.massGain')}>{t('specializationOptions.massGain')}</option>
                      <option value={t('specializationOptions.bodyCorrection')}>{t('specializationOptions.bodyCorrection')}</option>
                      <option value={t('specializationOptions.sportPrep')}>{t('specializationOptions.sportPrep')}</option>
                      <option value={t('specializationOptions.nutrition')}>{t('specializationOptions.nutrition')}</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !specName}
                    className={`w-full py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                    {tc('add')}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Certificate Viewer Modal */}
        {viewingCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-surface-3 rounded-xl overflow-hidden"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-surface-3 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">{t('certificate')}</h2>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-hover-overlay transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <img 
                  src={viewingCertificate} 
                  alt={t('certificate')} 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </motion.div>
          </div>
        )}

      </div>

      {/* Post Detail Modal */}
      {selectedPostId && (
        <NutritionistPostDetailModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} onDelete={handleDeletePost} deletingPostId={deletingPostId} />
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
