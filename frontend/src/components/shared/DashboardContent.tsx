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

interface DashboardContentProps {
  accentColor: string // hex color like '#f07915' or '#28bf68'
  accentGradient: string // tailwind gradient like 'from-[#f07915] to-[#d4600b]'
  role: 'trainer' | 'nutritionist'
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const TIER_COLORS = {
  basic: '#f07915',
  standard: '#F59E0B',
  pro: '#8B5CF6',
}

const CATEGORY_ICONS: Record<string, typeof Dumbbell> = {
  Training: Dumbbell,
  Diet: Apple,
  Consultation: MessageSquare,
}

export function DashboardContent({ accentColor, accentGradient, role }: DashboardContentProps) {
  const t = useTranslations('dashboard')
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
      <div className="text-center py-12 bg-surface-2 rounded-xl border border-border-subtle">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => loadStats(true)}
          className="px-4 py-2 text-foreground rounded-lg hover:opacity-90 transition-colors"
          style={{ backgroundColor: accentColor }}
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
    { name: 'Basic', value: stats.tierDistribution.basic, color: TIER_COLORS.basic },
    { name: 'Standard', value: stats.tierDistribution.standard, color: TIER_COLORS.standard },
    { name: 'Pro', value: stats.tierDistribution.pro, color: TIER_COLORS.pro },
  ].filter(d => d.value > 0)

  const totalTierSales = tierData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="page-title">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          value={stats.totalStudents}
          label={t('totalStudents')}
          accentColor={accentColor}
        />
        <StatCard
          icon={ShoppingBag}
          value={stats.totalProgramsSold}
          label={t('programsSold')}
          accentColor={accentColor}
        />
        <StatCard
          icon={Layers}
          value={stats.totalPrograms}
          label={t('totalPrograms')}
          accentColor={accentColor}
        />
      </div>

      {/* Monthly Sales Chart */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5" style={{ color: accentColor }} />
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('monthlySales')}</h2>
        </div>
        {stats.totalProgramsSold === 0 ? (
          <EmptyChartState message={t('noSalesYet')} />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accentColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#333' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#9CA3AF' }}
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
      </div>

      {/* Two-column Layout: Tier Distribution + Students Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tier Distribution Pie Chart */}
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5" style={{ color: accentColor }} />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('tierDistribution')}</h2>
          </div>
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
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend
                  formatter={(value) => <span className="text-muted-foreground text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Students Chart */}
        <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('monthlyStudents')}</h2>
          </div>
          {stats.totalStudents === 0 ? (
            <EmptyChartState message={t('noStudentsYet')} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#333' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#9CA3AF' }}
                />
                <Bar
                  dataKey="students"
                  fill={accentColor}
                  radius={[4, 4, 0, 0]}
                  name={t('newStudents')}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Program Performance Table */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5" style={{ color: accentColor }} />
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('programPerformance')}</h2>
        </div>
        {stats.programStats.length === 0 ? (
          <div className="text-center py-8">
            <Layers className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t('noProgramsYet')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left text-muted-foreground font-medium py-3 px-2">{t('program')}</th>
                  <th className="text-center text-muted-foreground font-medium py-3 px-2">{t('type')}</th>
                  <th className="text-center text-muted-foreground font-medium py-3 px-2">{t('students')}</th>
                  <th className="text-center text-muted-foreground font-medium py-3 px-2">{t('sales')}</th>
                  <th className="text-center text-muted-foreground font-medium py-3 px-2">Basic</th>
                  <th className="text-center text-muted-foreground font-medium py-3 px-2">Standard</th>
                  <th className="text-center text-muted-foreground font-medium py-3 px-2">Pro</th>
                </tr>
              </thead>
              <tbody>
                {stats.programStats.map((program) => {
                  const Icon = CATEGORY_ICONS[program.category] || Layers
                  return (
                    <tr key={program.programId} className="border-b border-border-subtle hover:bg-hover-overlay">
                      <td className="py-3 px-2">
                        <span className="text-foreground font-medium">{program.title}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{program.category}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2 text-foreground">{program.uniqueStudents}</td>
                      <td className="text-center py-3 px-2 font-semibold" style={{ color: accentColor }}>
                        {program.totalSales}
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">{program.basicSales}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-xs">{program.standardSales}</span>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">{program.proSales}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Students */}
      <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" style={{ color: accentColor }} />
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{t('recentStudents')}</h2>
        </div>
        {stats.recentStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t('noStudentsYet')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-hover-overlay transition-colors"
              >
                {student.avatarUrl ? (
                  <img
                    src={getMediaUrl(student.avatarUrl) || ''}
                    alt={student.fullName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-foreground font-bold text-sm"
                    style={{ backgroundColor: accentColor + '33' }}
                  >
                    {student.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{student.fullName}</p>
                  <p className="text-muted-foreground text-sm truncate">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Helper Components ---

function StatCard({
  icon: Icon,
  value,
  label,
  accentColor,
}: {
  icon: typeof Users
  value: number
  label: string
  accentColor: string
}) {
  return (
    <div className="bg-surface-2 rounded-xl border border-border-subtle p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: accentColor + '20' }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground leading-tight">{label}</p>
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
