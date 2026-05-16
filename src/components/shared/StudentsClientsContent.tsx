'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  Activity,
  MessageCircle,
  UserRound,
  Star,
  Loader2,
} from 'lucide-react'
import { getMediaUrl } from '@/lib/config'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

export interface ClientOrStudent {
  id: string
  firstName?: string
  lastName?: string
  fullName: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  role?: string | number | null
  name: string
}

interface StudentsClientsContentProps {
  fetchData: () => Promise<ClientOrStudent[]>
}

export function StudentsClientsContent({ fetchData }: StudentsClientsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('students')
  const tc = useTranslations('common')

  // Derive role + base path from current route
  const segment = pathname?.split('/')[1] || 'user'
  const role: 'trainer' | 'nutritionist' | 'user' =
    segment === 'nutritionist' ? 'nutritionist' : segment === 'trainer' ? 'trainer' : 'user'
  const accent = getAccentColorsByRole(role)
  const basePath = `/${segment}`

  const [students, setStudents] = useState<ClientOrStudent[]>([])
  const [filteredStudents, setFilteredStudents] = useState<ClientOrStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await fetchData()
        setStudents(data)
        setFilteredStudents(data)
      } catch (error) {
        console.error('Failed to load students/clients:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.email.toLowerCase().includes(query) ||
            s.phone?.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, students])

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accent.primary }} />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">{t('description')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={<Users className="w-5 h-5" style={{ color: accent.primary }} />}
          label={t('totalStudents')}
          value={students.length}
          accent={accent}
        />
        <StatCard
          icon={<Activity className="w-5 h-5" style={{ color: accent.primary }} />}
          label={t('active')}
          value={students.length}
          accent={accent}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" style={{ color: accent.primary }} />}
          label={t('todaySessions')}
          value={0}
          accent={accent}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 w-full rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle pl-10 pr-4 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 transition-all"
          style={{ ['--tw-ring-color' as never]: `${accent.primary}55` }}
        />
      </div>

      {/* List */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-10 text-center">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ring-1 ring-inset ring-border-subtle"
            style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
          >
            <Users className="w-6 h-6" style={{ color: accent.primary }} />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            {searchQuery ? t('notFound') : t('noStudents')}
          </h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {searchQuery ? t('tryDifferentSearch') : t('willAppear')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="group rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => router.push(`${pathname}/${student.id}`)}
                  className="shrink-0"
                  aria-label={t('viewProfile')}
                >
                  {student.avatarUrl ? (
                    <img
                      src={getMediaUrl(student.avatarUrl) || ''}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-background"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-background"
                      style={{
                        background: (() => {
                          const c = getAccentColorsByRole((student.role as 'trainer' | 'nutritionist' | 'user') || 'user')
                          return `linear-gradient(135deg, ${c.primary}, ${c.secondary})`
                        })(),
                      }}
                    >
                      {getInitials(student.name)}
                    </div>
                  )}
                </button>
                <button
                  onClick={() => router.push(`${pathname}/${student.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h3 className="truncate text-sm font-semibold text-foreground hover:underline">
                    {student.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{t('student')}</p>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push(`${basePath}/messages?userId=${student.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold ring-1 ring-inset hover:brightness-110 active:scale-[0.99] transition-all"
                  style={{
                    color: accent.primary,
                    backgroundColor: `${accent.primary}1a`,
                    ['--tw-ring-color' as never]: `${accent.primary}55`,
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('write')}
                </button>
                <button
                  onClick={() => router.push(`${pathname}/${student.id}`)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                  title="Оценить"
                  aria-label="Оценить студента"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push(`${basePath}/profile/${student.id}`)}
                  className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
                  title={t('viewProfile')}
                  aria-label={t('viewProfile')}
                >
                  <UserRound className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* hint for tc usage to silence unused var warning if any */}
      <span className="sr-only">{tc('search')}</span>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: { primary: string; secondary: string }
}) {
  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border-subtle"
          style={{ background: `linear-gradient(135deg, ${accent.primary}1f, ${accent.secondary}10)` }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </div>
  )
}
