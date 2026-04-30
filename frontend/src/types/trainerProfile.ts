export interface TrainerProfileResponse {
  trainer: TrainerDto
  about: AboutDto
  certificates: CertificateDto[]
  achievements: AchievementDto[]
  specializations: SpecializationDto[]
}

export interface TrainerDto {
  id: string
  userId: string
  fullName: string
  avatarUrl: string | null
  bannerUrl: string | null
  initials: string
  primaryTitle: string | null
  secondaryTitle: string | null
  location: string | null
  gender: string | null
  phone: string | null
  country: string | null
  city: string | null
  experienceYears: number | null
  programsCount: number
  studentsCount: number
  achievementsCount: number
  ratingValue: number
  reviewsCount: number
  slug: string
  profilePublicUrl: string
  role?: string | null
}

export interface AboutDto {
  text: string | null
}

export interface CertificateDto {
  id: string
  title: string
  issuer: string | null
  year: number
  fileUrl?: string | null
  fileName?: string | null
}

export interface AchievementDto {
  id: string
  title: string
  subtitle: string | null
  iconKey: string
  tone: string
}

export interface SpecializationDto {
  id: string
  name: string
}
