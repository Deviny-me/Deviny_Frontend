import { UserLevelDto } from '@/types/level'
import { API_URL, getAuthHeader } from '@/lib/config'

export async function getMyLevel(): Promise<UserLevelDto> {
  const authHeader = getAuthHeader()
  
  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/me/level`, {
    method: 'GET',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to fetch level')
  }

  return response.json()
}
