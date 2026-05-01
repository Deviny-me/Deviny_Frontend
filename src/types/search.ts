export interface UserSearchItem {
  id: string
  fullName: string
  avatarUrl: string | null
  role: string
  slug: string | null
}

export interface ProgramSearchItem {
  id: string
  title: string
  code: string
  price: number
  coverImagePath: string | null
  trainerId: string
  trainerName: string
  trainerSlug: string | null
}

export interface GlobalSearchResponse {
  users: UserSearchItem[]
  workoutPrograms: ProgramSearchItem[]
  mealPrograms: ProgramSearchItem[]
}
