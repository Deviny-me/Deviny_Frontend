import { GlobalSearchResponse } from '@/types/search'
import { API_URL, fetchWithAuth } from '@/lib/config'

export async function searchGlobal(
  query: string,
  limit: number = 5,
  signal?: AbortSignal
): Promise<GlobalSearchResponse> {
  const params = new URLSearchParams({ query, limit: String(limit) })
  const response = await fetchWithAuth(`${API_URL}/search?${params}`, { signal })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Search request failed')
  }

  return response.json()
}
