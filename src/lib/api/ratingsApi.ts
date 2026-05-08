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

function toNumber(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c
    if (typeof c === 'string' && c.trim() !== '' && Number.isFinite(Number(c))) return Number(c)
  }
  return 0
}

/** Normalize backend payload into a RatingDto regardless of casing/field naming. */
function normalizeRating(raw: any): RatingDto {
  const r = raw || {}
  return {
    starRating: toNumber(r.starRating, r.StarRating, r.star_rating, r.stars),
    overallScore: toNumber(
      r.overallScore,
      r.OverallScore,
      r.overall_score,
      r.score,
      r.average,
      r.averageRating,
      r.AverageRating,
      r.value,
    ),
    ratingCount: toNumber(
      r.ratingCount,
      r.RatingCount,
      r.rating_count,
      r.count,
      r.reviewsCount,
      r.ReviewsCount,
    ),
  }
}

function normalizeLeaderboardEntry(raw: any): LeaderboardEntryDto {
  const r = raw || {}
  return {
    userId: r.userId ?? r.UserId ?? r.id ?? r.Id ?? '',
    fullName: r.fullName ?? r.FullName ?? r.name ?? r.Name ?? '',
    avatarUrl: r.avatarUrl ?? r.AvatarUrl ?? null,
    role: r.role ?? r.Role ?? null,
    starRating: toNumber(r.starRating, r.StarRating, r.star_rating),
    overallScore: toNumber(r.overallScore, r.OverallScore, r.overall_score, r.score),
    ratingCount: toNumber(r.ratingCount, r.RatingCount, r.rating_count, r.count),
    rank: toNumber(r.rank, r.Rank, r.position, r.Position),
  }
}

const EMPTY_RATING: RatingDto = { starRating: 0, overallScore: 0, ratingCount: 0 }

async function readJsonOrEmpty(response: Response): Promise<any> {
  if (response.status === 204 || response.headers.get('content-length') === '0') return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function fetchRating(url: string): Promise<RatingDto> {
  const res = await fetchWithAuth(url)
  // Treat "not found / not implemented / no content" as an empty rating
  // instead of throwing — keeps the UI quiet until backend finishes wiring.
  if (res.status === 404 || res.status === 501 || res.status === 204) return EMPTY_RATING
  if (!res.ok) {
    const errorData = await readJsonOrEmpty(res)
    throw new Error(
      (errorData && (errorData.error || errorData.message)) || `Request failed (${res.status})`,
    )
  }
  const data = await readJsonOrEmpty(res)
  if (!data) return EMPTY_RATING
  return normalizeRating(data)
}

export const ratingsApi = {
  /** Reputation/activity rating for any user. */
  getUserRating: (userId: string): Promise<RatingDto> =>
    fetchRating(`${API_URL}/ratings/users/${userId}`),

  /** Professional rating (program quality) for a trainer or nutritionist. */
  getProfessionalRating: (ownerId: string): Promise<RatingDto> =>
    fetchRating(`${API_URL}/ratings/professionals/${ownerId}`),

  /** Rating for a specific program. */
  getProgramRating: (
    programType: 'training' | 'meal',
    programId: string,
  ): Promise<RatingDto> =>
    fetchRating(`${API_URL}/ratings/programs/${programType}/${programId}`),

  /**
   * Top-N leaderboard for a category. Returns [] gracefully on 404/501
   * so the sidebar can render an empty state instead of an error.
   */
  getLeaderboard: async (
    category: LeaderboardCategory,
    limit = 10,
  ): Promise<LeaderboardEntryDto[]> => {
    const res = await fetchWithAuth(
      `${API_URL}/ratings/leaderboard?category=${category}&limit=${limit}`,
    )
    if (res.status === 404 || res.status === 501 || res.status === 204) return []
    if (!res.ok) {
      const errorData = await readJsonOrEmpty(res)
      throw new Error(
        (errorData && (errorData.error || errorData.message)) || `Request failed (${res.status})`,
      )
    }
    const data = await readJsonOrEmpty(res)
    if (!Array.isArray(data)) return []
    return data.map(normalizeLeaderboardEntry)
  },
}
