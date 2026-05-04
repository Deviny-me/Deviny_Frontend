'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Upload,
  Loader2,
  Video,
  Plus,
  DollarSign,
  Dumbbell,
  Apple,
  MessageSquare,
  X,
  Eye,
  EyeOff,
  ImageIcon,
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

type VideoBlock = {
  id: string
  title: string
  description: string
  file: File | null
}

const DEFAULT_VIDEO_BLOCKS = 5

const createVideoBlock = (): VideoBlock => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  description: '',
  file: null,
})

const createDefaultVideoBlocks = (): VideoBlock[] =>
  Array.from({ length: DEFAULT_VIDEO_BLOCKS }, () => createVideoBlock())

const CATEGORY_OPTIONS: { value: ProgramCategory; Icon: typeof Dumbbell; labelKey: 'typeTraining' | 'typeMeal' | 'typeConsultation' }[] = [
  { value: 'Training', Icon: Dumbbell, labelKey: 'typeTraining' },
  { value: 'Diet', Icon: Apple, labelKey: 'typeMeal' },
  { value: 'Consultation', Icon: MessageSquare, labelKey: 'typeConsultation' },
]

export default function TrainerProgramFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('programs')
  const tc = useTranslations('common')

  const accent = getAccentColorsByRole('trainer')

  const editId = searchParams.get('edit')
  const defaultCategory = (searchParams.get('category') as ProgramCategory) || 'Training'
  const isEditing = !!editId

  const [formCategory, setFormCategory] = useState<ProgramCategory>(defaultCategory)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [price, setPrice] = useState('')
  const [standardPrice, setStandardPrice] = useState('')
  const [proPrice, setProPrice] = useState('')
  const [maxStandardSpots, setMaxStandardSpots] = useState('')
  const [maxProSpots, setMaxProSpots] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [videoBlocks, setVideoBlocks] = useState<VideoBlock[]>(createDefaultVideoBlocks())
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!editId) return
    const loadProgram = async () => {
      setLoading(true)
      try {
        const trainingProgs = await programsApi.getMyPrograms()
        const training = trainingProgs.find((p) => p.id === editId)
        if (training) {
          setFormCategory((training.category as ProgramCategory) || 'Training')
          setTitle(training.title)
          setDescription(training.description)
          setDetailedDescription(training.detailedDescription || '')
          setPrice(training.price.toString())
          setStandardPrice(training.standardPrice != null ? training.standardPrice.toString() : '')
          setProPrice(training.proPrice != null ? training.proPrice.toString() : '')
          setMaxStandardSpots(training.maxStandardSpots != null ? training.maxStandardSpots.toString() : '')
          setMaxProSpots(training.maxProSpots != null ? training.maxProSpots.toString() : '')
          setIsPublic(training.isPublic ?? true)
          setCoverPreview(training.coverImageUrl ? getMediaUrl(training.coverImageUrl) : null)
          setLoading(false)
          return
        }

        const mealProgs = await mealProgramsApi.getMyMealPrograms()
        const meal = mealProgs.find((p) => p.id === editId)
        if (meal) {
          setFormCategory((meal.category as ProgramCategory) || 'Diet')
          setTitle(meal.title)
          setDescription(meal.description)
          setDetailedDescription(meal.detailedDescription || '')
          setPrice(meal.price.toString())
          setStandardPrice(meal.standardPrice != null ? meal.standardPrice.toString() : '')
          setProPrice(meal.proPrice != null ? meal.proPrice.toString() : '')
          setMaxStandardSpots(meal.maxStandardSpots != null ? meal.maxStandardSpots.toString() : '')
          setMaxProSpots(meal.maxProSpots != null ? meal.maxProSpots.toString() : '')
          setIsPublic(meal.isPublic ?? true)
          setCoverPreview(meal.coverImageUrl ? getMediaUrl(meal.coverImageUrl) : null)
        }
      } catch (err) {
        console.error('Failed to load program:', err)
        toast.error(t('toasts.loadError'))
      } finally {
        setLoading(false)
      }
    }
    loadProgram()
  }, [editId, t])

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverImage(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleVideoFileChange = (index: number, file: File | null) => {
    setVideoBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, file } : block)))
  }

  const handleVideoTextChange = (index: number, field: 'title' | 'description', value: string) => {
    setVideoBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, [field]: value } : block)))
  }

  const addVideoBlock = () => setVideoBlocks((prev) => [...prev, createVideoBlock()])
  const removeVideoBlock = (index: number) => setVideoBlocks((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedVideoBlocks = videoBlocks.filter((b) => b.file !== null)
    const videoFiles = selectedVideoBlocks.map((b) => b.file).filter((f): f is File => f !== null)
    const trainingVideoTitles = selectedVideoBlocks.map((b) => b.title.trim())
    const trainingVideoDescriptions = selectedVideoBlocks.map((b) => b.description.trim())

    if (!title || !description) {
      toast.error(t('toasts.fillRequired'))
      return
    }
    if (!isEditing && !coverImage) {
      toast.error(t('toasts.addCover'))
      return
    }

    try {
      setSaving(true)
      if (formCategory === 'Training' || formCategory === 'Consultation') {
        const payload = {
          title,
          description,
          detailedDescription: detailedDescription || undefined,
          price: price ? parseFloat(price) : 0,
          standardPrice: standardPrice ? parseFloat(standardPrice) : undefined,
          proPrice: proPrice ? parseFloat(proPrice) : undefined,
          maxStandardSpots: maxStandardSpots ? parseInt(maxStandardSpots) : undefined,
          maxProSpots: maxProSpots ? parseInt(maxProSpots) : undefined,
          category: formCategory,
          isPublic,
        }
        if (isEditing) {
          await programsApi.updateProgram(editId!, {
            ...payload,
            coverImage: coverImage || undefined,
            trainingVideos: videoFiles.length > 0 ? videoFiles : undefined,
            trainingVideoTitles: videoFiles.length > 0 ? trainingVideoTitles : undefined,
            trainingVideoDescriptions: videoFiles.length > 0 ? trainingVideoDescriptions : undefined,
          })
          toast.success(t('toasts.updated'))
        } else {
          await programsApi.createProgram({
            ...payload,
            coverImage: coverImage!,
            trainingVideos: videoFiles,
            trainingVideoTitles,
            trainingVideoDescriptions,
          })
          toast.success(t('toasts.created'))
        }
      } else {
        const payload = {
          title,
          description,
          detailedDescription: detailedDescription || undefined,
          price: price ? parseFloat(price) : 0,
          standardPrice: standardPrice ? parseFloat(standardPrice) : undefined,
          proPrice: proPrice ? parseFloat(proPrice) : undefined,
          maxStandardSpots: maxStandardSpots ? parseInt(maxStandardSpots) : undefined,
          maxProSpots: maxProSpots ? parseInt(maxProSpots) : undefined,
          category: formCategory,
          isPublic,
        }
        if (isEditing) {
          await mealProgramsApi.updateMealProgram(editId!, {
            ...payload,
            coverImage: coverImage || undefined,
            videos: videoFiles.length > 0 ? videoFiles : undefined,
          })
          toast.success(t('toasts.updated'))
        } else {
          await mealProgramsApi.createMealProgram({
            ...payload,
            coverImage: coverImage!,
            videos: videoFiles,
          })
          toast.success(t('toasts.created'))
        }
      }
      router.push('/trainer/programs')
    } catch (error) {
      console.error('Failed to save program:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      toast.error(isEditing ? `${t('toasts.updateError')}: ${message}` : `${t('toasts.createError')}: ${message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
      </div>
    )
  }

  const titleText = isEditing
    ? formCategory === 'Training'
      ? t('editTrainingProgram')
      : formCategory === 'Diet'
      ? t('editMealProgram')
      : t('editConsultation')
    : formCategory === 'Training'
    ? t('newTrainingProgram')
    : formCategory === 'Diet'
    ? t('newMealProgram')
    : t('newConsultation')

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

      {/* Header */}
      <div>
        <h1 className="page-title">{titleText}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Category selector — only for new */}
        {!isEditing && (
          <FormSection title={t('programType')} accent={accent}>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {CATEGORY_OPTIONS.map(({ value, Icon, labelKey }) => {
                const isActive = formCategory === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormCategory(value)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all ring-1 ring-inset ${
                      isActive
                        ? 'text-white shadow-md ring-transparent'
                        : 'bg-surface-2 ring-border-subtle text-muted-foreground hover:text-foreground hover:bg-surface-3'
                    }`}
                    style={isActive ? { background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` } : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {t(labelKey)}
                  </button>
                )
              })}
            </div>
          </FormSection>
        )}

        {/* Cover image */}
        <FormSection title={t('coverImage')} accent={accent}>
          {coverPreview ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-surface-3">
              <img src={coverPreview} alt="Cover preview" className="absolute inset-0 h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setCoverImage(null)
                  setCoverPreview(null)
                }}
                className="absolute top-2.5 right-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur-md ring-1 ring-inset ring-white/15 text-white hover:bg-black/75 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full aspect-[16/9] rounded-xl bg-surface-2 ring-1 ring-inset ring-dashed ring-border-subtle cursor-pointer hover:bg-surface-3 transition-colors">
              <div
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-inset ring-border-subtle mb-2.5"
                style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
              >
                <ImageIcon className="w-5 h-5" style={{ color: accent.primary }} />
              </div>
              <span className="text-sm font-medium text-foreground">{t('clickToUpload')}</span>
              <span className="text-xs text-muted-foreground mt-0.5">PNG, JPG · 16:9</span>
              <input type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
            </label>
          )}
        </FormSection>

        {/* Basic info */}
        <FormSection accent={accent}>
          <div className="space-y-3">
            <FieldLabel label={t('nameLabel')}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 transition-all"
                style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                placeholder={t('namePlaceholder')}
              />
            </FieldLabel>

            <FieldLabel label={t('descriptionLabel')}>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 resize-none transition-all"
                style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                placeholder={t('descriptionPlaceholder')}
              />
            </FieldLabel>

            <FieldLabel label={t('detailedDescriptionLabel')}>
              <textarea
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 resize-none transition-all"
                style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                placeholder={t('detailedDescriptionPlaceholder')}
              />
            </FieldLabel>
          </div>
        </FormSection>

        {/* Pricing */}
        <FormSection title={t('basicPriceLabel')} accent={accent}>
          <FieldLabel label={t('basicPriceLabel')} hint={t('basicPriceHint')}>
            <PriceInput value={price} onChange={setPrice} accent={accent} placeholder="0.00" />
          </FieldLabel>

          <div className="mt-3 grid gap-3">
            {/* Standard tier */}
            <TierBlock
              title={t('standardTierLabel')}
              hint={t('standardTierHint')}
              titleColor="text-amber-400"
              ringColor="ring-amber-500/30"
            >
              <FieldLabel label={t('standardPriceLabel')} small>
                <PriceInput value={standardPrice} onChange={setStandardPrice} accent={accent} placeholder={t('standardPricePlaceholder')} />
              </FieldLabel>
              {standardPrice && (
                <FieldLabel label={t('maxStandardSpotsLabel')} small>
                  <input
                    type="number"
                    value={maxStandardSpots}
                    onChange={(e) => setMaxStandardSpots(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full h-10 px-3.5 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 transition-all"
                    style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                    placeholder={t('maxSpotsPlaceholder')}
                  />
                </FieldLabel>
              )}
            </TierBlock>

            {/* Pro tier */}
            <TierBlock
              title={t('proTierLabel')}
              hint={t('proTierHint')}
              titleColor="text-purple-400"
              ringColor="ring-purple-500/30"
            >
              <FieldLabel label={t('proPriceLabel')} small>
                <PriceInput value={proPrice} onChange={setProPrice} accent={accent} placeholder={t('proPricePlaceholder')} />
              </FieldLabel>
              {proPrice && (
                <FieldLabel label={t('maxProSpotsLabel')} small>
                  <input
                    type="number"
                    value={maxProSpots}
                    onChange={(e) => setMaxProSpots(e.target.value)}
                    min="1"
                    step="1"
                    className="w-full h-10 px-3.5 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 transition-all"
                    style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                    placeholder={t('maxSpotsPlaceholder')}
                  />
                </FieldLabel>
              )}
            </TierBlock>
          </div>
        </FormSection>

        {/* Visibility */}
        <FormSection title={t('visibility')} accent={accent}>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl ring-1 ring-inset transition-all ${
              isPublic
                ? 'bg-emerald-500/10 ring-emerald-500/30'
                : 'bg-amber-500/10 ring-amber-500/30'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isPublic ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </div>
              <div className="text-left min-w-0">
                <p className={`text-sm font-semibold ${isPublic ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isPublic ? t('visibilityPublic') : t('visibilityPrivate')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isPublic ? t('visibilityPublicHint') : t('visibilityPrivateHint')}
                </p>
              </div>
            </div>
            <div className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-surface-3'}`}>
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isPublic ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        </FormSection>

        {/* Videos */}
        {formCategory !== 'Consultation' && (
          <FormSection title={t('trainingVideos')} accent={accent}>
            <div className="space-y-2.5">
              {videoBlocks.map((block, index) => (
                <div key={block.id} className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-inset ring-border-subtle"
                        style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
                      >
                        <Video className="w-3.5 h-3.5" style={{ color: accent.primary }} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {t('exerciseBlock', { number: index + 1 })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVideoBlock(index)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title={t('removeVideo')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => handleVideoTextChange(index, 'title', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 transition-all"
                    style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                    placeholder={t('exerciseTitlePlaceholder')}
                  />

                  <textarea
                    value={block.description}
                    onChange={(e) => handleVideoTextChange(index, 'description', e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 resize-none transition-all"
                    style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
                    placeholder={t('exerciseDescriptionPlaceholder')}
                  />

                  <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-surface-1 ring-1 ring-inset ring-dashed ring-border-subtle cursor-pointer hover:bg-surface-3 transition-colors">
                    <Video className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground truncate">
                      {block.file ? block.file.name : t('addVideo')}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleVideoFileChange(index, e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                  </label>
                </div>
              ))}

              <button
                type="button"
                onClick={addVideoBlock}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-surface-2 ring-1 ring-inset ring-dashed ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('addExerciseBlock')}
              </button>
            </div>
          </FormSection>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? t('saveChanges') : t('createProgram')}
        </button>
      </form>
    </div>
  )
}

// --- Helpers ---

function FormSection({
  title,
  accent: _accent,
  children,
}: {
  title?: string
  accent: { primary: string; secondary: string }
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
      {title && (
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

function FieldLabel({
  label,
  children,
  hint,
  small,
}: {
  label: string
  children: React.ReactNode
  hint?: string
  small?: boolean
}) {
  return (
    <div>
      <label className={`block ${small ? 'text-xs' : 'text-sm'} font-medium text-foreground mb-1.5`}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function PriceInput({
  value,
  onChange,
  accent,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  accent: { primary: string }
  placeholder: string
}) {
  return (
    <div className="relative">
      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        step="0.01"
        className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 tabular-nums transition-all"
        style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
        placeholder={placeholder}
      />
    </div>
  )
}

function TierBlock({
  title,
  hint,
  titleColor,
  ringColor,
  children,
}: {
  title: string
  hint: string
  titleColor: string
  ringColor: string
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl bg-surface-2 ring-1 ring-inset ${ringColor} p-3 sm:p-4 space-y-3`}>
      <h3 className={`text-sm font-semibold ${titleColor}`}>{title}</h3>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
