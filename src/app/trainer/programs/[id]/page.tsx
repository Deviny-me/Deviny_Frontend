'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Star,
  Edit,
  Trash2,
  BookOpen,
  Loader2,
  Video,
  Dumbbell,
  Apple,
  MessageSquare,
  EyeOff,
  Eye,
  AlertTriangle,
  Calendar,
  Hash,
  Copy,
  Check,
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { ProgramDto, MealProgramDto, ProgramCategory, ProgramVideoDto } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

type ProgramData = {
  id: string
  title: string
  description: string
  detailedDescription?: string
  price: number
  standardPrice?: number
  proPrice?: number
  maxStandardSpots?: number
  maxProSpots?: number
  category: ProgramCategory
  code: string
  coverImageUrl: string
  createdAt: string
  type: 'training' | 'meal'
  isPublic: boolean
  averageRating?: number
  totalReviews?: number
  totalPurchases?: number
  videoUrls?: string[]
  videos?: ProgramVideoDto[]
}

const CATEGORY_META = {
  Training: { Icon: Dumbbell, labelKey: 'typeTraining' as const },
  Diet: { Icon: Apple, labelKey: 'typeMeal' as const },
  Consultation: { Icon: MessageSquare, labelKey: 'typeConsultation' as const },
}

export default function TrainerProgramDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const t = useTranslations('programs')
  const tp = useTranslations('profile')
  const tc = useTranslations('common')

  const accent = getAccentColorsByRole('trainer')

  const [program, setProgram] = useState<ProgramData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const trainingProgs = await programsApi.getMyPrograms()
      const training = trainingProgs.find((p: ProgramDto) => p.id === id)
      if (training) {
        setProgram({
          id: training.id,
          title: training.title,
          description: training.description,
          detailedDescription: training.detailedDescription,
          price: training.price,
          standardPrice: training.standardPrice,
          proPrice: training.proPrice,
          maxStandardSpots: training.maxStandardSpots,
          maxProSpots: training.maxProSpots,
          category: (training.category as ProgramCategory) || 'Training',
          code: training.code,
          coverImageUrl: training.coverImageUrl,
          createdAt: training.createdAt,
          type: 'training',
          isPublic: training.isPublic ?? true,
          averageRating: training.averageRating,
          totalReviews: training.totalReviews,
          totalPurchases: training.totalPurchases,
          videoUrls: training.trainingVideoUrls,
          videos: training.trainingVideos,
        })
        return
      }

      const mealProgs = await mealProgramsApi.getMyMealPrograms()
      const meal = mealProgs.find((p: MealProgramDto) => p.id === id)
      if (meal) {
        setProgram({
          id: meal.id,
          title: meal.title,
          description: meal.description,
          detailedDescription: meal.detailedDescription,
          price: meal.price,
          standardPrice: meal.standardPrice,
          proPrice: meal.proPrice,
          maxStandardSpots: meal.maxStandardSpots,
          maxProSpots: meal.maxProSpots,
          category: (meal.category as ProgramCategory) || 'Diet',
          code: meal.code,
          coverImageUrl: meal.coverImageUrl,
          createdAt: meal.createdAt,
          type: 'meal',
          isPublic: meal.isPublic ?? true,
          averageRating: 0,
          totalReviews: 0,
          totalPurchases: 0,
          videoUrls: meal.videoUrls,
        })
        return
      }

      setError('Program not found')
    } catch (err) {
      console.error('Failed to load program:', err)
      setError(err instanceof Error ? err.message : 'Failed to load program')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadProgram()
  }, [loadProgram])

  const handleDelete = async () => {
    if (!program || !confirm(t('toasts.deleteConfirm'))) return
    try {
      setDeleting(true)
      if (program.type === 'training') {
        await programsApi.deleteProgram(program.id)
      } else {
        await mealProgramsApi.deleteMealProgram(program.id)
      }
      toast.success(t('toasts.deleted'))
      router.push('/trainer/programs')
    } catch (err) {
      console.error('Failed to delete program:', err)
      toast.error(t('toasts.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyCode = () => {
    if (!program) return
    navigator.clipboard.writeText(program.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
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
        <div className="text-center py-14 rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/15 ring-1 ring-inset ring-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{error || 'Program not found'}</h3>
          <button
            onClick={() => router.push('/trainer/programs')}
            className="mt-4 inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
            style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  const { Icon: CategoryIcon, labelKey: categoryLabelKey } = CATEGORY_META[program.category]
  const createdDate = new Date(program.createdAt).toLocaleDateString()

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 lg:pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-2 active:scale-95 transition-all"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('back')}
      </button>

      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-3 lg:w-[520px] lg:shrink-0 lg:aspect-auto lg:self-stretch">
            {program.coverImageUrl ? (
              <img
                src={getMediaUrl(program.coverImageUrl) || ''}
                alt={program.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accent.primary}26, ${accent.secondary}14)` }}
              >
                <BookOpen className="w-16 h-16" style={{ color: `${accent.primary}80` }} />
              </div>
            )}

            {/* Top-left: category + visibility */}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              <span className="inline-flex h-7 items-center gap-1.5 pl-1 pr-2.5 rounded-full text-[11px] font-medium text-white bg-black/55 ring-1 ring-inset ring-white/15 backdrop-blur-md">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
                >
                  <CategoryIcon className="w-3 h-3 text-white" />
                </span>
                {t(categoryLabelKey)}
              </span>
              {!program.isPublic && (
                <span className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium text-white bg-black/55 ring-1 ring-inset ring-white/15 backdrop-blur-md">
                  <EyeOff className="w-3 h-3" />
                  {t('private')}
                </span>
              )}
            </div>

            {/* Top-right: price */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex h-8 items-center px-3 rounded-full text-sm font-bold text-white bg-black/55 ring-1 ring-inset ring-white/15 backdrop-blur-md tabular-nums">
                ${program.price}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight mb-2">
              {program.title}
            </h1>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {program.description}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <StatPill
                icon={<Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                label={tp('rating') ?? 'Rating'}
                value={
                  (program.averageRating ?? 0) > 0
                    ? (program.averageRating ?? 0).toFixed(1)
                    : '0.0'
                }
                hint={`${program.totalReviews ?? 0}`}
              />
              <StatPill
                icon={<Users className="w-3.5 h-3.5" style={{ color: accent.primary }} />}
                label={tc('purchases')}
                value={`${program.totalPurchases ?? 0}`}
              />
              <StatPill
                icon={<Video className="w-3.5 h-3.5 text-purple-400" />}
                label={tc('videos')}
                value={`${program.videoUrls?.length ?? 0}`}
              />
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${
                program.isPublic
                  ? 'bg-emerald-500/10 ring-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 ring-amber-500/30 text-amber-400'
              }`}>
                {program.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {program.isPublic ? t('visibilityPublic') : t('visibilityPrivate')}
              </span>
              <span className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {createdDate}
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11px] font-medium bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Hash className="w-3 h-3" />}
                <span className="font-mono">{program.code}</span>
                {!copied && <Copy className="w-3 h-3 opacity-60" />}
              </button>
            </div>

            {/* Actions */}
            <div className="mt-auto flex gap-2">
              <button
                onClick={() =>
                  router.push(`/trainer/programs/new?edit=${program.id}&category=${program.category}`)
                }
                className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold ring-1 ring-inset hover:brightness-110 active:scale-[0.99] transition-all"
                style={{
                  color: accent.primary,
                  backgroundColor: `${accent.primary}1a`,
                  ['--tw-ring-color' as never]: `${accent.primary}55`,
                }}
              >
                <Edit className="w-4 h-4" />
                {tc('edit')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10 ring-1 ring-inset ring-red-500/30 hover:bg-red-500/15 active:scale-[0.99] disabled:opacity-50 transition-all"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{tc('delete')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tier pricing */}
      {(program.standardPrice != null || program.proPrice != null) && (
        <Section title={`${t('basicTier')} / ${t('standardTier')} / ${t('proTier')}`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TierCard
              tier={t('basicTier')}
              price={program.price}
              hint={t('noLimit')}
              accentColor={accent.primary}
              ringClass="ring-border-subtle"
            />
            {program.standardPrice != null && (
              <TierCard
                tier={t('standardTier')}
                price={program.standardPrice}
                hint={
                  program.maxStandardSpots
                    ? `${program.maxStandardSpots} ${t('spots')}`
                    : t('noLimit')
                }
                accentColor="#F59E0B"
                ringClass="ring-amber-500/30"
              />
            )}
            {program.proPrice != null && (
              <TierCard
                tier={t('proTier')}
                price={program.proPrice}
                hint={
                  program.maxProSpots
                    ? `${program.maxProSpots} ${t('spots')}`
                    : t('noLimit')
                }
                accentColor="#A855F7"
                ringClass="ring-purple-500/30"
              />
            )}
          </div>
        </Section>
      )}

      {/* Description */}
      <Section title={tp('description')}>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
          {program.description}
        </p>
        {program.detailedDescription && (
          <>
            <div className="h-px bg-border-subtle my-4" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {t('detailedDescriptionLabel')}
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {program.detailedDescription}
            </p>
          </>
        )}
      </Section>

      {/* Videos */}
      {program.videoUrls && program.videoUrls.length > 0 && (
        <Section
          title={`${program.type === 'meal' ? t('mealRecipeVideos') : t('trainingVideos')} · ${program.videoUrls.length}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {program.videoUrls.map((url, i) => {
              const meta = program.videos?.[i]
              return (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden bg-surface-2 ring-1 ring-inset ring-border-subtle"
                >
                  <div className="aspect-video w-full bg-black">
                    <video
                      src={getMediaUrl(url) || ''}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {(meta?.title || meta?.description) && (
                    <div className="p-3">
                      {meta?.title && (
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {meta.title}
                        </p>
                      )}
                      {meta?.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {meta.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}

// --- Helpers ---

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

function StatPill({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-2.5 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold text-foreground tabular-nums">{value}</span>
        {hint && <span className="text-[11px] text-muted-foreground tabular-nums">({hint})</span>}
      </div>
    </div>
  )
}

function TierCard({
  tier,
  price,
  hint,
  accentColor,
  ringClass,
}: {
  tier: string
  price: number
  hint: string
  accentColor: string
  ringClass: string
}) {
  return (
    <div className={`rounded-xl bg-surface-2 ring-1 ring-inset ${ringClass} p-3.5`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: accentColor }}>
        {tier}
      </p>
      <p className="text-2xl font-bold text-foreground tabular-nums">${price}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
    </div>
  )
}
