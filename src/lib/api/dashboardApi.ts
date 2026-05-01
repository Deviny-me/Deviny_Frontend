import { API_URL, fetchWithAuth } from '@/lib/config'

// --- Types ---

export interface MonthlySalesData {
  year: number
  month: number
  sales: number
  students: number
}

export interface ProgramStatsData {
  programId: string
  title: string
  type: 'training' | 'meal'
  category: string
  totalSales: number
  uniqueStudents: number
  basicSales: number
  standardSales: number
  proSales: number
}

export interface TierDistribution {
  basic: number
  standard: number
  pro: number
}

export interface RecentStudent {
  id: string
  fullName: string
  avatarUrl: string | null
  email: string
}

export interface DashboardStats {
  totalStudents: number
  totalProgramsSold: number
  totalPrograms: number
  monthlySales: MonthlySalesData[]
  programStats: ProgramStatsData[]
  tierDistribution: TierDistribution
  recentStudents: RecentStudent[]
}

// --- API ---

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Request failed')
  }
  return response.json()
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await fetchWithAuth(`${API_URL}/dashboard/stats`)
    return handleResponse<DashboardStats>(response)
  },
}
