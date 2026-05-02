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
  Apple,
  MessageSquare,
  EyeOff,
} from 'lucide-react'
import { nutritionistProgramsApi } from '@/lib/api/nutritionistProgramsApi'
import { MealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors } from '@/lib/theme/useAccentColors'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

export default function NutritionistProgramDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const router = useRouter()
  const accent = useAccentColors()
  const t = useTranslations('programs')
  const tp = useTranslations('profile')
  const tc = useTranslations('common')

  const [program, setProgram] = useState<MealProgramDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadProgram = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const programs = await nutritionistProgramsApi.getMyPrograms()
      const found = programs.find((p: MealProgramDto) => p.id === id)
      if (found) {
        setProgram(found)
      } else {
        setError('Program not found')
      }
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
      await nutritionistProgramsApi.deleteProgram(program.id)
      toast.success(t('toasts.deleted'))
      router.push('/nutritionist/programs')
    } catch (err) {
      console.error('Failed to delete program:', err)
      toast.error(t('toasts.deleteError'))
    } finally {
      setDeleting(false)
    }
  }

  const category = (program?.category as ProgramCategory) || 'Diet'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
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
            onClick={() => router.push('/nutritionist/programs')}
            className={`mt-4 px-6 py-2 bg-gradient-to-r ${accent.gradient} text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity`}
          >
            {tc('back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">{tc('back')}</span>
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden">
        {program.coverImageUrl ? (
          <img
            src={getMediaUrl(program.coverImageUrl) || ''}
            alt={program.title}
            className="w-full h-80 sm:h-[26rem] object-cover"
          />
        ) : (
          <div className="w-full h-80 sm:h-[26rem] bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
            <BookOpen className="w-24 h-24 text-neutral-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top: category + visibility */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm border text-white flex items-center gap-1.5 ${
              category === 'Diet' ? 'bg-green-600/70 border-green-500/40' : 'bg-violet-600/70 border-violet-500/40'
            }`}
          >
            {category === 'Diet' ? (
              <Apple className="w-3 h-3" />
            ) : (
              <MessageSquare className="w-3 h-3" />
            )}
            {category === 'Diet' ? t('typeMeal') : t('typeConsultation')}
          </span>
          {!program.isPublic && (
            <span className="px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm bg-black/50 border border-white/20 text-white flex items-center gap-1.5">
              <EyeOff className="w-3 h-3" />
              {t('private')}
            </span>
          )}
        </div>

        {/* Bottom: title + stats + price */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 sm:px-6 sm:pb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3 drop-shadow-sm">
            {program.title}
          </h1>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="flex items-center gap-1.5 text-white/90 text-sm shrink-0">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold">{tp('noRating')}</span>
                <span className="text-white/50 text-xs">(0)</span>
              </span>
              <span className="text-white/30 text-sm">·</span>
              <span className="flex items-center gap-1.5 text-white/70 text-sm shrink-0">
                <Users className="w-4 h-4" />
                <span>0</span>
              </span>
              {program.videoUrls && program.videoUrls.length > 0 && (
                <>
                  <span className="text-white/30 text-sm">·</span>
                  <span className="flex items-center gap-1.5 text-white/70 text-sm shrink-0">
                    <Video className="w-4 h-4" />
                    <span>{program.videoUrls.length}</span>
                  </span>
                </>
              )}
            </div>
            <span className={`shrink-0 px-4 py-1.5 rounded-full ${accent.bg} text-white font-bold text-base shadow-lg`}>
              ${program.price}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 space-y-3">
        {/* Tier pricing */}
        {(program.standardPrice != null || program.proPrice != null) && (
          <div className="bg-surface-3 rounded-2xl border border-border p-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3.5 bg-background rounded-xl border border-border text-center">
                <p className="text-xs text-muted-foreground mb-1.5">{t('basicTier')}</p>
                <p className="text-xl font-bold text-foreground">${program.price}</p>
                <p className="text-xs text-faint-foreground mt-1">{t('noLimit')}</p>
              </div>
              {program.standardPrice != null && (
                <div className="p-3.5 bg-background rounded-xl border border-blue-500/30 text-center">
                  <p className="text-xs text-blue-400 mb-1.5">{t('standardTier')}</p>
                  <p className="text-xl font-bold text-foreground">${program.standardPrice}</p>
                  <p className="text-xs text-faint-foreground mt-1">
                    {program.maxStandardSpots
                      ? `${program.maxStandardSpots} ${t('spots')}`
                      : t('noLimit')}
                  </p>
                </div>
              )}
              {program.proPrice != null && (
                <div className="p-3.5 bg-background rounded-xl border border-purple-500/30 text-center">
                  <p className="text-xs text-purple-400 mb-1.5">{t('proTier')}</p>
                  <p className="text-xl font-bold text-foreground">${program.proPrice}</p>
                  <p className="text-xs text-faint-foreground mt-1">
                    {program.maxProSpots
                      ? `${program.maxProSpots} ${t('spots')}`
                      : t('noLimit')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-surface-3 rounded-2xl border border-border p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {tp('description')}
          </p>
          <p className="text-sm text-foreground leading-relaxed">{program.description}</p>
          {program.detailedDescription && (
            <>
              <div className="h-px bg-border my-4" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {t('detailedDescriptionLabel')}
              </p>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {program.detailedDescription}
              </p>
            </>
          )}
        </div>

        {/* Videos */}
        {program.videoUrls && program.videoUrls.length > 0 && (
          <div className="bg-surface-3 rounded-2xl border border-border p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {t('trainingVideos')}
            </p>
            <div className="space-y-3">
              {program.videoUrls.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-border bg-black">
                  <div className="aspect-video w-full bg-black flex items-center justify-center">
                    <video src={getMediaUrl(url) || ''} controls className="w-full h-full object-contain" />
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={() =>
              router.push(
                `/nutritionist/programs/new?edit=${program.id}&category=${category}`
              )
            }
            className={`flex-1 py-3.5 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
          >
            <Edit className="w-5 h-5" />
            {tc('edit')}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="py-3.5 px-4 border border-red-500/30 text-red-400 font-semibold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-faint-foreground">{t('programCode')}:</span>
          <span className="text-xs font-mono text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5">
            {program.code}
          </span>
        </div>
      </div>
    </div>
  )
}
