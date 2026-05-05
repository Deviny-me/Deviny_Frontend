import { API_URL, fetchWithAuth } from '@/lib/config'

/** Single-entity rating returned by the rating endpoints. */
export interface RatingDto {
  /** 0-5, supports half increments. Use this for the star UI. */
  starRating: number
  /** Precise score for tooltips/exact display. */
  overallScore: number
  /** Number of underlying inputs (reviews, activity events, …). */
  ratingCount: number
}

/** A single row of any of the leaderboards. */
export interface LeaderboardEntryDto {
  userId: string
  fullName: string
  avatarUrl: string | null
  role?: string | null
  starRating: number
  overallScore: number
  ratingCount: number
  rank: number
}

export type LeaderboardCategory = 'user' | 'trainer' | 'nutritionist'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || errorData.message || `Request failed (${response.status})`)
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T
  }
  return response.json()
}

export const ratingsApi = {
  /** Reputation/activity rating for any user. */
  getUserRating: async (userId: string): Promise<RatingDto> => {
    const res = await fetchWithAuth(`${API_URL}/ratings/users/${userId}`)
    return handleResponse<RatingDto>(res)
  },

  /** Professional rating (program quality) for a trainer or nutritionist. */
  getProfessionalRating: async (ownerId: string): Promise<RatingDto> => {
    const res = await fetchWithAuth(`${API_URL}/ratings/professionals/${ownerId}`)
    return handleResponse<RatingDto>(res)
  },

  /** Rating for a specific program. */
  getProgramRating: async (
    programType: 'training' | 'meal',
    programId: string
  ): Promise<RatingDto> => {
    const res = await fetchWithAuth(
      `${API_URL}/ratings/programs/${programType}/${programId}`
    )
    return handleResponse<RatingDto>(res)
  },

  /**
   * Top-N leaderboard for a category.
   *
   * NOTE: The backend leaderboard list endpoint is not finalized yet.
   * The path below is a best-guess so the UI can wire up cleanly when it
   * lands. Until then this method returns [] on 404/501 so the sidebar
   * shows a graceful empty state instead of an error.
   */
  getLeaderboard: async (
    category: LeaderboardCategory,
    limit = 10
  ): Promise<LeaderboardEntryDto[]> => {
    const res = await fetchWithAuth(
      `${API_URL}/ratings/leaderboard?category=${category}&limit=${limit}`
    )
    if (res.status === 404 || res.status === 501) return []
    return handleResponse<LeaderboardEntryDto[]>(res)
  },
}
