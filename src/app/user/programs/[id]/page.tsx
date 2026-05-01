'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft,
  Star,
  Users,
  ShoppingCart,
  Loader2,
  Dumbbell,
  Apple,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  ArrowRight,
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { purchasesApi } from '@/lib/api/purchasesApi'
import { reviewsApi } from '@/lib/api/reviewsApi'
import { PublicProgramDto, PublicMealProgramDto, ProgramCategory, ReviewDto } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { cn } from '@/lib/utils/cn'

type UnifiedPublicProgram = {
  id: string
  title: string
  description: string
  price: number
  standardPrice?: number
  proPrice?: number
  maxStandardSpots?: number
  maxProSpots?: number
  standardSpotsRemaining?: number
  proSpotsRemaining?: number
  code: string
  coverImageUrl: string
  createdAt: string
  trainerId: string
  trainerName: string
  trainerAvatarUrl: string
  trainerSlug: string
  trainerRole: string
  category: ProgramCategory
  averageRating?: number
  totalReviews?: number
  totalPurchases?: number
}

type TierOption = {
  key: 'Basic' | 'Standard' | 'Pro'
  title: string
  description: string
  price: number
  remaining?: number
  maxSpots?: number
  featured?: boolean
}

const detailCopy = {
  instantAccess: 'Мгновенный доступ',
  chooseAccess: 'Выберите доступ',
  verifiedExpertTitle: 'Проверенный эксперт',
  verifiedExpertCopy: 'Программа привязана к профилю специалиста.',
  clearAccessTitle: 'Понятные пакеты',
  clearAccessCopy: 'Выберите уровень поддержки под вашу цель.',
  selfPacedTitle: 'В своем темпе',
  selfPacedCopy: 'После покупки программа появится в вашем пути.',
  availableNow: 'Доступно сейчас',
  select: 'Выбрать',
  securePurchase: 'Безопасная покупка',
  securePurchaseCopy: 'После оплаты программа появится в разделе «Мой путь» и будет доступна в любое время.',
  browseMore: 'Смотреть другие программы',
  programNotFound: 'Программа не найдена',
  loadFailed: 'Не удалось загрузить программу',
  purchaseFailed: 'Не удалось купить программу',
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

function fromTraining(p: PublicProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    standardSpotsRemaining: p.standardSpotsRemaining,
    proSpotsRemaining: p.proSpotsRemaining,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Training',
    averageRating: p.averageRating,
    totalReviews: p.totalReviews,
    totalPurchases: p.totalPurchases,
  }
}

function fromMeal(p: PublicMealProgramDto): UnifiedPublicProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    standardSpotsRemaining: p.standardSpotsRemaining,
    proSpotsRemaining: p.proSpotsRemaining,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    trainerId: p.trainerId,
    trainerName: p.trainerName,
    trainerAvatarUrl: p.trainerAvatarUrl,
    trainerSlug: p.trainerSlug,
    trainerRole: p.trainerRole,
    category: (p.category as ProgramCategory) || 'Diet',
    averageRating: p.averageRating ?? 0,
    totalReviews: p.totalReviews ?? 0,
    totalPurchases: p.totalPurchases ?? 0,
  }
}

function getCategoryMeta(category: ProgramCategory, t: ReturnType<typeof useTranslations>) {
  if (category === 'Diet') {
    return {
      label: t('nutrition'),
      Icon: Apple,
      accent: 'text-nutritionist-500',
      badge: 'bg-nutritionist-500',
      tint: 'from-nutritionist-500/20 via-transparent to-user-500/10',
      ring: 'border-nutritionist-500/30',
    }
  }

  if (category === 'Consultation') {
    return {
      label: t('consultation'),
      Icon: MessageSquare,
      accent: 'text-user-500',
      badge: 'bg-user-600',
      tint: 'from-user-500/20 via-transparent to-primary-500/10',
      ring: 'border-user-500/30',
    }
  }

  return {
    label: t('training'),
    Icon: Dumbbell,
    accent: 'text-trainer-500',
    badge: 'bg-trainer-500',
    tint: 'from-trainer-500/20 via-transparent to-user-500/10',
    ring: 'border-trainer-500/30',
  }
}

export default function ProgramDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('userPrograms')
  const tc = useTranslations('common')

  const [program, setProgram] = useState<UnifiedPublicProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchasingTier, setPurchasingTier] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<ReviewDto[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const category = searchParams.get('category')

      if (category !== 'Diet') {
        const trainingProg = await withTimeout(programsApi.getProgramById(id), detailCopy.loadFailed)
        if (trainingProg) {
          setProgram(fromTraining(trainingProg))
          return
        }
      }

      const mealRes = await withTimeout(mealProgramsApi.getAllPublic(1, 100), detailCopy.loadFailed)
      const found = mealRes.items.find((p) => p.id === id)
      if (found) {
        setProgram(fromMeal(found))
        return
      }

      if (category === 'Diet') {
        const trainingProg = await withTimeout(programsApi.getProgramById(id), detailCopy.loadFailed)
        if (trainingProg) {
          setProgram(fromTraining(trainingProg))
          return
        }
      }

      setError(detailCopy.programNotFound)
    } catch (err) {
      console.error('Failed to fetch program:', err)
      setError(err instanceof Error ? err.message : detailCopy.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [id, searchParams])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  const programType = program?.category === 'Diet' ? ('meal' as const) : ('training' as const)

  const loadReviews = useCallback(async () => {
    if (!program) return
    try {
      setReviewsLoading(true)
      const data = await reviewsApi.getReviews(program.id, programType)
      setReviews(data)
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setReviewsLoading(false)
    }
  }, [program, programType])

  useEffect(() => {
    if (program) {
      loadReviews()
    }
  }, [program, loadReviews])

  useRealtimeScopeRefresh(['programs', 'reviews'], () => {
    loadProgram()
    if (program) {
      loadReviews()
    }
  })

  const handlePurchase = async (tier: string) => {
    if (!program) return
    setPurchasingTier(tier)
    setPurchaseError(null)
    try {
      await purchasesApi.purchase({
        programId: program.id,
        programType,
        tier,
      })
      router.push('/user/journey')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : detailCopy.purchaseFailed
      setPurchaseError(message)
    } finally {
      setPurchasingTier(null)
    }
  }

  const formatPrice = (price: number) => {
    if (price === 0) return tc('free')
    return `$${price.toFixed(2)}`
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
          <h3 className="mb-2 text-lg font-semibold text-foreground">{error || detailCopy.programNotFound}</h3>
          <button
            onClick={() => router.push('/user/programs')}
            className="mt-4 rounded-lg bg-user-600 px-6 py-2 text-sm font-semibold text-white hover:bg-user-700"
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  const categoryMeta = getCategoryMeta(program.category, t)
  const CategoryIcon = categoryMeta.Icon
  const accentColors = getAccentColorsByRole(program.trainerRole)
  const availablePrices = [program.price, program.standardPrice, program.proPrice].filter(
    (price): price is number => price != null && price >= 0
  )
  const paidPrices = availablePrices.filter(price => price > 0)
  const minPrice = paidPrices.length > 0 ? Math.min(...paidPrices) : 0
  const hasMultiplePrices = paidPrices.length > 1
  const averageRating = program.averageRating ?? 0
  const totalReviews = program.totalReviews ?? 0
  const totalPurchases = program.totalPurchases ?? 0

  const tierOptions: TierOption[] = [
    program.price >= 0
      ? {
          key: 'Basic',
          title: t('basicTier'),
          description: t('basicTierDesc'),
          price: program.price,
        }
      : null,
    program.standardPrice != null && program.standardPrice > 0
      ? {
          key: 'Standard',
          title: t('standardTier'),
          description: t('standardTierDesc'),
          price: program.standardPrice,
          remaining: program.standardSpotsRemaining,
          maxSpots: program.maxStandardSpots,
          featured: true,
        }
      : null,
    program.proPrice != null && program.proPrice > 0
      ? {
          key: 'Pro',
          title: t('proTier'),
          description: t('proTierDesc'),
          price: program.proPrice,
          remaining: program.proSpotsRemaining,
          maxSpots: program.maxProSpots,
        }
      : null,
  ].filter((tier): tier is TierOption => Boolean(tier))

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
        <div className="relative min-h-[360px]">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-4">
              <CategoryIcon className={cn('h-20 w-20', categoryMeta.accent)} />
            </div>
          )}
          <div className={cn('absolute inset-0 bg-gradient-to-br', categoryMeta.tint)} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15" />

          <div className="relative flex min-h-[360px] flex-col justify-end gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-white', categoryMeta.badge)}>
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {categoryMeta.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  <Clock3 className="h-3.5 w-3.5" />
                  {detailCopy.instantAccess}
                </span>
              </div>

              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">
                {program.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                {program.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/15 bg-black/35 p-2 text-white backdrop-blur sm:min-w-[360px]">
              <div className="rounded-lg bg-white/10 px-3 py-3">
                <p className="text-[11px] uppercase text-white/60">{t('reviews')}</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {averageRating > 0 ? averageRating.toFixed(1) : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 px-3 py-3">
                <p className="text-[11px] uppercase text-white/60">{tc('purchases')}</p>
                <p className="mt-1 flex items-center gap-1 text-lg font-bold">
                  <Users className="h-4 w-4" />
                  {totalPurchases}
                </p>
              </div>
              <div className="rounded-lg bg-white/10 px-3 py-3">
                <p className="text-[11px] uppercase text-white/60">{tc('from')}</p>
                <p className="mt-1 text-lg font-bold">{formatPrice(minPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div
                className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-background p-3 hover:border-user-500/30"
                onClick={() => router.push(`/user/profile/${program.trainerId}`)}
              >
                {program.trainerAvatarUrl ? (
                  <img
                    src={getMediaUrl(program.trainerAvatarUrl) || ''}
                    alt={program.trainerName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{
                      background: `linear-gradient(to bottom right, ${accentColors.primary}, ${accentColors.secondary})`,
                    }}
                  >
                    <span className="font-bold text-white">{program.trainerName.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{program.trainerName}</p>
                  <p className="text-xs text-muted-foreground group-hover:text-user-500">
                    {program.trainerRole?.toLowerCase() === 'nutritionist' || program.trainerRole === '2'
                      ? t('viewNutritionistProfile')
                      : t('viewTrainerProfile')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[240px]">
                <div className="rounded-xl border border-border-subtle bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('programCode')}</p>
                  <p className="mt-1 truncate font-mono text-sm font-semibold text-foreground">{program.code}</p>
                </div>
                <div className="rounded-xl border border-border-subtle bg-background p-3">
                  <p className="text-xs text-muted-foreground">{t('reviews')}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{totalReviews}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">{t('aboutProgram')}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{program.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: detailCopy.verifiedExpertTitle, copy: detailCopy.verifiedExpertCopy },
                { icon: CheckCircle2, title: detailCopy.clearAccessTitle, copy: detailCopy.clearAccessCopy },
                { icon: Clock3, title: detailCopy.selfPacedTitle, copy: detailCopy.selfPacedCopy },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-xl border border-border-subtle bg-background p-4">
                    <Icon className={cn('h-5 w-5', categoryMeta.accent)} />
                    <p className="mt-3 text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.copy}</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-3 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Star className="h-5 w-5 text-amber-400" />
                {t('reviews')} ({reviews.length})
              </h2>
              {averageRating > 0 && (
                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-sm font-semibold text-amber-500">
                  {averageRating.toFixed(1)} / 5
                </span>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-user-500" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background py-8 text-center">
                <p className="text-sm text-faint-foreground">{t('noReviews')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-border-subtle bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {review.userAvatarUrl ? (
                          <img
                            src={getMediaUrl(review.userAvatarUrl) || ''}
                            alt={review.userName}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-4">
                            <span className="text-xs font-bold text-foreground">{review.userName.charAt(0)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{review.userName}</p>
                          <p className="text-xs text-faint-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn('h-3.5 w-3.5', star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-faint-foreground')}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{review.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          <section className={cn('rounded-xl border bg-surface-3 p-5 shadow-sm', categoryMeta.ring)}>
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{detailCopy.chooseAccess}</p>
              <p className="mt-1 text-3xl font-bold text-foreground">
                {hasMultiplePrices && <span className="mr-1 text-sm font-medium text-muted-foreground">{tc('from')}</span>}
                {formatPrice(minPrice)}
              </p>
            </div>

            {purchaseError && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {purchaseError}
              </div>
            )}

            <div className="space-y-3">
              {tierOptions.map((tier) => {
                const soldOut =
                  tier.maxSpots != null &&
                  tier.maxSpots > 0 &&
                  (tier.remaining ?? 0) <= 0
                const isPurchasing = purchasingTier === tier.key

                return (
                  <button
                    key={tier.key}
                    disabled={soldOut || Boolean(purchasingTier)}
                    onClick={() => !soldOut && handlePurchase(tier.key)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
                      tier.featured
                        ? 'border-user-500/40 bg-user-500/10 hover:border-user-500'
                        : 'border-border-subtle bg-background hover:border-user-500/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{tier.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{tier.description}</p>
                      </div>
                      <span className="shrink-0 text-base font-bold text-foreground">
                        {formatPrice(tier.price)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={soldOut ? 'text-red-400' : 'text-muted-foreground'}>
                        {soldOut
                          ? t('soldOut')
                          : tier.maxSpots != null && tier.maxSpots > 0
                          ? `${tier.remaining} ${t('spotsLeft')}`
                          : detailCopy.availableNow}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-user-500">
                        {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                        {detailCopy.select}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-xl border border-border-subtle bg-background p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-user-500" />
                {detailCopy.securePurchase}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {detailCopy.securePurchaseCopy}
              </p>
            </div>
          </section>

          <button
            onClick={() => router.push('/user/programs')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-3 px-4 py-3 text-sm font-semibold text-foreground hover:bg-hover-overlay"
          >
            {detailCopy.browseMore}
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  )
}
