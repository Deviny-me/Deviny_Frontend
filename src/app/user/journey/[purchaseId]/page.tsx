'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Loader2,
  Dumbbell,
  Apple,
  Video,
  Star,
  Send,
  CheckCircle2,
  PlayCircle,
  CalendarDays,
  ShieldCheck,
  MessageSquareText,
  Trophy,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { purchasesApi, PurchasedProgramDto } from '@/lib/api/purchasesApi'
import { reviewsApi } from '@/lib/api/reviewsApi'
import { getMediaUrl, MEDIA_BASE_URL } from '@/lib/config'
import { cn } from '@/lib/utils/cn'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

const journeyCopy = {
  programNotFound: 'Программа не найдена',
  completed: 'Завершено',
  inProgress: 'В процессе',
  readyForReview: 'Можно оставить отзыв',
  keepGoing: 'Продолжайте',
  viewExpertProfile: 'Открыть профиль эксперта',
  lesson: 'Урок',
  watched: 'Просмотрено',
  ready: 'Готово',
  markComplete: 'Завершить программу',
  programReview: 'Отзыв о программе',
  finishToReview: 'Завершите программу, чтобы оставить отзыв.',
  finishToReviewHint: 'Посмотрите последний урок или завершите программу вручную, когда будете готовы.',
  alreadyReviewed: 'Вы уже оставили отзыв об этой программе.',
  shareExperience: 'Поделитесь впечатлением',
  reviewSubmitted: 'Отзыв успешно отправлен.',
  submitReview: 'Отправить отзыв',
  failedSubmitReview: 'Не удалось отправить отзыв',
}

function withTimeout<T>(promise: Promise<T>, message: string, ms = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(message))
    }, ms)

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      }
    )
  })
}

function getProgramMeta(programType: PurchasedProgramDto['programType'], t: ReturnType<typeof useTranslations>) {
  if (programType === 'meal') {
    return {
      label: t('nutrition'),
      Icon: Apple,
      badge: 'bg-nutritionist-500',
      accent: 'text-nutritionist-500',
      ring: 'border-nutritionist-500/30',
      tint: 'from-nutritionist-500/20 via-transparent to-user-500/10',
    }
  }

  return {
    label: t('training'),
    Icon: Dumbbell,
    badge: 'bg-trainer-500',
    accent: 'text-trainer-500',
    ring: 'border-trainer-500/30',
    tint: 'from-trainer-500/20 via-transparent to-user-500/10',
  }
}

export default function ProgramDetailPage({
  params,
}: {
  params: { purchaseId: string }
}) {
  const { purchaseId } = params
  const t = useTranslations('journey')
  const tc = useTranslations('common')
  const router = useRouter()
  const [program, setProgram] = useState<PurchasedProgramDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [completingPurchase, setCompletingPurchase] = useState(false)
  const [watchedVideoIndexes, setWatchedVideoIndexes] = useState<Set<number>>(new Set())

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await withTimeout(purchasesApi.getMyPurchases(), t('errorLoading'))
      const found = data.find((p) => p.purchaseId === purchaseId)
      if (found) {
        setProgram(found)
      } else {
        setError(journeyCopy.programNotFound)
      }
    } catch (err) {
      console.error('Failed to fetch program:', err)
      setError(t('errorLoading'))
    } finally {
      setIsLoading(false)
    }
  }, [purchaseId, t])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  const completeProgramIfNeeded = async () => {
    if (!program || program.purchaseStatus === 'Completed' || completingPurchase) return

    try {
      setCompletingPurchase(true)
      await purchasesApi.completePurchase(program.purchaseId)
      setProgram(prev => prev ? {
        ...prev,
        purchaseStatus: 'Completed',
        canReview: true,
      } : prev)
    } catch (err) {
      console.error('Failed to mark purchase completed:', err)
    } finally {
      setCompletingPurchase(false)
    }
  }

  const handleVideoEnded = async (videoIndex: number) => {
    setWatchedVideoIndexes(prev => {
      const next = new Set(prev)
      next.add(videoIndex)
      return next
    })

    if (!program) return
    const isLastVideo = videoIndex === program.videoUrls.length - 1
    if (isLastVideo) {
      await completeProgramIfNeeded()
    }
  }

  const handleSubmitReview = async () => {
    if (!program || reviewRating === 0 || !program.canReview || program.hasReviewed) return

    setSubmittingReview(true)
    setReviewError(null)
    setReviewSuccess(false)
    try {
      await reviewsApi.createReview({
        programId: program.programId,
        programType: program.programType,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      })

      setProgram(prev => prev ? {
        ...prev,
        hasReviewed: true,
        canReview: false,
      } : prev)
      setReviewRating(0)
      setReviewComment('')
      setReviewSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : journeyCopy.failedSubmitReview
      setReviewError(message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-user-500" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="space-y-4 pb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc('back')}
        </button>
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-6 py-12 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-inset ring-red-500/20 text-red-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">{error || journeyCopy.programNotFound}</h3>
          <button
            onClick={() => router.push('/user/journey')}
            className="inline-flex h-10 items-center justify-center px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, var(--user-500, #0c8de6), var(--user-700, #0866a8))' }}
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  const meta = getProgramMeta(program.programType, t)
  const ProgramIcon = meta.Icon
  const accentColors = getAccentColorsByRole(program.programType === 'meal' ? 'nutritionist' : 'trainer')
  const completed = program.purchaseStatus === 'Completed'
  const totalVideos = program.videoUrls.length
  const watchedVideos = completed ? totalVideos : watchedVideoIndexes.size
  const progressPercent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : completed ? 100 : 0
  const canManualComplete = !completed && (totalVideos === 0 || watchedVideoIndexes.size >= totalVideos)

  return (
    <div className="space-y-5 pb-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 active:scale-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('back')}
      </button>

      <section className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
        <div className="flex flex-col lg:flex-row">
          {/* Cover image — fixed 16:9, narrower column on lg */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-3 lg:w-[420px] lg:shrink-0 lg:aspect-auto lg:self-stretch">
            {program.coverImageUrl ? (
              <img
                src={getMediaUrl(program.coverImageUrl) || ''}
                alt={program.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accentColors.primary}22, ${accentColors.secondary}11)` }}
              >
                <ProgramIcon className="h-20 w-20" style={{ color: accentColors.primary }} />
              </div>
            )}

            {/* Top-left badges */}
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-semibold text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${accentColors.primary}, ${accentColors.secondary})` }}
              >
                <ProgramIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-semibold text-white bg-black/45 ring-1 ring-inset ring-white/15 backdrop-blur-md">
                <Trophy className="h-3.5 w-3.5" />
                {completed ? journeyCopy.completed : journeyCopy.inProgress}
              </span>
            </div>

            {/* Top-right tier pill */}
            <div className="absolute top-3 right-3 inline-flex items-center rounded-full px-2.5 h-7 text-[11px] font-semibold text-white bg-black/45 ring-1 ring-inset ring-white/15 backdrop-blur-md">
              {program.tier}
            </div>
          </div>

          {/* Meta column */}
          <div className="flex flex-1 min-w-0 flex-col gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-tight">
                {program.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-foreground/85 line-clamp-4">
                {program.description}
              </p>
            </div>

            {/* Progress card */}
            <div className="mt-auto rounded-2xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('progress')}</p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold tabular-nums text-foreground">{progressPercent}%</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${progressPercent}%`, background: `linear-gradient(135deg, ${accentColors.primary}, ${accentColors.secondary})` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                <span>{watchedVideos} / {totalVideos} {tc('videos')}</span>
                <span>{completed ? journeyCopy.readyForReview : journeyCopy.keepGoing}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
                  <CalendarDays className="h-4 w-4 text-user-500" />
                </div>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('purchased')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {new Date(program.purchasedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
                  <Video className={cn('h-4 w-4', meta.accent)} />
                </div>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('videos')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">{totalVideos}</p>
              </div>
              <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-4">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
                <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('reviews')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                  {program.averageRating > 0 ? program.averageRating.toFixed(1) : '0'} ({program.totalReviews})
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{t('aboutProgram')}</h2>
            <p className="mt-3 text-sm leading-7 text-foreground/85">{program.description}</p>
            <div
              className={cn(
                'mt-5 flex cursor-pointer items-center gap-3 rounded-xl bg-surface-2 ring-1 ring-inset p-3 transition-all active:scale-[0.99]',
                program.programType === 'meal'
                  ? 'ring-nutritionist-500/30 hover:ring-nutritionist-500/60'
                  : 'ring-trainer-500/30 hover:ring-trainer-500/60'
              )}
              onClick={() => router.push(`/user/profile/${program.trainerId}`)}
            >
              {program.trainerAvatarUrl ? (
                <img
                  src={getMediaUrl(program.trainerAvatarUrl) || ''}
                  alt={program.trainerName}
                  className={cn(
                    'h-11 w-11 rounded-full object-cover ring-2',
                    program.programType === 'meal' ? 'ring-nutritionist-500' : 'ring-trainer-500'
                  )}
                />
              ) : (
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-background"
                  style={{ background: `linear-gradient(135deg, ${accentColors.primary}, ${accentColors.secondary})` }}
                >
                  <span className="font-bold text-white">{program.trainerName.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm text-foreground">{program.trainerName}</p>
                <p
                  className={cn(
                    'text-xs',
                    program.programType === 'meal' ? 'text-nutritionist-500' : 'text-trainer-500'
                  )}
                >
                  {journeyCopy.viewExpertProfile}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-foreground">
                <Video className="h-4 w-4 text-user-500" />
                {t('videos')} <span className="text-muted-foreground font-normal tabular-nums">({totalVideos})</span>
              </h2>
              {completed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 px-2.5 h-7 text-[11px] font-semibold text-emerald-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {journeyCopy.completed}
                </span>
              )}
            </div>

            {totalVideos > 0 ? (
              <div className="space-y-3">
                {program.videoUrls.map((url, index) => {
                  const video = program.videos?.[index]
                  const watched = completed || watchedVideoIndexes.has(index)

                  return (
                    <article key={url || index} className="overflow-hidden rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
                      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{journeyCopy.lesson} {index + 1}</p>
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {video?.title || `${t('videos')} ${index + 1}`}
                          </h3>
                        </div>
                        <span className={cn(
                          'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-semibold ring-1 ring-inset',
                          watched ? 'bg-emerald-500/10 ring-emerald-500/20 text-emerald-500' : 'bg-surface-1 ring-border-subtle text-muted-foreground'
                        )}>
                          {watched ? <CheckCircle2 className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                          {watched ? journeyCopy.watched : journeyCopy.ready}
                        </span>
                      </div>
                      <video
                        controls
                        preload="metadata"
                        onEnded={() => handleVideoEnded(index)}
                        className="aspect-video w-full bg-black"
                        src={url.startsWith('http') ? url : `${MEDIA_BASE_URL}${url}`}
                      >
                        {t('videoNotSupported')}
                      </video>
                      {video?.description && (
                        <p className="border-t border-border-subtle px-4 py-3 text-sm leading-6 text-muted-foreground">
                          {video.description}
                        </p>
                      )}
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle py-10 text-center">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
                  <Video className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t('noVideos')}</p>
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t('progress')}</p>
                <h2 className="mt-1 text-2xl font-bold tabular-nums text-foreground">{progressPercent}%</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
                {completed ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <PlayCircle className="h-6 w-6 text-user-500" />}
              </div>
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(135deg, var(--user-500, #0c8de6), var(--user-700, #0866a8))' }}
              />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
              <span>{watchedVideos} / {totalVideos} {tc('videos')}</span>
              <span>{program.purchaseStatus}</span>
            </div>

            {canManualComplete && (
              <button
                onClick={completeProgramIfNeeded}
                disabled={completingPurchase}
                className="mt-4 flex w-full items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, var(--user-500, #0c8de6), var(--user-700, #0866a8))' }}
              >
                {completingPurchase ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {journeyCopy.markComplete}
              </button>
            )}
          </section>

          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-user-500" />
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">{journeyCopy.programReview}</h2>
            </div>

            {!program.canReview && !program.hasReviewed && (
              <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-4">
                <p className="text-sm font-semibold text-foreground">{journeyCopy.finishToReview}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {journeyCopy.finishToReviewHint}
                </p>
              </div>
            )}

            {program.hasReviewed && (
              <div className="rounded-xl bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 p-4 text-sm font-semibold text-emerald-500">
                {journeyCopy.alreadyReviewed}
              </div>
            )}

            {program.canReview && !program.hasReviewed && (
              <div className="space-y-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="rounded-lg p-1 hover:bg-hover-overlay active:scale-95 transition-all"
                      aria-label={`Rate ${star}`}
                    >
                      <Star
                        className={cn(
                          'h-7 w-7 transition-colors',
                          star <= (reviewHover || reviewRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-faint-foreground'
                        )}
                      />
                    </button>
                  ))}
                </div>

                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={journeyCopy.shareExperience}
                  rows={4}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 focus:ring-user-500/40 transition-shadow"
                />

                {reviewError && <p className="text-sm text-red-500">{reviewError}</p>}
                {reviewSuccess && <p className="text-sm text-emerald-500">{journeyCopy.reviewSubmitted}</p>}

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="flex w-full items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'linear-gradient(135deg, var(--user-500, #0c8de6), var(--user-700, #0866a8))' }}
                >
                  {submittingReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {journeyCopy.submitReview}
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
