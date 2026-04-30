export interface PublicTrainerDto {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  primaryTitle: string | null;
  secondaryTitle: string | null;
  location: string | null;
  experienceYears: number | null;
  slug: string;
  role?: string;
  programsCount: number;
  specializations: string[];
  ratingValue: number;
  reviewsCount: number;
}
