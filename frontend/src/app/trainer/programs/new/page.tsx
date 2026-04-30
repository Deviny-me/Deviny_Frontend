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
} from 'lucide-react'
import { programsApi } from '@/lib/api/programsApi'
import { mealProgramsApi } from '@/lib/api/mealProgramsApi'
import { ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

const accent = {
  gradient: 'from-[#f07915] to-[#d4600b]',
  border: 'focus:border-[#f07915]',
  hoverBorder: 'hover:border-[#f07915]/50',
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

export default function TrainerProgramFormPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('programs')
  const tc = useTranslations('common')

  const editId = searchParams.get('edit')
  const defaultCategory = (searchParams.get('category') as ProgramCategory) || 'Training'
  const isEditing = !!editId

  // Form state
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

  // Load existing program data for editing
  useEffect(() => {
    if (!editId) return
    const loadProgram = async () => {
      setLoading(true)
      try {
        // Try training programs first
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

        // Try meal programs
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
    setVideoBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, file } : block))
    )
  }

  const handleVideoTextChange = (index: number, field: 'title' | 'description', value: string) => {
    setVideoBlocks((prev) =>
      prev.map((block, i) => (i === index ? { ...block, [field]: value } : block))
    )
  }

  const addVideoBlock = () => {
    setVideoBlocks((prev) => [...prev, createVideoBlock()])
  }

  const removeVideoBlock = (index: number) => {
    setVideoBlocks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedVideoBlocks = videoBlocks.filter((block) => block.file !== null)
    const videoFiles = selectedVideoBlocks
      .map((block) => block.file)
      .filter((file): file is File => file !== null)
    const trainingVideoTitles = selectedVideoBlocks.map((block) => block.title.trim())
    const trainingVideoDescriptions = selectedVideoBlocks.map((block) => block.description.trim())

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
        if (isEditing) {
          await programsApi.updateProgram(editId!, {
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
            coverImage: coverImage || undefined,
            trainingVideos: videoFiles.length > 0 ? videoFiles : undefined,
            trainingVideoTitles: videoFiles.length > 0 ? trainingVideoTitles : undefined,
            trainingVideoDescriptions: videoFiles.length > 0 ? trainingVideoDescriptions : undefined,
          })
          toast.success(t('toasts.updated'))
        } else {
          await programsApi.createProgram({
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
            coverImage: coverImage!,
            trainingVideos: videoFiles,
            trainingVideoTitles,
            trainingVideoDescriptions,
          })
          toast.success(t('toasts.created'))
        }
      } else {
        // Diet
        if (isEditing) {
          await mealProgramsApi.updateMealProgram(editId!, {
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
            coverImage: coverImage || undefined,
            videos: videoFiles.length > 0 ? videoFiles : undefined,
          })
          toast.success(t('toasts.updated'))
        } else {
          await mealProgramsApi.createMealProgram({
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#f07915] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-6 max-w-2xl mx-auto">
      <div>
        <h1 className="page-title">
          {isEditing
            ? formCategory === 'Training'
              ? t('editTrainingProgram')
              : formCategory === 'Diet'
              ? t('editMealProgram')
              : t('editConsultation')
            : formCategory === 'Training'
            ? t('newTrainingProgram')
            : formCategory === 'Diet'
            ? t('newMealProgram')
            : t('newConsultation')}
        </h1>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">{tc('back')}</span>
      </button>

      <div className="bg-surface-3 rounded-xl border border-border overflow-hidden">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Program Category Selector — only for new programs */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t('programType')}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormCategory('Training')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formCategory === 'Training'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-border text-muted-foreground hover:border-border'
                    }`}
                  >
                    <Dumbbell className="w-5 h-5" />
                    {t('typeTraining')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('Diet')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formCategory === 'Diet'
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : 'border-border text-muted-foreground hover:border-border'
                    }`}
                  >
                    <Apple className="w-5 h-5" />
                    {t('typeMeal')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormCategory('Consultation')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formCategory === 'Consultation'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-400'
                        : 'border-border text-muted-foreground hover:border-border'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5" />
                    {t('typeConsultation')}
                  </button>
                </div>
              </div>
            )}

            {/* Cover Image */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('coverImage')}
              </label>
              <div className="relative">
                {coverPreview ? (
                  <div className="relative">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null)
                        setCoverPreview(null)
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-foreground hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-lg cursor-pointer ${accent.hoverBorder} transition-colors`}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">{t('clickToUpload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('nameLabel')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.border}`}
                placeholder={t('namePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('descriptionLabel')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.border} resize-none`}
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {/* Detailed Description */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('detailedDescriptionLabel')}
              </label>
              <textarea
                value={detailedDescription}
                onChange={(e) => setDetailedDescription(e.target.value)}
                rows={5}
                className={`w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.border} resize-none`}
                placeholder={t('detailedDescriptionPlaceholder')}
              />
            </div>

            {/* Price — Basic Tier */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('basicPriceLabel')}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className={`w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none ${accent.border}`}
                  placeholder="0.00"
                />
              </div>
              <p className="mt-1 text-xs text-faint-foreground">{t('basicPriceHint')}</p>
            </div>

            {/* Standard Tier */}
            <div className="p-4 bg-background rounded-lg border border-border space-y-3">
              <h4 className="text-sm font-semibold text-blue-400">{t('standardTierLabel')}</h4>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('standardPriceLabel')}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={standardPrice}
                    onChange={(e) => setStandardPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className={`w-full pl-9 pr-4 py-2 bg-[#111] border border-border rounded-lg text-foreground text-sm focus:outline-none ${accent.border}`}
                    placeholder={t('standardPricePlaceholder')}
                  />
                </div>
              </div>
              {standardPrice && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('maxStandardSpotsLabel')}
                  </label>
                  <input
                    type="number"
                    value={maxStandardSpots}
                    onChange={(e) => setMaxStandardSpots(e.target.value)}
                    min="1"
                    step="1"
                    className={`w-full px-4 py-2 bg-[#111] border border-border rounded-lg text-foreground text-sm focus:outline-none ${accent.border}`}
                    placeholder={t('maxSpotsPlaceholder')}
                  />
                </div>
              )}
              <p className="text-xs text-faint-foreground">{t('standardTierHint')}</p>
            </div>

            {/* Pro Tier */}
            <div className="p-4 bg-background rounded-lg border border-border space-y-3">
              <h4 className="text-sm font-semibold text-purple-400">{t('proTierLabel')}</h4>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {t('proPriceLabel')}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={proPrice}
                    onChange={(e) => setProPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    className={`w-full pl-9 pr-4 py-2 bg-[#111] border border-border rounded-lg text-foreground text-sm focus:outline-none ${accent.border}`}
                    placeholder={t('proPricePlaceholder')}
                  />
                </div>
              </div>
              {proPrice && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {t('maxProSpotsLabel')}
                  </label>
                  <input
                    type="number"
                    value={maxProSpots}
                    onChange={(e) => setMaxProSpots(e.target.value)}
                    min="1"
                    step="1"
                    className={`w-full px-4 py-2 bg-[#111] border border-border rounded-lg text-foreground text-sm focus:outline-none ${accent.border}`}
                    placeholder={t('maxSpotsPlaceholder')}
                  />
                </div>
              )}
              <p className="text-xs text-faint-foreground">{t('proTierHint')}</p>
            </div>

            {/* Visibility Toggle */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t('visibility')}
              </label>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                  isPublic
                    ? 'border-green-500/50 bg-green-500/10'
                    : 'border-yellow-500/50 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Eye className="w-5 h-5 text-green-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-yellow-400" />
                  )}
                  <div className="text-left">
                    <p className={`text-sm font-medium ${isPublic ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isPublic ? t('visibilityPublic') : t('visibilityPrivate')}
                    </p>
                    <p className="text-xs text-faint-foreground">
                      {isPublic ? t('visibilityPublicHint') : t('visibilityPrivateHint')}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-11 h-6 rounded-full relative transition-colors ${isPublic ? 'bg-green-500' : 'bg-gray-600'}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? 'translate-x-5' : 'translate-x-0.5'}`}
                  />
                </div>
              </button>
            </div>

            {/* Training Videos — hide for consultations */}
            {formCategory !== 'Consultation' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {t('trainingVideos')}
                </label>
                <div className="space-y-3">
                  {videoBlocks.map((block, index) => (
                    <div key={block.id} className="p-3 bg-background rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{t('exerciseBlock', { number: index + 1 })}</p>
                        <button
                          type="button"
                          onClick={() => removeVideoBlock(index)}
                          className="text-red-400 hover:text-red-300"
                          title={t('removeVideo')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) => handleVideoTextChange(index, 'title', e.target.value)}
                        className={`w-full px-3 py-2 bg-[#111] border border-border rounded-lg text-foreground text-sm focus:outline-none ${accent.border}`}
                        placeholder={t('exerciseTitlePlaceholder')}
                      />

                      <textarea
                        value={block.description}
                        onChange={(e) => handleVideoTextChange(index, 'description', e.target.value)}
                        rows={2}
                        className={`w-full px-3 py-2 bg-[#111] border border-border rounded-lg text-foreground text-sm focus:outline-none ${accent.border} resize-none`}
                        placeholder={t('exerciseDescriptionPlaceholder')}
                      />

                      <label
                        className={`flex items-center justify-center w-full py-2.5 border-2 border-dashed border-white/20 rounded-lg cursor-pointer ${accent.hoverBorder} transition-colors`}
                      >
                        <Video className="w-5 h-5 text-muted-foreground mr-2" />
                        <span className="text-sm text-muted-foreground">
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
                    className={`w-full py-2.5 border border-white/20 rounded-lg text-sm text-muted-foreground hover:text-foreground ${accent.hoverBorder} transition-colors flex items-center justify-center gap-2`}
                  >
                    <Plus className="w-4 h-4" />
                    {t('addExerciseBlock')}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              {isEditing ? t('saveChanges') : t('createProgram')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
