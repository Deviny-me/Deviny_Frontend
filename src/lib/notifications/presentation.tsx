import {
  Bell,
  Dumbbell,
  Mail,
  Megaphone,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import type { Notification } from '@/types/notification'

export function getNotificationIcon(type: string, className = 'w-4 h-4') {
  switch (type) {
    case 'AchievementUnlocked':
      return <Trophy className={`${className} text-amber-400`} />
    case 'TrainingProgramCreated':
      return <Dumbbell className={`${className} text-blue-400`} />
    case 'MealProgramCreated':
      return <UtensilsCrossed className={`${className} text-emerald-400`} />
    case 'FriendRequestReceived':
      return <UserPlus className={`${className} text-violet-400`} />
    case 'FriendRequestAccepted':
      return <UserCheck className={`${className} text-emerald-400`} />
    case 'NewFollower':
      return <Users className={`${className} text-sky-400`} />
    case 'MessageReceived':
      return <Mail className={`${className} text-cyan-400`} />
    case 'System':
      return <Megaphone className={`${className} text-muted-foreground`} />
    default:
      return <Bell className={`${className} text-muted-foreground`} />
  }
}

export function getNotificationCategory(type: string, category?: string | null) {
  if (category) return category

  switch (type) {
    case 'AchievementUnlocked':
      return 'Achievement'
    case 'TrainingProgramCreated':
      return 'Training'
    case 'MealProgramCreated':
      return 'Nutrition'
    case 'FriendRequestReceived':
    case 'FriendRequestAccepted':
    case 'NewFollower':
      return 'Social'
    case 'MessageReceived':
      return 'Messaging'
    default:
      return 'System'
  }
}

export function getNotificationHref(notification: Notification, basePath: string) {
  const entityType = notification.relatedEntityType?.toLowerCase()
  const entityId = notification.relatedEntityId

  if (entityType === 'trainingprogram' && entityId) return `${basePath}/programs/${entityId}`
  if (entityType === 'mealprogram' && entityId) return `${basePath}/programs/${entityId}`
  if (entityType === 'user' && entityId) return `${basePath}/profile/${entityId}`
  if (entityType === 'achievement') return `${basePath}/achievements`
  if (entityType === 'friendrequest') return `${basePath}/friends`

  return null
}

export function timeAgo(
  dateStr: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return t('justNow')
  if (diffMin < 60) return t('minutesAgo', { count: diffMin })
  if (diffHour < 24) return t('hoursAgo', { count: diffHour })
  if (diffDay < 7) return t('daysAgo', { count: diffDay })
  return date.toLocaleDateString()
}
