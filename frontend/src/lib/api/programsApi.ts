import { ProgramDto, CreateProgramRequest, UpdateProgramRequest, PublicProgramDto } from '@/types/program';
import { PagedResponse } from '@/types/pagination';
import { API_URL, fetchWithAuth } from '@/lib/config';

export interface ProgramsFilterParams {
  minPrice?: number
  maxPrice?: number
  minRating?: number
  tier?: string
  minSales?: number
}

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

export const programsApi = {
  // Get all public programs for browsing (paginated)
  getAllPublic: async (page = 1, pageSize = 20, filters?: ProgramsFilterParams): Promise<PagedResponse<PublicProgramDto>> => {
    const response = await fetchWithAuth(`${API_URL}/programs?page=${page}&pageSize=${pageSize}${buildProgramFilterQuery(filters)}`);
    return handleResponse<PagedResponse<PublicProgramDto>>(response);
  },

  // Get a single public program by ID
  getProgramById: async (id: string): Promise<PublicProgramDto | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/programs/${id}`);
      return handleResponse<PublicProgramDto>(response);
    } catch (error) {
      return null;
    }
  },

  // Get trainer's programs
  getMyPrograms: async (): Promise<ProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs`);
    return handleResponse<ProgramDto[]>(response);
  },

  // Create program
  createProgram: async (request: CreateProgramRequest): Promise<ProgramDto> => {
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

    if (request.trainingVideos && request.trainingVideos.length > 0) {
      request.trainingVideos.forEach((video) => {
        formData.append('trainingVideos', video);
      });
    }

    if (request.trainingVideoTitles && request.trainingVideoTitles.length > 0) {
      request.trainingVideoTitles.forEach((title) => {
        formData.append('trainingVideoTitles', title);
      });
    }

    if (request.trainingVideoDescriptions && request.trainingVideoDescriptions.length > 0) {
      request.trainingVideoDescriptions.forEach((description) => {
        formData.append('trainingVideoDescriptions', description);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs`, {
      method: 'POST',
      body: formData,
    });

    return handleResponse<ProgramDto>(response);
  },

  // Update program
  updateProgram: async (id: string, request: UpdateProgramRequest): Promise<ProgramDto> => {
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
    if (request.trainingVideos && request.trainingVideos.length > 0) {
      request.trainingVideos.forEach((video) => {
        formData.append('trainingVideos', video);
      });
    }

    if (request.trainingVideoTitles && request.trainingVideoTitles.length > 0) {
      request.trainingVideoTitles.forEach((title) => {
        formData.append('trainingVideoTitles', title);
      });
    }

    if (request.trainingVideoDescriptions && request.trainingVideoDescriptions.length > 0) {
      request.trainingVideoDescriptions.forEach((description) => {
        formData.append('trainingVideoDescriptions', description);
      });
    }

    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs/${id}`, {
      method: 'PUT',
      body: formData,
    });

    return handleResponse<ProgramDto>(response);
  },

  // Delete program
  deleteProgram: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/trainer/me/programs/${id}`, {
      method: 'DELETE',
    });
    await handleResponse<void>(response);
  },

  // Get program by code
  getProgramByCode: async (code: string): Promise<ProgramDto | null> => {
    try {
      const response = await fetchWithAuth(`${API_URL}/programs/by-code/${code}`);
      return handleResponse<ProgramDto>(response);
    } catch (error) {
      return null;
    }
  },
};
