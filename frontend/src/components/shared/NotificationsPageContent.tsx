'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Inbox,
  Loader2,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useUnreadNotifications } from '@/contexts/UnreadNotificationsContext'
import { isDeleteUnsupportedError, notificationsApi } from '@/lib/api/notificationsApi'
import {
  archiveNotificationLocally,
  archiveNotificationsBefore,
  filterArchivedNotifications,
  isNotificationArchived,
} from '@/lib/notifications/localArchive'
import {
  getNotificationCategory,
  getNotificationHref,
  getNotificationIcon,
  timeAgo,
} from '@/lib/notifications/presentation'
import { chatConnection, EntityChangedEvent } from '@/lib/signalr/chatConnection'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import type { Notification, NotificationRealtimePayload } from '@/types/notification'

type NotificationFilter = 'all' | 'unread' | 'read'

interface NotificationsPageContentProps {
  basePath: '/user' | '/trainer' | '/nutritionist'
}

function uniqueById(items: Notification[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function NotificationsPageContent({ basePath }: NotificationsPageContentProps) {
  const t = useTranslations('notifications')
  const router = useRouter()
  const accent = useAccentColors()
  const { unreadCount, refreshCount } = useUnreadNotifications()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [filter, setFilter] = useState<NotificationFilter>('all')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [mutatingIds, setMutatingIds] = useState<Set<string>>(new Set())
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async (cursor?: string) => {
    if (cursor) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await notificationsApi.getNotifications(cursor, 30)
      setNotifications(prev =>
        cursor
          ? filterArchivedNotifications(uniqueById([...prev, ...response.items]))
          : filterArchivedNotifications(response.items)
      )
      setNextCursor(response.nextCursor)
    } catch (err) {
      console.error('[NotificationsPage] Failed to load notifications:', err)
      setError(t('loadError'))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [t])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const handleNotificationReceived = (data: NotificationRealtimePayload) => {
      const item: Notification = {
        id: data.id,
        type: data.type,
        category: data.category ?? null,
        title: data.title,
        message: data.message,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        isRead: data.isRead,
        createdAt: data.createdAt,
        readAt: data.readAt ?? null,
      }

      if (isNotificationArchived(item)) return
      setNotifications(prev => uniqueById([item, ...prev]))
    }

    const handleEntityChanged = (event: EntityChangedEvent) => {
      if (event.scope !== 'notifications') return

      if (event.action === 'deleted') {
        if (event.entityId) {
          setNotifications(prev => prev.filter(item => item.id !== event.entityId))
        } else {
          setNotifications([])
          setNextCursor(null)
        }
      }

      if (event.action === 'updated') {
        if (event.entityId) {
          setNotifications(prev =>
            prev.map(item =>
              item.id === event.entityId
                ? { ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }
                : item
            )
          )
        } else {
          setNotifications(prev =>
            prev.map(item => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }))
          )
        }
      }
    }

    chatConnection.onNotificationReceived(handleNotificationReceived)
    chatConnection.onEntityChanged(handleEntityChanged)

    return () => {
      chatConnection.off('NotificationReceived', handleNotificationReceived)
      chatConnection.off('EntityChanged', handleEntityChanged)
    }
  }, [])

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(item => !item.isRead)
    if (filter === 'read') return notifications.filter(item => item.isRead)
    return notifications
  }, [filter, notifications])

  const readCount = Math.max(notifications.length - unreadCount, 0)
  const hasNotifications = notifications.length > 0
  const filterLabels: Record<NotificationFilter, string> = {
    all: t('filterAll'),
    unread: t('filterUnread'),
    read: t('filterRead'),
  }

  const setMutating = (id: string, value: boolean) => {
    setMutatingIds(prev => {
      const next = new Set(prev)
      if (value) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }

  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.isRead || mutatingIds.has(notification.id)) return

    setMutating(notification.id, true)
    const previous = notifications
    setNotifications(prev =>
      prev.map(item =>
        item.id === notification.id
          ? { ...item, isRead: true, readAt: new Date().toISOString() }
          : item
      )
    )

    try {
      await notificationsApi.markAsRead(notification.id)
      refreshCount()
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark as read:', err)
      setNotifications(previous)
      setError(t('markReadError'))
    } finally {
      setMutating(notification.id, false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || clearing) return

    setClearing(true)
    const previous = notifications
    setNotifications(prev =>
      prev.map(item => ({ ...item, isRead: true, readAt: item.readAt ?? new Date().toISOString() }))
    )

    try {
      await notificationsApi.markAllAsRead()
      refreshCount()
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark all as read:', err)
      setNotifications(previous)
      setError(t('markAllReadError'))
    } finally {
      setClearing(false)
    }
  }

  const handleDelete = async (notification: Notification) => {
    if (mutatingIds.has(notification.id)) return

    setMutating(notification.id, true)
    const previous = notifications
    setNotifications(prev => prev.filter(item => item.id !== notification.id))

    try {
      await notificationsApi.deleteNotification(notification.id)
      refreshCount()
    } catch (err) {
      if (isDeleteUnsupportedError(err)) {
        archiveNotificationLocally(notification.id)
        if (!notification.isRead) {
          try {
            await notificationsApi.markAsRead(notification.id)
          } catch (markErr) {
            console.warn('[NotificationsPage] Failed to mark locally archived notification as read:', markErr)
          }
        }
        refreshCount()
        return
      }

      console.error('[NotificationsPage] Failed to delete notification:', err)
      setNotifications(previous)
      setError(t('deleteError'))
    } finally {
      setMutating(notification.id, false)
    }
  }

  const handleClearAll = async () => {
    if (!hasNotifications || clearing) return

    if (!clearConfirm) {
      setClearConfirm(true)
      return
    }

    setClearing(true)
    const previous = notifications
    const previousCursor = nextCursor
    setNotifications([])
    setNextCursor(null)
    setClearConfirm(false)

    try {
      await notificationsApi.deleteAllNotifications()
      refreshCount()
    } catch (err) {
      if (isDeleteUnsupportedError(err)) {
        archiveNotificationsBefore(new Date().toISOString())
        try {
          await notificationsApi.markAllAsRead()
        } catch (markErr) {
          console.warn('[NotificationsPage] Failed to mark locally archived notifications as read:', markErr)
        }
        refreshCount()
        return
      }

      console.error('[NotificationsPage] Failed to clear notifications:', err)
      setNotifications(previous)
      setNextCursor(previousCursor)
      setError(t('clearError'))
    } finally {
      setClearing(false)
    }
  }

  const handleOpen = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification)
    }

    const href = getNotificationHref(notification, basePath)
    if (href) router.push(href)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-2 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${accent.badge}`} />
              {unreadCount > 0 ? t('unreadSummary', { count: unreadCount }) : t('allCaughtUp')}
            </div>
            <h1 className="text-2xl font-bold tracking-normal text-foreground sm:text-3xl">
              {t('title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t('pageSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadNotifications()}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0 || clearing}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="h-4 w-4" />
              {t('markAllRead')}
            </button>
            <button
              onClick={handleClearAll}
              disabled={!hasNotifications || clearing}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
                clearConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/15'
              }`}
            >
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {clearConfirm ? t('confirmClear') : t('clearAll')}
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-4">
            <p className="text-xs font-medium uppercase text-faint-foreground">{t('total')}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{notifications.length}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-4">
            <p className="text-xs font-medium uppercase text-faint-foreground">{t('unread')}</p>
            <p className="mt-2 text-2xl font-bold" style={{ color: accent.primary }}>{unreadCount}</p>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-4">
            <p className="text-xs font-medium uppercase text-faint-foreground">{t('read')}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{readCount}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['all', 'unread', 'read'] as NotificationFilter[]).map(item => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`h-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                filter === item
                  ? 'text-white'
                  : 'border border-border bg-surface-2 text-muted-foreground hover:bg-hover-overlay hover:text-foreground'
              }`}
              style={filter === item ? { backgroundColor: accent.primary } : undefined}
            >
              {filterLabels[item]}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-lg border border-border-subtle bg-surface-2">
          {loading ? (
            <div className="flex min-h-[24rem] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-full bg-border-subtle p-4">
                {filter === 'all'
                  ? <Inbox className="h-8 w-8 text-faint-foreground" />
                  : <Bell className="h-8 w-8 text-faint-foreground" />}
              </div>
              <h2 className="text-base font-semibold text-foreground">
                {filter === 'all' ? t('noNotifications') : t('noFilteredNotifications')}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {filter === 'all' ? t('emptyDescription') : t('emptyFilterDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {filteredNotifications.map(notification => {
                const href = getNotificationHref(notification, basePath)
                const isMutating = mutatingIds.has(notification.id)
                const category = getNotificationCategory(notification.type, notification.category)

                return (
                  <article
                    key={notification.id}
                    className={`group flex gap-4 px-4 py-4 transition-colors sm:px-5 ${
                      notification.isRead ? 'bg-transparent' : 'bg-[color:var(--unread-bg)]'
                    } hover:bg-hover-overlay`}
                  >
                    <div className="mt-0.5 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-border-subtle">
                      {getNotificationIcon(notification.type, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-medium text-faint-foreground">
                          {category}
                        </span>
                        {!notification.isRead && (
                          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white" style={{ backgroundColor: accent.secondary }}>
                            {t('new')}
                          </span>
                        )}
                        <time className="text-xs text-faint-foreground">
                          {timeAgo(notification.createdAt, t)}
                        </time>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-foreground">
                        {notification.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex flex-none items-start gap-1">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification)}
                          disabled={isMutating}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground disabled:opacity-50"
                          title={t('markRead')}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification)}
                        disabled={isMutating}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        title={t('delete')}
                      >
                        {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                      {href && (
                        <button
                          onClick={() => handleOpen(notification)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-1 hover:text-foreground"
                          title={t('open')}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {nextCursor && filter === 'all' && (
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => loadNotifications(nextCursor)}
              disabled={loadingMore}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface-2 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-hover-overlay disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('loadMore')}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
