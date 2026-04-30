/**
 * Nutritionist Programs API
 * Nutritionist only works with meal programs (no training programs).
 * Uses dedicated /nutritionist/me/meal-programs backend endpoints.
 */
import { MealProgramDto, PublicMealProgramDto, CreateMealProgramRequest, UpdateMealProgramRequest } from '@/types/program';
import { API_URL, fetchWithAuth } from '@/lib/config';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.details || 'Request failed');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

export const nutritionistProgramsApi = {
  /** Get all public meal programs */
  getAllPublic: async (): Promise<PublicMealProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/meal-programs`);
    return handleResponse<PublicMealProgramDto[]>(response);
  },

  /** Get nutritionist's own meal programs */
  getMyPrograms: async (): Promise<MealProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/meal-programs`);
    return handleResponse<MealProgramDto[]>(response);
  },

  /** Create meal program */
  createProgram: async (request: CreateMealProgramRequest): Promise<MealProgramDto> => {
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

    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/meal-programs`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<MealProgramDto>(response);
  },

  /** Update meal program */
  updateProgram: async (id: string, request: UpdateMealProgramRequest): Promise<MealProgramDto> => {
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

    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/meal-programs/${id}`, {
      method: 'PUT',
      body: formData,
    });

    return handleResponse<MealProgramDto>(response);
  },

  /** Delete meal program */
  deleteProgram: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/nutritionist/me/meal-programs/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },
};
