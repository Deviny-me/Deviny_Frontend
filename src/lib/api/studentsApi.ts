import { API_URL, fetchWithAuth } from '@/lib/config'
import type { StudentDetailDto, SubmitReviewRequest, StudentReview } from '@/types/studentReview'

export type { StudentDetailDto, SubmitReviewRequest, StudentReview } from '@/types/studentReview'

export interface Student {
  id: string
  firstName?: string
  lastName?: string
  fullName: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  role?: string | number | null
  name: string // Alias for fullName for compatibility
}

export interface StudentMedicalInfo {
  hasInjuries: boolean
  injuryDocUrl?: string | null
}

export const studentsApi = {
  async getStudents(): Promise<Student[]> {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/students`)

    if (!response.ok) throw new Error('Failed to fetch students')
    
    const data = await response.json()
    
    // Transform data to include name property
    return data.map((student: any) => ({
      ...student,
      name: student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim()
    }))
  },

  async getStudentMedicalInfo(studentId: string): Promise<StudentMedicalInfo> {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/students/${studentId}/medical-info`)

    if (!response.ok) throw new Error('Failed to fetch student medical info')

    return response.json()
  },

  async getStudentDetail(studentId: string): Promise<StudentDetailDto> {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/students/${studentId}`)
    if (!response.ok) throw new Error('Failed to fetch student detail')
    return response.json()
  },

  async submitReview(studentId: string, data: SubmitReviewRequest): Promise<StudentReview> {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/students/${studentId}/reviews`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to submit review')
    return response.json()
  },
}
