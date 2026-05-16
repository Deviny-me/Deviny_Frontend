export interface StudentReview {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface StudentPurchase {
  purchaseId: string
  programId: string
  programTitle: string
  programType: 'training' | 'meal'
  status: 'active' | 'completed'
  purchasedAt: string
  review: StudentReview | null
}

export interface StudentDetailDto {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
  role: string
  bio: string | null
  country: string | null
  city: string | null
  hasInjuries: boolean
  injuryDocUrl: string | null
  purchases: StudentPurchase[]
}

export interface SubmitReviewRequest {
  programId: string
  programType: 'training' | 'meal'
  rating: number
  comment: string | null
}
