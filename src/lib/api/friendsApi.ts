import { API_URL, fetchWithAuth } from '@/lib/config';
import { FriendDto, FriendRequestDto, RelationshipStatus } from '@/types/friend';
import { PagedResponse } from '@/types/pagination';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithAuth(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const friendsApi = {
  // Send friend request
  sendFriendRequest: async (receiverId: string): Promise<FriendRequestDto> => {
    return apiRequest<FriendRequestDto>('/me/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
  },

  // Get incoming friend requests
  getIncomingRequests: async (): Promise<FriendRequestDto[]> => {
    return apiRequest<FriendRequestDto[]>('/me/friends/requests/incoming');
  },

  // Get outgoing friend requests
  getOutgoingRequests: async (): Promise<FriendRequestDto[]> => {
    return apiRequest<FriendRequestDto[]>('/me/friends/requests/outgoing');
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: number): Promise<void> => {
    return apiRequest<void>(`/me/friends/requests/${requestId}/accept`, {
      method: 'POST',
    });
  },

  // Decline friend request
  declineFriendRequest: async (requestId: number): Promise<void> => {
    return apiRequest<void>(`/me/friends/requests/${requestId}/decline`, {
      method: 'POST',
    });
  },

  // Cancel friend request
  cancelFriendRequest: async (requestId: number): Promise<void> => {
    return apiRequest<void>(`/me/friends/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  // Get my friends (paginated)
  getMyFriends: async (page = 1, pageSize = 30): Promise<PagedResponse<FriendDto>> => {
    return apiRequest<PagedResponse<FriendDto>>(`/me/friends?page=${page}&pageSize=${pageSize}`);
  },

  // Remove friend
  removeFriend: async (friendId: string): Promise<void> => {
    return apiRequest<void>(`/me/friends/${friendId}`, {
      method: 'DELETE',
    });
  },

  // Get relationship status with another user
  getRelationshipStatus: async (userId: string): Promise<RelationshipStatus> => {
    return apiRequest<RelationshipStatus>(`/me/friends/relationship/${userId}`);
  },
};

export const followsApi = {
  // Follow trainer
  followTrainer: async (trainerId: string): Promise<void> => {
    return apiRequest<void>(`/me/follows/${trainerId}`, {
      method: 'POST',
    });
  },

  // Unfollow trainer
  unfollowTrainer: async (trainerId: string): Promise<void> => {
    return apiRequest<void>(`/me/follows/${trainerId}`, {
      method: 'DELETE',
    });
  },

  // Get my following (paginated)
  getMyFollowing: async (page = 1, pageSize = 30): Promise<PagedResponse<FriendDto>> => {
    return apiRequest<PagedResponse<FriendDto>>(`/me/follows?page=${page}&pageSize=${pageSize}`);
  },

  // Get my followers (paginated)
  getMyFollowers: async (page = 1, pageSize = 30): Promise<PagedResponse<FriendDto>> => {
    return apiRequest<PagedResponse<FriendDto>>(`/me/follows/followers?page=${page}&pageSize=${pageSize}`);
  },
};

export const blocksApi = {
  // Block user
  blockUser: async (userId: string): Promise<void> => {
    return apiRequest<void>(`/me/blocks/${userId}`, {
      method: 'POST',
    });
  },

  // Unblock user
  unblockUser: async (userId: string): Promise<void> => {
    return apiRequest<void>(`/me/blocks/${userId}`, {
      method: 'DELETE',
    });
  },
};
