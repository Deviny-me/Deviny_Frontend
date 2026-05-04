'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Users,
  ShoppingBag,
  Layers,
  TrendingUp,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Dumbbell,
  Apple,
  MessageSquare,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { dashboardApi, DashboardStats } from '@/lib/api/dashboardApi'
import { getMediaUrl } from '@/lib/config'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'
import { getAccentColorsByRole } from '@/lib/theme/useAccentColors'

interface DashboardContentProps {
  /** kept for backwards-compat — values are derived from role */
  accentColor?: string
  accentGradient?: string
  role: 'trainer' | 'nutritionist'
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TIER_STANDARD_COLOR = '#F59E0B'
const TIER_PRO_COLOR = '#8B5CF6'

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  Training: Dumbbell,
  Diet: Apple,
  Consultation: MessageSquare,
}

export function DashboardContent({ role }: DashboardContentProps) {
  const t = useTranslations('dashboard')
  const accent = getAccentColorsByRole(role)
  const accentColor = accent.primary
  const accentSecondary = accent.secondary

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats(true)
  }, [])

  const loadStats = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      setError(null)
      const data = await dashboardApi.getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      if (isInitial) setLoading(false)
    }
  }

  useRealtimeScopeRefresh(['schedule', 'follows', 'programs', 'purchases'], () => {
    loadStats()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-6 text-center">
        <p className="text-red-400 mb-4 text-sm">{error}</p>
        <button
          onClick={() => loadStats(true)}
          className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg active:scale-95 transition-all"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})` }}
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  if (!stats) return null

  const monthlyChartData = stats.monthlySales.map(m => ({
    name: MONTH_LABELS[m.month - 1],
    sales: m.sales,
    students: m.students,
  }))

  const tierData = [
    { name: 'Basic', value: stats.tierDistribution.basic, color: accentColor },
    { name: 'Standard', value: stats.tierDistribution.standard, color: TIER_STANDARD_COLOR },
    { name: 'Pro', value: stats.tierDistribution.pro, color: TIER_PRO_COLOR },
  ].filter(d => d.value > 0)

  const totalTierSales = tierData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="space-y-4 sm:space-y-5 pb-8">
      {/* Header */}
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          icon={Users}
          value={stats.totalStudents}
          label={t('totalStudents')}
          accentColor={accentColor}
          accentSecondary={accentSecondary}
        />
        <StatCard
          icon={ShoppingBag}
          value={stats.totalProgramsSold}
          label={t('programsSold')}
          accentColor={accentColor}
          accentSecondary={accentSecondary}
        />
        <StatCard
          icon={Layers}
          value={stats.totalPrograms}
          label={t('totalPrograms')}
          accentColor={accentColor}
          accentSecondary={accentSecondary}
        />
      </div>

      {/* Monthly Sales Chart */}
      <SectionCard
        icon={BarChart3}
        title={t('monthlySales')}
        accentColor={accentColor}
        accentSecondary={accentSecondary}
      >
        {stats.totalProgramsSold === 0 ? (
          <EmptyChartState message={t('noSalesYet')} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.18)" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(127,127,127,0.18)' }} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(127,127,127,0.18)' }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '12px' }}
                labelStyle={{ color: 'var(--foreground)' }}
                itemStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke={accentColor}
                fill="url(#salesGradient)"
                strokeWidth={2}
                name={t('sales')}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Two-column Layout: Tier Distribution + Students Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <SectionCard
          icon={PieChartIcon}
          title={t('tierDistribution')}
          accentColor={accentColor}
          accentSecondary={accentSecondary}
        >
          {totalTierSales === 0 ? (
            <EmptyChartState message={t('noSalesYet')} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                />
                <Legend formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          icon={TrendingUp}
          title={t('monthlyStudents')}
          accentColor={accentColor}
          accentSecondary={accentSecondary}
        >
          {stats.totalStudents === 0 ? (
            <EmptyChartState message={t('noStudentsYet')} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(127,127,127,0.18)" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(127,127,127,0.18)' }} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={{ stroke: 'rgba(127,127,127,0.18)' }} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--muted-foreground)' }}
                />
                <Bar
                  dataKey="students"
                  fill={accentColor}
                  radius={[6, 6, 0, 0]}
                  name={t('newStudents')}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {/* Program Performance Table */}
      <SectionCard
        icon={Layers}
        title={t('programPerformance')}
        accentColor={accentColor}
        accentSecondary={accentSecondary}
      >
        {stats.programStats.length === 0 ? (
          <EmptyState icon={Layers} message={t('noProgramsYet')} />
        ) : (
          <div className="-mx-4 sm:-mx-5 overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-[11px] uppercase tracking-wider text-muted-foreground font-semibold py-2.5 px-4 sm:px-5">{t('program')}</th>
                  <th className="w-24 text-center text-[11px] uppercase tracking-wider text-muted-foreground font-semibold py-2.5 px-3">{t('students')}</th>
                  <th className="w-24 text-center text-[11px] uppercase tracking-wider text-muted-foreground font-semibold py-2.5 px-3">{t('sales')}</th>
                  <th className="w-24 text-center text-[11px] uppercase tracking-wider font-semibold py-2.5 px-3" style={{ color: accentColor }}>Basic</th>
                  <th className="w-24 text-center text-[11px] uppercase tracking-wider text-amber-400 font-semibold py-2.5 px-3">Std</th>
                  <th className="w-24 text-center text-[11px] uppercase tracking-wider text-purple-400 font-semibold py-2.5 px-4 sm:px-5">Pro</th>
                </tr>
              </thead>
              <tbody>
                {stats.programStats.map((program) => {
                  const Icon = CATEGORY_ICONS[program.category] || Layers
                  return (
                    <tr key={program.programId} className="border-b border-border-subtle last:border-0 hover:bg-hover-overlay transition-colors">
                      <td className="py-3 px-4 sm:px-5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium text-foreground">{program.title}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-3 text-foreground tabular-nums">{program.uniqueStudents}</td>
                      <td className="text-center py-3 px-3 font-semibold tabular-nums" style={{ color: accentColor }}>{program.totalSales}</td>
                      <td className="text-center py-3 px-3 tabular-nums font-medium" style={{ color: accentColor }}>{program.basicSales}</td>
                      <td className="text-center py-3 px-3 tabular-nums font-medium text-amber-400">{program.standardSales}</td>
                      <td className="text-center py-3 px-4 sm:px-5 tabular-nums font-medium text-purple-400">{program.proSales}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Recent Students */}
      <SectionCard
        icon={Users}
        title={t('recentStudents')}
        accentColor={accentColor}
        accentSecondary={accentSecondary}
      >
        {stats.recentStudents.length === 0 ? (
          <EmptyState icon={Users} message={t('noStudentsYet')} />
        ) : (
          <div className="space-y-1.5">
            {stats.recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-hover-overlay transition-colors"
              >
                {student.avatarUrl ? (
                  <img
                    src={getMediaUrl(student.avatarUrl) || ''}
                    alt={student.fullName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-background"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-background"
                    style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})` }}
                  >
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate text-sm">{student.fullName}</p>
                  <p className="text-muted-foreground text-xs truncate">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// --- Helper Components ---

function SectionCard({
  icon: Icon,
  title,
  accentColor,
  accentSecondary,
  children,
}: {
  icon: typeof Users
  title: string
  accentColor: string
  accentSecondary: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-xl ring-1 ring-inset ring-border-subtle"
          style={{ background: `linear-gradient(135deg, ${accentColor}1f, ${accentSecondary}10)` }}
        >
          <Icon className="w-4 h-4" style={{ color: accentColor }} />
        </div>
        <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function StatCard({
  icon: Icon,
  value,
  label,
  accentColor,
  accentSecondary,
}: {
  icon: typeof Users
  value: number
  label: string
  accentColor: string
  accentSecondary: string
}) {
  return (
    <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 sm:p-5 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-inset ring-border-subtle"
          style={{ background: `linear-gradient(135deg, ${accentColor}1f, ${accentSecondary}10)` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
        </div>
      </div>
    </div>
  )
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <p className="text-faint-foreground text-sm">{message}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: typeof Users; message: string }) {
  return (
    <div className="text-center py-10">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-inset ring-border-subtle mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
