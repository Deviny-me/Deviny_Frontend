export interface ProgramVideoDto {
  videoUrl: string;
  title: string;
  description: string;
}

export interface ProgramDto {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  detailedDescription?: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  code: string;
  coverImageUrl: string;
  trainingVideoUrls: string[];
  trainingVideos: ProgramVideoDto[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  averageRating: number;
  totalReviews: number;
  totalPurchases: number;
}

// Public program for browsing (includes trainer info)
export interface PublicProgramDto {
  id: string;
  title: string;
  description: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  code: string;
  coverImageUrl: string;
  averageRating: number;
  totalReviews: number;
  totalPurchases: number;
  latestReviewComment?: string;
  latestReviewRating?: number;
  latestReviewUserName?: string;
  latestReviewCreatedAt?: string;
  standardSpotsRemaining?: number;
  proSpotsRemaining?: number;
  createdAt: string;
  trainerId: string;
  trainerName: string;
  trainerAvatarUrl: string;
  trainerSlug: string;
  trainerRole: string;
}

export interface CreateProgramRequest {
  title: string;
  description: string;
  detailedDescription?: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  isPublic?: boolean;
  coverImage: File;
  trainingVideos: File[];
  trainingVideoTitles?: string[];
  trainingVideoDescriptions?: string[];
}

export interface UpdateProgramRequest {
  title: string;
  description: string;
  detailedDescription?: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  isPublic?: boolean;
  coverImage?: File;
  trainingVideos?: File[];
  trainingVideoTitles?: string[];
  trainingVideoDescriptions?: string[];
}

// Meal Program types
export interface MealProgramDto {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  code: string;
  coverImageUrl: string;
  videoUrls: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicMealProgramDto {
  id: string;
  title: string;
  description: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  code: string;
  coverImageUrl: string;
  videoUrls: string[];
  standardSpotsRemaining?: number;
  proSpotsRemaining?: number;
  averageRating: number;
  totalReviews: number;
  totalPurchases: number;
  latestReviewComment?: string;
  latestReviewRating?: number;
  latestReviewUserName?: string;
  latestReviewCreatedAt?: string;
  createdAt: string;
  trainerId: string;
  trainerName: string;
  trainerAvatarUrl: string;
  trainerSlug: string;
  trainerRole: string;
}

export interface CreateMealProgramRequest {
  title: string;
  description: string;
  detailedDescription?: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  isPublic?: boolean;
  coverImage: File;
  videos: File[];
}

export interface UpdateMealProgramRequest {
  title: string;
  description: string;
  detailedDescription?: string;
  price: number;
  standardPrice?: number;
  proPrice?: number;
  maxStandardSpots?: number;
  maxProSpots?: number;
  category?: string;
  isPublic?: boolean;
  coverImage?: File;
  videos?: File[];
}

// Union type for program type selection (which API/entity to use)
export type ProgramType = 'training' | 'meal';

// Semantic program category
export type ProgramCategory = 'Training' | 'Diet' | 'Consultation';

// Reviews
export interface ReviewDto {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ExpertReviewDto extends ReviewDto {
  programId: string;
  programTitle: string;
  programType: string;
}

export interface CreateReviewRequest {
  programId: string;
  programType: ProgramType;
  rating: number;
  comment?: string;
}
