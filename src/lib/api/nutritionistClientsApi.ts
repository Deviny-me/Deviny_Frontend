/**
 * Nutritionist Clients API  
 * Independent API for nutritionist's client management.
 * Uses dedicated /nutritionist/me/clients backend endpoint.
 */
import { API_URL, fetchWithAuth } from '@/lib/config'
import type { StudentDetailDto, SubmitReviewRequest, StudentReview } from '@/types/studentReview'

export type { StudentDetailDto, SubmitReviewRequest, StudentReview } from '@/types/studentReview'

export interface NutritionistClient {
  id: string
  firstName?: string
  lastName?: string
  fullName: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  name: string
}

export const nutritionistClientsApi = {
  async getClients(): Promise<NutritionistClient[]> {
    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/clients`)

    if (!response.ok) throw new Error('Failed to fetch clients')

    const data = await response.json()

    return data.map((client: any) => ({
      ...client,
      name: client.fullName || `${client.firstName || ''} ${client.lastName || ''}`.trim()
    }))
  },

  async getClientDetail(clientId: string): Promise<StudentDetailDto> {
    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/clients/${clientId}`)
    if (!response.ok) throw new Error('Failed to fetch client detail')
    return response.json()
  },

  async submitReview(clientId: string, data: SubmitReviewRequest): Promise<StudentReview> {
    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/clients/${clientId}/reviews`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to submit review')
    return response.json()
  },
}
