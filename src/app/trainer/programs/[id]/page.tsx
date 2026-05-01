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
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { ProgramDto, MealProgramDto, ProgramCategory, ProgramVideoDto } from '@/types/program'
import { getMediaUrl } from '@/lib/config'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

const accent = {
  gradient: 'from-[#f07915] to-[#d4600b]',
  bg: 'bg-[#f07915]',
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

  const [program, setProgram] = useState<ProgramData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try training programs
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

      // Try meal programs
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#f07915] animate-spin" />
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="space-y-4 pb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{tc('back')}</span>
        </button>
        <div className="text-center py-12 bg-surface-3 rounded-xl border border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{error || 'Program not found'}</h3>
          <button
            onClick={() => router.push('/trainer/programs')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-[#f07915] to-[#d4600b] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{tc('back')}</span>
      </button>

      <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
        {/* Cover Image */}
        <div className="relative">
          {program.coverImageUrl ? (
            <img
              src={getMediaUrl(program.coverImageUrl) || ''}
              alt={program.title}
              className="w-full h-56 sm:h-72 object-cover"
            />
          ) : (
            <div className="w-full h-56 sm:h-72 bg-background flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-gray-600" />
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs font-bold rounded ${accent.bg} text-foreground`}>
              ${program.price}
            </span>
            {program.standardPrice != null && (
              <span className="px-2 py-1 text-xs font-bold rounded bg-blue-600 text-foreground">
                STD ${program.standardPrice}
              </span>
            )}
            {program.proPrice != null && (
              <span className="px-2 py-1 text-xs font-bold rounded bg-purple-600 text-foreground">
                PRO ${program.proPrice}
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-bold rounded text-foreground ${
                program.category === 'Training'
                  ? 'bg-blue-600'
                  : program.category === 'Diet'
                  ? 'bg-green-600'
                  : 'bg-violet-600'
              }`}
            >
              {program.category === 'Training'
                ? t('typeTraining')
                : program.category === 'Diet'
                ? t('typeMeal')
                : t('typeConsultation')}
            </span>
            {!program.isPublic && (
              <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-600 text-foreground flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                {t('private')}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <h1 className="page-title">{program.title}</h1>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-foreground font-medium">
                {(program.averageRating ?? 0) > 0
                  ? (program.averageRating ?? 0).toFixed(1)
                  : tp('noRating')}
              </span>
              <span className="text-faint-foreground">({program.totalReviews ?? 0})</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>
                {program.totalPurchases ?? 0} {tc('purchases')}
              </span>
            </div>
            {program.videoUrls && program.videoUrls.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="w-5 h-5" />
                <span>
                  {program.videoUrls.length} {tc('videos')}
                </span>
              </div>
            )}
          </div>

          {/* Package Tiers Info */}
          {(program.standardPrice != null || program.proPrice != null) && (
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-background rounded-lg border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1">{t('basicTier')}</p>
                <p className="text-lg font-bold text-foreground">${program.price}</p>
                <p className="text-xs text-faint-foreground">{t('noLimit')}</p>
              </div>
              {program.standardPrice != null && (
                <div className="p-3 bg-background rounded-lg border border-blue-500/30 text-center">
                  <p className="text-xs text-blue-400 mb-1">{t('standardTier')}</p>
                  <p className="text-lg font-bold text-foreground">${program.standardPrice}</p>
                  <p className="text-xs text-faint-foreground">
                    {program.maxStandardSpots
                      ? `${program.maxStandardSpots} ${t('spots')}`
                      : t('noLimit')}
                  </p>
                </div>
              )}
              {program.proPrice != null && (
                <div className="p-3 bg-background rounded-lg border border-purple-500/30 text-center">
                  <p className="text-xs text-purple-400 mb-1">{t('proTier')}</p>
                  <p className="text-lg font-bold text-foreground">${program.proPrice}</p>
                  <p className="text-xs text-faint-foreground">
                    {program.maxProSpots
                      ? `${program.maxProSpots} ${t('spots')}`
                      : t('noLimit')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{tp('description')}</h3>
            <p className="text-foreground leading-relaxed">{program.description}</p>
          </div>

          {program.detailedDescription && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t('detailedDescriptionLabel')}
              </h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {program.detailedDescription}
              </p>
            </div>
          )}

          {/* Videos */}
          {program.videoUrls && program.videoUrls.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('trainingVideos')}</h3>
              <div className="space-y-2">
                {program.videoUrls.map((url, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-border bg-background">
                    <video
                      src={getMediaUrl(url) || ''}
                      controls
                      className="w-full rounded-t-lg"
                    />
                    {(program.videos?.[i]?.title || program.videos?.[i]?.description) && (
                      <div className="px-3 py-2">
                        {program.videos?.[i]?.title && (
                          <p className="text-sm font-semibold text-foreground">{program.videos[i].title}</p>
                        )}
                        {program.videos?.[i]?.description && (
                          <p className="text-xs text-muted-foreground mt-1">{program.videos[i].description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() =>
                router.push(`/trainer/programs/new?edit=${program.id}&category=${program.category}`)
              }
              className={`flex-1 py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
            >
              <Edit className="w-5 h-5" />
              {tc('edit')}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="py-3 px-4 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-center text-xs text-faint-foreground">
            {t('programCode')}:{' '}
            <span className="text-muted-foreground font-mono">{program.code}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
