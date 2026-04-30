import { ReviewDto, ExpertReviewDto, CreateReviewRequest } from '@/types/program';
import { API_URL, fetchWithAuth } from '@/lib/config';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Request failed');
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return response.json();
}

export const reviewsApi = {
  /** Get reviews for a program */
  getReviews: async (programId: string, programType: 'training' | 'meal'): Promise<ReviewDto[]> => {
    const response = await fetchWithAuth(
      `${API_URL}/reviews?programId=${programId}&programType=${programType}`
    );
    return handleResponse<ReviewDto[]>(response);
  },

  /** Get all reviews for an expert's programs */
  getExpertReviews: async (expertId: string): Promise<ExpertReviewDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/reviews/expert/${expertId}`);
    return handleResponse<ExpertReviewDto[]>(response);
  },

  /** Create a review for a completed program */
  createReview: async (request: CreateReviewRequest): Promise<{ reviewId: string }> => {
    const response = await fetchWithAuth(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<{ reviewId: string }>(response);
  },
};
