import { API_URL, fetchWithAuth } from '@/lib/config'
import { chatConnection } from '@/lib/signalr/chatConnection'

export interface UpdateUserProfileRequest {
  firstName?: string
  lastName?: string
  bio?: string
  country?: string
  city?: string
  phone?: string
  gender?: string
}

export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_URL}/user/avatar`, {
    method: 'POST',
    body: formData,
    headers: {}, // Don't set Content-Type for FormData
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload avatar')
  }

  return response.json()
}

export async function deleteAvatar(): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/user/avatar`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete avatar')
  }
}

export async function uploadBanner(file: File): Promise<{ bannerUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetchWithAuth(`${API_URL}/user/banner`, {
    method: 'POST',
    body: formData,
    headers: {},
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to upload banner')
  }

  return response.json()
}

export async function deleteBanner(): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/user/banner`, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to delete banner')
  }
}

export async function updateUserProfile(request: UpdateUserProfileRequest): Promise<{
  user: {
    bio?: string | null
    country?: string | null
    city?: string | null
    phone?: string | null
    gender?: string | null
  }
}> {
  const response = await fetchWithAuth(`${API_URL}/user/profile`, {
    method: 'PUT',
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to update profile')
  }

  return response.json()
}

export async function deleteAccount(password: string): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/me/account`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })

  if (!response.ok && response.status !== 204) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || 'Failed to delete account')
  }

  // Аккаунт удалён — очищаем всё локальное состояние
  try {
    chatConnection.clearHandlers()
    await chatConnection.stop()
  } catch { /* ignore */ }

  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')
  localStorage.removeItem('selectedRole')
  sessionStorage.removeItem('accessToken')
  sessionStorage.removeItem('user')
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await fetchWithAuth(`${API_URL}/user/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to change password')
  }
}
