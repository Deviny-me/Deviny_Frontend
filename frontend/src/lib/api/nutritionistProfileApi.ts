/**
 * Nutritionist Profile API
 * Independent API layer for nutritionist profile operations.
 * Uses dedicated /nutritionist/me/* backend endpoints.
 */
import { TrainerProfileResponse } from '@/types/trainerProfile'
import { API_URL, getAuthHeader, fetchWithAuth } from '@/lib/config'

export async function uploadNutritionistAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_URL}/nutritionist/me/avatar`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload avatar')
  }

  return response.json()
}

export async function deleteNutritionistAvatar(): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/nutritionist/me/avatar`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete avatar')
  }
}

export async function fetchNutritionistProfile(): Promise<TrainerProfileResponse> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/nutritionist/me/profile`, {
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

  if (response.status === 403) {
    throw new Error('Access denied. Nutritionist role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to fetch nutritionist profile')
  }

  return response.json()
}

export async function uploadCertificate(
  title: string,
  issuer: string,
  year: number,
  file: File
): Promise<void> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const formData = new FormData()
  formData.append('title', title)
  formData.append('issuer', issuer)
  formData.append('year', year.toString())
  formData.append('file', file)

  const response = await fetch(`${API_URL}/nutritionist/me/certificates`, {
    method: 'POST',
    headers: authHeader,
    credentials: 'include',
    body: formData,
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (response.status === 403) {
    throw new Error('Access denied. Nutritionist role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload certificate')
  }
}

export async function deleteCertificate(certificateId: string): Promise<void> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/nutritionist/me/certificates/${certificateId}`, {
    method: 'DELETE',
    headers: authHeader,
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (response.status === 403) {
    throw new Error('Access denied. Nutritionist role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete certificate')
  }
}

export async function updateAbout(text: string): Promise<void> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/nutritionist/me/about`, {
    method: 'PUT',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ text }),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to update about')
  }
}

export async function addSpecialization(name: string): Promise<any> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/nutritionist/me/specializations`, {
    method: 'POST',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to add specialization')
  }

  return response.json()
}

export async function deleteSpecialization(specializationId: string): Promise<void> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/nutritionist/me/specializations/${specializationId}`, {
    method: 'DELETE',
    headers: authHeader,
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete specialization')
  }
}

export interface UpdateNutritionistProfileRequest {
  primaryTitle?: string
  secondaryTitle?: string
  experienceYears?: number
  location?: string
  gender?: string
}

export async function updateNutritionistProfile(data: UpdateNutritionistProfileRequest): Promise<void> {
  const authHeader = getAuthHeader()

  if (!authHeader.Authorization) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(`${API_URL}/nutritionist/me/profile`, {
    method: 'PUT',
    headers: {
      ...authHeader,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (response.status === 401) {
    throw new Error('Unauthorized. Please log in again.')
  }

  if (response.status === 403) {
    throw new Error('Access denied. Nutritionist role required.')
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to update nutritionist profile')
  }
}

export async function uploadNutritionistBanner(file: File): Promise<{ bannerUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_URL}/nutritionist/me/banner`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload banner')
  }

  return response.json()
}

export async function deleteNutritionistBanner(): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/nutritionist/me/banner`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete banner')
  }
}
