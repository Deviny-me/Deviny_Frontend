import { PublicTrainerDto } from '@/types/trainer';
import { PagedResponse } from '@/types/pagination';
import { API_URL, fetchWithAuth } from '@/lib/config';

export interface ExpertsFilterParams {
  country?: string;
  city?: string;
  gender?: string;
  specialization?: string;
  minRating?: number;
}

async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetchWithAuth(`${API_URL}${url}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

function buildFilterQuery(page: number, pageSize: number, filters?: ExpertsFilterParams): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (filters?.country) params.set('country', filters.country);
  if (filters?.city) params.set('city', filters.city);
  if (filters?.gender) params.set('gender', filters.gender);
  if (filters?.specialization) params.set('specialization', filters.specialization);
  if (filters?.minRating && filters.minRating > 0) params.set('minRating', String(filters.minRating));
  return params.toString();
}

export const trainersApi = {
  // Get all trainers for browsing (paginated + filtered)
  getAll: async (page = 1, pageSize = 20, filters?: ExpertsFilterParams): Promise<PagedResponse<PublicTrainerDto>> => {
    return apiRequest(`/trainers?${buildFilterQuery(page, pageSize, filters)}`);
  },

  // Get trainer profile by slug
  getBySlug: async (slug: string) => {
    return apiRequest(`/trainers/${slug}/profile`);
  },
};
