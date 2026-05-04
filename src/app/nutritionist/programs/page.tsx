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

export default function NutritionistProgramsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accent = useAccentColors()
  const t = useTranslations('programs')
  const tp = useTranslations('profile')
  const tc = useTranslations('common')

  const [mealPrograms, setMealPrograms] = useState<MealProgramDto[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ProgramCategory>('Diet')
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
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">{t('title')}</h1>
            <p className="text-muted-foreground">{t('description')}</p>
          </div>
          <button
            onClick={() => router.push(`/nutritionist/programs/new?category=${activeTab}`)}
            className={`px-4 py-2 bg-gradient-to-r ${accent.gradient} text-white font-semibold rounded-lg hover:opacity-90 flex items-center gap-2`}
          >
            <Plus className="w-5 h-5" />
            {t('createProgram')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-background rounded-xl p-1 w-fit border border-border">
          <button
            onClick={() => setActiveTab('Diet')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'Diet'
                ? `bg-gradient-to-r ${accent.gradient} text-white shadow-lg`
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Apple className="w-4 h-4" />
            {t('tabMeal')}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === 'Diet' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {allPrograms.filter(p => p.category === 'Diet').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('Consultation')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'Consultation'
                ? 'bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t('tabConsultation')}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              activeTab === 'Consultation' ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {allPrograms.filter(p => p.category === 'Consultation').length}
            </span>
          </button>
        </div>

        {/* Stats */}
        {activeTab === 'Diet' && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('totalMealPrograms'), value: dietStats.total.toString(), icon: Apple },
              { label: t('totalPurchases'), value: dietStats.purchases.toString(), icon: Users },
              { label: t('averageRating'), value: dietStats.avgRating, icon: Star },
              { label: t('totalReviews'), value: dietStats.reviews.toString(), icon: TrendingUp },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-3 rounded-xl border border-border p-4"
              >
                <stat.icon className={`w-6 h-6 ${accent.text} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}
        {activeTab === 'Consultation' && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('totalConsultations'), value: consultationStats.total.toString(), icon: MessageSquare },
              { label: t('totalPurchases'), value: consultationStats.purchases.toString(), icon: Users },
              { label: t('averageRating'), value: consultationStats.avgRating, icon: Star },
              { label: t('totalReviews'), value: consultationStats.reviews.toString(), icon: TrendingUp },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-3 rounded-xl border border-border p-4"
              >
                <stat.icon className={`w-6 h-6 ${accent.text} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-faint-foreground focus:outline-none ${accent.border}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrograms.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-surface-3 rounded-xl border border-border overflow-hidden group hover:border-border transition-all cursor-pointer"
                onClick={() => router.push(`/nutritionist/programs/${program.id}`)}
              >
                <div className="relative">
                  <img
                    src={program.coverImageUrl ? getMediaUrl(program.coverImageUrl) || 'https://via.placeholder.com/400x200?text=No+Image' : 'https://via.placeholder.com/400x200?text=No+Image'}
                    alt={program.title}
                    className="w-full h-40 object-cover"
                  />
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
                    <span className={`px-2 py-1 text-xs font-bold rounded text-foreground flex items-center gap-1 ${
                      program.category === 'Diet' ? 'bg-green-600' : 'bg-violet-600'
                    }`}>
                      {program.category === 'Diet' ? (
                        <><Apple className="w-3 h-3" />{t('tabMeal')}</>
                      ) : (
                        <><MessageSquare className="w-3 h-3" />{t('tabConsultation')}</>
                      )}
                    </span>
                    {!program.isPublic && (
                      <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-600 text-foreground flex items-center gap-1">
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
                  <h3 className={`font-bold text-foreground mb-2 ${accent.hoverText} transition-colors`}>
                    {program.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{program.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {program.totalPurchases} {tc('purchases')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      {program.averageRating.toFixed(1)} ({program.totalReviews})
                    </div>
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
                    <span className="text-xs text-faint-foreground">
                      {new Date(program.createdAt).toLocaleDateString('ru-RU')}
                    </span>
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
