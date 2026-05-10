export type NotificationActionMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface NotificationAction {
  key: string;
  label: string;
  method: NotificationActionMethod;
  url: string;
}

export interface Notification {
  id: string;
  type: string;
  category?: string | null;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  actions?: NotificationAction[];
}

export interface NotificationsResponse {
  items: Notification[];
  unreadCount: number;
  nextCursor: string | null;
}

export interface NotificationSettings {
  notificationsEnabled: boolean;
  workoutRemindersEnabled: boolean;
  achievementFeedEnabled: boolean;
  contentUpdatesEnabled: boolean;
  messagingEnabled: boolean;
}

export type NotificationRealtimePayload = Omit<Notification, 'readAt'> & {
  readAt?: string | null;
};
