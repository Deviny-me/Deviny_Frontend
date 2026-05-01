import type { Notification } from '@/types/notification'

const DELETED_IDS_KEY = 'deviny.archivedNotificationIds'
const CLEARED_BEFORE_KEY = 'deviny.notificationsClearedBefore'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readDeletedIds() {
  if (!canUseStorage()) return new Set<string>()

  try {
    const raw = window.localStorage.getItem(DELETED_IDS_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function writeDeletedIds(ids: Set<string>) {
  if (!canUseStorage()) return
  window.localStorage.setItem(DELETED_IDS_KEY, JSON.stringify([...ids]))
}

export function archiveNotificationLocally(id: string) {
  const ids = readDeletedIds()
  ids.add(id)
  writeDeletedIds(ids)
}

export function archiveNotificationsBefore(cutoffIso: string) {
  if (!canUseStorage()) return
  window.localStorage.setItem(CLEARED_BEFORE_KEY, cutoffIso)
}

export function isNotificationArchived(notification: Notification) {
  if (!canUseStorage()) return false

  const ids = readDeletedIds()
  if (ids.has(notification.id)) return true

  const clearedBefore = window.localStorage.getItem(CLEARED_BEFORE_KEY)
  if (!clearedBefore) return false

  const createdAt = new Date(notification.createdAt).getTime()
  const cutoff = new Date(clearedBefore).getTime()
  return Number.isFinite(createdAt) && Number.isFinite(cutoff) && createdAt <= cutoff
}

export function filterArchivedNotifications(items: Notification[]) {
  return items.filter(item => !isNotificationArchived(item))
}
