import { API_URL, fetchWithAuth } from '@/lib/config';

// --- Types ---

export interface ProgramVideoDto {
  videoUrl: string;
  title: string;
  description: string;
}

export interface PurchasedProgramDto {
  purchaseId: string;
  programId: string;
  programType: 'training' | 'meal';
  title: string;
  description: string;
  coverImageUrl: string;
  videoUrls: string[];
  videos: ProgramVideoDto[];
  tier: string;
  category: string;
  purchasedAt: string;
  trainerName: string;
  trainerAvatarUrl: string;
  trainerId: string;
  averageRating: number;
  totalReviews: number;
  purchaseStatus: 'Active' | 'Completed' | 'Cancelled';
  canReview: boolean;
  hasReviewed: boolean;
}

export interface PurchaseProgramRequest {
  programId: string;
  programType: 'training' | 'meal';
  tier: string;
}

export interface PurchaseProgramResponse {
  purchaseId: string;
}

// --- Helpers ---

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

// --- API ---

export const purchasesApi = {
  /** Purchase a program */
  purchase: async (request: PurchaseProgramRequest): Promise<PurchaseProgramResponse> => {
    const response = await fetchWithAuth(`${API_URL}/me/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse<PurchaseProgramResponse>(response);
  },

  /** Get current user's purchased programs */
  getMyPurchases: async (): Promise<PurchasedProgramDto[]> => {
    const response = await fetchWithAuth(`${API_URL}/me/purchases`);
    return handleResponse<PurchasedProgramDto[]>(response);
  },

  /** Mark purchased program as completed */
  completePurchase: async (purchaseId: string): Promise<void> => {
    const response = await fetchWithAuth(`${API_URL}/me/purchases/${purchaseId}/complete`, {
      method: 'POST',
    });
    await handleResponse<void>(response);
  },
};
