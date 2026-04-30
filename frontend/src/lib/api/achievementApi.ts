import { MyAchievementsResponse, MyChallengesResponse } from '@/types/achievement'
import { API_URL, getAuthHeader } from '@/lib/config'

export async function getMyAchievements(): Promise<MyAchievementsResponse> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/me/achievements`, {
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
    throw new Error(errorData.message || 'Failed to fetch achievements')
  }

  return response.json()
}

export async function getMyChallenges(): Promise<MyChallengesResponse> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/me/challenges`, {
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
    throw new Error(errorData.message || 'Failed to fetch challenges')
  }

  return response.json()
}
