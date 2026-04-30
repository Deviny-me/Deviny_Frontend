import { MealProgramDto, PublicMealProgramDto, CreateMealProgramRequest, UpdateMealProgramRequest } from '@/types/program';
import { PagedResponse } from '@/types/pagination';
import { API_URL, fetchWithAuth } from '@/lib/config';
import type { ProgramsFilterParams } from '@/lib/api/programsApi';

function buildProgramFilterQuery(filters?: ProgramsFilterParams): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.minPrice != null) params.set('minPrice', filters.minPrice.toString())
  if (filters.maxPrice != null) params.set('maxPrice', filters.maxPrice.toString())
  if (filters.minRating != null && filters.minRating > 0) params.set('minRating', filters.minRating.toString())
  if (filters.tier) params.set('tier', filters.tier)
  if (filters.minSales != null && filters.minSales > 0) params.set('minSales', filters.minSales.toString())
  const qs = params.toString()
  return qs ? `&${qs}` : ''
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || 'Request failed');
  }

  // Handle 204 No Content responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

export const mealProgramsApi = {
  // Get all public meal programs (paginated)
  getAllPublic: async (page = 1, pageSize = 20, filters?: ProgramsFilterParams): Promise<PagedResponse<PublicMealProgramDto>> => {
    const response = await fetchWithAuth(`${API_URL}/meal-programs?page=${page}&pageSize=${pageSize}${buildProgramFilterQuery(filters)}`);
    return handleResponse<PagedResponse<PublicMealProgramDto>>(response);
  },

  // Get trainer's/nutritionist's own meal programs
  getMyMealPrograms: async (): Promise<MealProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs`);
    return handleResponse<MealProgramDto[]>(response);
  },

  // Create meal program
  createMealProgram: async (request: CreateMealProgramRequest): Promise<MealProgramDto> => {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    formData.append('coverImage', request.coverImage);
    formData.append('isPublic', (request.isPublic ?? true).toString());

    if (request.detailedDescription) {
      formData.append('detailedDescription', request.detailedDescription);
    }

    if (request.proPrice != null) {
      formData.append('proPrice', request.proPrice.toString());
    }

    if (request.standardPrice != null) {
      formData.append('standardPrice', request.standardPrice.toString());
    }

    if (request.maxStandardSpots != null) {
      formData.append('maxStandardSpots', request.maxStandardSpots.toString());
    }

    if (request.maxProSpots != null) {
      formData.append('maxProSpots', request.maxProSpots.toString());
    }

    if (request.category) {
      formData.append('category', request.category);
    }

    if (request.videos && request.videos.length > 0) {
      request.videos.forEach(video => {
        formData.append('videos', video);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<MealProgramDto>(response);
  },

  // Update meal program
  updateMealProgram: async (id: string, request: UpdateMealProgramRequest): Promise<MealProgramDto> => {
    const formData = new FormData();
    formData.append('title', request.title);
    formData.append('description', request.description);
    formData.append('price', request.price.toString());
    formData.append('isPublic', (request.isPublic ?? true).toString());
    
    if (request.detailedDescription) {
      formData.append('detailedDescription', request.detailedDescription);
    }

    if (request.proPrice != null) {
      formData.append('proPrice', request.proPrice.toString());
    }

    if (request.standardPrice != null) {
      formData.append('standardPrice', request.standardPrice.toString());
    }

    if (request.maxStandardSpots != null) {
      formData.append('maxStandardSpots', request.maxStandardSpots.toString());
    }

    if (request.maxProSpots != null) {
      formData.append('maxProSpots', request.maxProSpots.toString());
    }

    if (request.category) {
      formData.append('category', request.category);
    }

    if (request.coverImage) {
      formData.append('coverImage', request.coverImage);
    }

    if (request.videos && request.videos.length > 0) {
      request.videos.forEach(video => {
        formData.append('videos', video);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs/${id}`, {
      method: 'PUT',
      body: formData,
    });

    return handleResponse<MealProgramDto>(response);
  },

  // Delete meal program
  deleteMealProgram: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/meal-programs/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },
};
