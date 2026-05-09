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
  selfPacedTitle: 'В своём темпе',
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
      ring: 'ring-nutritionist-500/30',
    }
  }

  if (category === 'Consultation') {
    return {
      label: t('consultation'),
      Icon: MessageSquare,
      accent: 'text-violet-400',
      badge: 'bg-violet-600',
      tint: 'from-violet-500/20 via-transparent to-violet-400/10',
      ring: 'ring-violet-500/30',
    }
  }

  return {
    label: t('training'),
    Icon: Dumbbell,
    accent: 'text-trainer-500',
    badge: 'bg-trainer-500',
    tint: 'from-trainer-500/20 via-transparent to-user-500/10',
    ring: 'ring-trainer-500/30',
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
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          {tc('back')}
        </button>
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-6 py-12 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-inset ring-red-500/20 text-red-500">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">{error || detailCopy.programNotFound}</h3>
          <button
            onClick={() => router.push('/user/programs')}
            className="inline-flex h-10 items-center justify-center px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${getAccentColorsByRole('user').primary}, ${getAccentColorsByRole('user').secondary})` }}
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  const categoryMeta = getCategoryMeta(program.category, t)
  const CategoryIcon = categoryMeta.Icon
  const isNutritionist = program.category === 'Diet' || program.trainerRole?.toLowerCase() === 'nutritionist' || program.trainerRole === '3'
  const accentColors = getAccentColorsByRole(
    program.category === 'Diet' ? 'nutritionist' :
    program.category === 'Training' ? 'trainer' :
    program.trainerRole
  )
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
    <div className="space-y-4 pb-24 lg:pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 active:scale-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('back')}
      </button>

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-4 lg:space-y-5">
          {/* Hero card вЂ” image + meta on light surface (no dark overlay) */}
          <section className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
            {/* Cover image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-3">
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
                  <CategoryIcon className="h-20 w-20" style={{ color: accentColors.primary }} />
                </div>
              )}

              {/* Top-left badges */}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-semibold text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${accentColors.primary}, ${accentColors.secondary})` }}
                >
                  <CategoryIcon className="h-3.5 w-3.5" />
                  {categoryMeta.label}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-semibold text-white bg-black/45 ring-1 ring-inset ring-white/15 backdrop-blur-md">
                  <Clock3 className="h-3.5 w-3.5" />
                  {detailCopy.instantAccess}
                </span>
              </div>

              {/* Top-right rating pill */}
              {averageRating > 0 && (
                <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full px-2.5 h-7 text-[11px] font-semibold text-white bg-black/45 ring-1 ring-inset ring-white/15 backdrop-blur-md">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="tabular-nums">{averageRating.toFixed(1)}</span>
                  <span className="text-white/70">({totalReviews})</span>
                </div>
              )}
            </div>

            {/* Meta */}
            <div className="p-4 sm:p-5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground leading-tight">
                {program.title}
              </h1>
              <p className="mt-2 text-sm leading-6 text-foreground/85">{program.description}</p>

              {/* Stats row */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5 text-center">
                  <p className="flex items-center justify-center gap-1 text-base sm:text-lg font-bold text-foreground tabular-nums leading-none">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {averageRating > 0 ? averageRating.toFixed(1) : 'вЂ”'}
                  </p>
                  <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-none">{t('reviews')}</p>
                </div>
                <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5 text-center">
                  <p className="flex items-center justify-center gap-1 text-base sm:text-lg font-bold text-foreground tabular-nums leading-none">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {totalPurchases}
                  </p>
                  <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-none">{tc('purchases')}</p>
                </div>
                <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5 text-center">
                  <p className="text-base sm:text-lg font-bold text-foreground tabular-nums leading-none">
                    {formatPrice(minPrice)}
                  </p>
                  <p className="mt-1 text-[10px] sm:text-[11px] text-muted-foreground leading-none">
                    {hasMultiplePrices ? tc('from') : tc('price')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Trainer + code */}
          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => router.push(`/user/profile/${program.trainerId}`)}
                className={cn(
                  'group flex items-center gap-3 rounded-xl bg-surface-2 ring-1 ring-inset p-2.5 pr-4 text-left transition-all active:scale-[0.99]',
                  isNutritionist
                    ? 'ring-nutritionist-500/30 hover:ring-nutritionist-500/60'
                    : 'ring-trainer-500/30 hover:ring-trainer-500/60'
                )}
              >
                {program.trainerAvatarUrl ? (
                  <img
                    src={getMediaUrl(program.trainerAvatarUrl) || ''}
                    alt={program.trainerName}
                    className={cn(
                      'h-11 w-11 rounded-full object-cover ring-2',
                      isNutritionist ? 'ring-nutritionist-500' : 'ring-trainer-500'
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
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{program.trainerName}</p>
                  <p
                    className={cn(
                      'text-[11px] transition-colors',
                      isNutritionist ? 'text-nutritionist-500' : 'text-trainer-500'
                    )}
                  >
                    {isNutritionist ? t('viewNutritionistProfile') : t('viewTrainerProfile')}
                  </p>
                </div>
                <ArrowRight
                  className={cn(
                    'ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5',
                    isNutritionist ? 'text-nutritionist-500' : 'text-trainer-500'
                  )}
                />
              </button>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[220px]">
                <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t('programCode')}</p>
                  <p className="mt-1 truncate font-mono text-xs font-semibold text-foreground">{program.code}</p>
                </div>
                <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{t('reviews')}</p>
                  <p className="mt-1 text-xs font-semibold text-foreground tabular-nums">{totalReviews}</p>
                </div>
              </div>
            </div>
          </section>

          {/* About */}
          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t('aboutProgram')}</h2>
            <p className="text-sm leading-7 text-foreground/85 whitespace-pre-line">{program.description}</p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: detailCopy.verifiedExpertTitle, copy: detailCopy.verifiedExpertCopy },
                { icon: CheckCircle2, title: detailCopy.clearAccessTitle, copy: detailCopy.clearAccessCopy },
                { icon: Clock3, title: detailCopy.selfPacedTitle, copy: detailCopy.selfPacedCopy },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-3.5">
                    <div
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ring-border-subtle"
                      style={{ background: `linear-gradient(135deg, ${accentColors.primary}1f, ${accentColors.secondary}10)` }}
                    >
                      <Icon className="h-4 w-4" style={{ color: accentColors.primary }} />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.copy}</p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Reviews */}
          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {t('reviews')}
                <span className="text-muted-foreground font-normal tabular-nums">({reviews.length})</span>
              </h2>
              {averageRating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 ring-1 ring-inset ring-amber-400/20 px-2.5 h-7 text-[11px] font-semibold text-amber-500 tabular-nums">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {averageRating.toFixed(1)} / 5
                </span>
              )}
            </div>

            {reviewsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle py-10 text-center">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
                  <Star className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t('noReviews')}</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {review.userAvatarUrl ? (
                          <img
                            src={getMediaUrl(review.userAvatarUrl) || ''}
                            alt={review.userName}
                            className="h-9 w-9 rounded-full object-cover ring-2 ring-background"
                          />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 ring-2 ring-background">
                            <span className="text-xs font-bold text-foreground">{review.userName.charAt(0)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{review.userName}</p>
                          <p className="text-[11px] text-faint-foreground tabular-nums">
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
                      <p className="mt-3 text-sm leading-6 text-foreground/85">{review.comment}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>

        {/* Sidebar вЂ” purchase */}
        <aside className="lg:sticky lg:top-5 lg:self-start lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
          <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5 shadow-md shadow-zinc-900/[0.04] dark:shadow-black/20">
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{detailCopy.chooseAccess}</p>
              <p className="mt-1 text-3xl font-bold text-foreground tabular-nums">
                {hasMultiplePrices && <span className="mr-1 text-sm font-medium text-muted-foreground">{tc('from')}</span>}
                {formatPrice(minPrice)}
              </p>
            </div>

            {purchaseError && (
              <div className="mb-3 rounded-xl bg-red-500/10 ring-1 ring-inset ring-red-500/20 p-3 text-sm text-red-500">
                {purchaseError}
              </div>
            )}

            <div className="space-y-2.5">
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
                      'group relative w-full rounded-xl ring-1 ring-inset p-4 text-left transition-all duration-200 ease-out-expo disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]',
                      tier.featured
                        ? 'bg-surface-2 ring-2'
                        : 'bg-surface-2 ring-border-subtle hover:ring-border'
                    )}
                    style={tier.featured ? { '--tw-ring-color': accentColors.primary } as React.CSSProperties : undefined}
                  >
                    {tier.featured && (
                      <span
                        className="absolute -top-2 right-3 inline-flex items-center rounded-full px-2 h-5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${accentColors.primary}, ${accentColors.secondary})` }}
                      >
                        {tc('popular') || 'Popular'}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">{tier.title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{tier.description}</p>
                      </div>
                      <span className="shrink-0 text-base font-bold text-foreground tabular-nums">
                        {formatPrice(tier.price)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <span className={cn('tabular-nums', soldOut ? 'text-red-500' : 'text-muted-foreground')}>
                        {soldOut
                          ? t('soldOut')
                          : tier.maxSpots != null && tier.maxSpots > 0
                          ? `${tier.remaining} ${t('spotsLeft')}`
                          : detailCopy.availableNow}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 font-semibold"
                        style={{ color: accentColors.primary }}
                      >
                        {isPurchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                        {detailCopy.select}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" style={{ color: accentColors.primary }} />
                {detailCopy.securePurchase}
              </div>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                {detailCopy.securePurchaseCopy}
              </p>
            </div>
          </section>

          <button
            onClick={() => router.push('/user/programs')}
            className="mt-3 hidden lg:inline-flex w-full items-center justify-center gap-2 h-11 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-sm font-semibold text-foreground hover:bg-surface-2 hover:ring-border active:scale-[0.99] transition-all"
          >
            {detailCopy.browseMore}
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </div>
  )
}
