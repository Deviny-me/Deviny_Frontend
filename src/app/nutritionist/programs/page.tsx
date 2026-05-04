'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Plus,
  Users,
  Star,
  Search,
  Edit,
  Trash2,
  TrendingUp,
  Loader2,
  Video,
  Apple,
  MessageSquare,
  EyeOff,
} from 'lucide-react'
import { nutritionistProgramsApi } from '@/lib/api/nutritionistProgramsApi'
import { MealProgramDto, ProgramCategory } from '@/types/program'
import { getMediaUrl } from '@/lib/config'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

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
  averageRating: number
  totalReviews: number
  totalPurchases: number
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
    averageRating: 0,
    totalReviews: 0,
    totalPurchases: 0,
  }
}

const CATEGORY_META: Record<'Diet' | 'Consultation', { Icon: typeof Apple; labelKey: 'tabMeal' | 'tabConsultation' }> = {
  Diet: { Icon: Apple, labelKey: 'tabMeal' },
  Consultation: { Icon: MessageSquare, labelKey: 'tabConsultation' },
}

export default function NutritionistProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('programs')
  const tc = useTranslations('common')

  const accent = getAccentColorsByRole('nutritionist')

  const [mealPrograms, setMealPrograms] = useState<MealProgramDto[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'Diet' | 'Consultation'>('Diet')
  const [searchQuery, setSearchQuery] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadMealPrograms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const currentPrograms = allPrograms.filter(p => p.category === activeTab)

  const filteredPrograms = currentPrograms.filter(p => {
    if (!searchQuery) return true
    return p.title.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const dietPrograms = allPrograms.filter(p => p.category === 'Diet')
  const consultationPrograms = allPrograms.filter(p => p.category === 'Consultation')

  const dietStats = {
    total: dietPrograms.length,
    purchases: dietPrograms.reduce((acc, p) => acc + p.totalPurchases, 0),
    avgRating: dietPrograms.length > 0
      ? (dietPrograms.reduce((a, p) => a + p.averageRating, 0) / dietPrograms.length).toFixed(1)
      : '0',
    reviews: dietPrograms.reduce((a, p) => a + p.totalReviews, 0),
  }

  const consultationStats = {
    total: consultationPrograms.length,
    purchases: consultationPrograms.reduce((acc, p) => acc + p.totalPurchases, 0),
    avgRating: consultationPrograms.length > 0
      ? (consultationPrograms.reduce((a, p) => a + p.averageRating, 0) / consultationPrograms.length).toFixed(1)
      : '0',
    reviews: consultationPrograms.reduce((a, p) => a + p.totalReviews, 0),
  }

  const currentStats = activeTab === 'Diet' ? dietStats : consultationStats
  const totalLabel = activeTab === 'Diet' ? t('totalMealPrograms') : t('totalConsultations')
  const TotalIcon = activeTab === 'Diet' ? Apple : MessageSquare

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
    <div className="space-y-4 sm:space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('description')}</p>
        </div>
        <button
          onClick={() => router.push(`/nutritionist/programs/new?category=${activeTab}`)}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 sm:px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
          style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('createProgram')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-surface-1 ring-1 ring-inset ring-border-subtle rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {(['Diet', 'Consultation'] as const).map((cat) => {
          const meta = CATEGORY_META[cat]
          const Icon = meta.Icon
          const isActive = activeTab === cat
          const count = allPrograms.filter(p => p.category === cat).length
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                isActive ? 'text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={isActive ? { background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` } : undefined}
            >
              <Icon className="w-4 h-4" />
              {t(meta.labelKey)}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums ${
                isActive ? 'bg-white/25' : 'bg-surface-3'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TotalIcon} value={currentStats.total.toString()} label={totalLabel} accent={accent} />
        <StatCard icon={Users} value={currentStats.purchases.toString()} label={t('totalPurchases')} accent={accent} />
        <StatCard icon={Star} value={currentStats.avgRating} label={t('averageRating')} accent={accent} />
        <StatCard icon={TrendingUp} value={currentStats.reviews.toString()} label={t('totalReviews')} accent={accent} />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle text-foreground text-sm placeholder:text-faint-foreground focus:outline-none focus:ring-2 transition-all"
          style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
        </div>
      ) : filteredPrograms.length === 0 ? (
        <EmptyState
          icon={CATEGORY_META[activeTab].Icon}
          title={activeTab === 'Diet' ? t('noMealPrograms') : t('noConsultations')}
          message={activeTab === 'Diet' ? t('createFirstMeal') : t('createFirstConsultation')}
          ctaLabel={t('createProgram')}
          onCta={() => router.push(`/nutritionist/programs/new?category=${activeTab}`)}
          accent={accent}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPrograms.map((program, index) => (
            <ProgramCard
              key={program.id}
              program={program}
              index={index}
              onClick={() => router.push(`/nutritionist/programs/${program.id}`)}
              onEdit={() => router.push(`/nutritionist/programs/new?edit=${program.id}&category=${program.category}`)}
              onDelete={() => handleDelete(program)}
              deleting={deleting === program.id}
              accent={accent}
              t={t}
              tc={tc}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// --- Subcomponents ---

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof Users
  value: string
  label: string
  accent: { primary: string; secondary: string }
}) {
  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-border-subtle"
          style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent.primary }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground tabular-nums leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-tight truncate">{label}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
  accent,
}: {
  icon: typeof Users
  title: string
  message: string
  ctaLabel: string
  onCta: () => void
  accent: { primary: string; secondary: string }
}) {
  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-10 text-center">
      <div
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ring-inset ring-border-subtle mb-4"
        style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
      >
        <Icon className="w-6 h-6" style={{ color: accent.primary }} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-5">{message}</p>
      <button
        onClick={onCta}
        className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
        style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
      >
        {ctaLabel}
      </button>
    </div>
  )
}

function ProgramCard({
  program,
  index,
  onClick,
  onEdit,
  onDelete,
  deleting,
  accent,
  t,
  tc,
}: {
  program: UnifiedProgram
  index: number
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
  accent: { primary: string; secondary: string }
  t: ReturnType<typeof useTranslations>
  tc: ReturnType<typeof useTranslations>
}) {
  const meta = CATEGORY_META[program.category as 'Diet' | 'Consultation']
  const Icon = meta.Icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3) }}
      onClick={onClick}
      className="group rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-3">
        {program.coverImageUrl ? (
          <img
            src={getMediaUrl(program.coverImageUrl) || ''}
            alt={program.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${accent.primary}22, ${accent.secondary}11)` }}
          >
            <Icon className="w-12 h-12" style={{ color: accent.primary }} />
          </div>
        )}

        {/* Top-left: category + private */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 h-7 text-[11px] font-semibold text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(meta.labelKey)}
          </span>
          {!program.isPublic && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 h-7 text-[11px] font-semibold text-white bg-black/45 ring-1 ring-inset ring-white/15 backdrop-blur-md">
              <EyeOff className="w-3 h-3" />
              {t('private')}
            </span>
          )}
        </div>

        {/* Top-right: actions */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md ring-1 ring-inset ring-white/15 flex items-center justify-center text-white hover:bg-black/75 transition-all"
            aria-label="Edit"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            disabled={deleting}
            className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md ring-1 ring-inset ring-white/15 flex items-center justify-center text-red-400 hover:bg-black/75 transition-all disabled:opacity-50"
            aria-label="Delete"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Bottom-right: price stack */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full px-2.5 h-7 text-[11px] font-bold text-white bg-black/55 ring-1 ring-inset ring-white/15 backdrop-blur-md tabular-nums">
            ${program.price}
          </span>
          {program.standardPrice != null && (
            <span className="hidden sm:inline-flex items-center rounded-full px-2 h-7 text-[10px] font-semibold text-amber-300 bg-black/55 ring-1 ring-inset ring-amber-300/30 backdrop-blur-md tabular-nums">
              STD ${program.standardPrice}
            </span>
          )}
          {program.proPrice != null && (
            <span className="hidden sm:inline-flex items-center rounded-full px-2 h-7 text-[10px] font-semibold text-purple-300 bg-black/55 ring-1 ring-inset ring-purple-300/30 backdrop-blur-md tabular-nums">
              PRO ${program.proPrice}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-base leading-snug mb-1.5 line-clamp-1">
          {program.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{program.description}</p>

        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-3">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Users className="w-3.5 h-3.5" />
            {program.totalPurchases}
          </span>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            {program.averageRating.toFixed(1)}
            <span className="text-faint-foreground">({program.totalReviews})</span>
          </span>
          {program.videoUrls && program.videoUrls.length > 0 && (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Video className="w-3.5 h-3.5" />
              {program.videoUrls.length}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-[11px] text-faint-foreground">
          <span className="font-mono">{program.code}</span>
          <span>{new Date(program.createdAt).toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    </motion.div>
  )
}
