export interface FriendDto {
  id: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role?: string;
  friendsSince: string;
}

export interface FriendRequestDto {
  id: number;
  senderId: string;
  senderEmail: string;
  senderFullName?: string;
  senderAvatar?: string;
  senderRole?: string;
  receiverId: string;
  receiverEmail: string;
  receiverFullName?: string;
  receiverAvatar?: string;
  receiverRole?: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string;
}

export enum FriendRequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Declined = 'Declined',
  Cancelled = 'Cancelled',
}

export interface RelationshipStatus {
  isFriend: boolean;
  friendsSince?: string;
  hasPendingRequest: boolean;
  pendingRequestId?: number;
  isRequestSender: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
  isBlockedByThem: boolean;
}
