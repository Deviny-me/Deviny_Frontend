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
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover-overlay hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc('back')}
        </button>
        <div className="rounded-xl border border-border bg-surface-3 px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{error || journeyCopy.programNotFound}</h3>
          <button
            onClick={() => router.push('/user/journey')}
            className="mt-4 rounded-lg bg-user-600 px-6 py-2 text-sm font-semibold text-white hover:bg-user-700"
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  const meta = getProgramMeta(program.programType, t)
  const ProgramIcon = meta.Icon
  const completed = program.purchaseStatus === 'Completed'
  const totalVideos = program.videoUrls.length
  const watchedVideos = completed ? totalVideos : watchedVideoIndexes.size
  const progressPercent = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : completed ? 100 : 0
  const canManualComplete = !completed && (totalVideos === 0 || watchedVideoIndexes.size >= totalVideos)

  return (
    <div className="space-y-5 pb-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-hover-overlay hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('back')}
      </button>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface-3 shadow-sm">
        <div className="relative min-h-[340px]">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-4">
              <ProgramIcon className={cn('h-20 w-20', meta.accent)} />
            </div>
          )}
          <div className={cn('absolute inset-0 bg-gradient-to-br', meta.tint)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/15" />

          <div className="relative flex min-h-[340px] flex-col justify-end gap-5 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white', meta.badge)}>
                  <ProgramIcon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Trophy className="h-3.5 w-3.5" />
                  {completed ? journeyCopy.completed : journeyCopy.inProgress}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {program.tier}
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">
                {program.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                {program.description}
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-black/35 p-4 text-white backdrop-blur sm:min-w-[320px]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-white/60">{t('progress')}</p>
                  <p className="mt-1 text-3xl font-bold">{progressPercent}%</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
                  {completed ? <CheckCircle2 className="h-7 w-7 text-green-300" /> : <PlayCircle className="h-7 w-7 text-user-300" />}
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-user-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                <span>{watchedVideos} / {totalVideos} {tc('videos')}</span>
                <span>{completed ? journeyCopy.readyForReview : journeyCopy.keepGoing}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border-subtle bg-background p-4">
                <CalendarDays className="h-5 w-5 text-user-500" />
                <p className="mt-3 text-xs text-muted-foreground">{t('purchased')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {new Date(program.purchasedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background p-4">
                <Video className={cn('h-5 w-5', meta.accent)} />
                <p className="mt-3 text-xs text-muted-foreground">{t('videos')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{totalVideos}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-background p-4">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <p className="mt-3 text-xs text-muted-foreground">{t('reviews')}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {program.averageRating > 0 ? program.averageRating.toFixed(1) : '-'} ({program.totalReviews})
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">{t('aboutProgram')}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{program.description}</p>
            <div
              className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-background p-3 hover:border-user-500/30"
              onClick={() => router.push(`/user/profile/${program.trainerId}`)}
            >
              {program.trainerAvatarUrl ? (
                <img
                  src={getMediaUrl(program.trainerAvatarUrl) || ''}
                  alt={program.trainerName}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-4">
                  <span className="font-bold text-foreground">{program.trainerName.charAt(0)}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{program.trainerName}</p>
                <p className="text-xs text-muted-foreground">{journeyCopy.viewExpertProfile}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Video className="h-5 w-5 text-user-500" />
                {t('videos')} ({totalVideos})
              </h2>
              {completed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {journeyCopy.completed}
                </span>
              )}
            </div>

            {totalVideos > 0 ? (
              <div className="space-y-4">
                {program.videoUrls.map((url, index) => {
                  const video = program.videos?.[index]
                  const watched = completed || watchedVideoIndexes.has(index)

                  return (
                    <article key={url || index} className="overflow-hidden rounded-xl border border-border-subtle bg-background">
                      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">{journeyCopy.lesson} {index + 1}</p>
                          <h3 className="truncate text-sm font-semibold text-foreground">
                            {video?.title || `${t('videos')} ${index + 1}`}
                          </h3>
                        </div>
                        <span className={cn(
                          'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                          watched ? 'bg-green-500/10 text-green-400' : 'bg-surface-4 text-muted-foreground'
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
              <div className="rounded-xl border border-dashed border-border bg-background py-10 text-center">
                <Video className="mx-auto mb-3 h-9 w-9 text-faint-foreground" />
                <p className="text-sm text-faint-foreground">{t('noVideos')}</p>
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          <section className={cn('rounded-xl border bg-surface-3 p-5 shadow-sm', meta.ring)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('progress')}</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">{progressPercent}%</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-user-500/10">
                {completed ? <CheckCircle2 className="h-6 w-6 text-green-400" /> : <PlayCircle className="h-6 w-6 text-user-500" />}
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-4">
              <div className="h-full rounded-full bg-user-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{watchedVideos} / {totalVideos} {tc('videos')}</span>
              <span>{program.purchaseStatus}</span>
            </div>

            {canManualComplete && (
              <button
                onClick={completeProgramIfNeeded}
                disabled={completingPurchase}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-user-600 px-4 py-3 text-sm font-semibold text-white hover:bg-user-700 disabled:opacity-60"
              >
                {completingPurchase ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {journeyCopy.markComplete}
              </button>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-user-500" />
              <h2 className="text-lg font-bold text-foreground">{journeyCopy.programReview}</h2>
            </div>

            {!program.canReview && !program.hasReviewed && (
              <div className="rounded-xl border border-border-subtle bg-background p-4">
                <p className="text-sm font-semibold text-foreground">{journeyCopy.finishToReview}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {journeyCopy.finishToReviewHint}
                </p>
              </div>
            )}

            {program.hasReviewed && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm font-semibold text-green-400">
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
                      className="rounded-md p-1 hover:bg-hover-overlay"
                      aria-label={`Rate ${star}`}
                    >
                      <Star
                        className={cn(
                          'h-7 w-7',
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
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-faint-foreground focus:border-user-500/50 focus:outline-none focus:ring-2 focus:ring-user-500/10"
                />

                {reviewError && <p className="text-sm text-red-400">{reviewError}</p>}
                {reviewSuccess && <p className="text-sm text-green-400">{journeyCopy.reviewSubmitted}</p>}

                <button
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || submittingReview}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-user-600 px-4 py-3 text-sm font-semibold text-white hover:bg-user-700 disabled:opacity-50"
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
