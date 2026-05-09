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
export type LeaderboardScope = 'global' | 'local'
export type LeaderboardPeriod = 'week' | 'month' | 'season' | 'all'

/** Envelope returned by the v2 leaderboard endpoint (items + meta). */
export interface LeaderboardResponse {
  items: LeaderboardEntryDto[]
  total: number
  period: LeaderboardPeriod
  scope: LeaderboardScope
  generatedAt: string | null
}

/** Current user's own position in a leaderboard. */
export interface MyLeaderboardPosition {
  userId: string
  fullName: string
  avatarUrl: string | null
  role: string | null
  starRating: number
  overallScore: number
  ratingCount: number
  rank: number | null
  total: number
  percentile: number | null
}

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
   * Top-N leaderboard for a category.
   *
   * Returns an envelope `{ items, total, period, scope, generatedAt }`.
   * Back-compat: if the backend still returns a bare array, it is wrapped
   * into the same shape with `total = items.length` and `generatedAt = null`.
   *
   * @param scope  'global' (default) or 'local' (same country as caller)
   * @param period 'week' (default) | 'month' | 'season' | 'all'
   */
  getLeaderboard: async (
    category: LeaderboardCategory,
    limit = 10,
    scope: LeaderboardScope = 'global',
    period: LeaderboardPeriod = 'week',
    extra?: {
      offset?: number
      sort?: 'rank' | 'score' | 'stars' | 'reviews' | 'name'
      direction?: 'asc' | 'desc'
      minReviews?: number
      q?: string
    },
  ): Promise<LeaderboardResponse> => {
    const params = new URLSearchParams({
      category,
      limit: String(limit),
      scope,
      period,
    })
    if (extra?.offset) params.set('offset', String(extra.offset))
    if (extra?.sort) params.set('sort', extra.sort)
    if (extra?.direction) params.set('direction', extra.direction)
    if (typeof extra?.minReviews === 'number') params.set('minReviews', String(extra.minReviews))
    if (extra?.q && extra.q.trim()) params.set('q', extra.q.trim())

    const res = await fetchWithAuth(`${API_URL}/ratings/leaderboard?${params.toString()}`)
    const empty: LeaderboardResponse = {
      items: [],
      total: 0,
      period,
      scope,
      generatedAt: null,
    }
    if (res.status === 404 || res.status === 501 || res.status === 204) return empty
    if (!res.ok) {
      const errorData = await readJsonOrEmpty(res)
      throw new Error(
        (errorData && (errorData.error || errorData.message)) || `Request failed (${res.status})`,
      )
    }
    const data = await readJsonOrEmpty(res)
    if (!data) return empty
    // New envelope shape
    if (Array.isArray((data as any).items)) {
      const items = ((data as any).items as any[]).map(normalizeLeaderboardEntry)
      return {
        items,
        total: toNumber((data as any).total, items.length),
        period: ((data as any).period as LeaderboardPeriod) || period,
        scope: ((data as any).scope as LeaderboardScope) || scope,
        generatedAt: (data as any).generatedAt ?? null,
      }
    }
    // Legacy: backend returns a bare array
    if (Array.isArray(data)) {
      const items = data.map(normalizeLeaderboardEntry)
      return { items, total: items.length, period, scope, generatedAt: null }
    }
    return empty
  },

  /**
   * Caller's own position in a given leaderboard. Returns `null` when the
   * endpoint is not implemented yet (404/501/204) so the UI can fall back
   * silently.
   */
  getMyLeaderboardPosition: async (
    category: LeaderboardCategory,
    scope: LeaderboardScope = 'global',
    period: LeaderboardPeriod = 'week',
    minReviews = 0,
  ): Promise<MyLeaderboardPosition | null> => {
    const params = new URLSearchParams({ category, scope, period })
    if (minReviews) params.set('minReviews', String(minReviews))
    const res = await fetchWithAuth(`${API_URL}/ratings/leaderboard/me?${params.toString()}`)
    if (res.status === 404 || res.status === 501 || res.status === 204 || res.status === 401) return null
    if (!res.ok) return null
    const data = await readJsonOrEmpty(res)
    if (!data) return null
    return {
      userId: data.userId ?? data.UserId ?? '',
      fullName: data.fullName ?? data.FullName ?? '',
      avatarUrl: data.avatarUrl ?? data.AvatarUrl ?? null,
      role: data.role ?? data.Role ?? null,
      starRating: toNumber(data.starRating, data.StarRating),
      overallScore: toNumber(data.overallScore, data.OverallScore, data.score),
      ratingCount: toNumber(data.ratingCount, data.RatingCount, data.count),
      rank:
        data.rank == null && data.Rank == null
          ? null
          : toNumber(data.rank, data.Rank),
      total: toNumber(data.total, data.Total),
      percentile:
        data.percentile == null && data.Percentile == null
          ? null
          : toNumber(data.percentile, data.Percentile),
    }
  },
}
