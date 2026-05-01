'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Video,
  Apple,
  MessageSquare,
  EyeOff,
  ChevronRight,
} from 'lucide-react'
import { nutritionistProgramsApi } from '@/lib/api/nutritionistProgramsApi'
import { MealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

type UnifiedProgram = {
  id: string
  title: string
  description: string
  detailedDescription?: string
  price: number
  standardPrice?: number
  proPrice?: number
  maxStandardSpots?: number
  maxProSpots?: number
  code: string
  coverImageUrl: string
  createdAt: string
  updatedAt: string
  isPublic: boolean
  videoUrls?: string[]
  category: ProgramCategory
}

function toUnified(p: MealProgramDto): UnifiedProgram {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    detailedDescription: p.detailedDescription,
    price: p.price,
    standardPrice: p.standardPrice,
    proPrice: p.proPrice,
    maxStandardSpots: p.maxStandardSpots,
    maxProSpots: p.maxProSpots,
    code: p.code,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    isPublic: p.isPublic ?? true,
    videoUrls: p.videoUrls,
    category: (p.category as ProgramCategory) || 'Diet',
  }
}

export default function NutritionistProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accent = useAccentColors()
  const t = useTranslations('programs')
  const tp = useTranslations('profile')
  const tc = useTranslations('common')

  // Data
  const [mealPrograms, setMealPrograms] = useState<MealProgramDto[]>([])
  const [loading, setLoading] = useState(false)

  // Tabs & category
  const [activeTab, setActiveTab] = useState<ProgramCategory>('Diet')

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadMealPrograms()
  }, [])

  // Deep link: ?program=<id> → redirect to detail page
  useEffect(() => {
    const programId = searchParams.get('program')
    if (!programId) return
    router.replace(`/nutritionist/programs/${programId}`)
  }, [searchParams, router])

  const loadMealPrograms = async () => {
    try {
      setLoading(true)
      const data = await nutritionistProgramsApi.getMyPrograms()
      setMealPrograms(data)
    } catch (error) {
      console.error('Failed to load meal programs:', error)
      toast.error(t('toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useRealtimeScopeRefresh(['programs', 'purchases'], () => {
    loadMealPrograms()
  })

  const allPrograms = mealPrograms.map(toUnified)

  const filteredPrograms = allPrograms.filter(p => {
    if (p.category !== activeTab) return false
    if (!searchQuery) return true
    return p.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const dietCount = allPrograms.filter(p => p.category === 'Diet').length
  const consultationCount = allPrograms.filter(p => p.category === 'Consultation').length

  const handleDelete = async (program: UnifiedProgram) => {
    if (!confirm(t('toasts.deleteConfirm'))) return

    try {
      setDeleting(program.id)
      await nutritionistProgramsApi.deleteProgram(program.id)
      await loadMealPrograms()
      toast.success(t('toasts.deleted'))
    } catch (error) {
      console.error('Failed to delete program:', error)
      toast.error(t('toasts.deleteError'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="space-y-5 pb-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="page-title">{t('title')}</h1>
            <p className="page-subtitle">{t('description')}</p>
          </div>
          <button 
            onClick={() => router.push(`/nutritionist/programs/new?category=${activeTab}`)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-semibold text-white hover:opacity-90 sm:w-auto ${accent.gradient}`}
          >
            <Plus className="h-4.5 w-4.5" />
            {t('createProgram')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { cat: 'Diet' as ProgramCategory, count: dietCount, icon: Apple, label: t('totalMealPrograms'), color: 'text-green-400' },
            { cat: 'Consultation' as ProgramCategory, count: consultationCount, icon: MessageSquare, label: t('totalConsultations'), color: 'text-violet-400' },
          ].map(({ cat, count, icon: Icon, label, color }) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border-subtle bg-surface-2/50 p-4"
            >
              <Icon className={`w-6 h-6 ${color} mb-2`} />
              <p className="text-xl font-bold text-foreground sm:text-2xl">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="-mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-2">
          {([
            { cat: 'Diet' as ProgramCategory, icon: Apple, label: t('tabMeal'), count: dietCount, activeClass: 'border-green-500/30 bg-green-500/15 text-green-400', badgeClass: 'bg-green-500/20 text-green-300' },
            { cat: 'Consultation' as ProgramCategory, icon: MessageSquare, label: t('tabConsultation'), count: consultationCount, activeClass: 'border-violet-500/30 bg-violet-500/15 text-violet-400', badgeClass: 'bg-violet-500/20 text-violet-300' },
          ] as const).map(({ cat, icon: Icon, label, count, activeClass, badgeClass }) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === cat
                  ? activeClass
                  : 'border-border-subtle bg-surface-2/50 text-muted-foreground hover:bg-hover-overlay hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`ml-1 rounded px-1.5 py-0.5 text-xs ${
                activeTab === cat ? badgeClass : 'bg-white/10 text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border border-[rgba(148,163,184,0.18)] bg-background pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-faint-foreground focus:border-[rgba(148,163,184,0.28)] focus:outline-none"
            />
          </div>
        </div>

        {/* Programs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className={`w-8 h-8 ${accent.text} animate-spin`} />
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            {activeTab === 'Diet' ? (
              <Apple className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            ) : (
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            )}
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {activeTab === 'Diet' ? t('noMealPrograms') : t('noConsultations')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {activeTab === 'Diet' ? t('createFirstMeal') : t('createFirstConsultation')}
            </p>
            <button 
              onClick={() => router.push(`/nutritionist/programs/new?category=${activeTab}`)}
              className={`px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90`}
            >
              {t('createProgram')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-surface-3 transition-all hover:border-border"
                onClick={() => router.push(`/nutritionist/programs/${program.id}`)}
              >
                <div className="relative">
                  <img
                    src={program.coverImageUrl ? getMediaUrl(program.coverImageUrl) || 'https://via.placeholder.com/400x200?text=No+Image' : 'https://via.placeholder.com/400x200?text=No+Image'}
                    alt={program.title}
                    className="h-40 w-full object-cover sm:h-44"
                  />
                  <div className="absolute left-3 top-3 flex max-w-[calc(100%-5.5rem)] flex-wrap gap-2">
                    <span className={`rounded px-2 py-1 text-xs font-bold text-white ${accent.bg}`}>
                      ${program.price}
                    </span>
                    {program.standardPrice != null && (
                      <span className="rounded bg-blue-600 px-2 py-1 text-xs font-bold text-white">
                        STD ${program.standardPrice}
                      </span>
                    )}
                    {program.proPrice != null && (
                      <span className="rounded bg-purple-600 px-2 py-1 text-xs font-bold text-white">
                        PRO ${program.proPrice}
                      </span>
                    )}
                    <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-bold text-white ${
                      program.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                    }`}>
                      {program.category === 'Diet' ? (
                        <><Apple className="w-3 h-3" />{t('tabMeal')}</>
                      ) : (
                        <><MessageSquare className="w-3 h-3" />{t('tabConsultation')}</>
                      )}
                    </span>
                    {!program.isPublic && (
                      <span className="flex items-center gap-1 rounded bg-yellow-600 px-2 py-1 text-xs font-bold text-white">
                        <EyeOff className="w-3 h-3" />{t('private')}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/nutritionist/programs/new?edit=${program.id}&category=${program.category}`) }}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-black/70 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(program) }}
                      disabled={deleting === program.id}
                      className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-black/70 transition-all disabled:opacity-50"
                    >
                      {deleting === program.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`mb-2 text-base font-bold text-foreground transition-colors ${accent.hoverText}`}>
                    {program.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{program.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {program.videoUrls && program.videoUrls.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {program.videoUrls.length} {tc('videos')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-xs text-faint-foreground">
                      {t('programCode')}: {program.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-faint-foreground">
                        {new Date(program.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                      <ChevronRight className={`h-4 w-4 ${accent.text}`} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}
