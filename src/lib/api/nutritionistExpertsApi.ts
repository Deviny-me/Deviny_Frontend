/**
 * Nutritionist Experts API
 * Independent API for browsing nutritionists from the nutritionist panel.
 * Uses dedicated /nutritionists backend endpoints (only returns Nutritionist role).
 */
import { PublicTrainerDto } from '@/types/trainer';
import { PagedResponse } from '@/types/pagination';
import { API_URL, fetchWithAuth } from '@/lib/config';

async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetchWithAuth(`${API_URL}${url}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Request failed');
  }

  return response.json();
}

export const nutritionistExpertsApi = {
  /** Get all nutritionists for browsing (paginated) */
  getAll: async (page = 1, pageSize = 20): Promise<PagedResponse<PublicTrainerDto>> => {
    return apiRequest(`/nutritionists?page=${page}&pageSize=${pageSize}`);
  },

  /** Get nutritionist profile by slug */
  getBySlug: async (slug: string) => {
    return apiRequest(`/nutritionists/${slug}/profile`);
  },
};
