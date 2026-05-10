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
  getNotificationHref,
  getNotificationIcon,
  resolveNotificationCategory,
  resolveNotificationTitle,
  resolveNotificationMessage,
  timeAgo,
} from '@/lib/notifications/presentation'
import { chatConnection, EntityChangedEvent } from '@/lib/signalr/chatConnection'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import type { Notification, NotificationAction, NotificationRealtimePayload } from '@/types/notification'

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
  const [actionBusy, setActionBusy] = useState<Set<string>>(new Set())
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
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
        actions: data.actions ?? [],
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

  const actionId = (notificationId: string, key: string) => `${notificationId}:${key}`

  const handleAction = async (notification: Notification, action: NotificationAction) => {
    const id = actionId(notification.id, action.key)
    if (actionBusy.has(id) || completedActions.has(id)) return

    // open-profile is a navigation action — do not POST, just route client-side.
    if (action.key === 'open-profile') {
      if (!notification.isRead) {
        // fire-and-forget mark-as-read; navigation should not block on it
        handleMarkAsRead(notification).catch(() => {})
      }
      const href = notification.relatedEntityId
        ? `${basePath}/profile/${notification.relatedEntityId}`
        : getNotificationHref(notification, basePath)
      if (href) router.push(href)
      return
    }

    setActionBusy(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })

    try {
      await notificationsApi.executeAction(action)
      setCompletedActions(prev => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
      if (!notification.isRead) {
        handleMarkAsRead(notification).catch(() => {})
      }
    } catch (err) {
      console.error('[NotificationsPage] Action failed:', action.key, err)
      setError(t('actionError'))
    } finally {
      setActionBusy(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${accent.badge}`} />
            {unreadCount > 0 ? t('unreadSummary', { count: unreadCount }) : t('allCaughtUp')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('pageSubtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadNotifications()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0 || clearing}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-hover-overlay hover:text-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="hidden sm:inline">{t('markAllRead')}</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={!hasNotifications || clearing}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors disabled:opacity-50 ${
              clearConfirm
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-red-500/10 ring-1 ring-inset ring-red-500/25 text-red-400 hover:bg-red-500/15'
            }`}
          >
            {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{clearConfirm ? t('confirmClear') : t('clearAll')}</span>
          </button>
        </div>
      </div>

      {/* Stats card */}
      <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="hidden sm:inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
            >
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t('total')}</p>
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{notifications.length}</p>
            </div>
          </div>
          <div className="min-w-0 sm:border-l sm:border-border-subtle sm:pl-6">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t('unread')}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums" style={{ color: accent.primary }}>{unreadCount}</p>
          </div>
          <div className="min-w-0 sm:border-l sm:border-border-subtle sm:pl-6">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t('read')}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{readCount}</p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'unread', 'read'] as NotificationFilter[]).map(item => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`h-9 rounded-xl px-3.5 text-sm font-medium transition-all ${
              filter === item
                ? 'text-white shadow-md'
                : 'bg-surface-1 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:bg-hover-overlay hover:text-foreground'
            }`}
            style={filter === item ? { background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` } : undefined}
          >
            {filterLabels[item]}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 ring-1 ring-inset ring-red-500/25 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Notifications list */}
      <section className="overflow-hidden rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
        {loading ? (
          <div className="flex min-h-[24rem] items-center justify-center">
            <Loader2 className={`h-6 w-6 ${accent.loader} animate-spin`} />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle">
              {filter === 'all'
                ? <Inbox className="h-5 w-5 text-muted-foreground" />
                : <Bell className="h-5 w-5 text-muted-foreground" />}
            </div>
            <p className="text-sm font-medium text-foreground">
              {filter === 'all' ? t('noNotifications') : t('noFilteredNotifications')}
            </p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {filter === 'all' ? t('emptyDescription') : t('emptyFilterDescription')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {filteredNotifications.map(notification => {
              const href = getNotificationHref(notification, basePath)
              const isMutating = mutatingIds.has(notification.id)
              const category = resolveNotificationCategory(notification.type, notification.category, t)

              return (
                <article
                  key={notification.id}
                  className={`group relative flex gap-3 px-4 py-4 transition-colors sm:gap-4 sm:px-5 ${
                    notification.isRead ? 'bg-transparent' : 'bg-[color:var(--unread-bg)]'
                  } hover:bg-hover-overlay`}
                >
                  {!notification.isRead && (
                    <span
                      className="absolute left-0 top-0 h-full w-0.5"
                      style={{ background: `linear-gradient(180deg, ${accent.primary}, ${accent.secondary})` }}
                    />
                  )}

                  <div className="mt-0.5 inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
                    {getNotificationIcon(notification.type, 'w-5 h-5')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {category}
                      </span>
                      {!notification.isRead && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
                        >
                          {t('new')}
                        </span>
                      )}
                      <time className="text-[11px] text-faint-foreground">
                        {timeAgo(notification.createdAt, t)}
                      </time>
                    </div>

                    <h3 className="mt-2 text-sm font-semibold tracking-tight text-foreground">
                      {resolveNotificationTitle(notification.title, t)}
                    </h3>
                    <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                      {resolveNotificationMessage(notification.message, t)}
                    </p>

                    {notification.actions && notification.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {notification.actions.map(action => {
                          const id = actionId(notification.id, action.key)
                          const busy = actionBusy.has(id)
                          const done = completedActions.has(id)
                          const isPrimary = action.key === 'follow-back'
                          const label = done && isPrimary
                            ? t('actionFollowing')
                            : action.key === 'follow-back'
                              ? t('actionFollowBack')
                              : action.key === 'open-profile'
                                ? t('actionOpenProfile')
                                : action.label
                          return (
                            <button
                              key={action.key}
                              onClick={(e) => { e.stopPropagation(); handleAction(notification, action) }}
                              disabled={busy || done}
                              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
                                isPrimary
                                  ? 'text-white shadow-sm'
                                  : 'bg-surface-2 ring-1 ring-inset ring-border-subtle text-foreground hover:bg-hover-overlay'
                              }`}
                              style={isPrimary && !done ? { background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` } : undefined}
                            >
                              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-none items-center sm:items-start gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        disabled={isMutating}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
                        title={t('markRead')}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification)}
                      disabled={isMutating}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      title={t('delete')}
                    >
                      {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                    {href && (
                      <button
                        onClick={() => handleOpen(notification)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
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
        <div className="flex justify-center">
          <button
            onClick={() => loadNotifications(nextCursor)}
            disabled={loadingMore}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-1 ring-1 ring-inset ring-border-subtle px-5 text-sm font-semibold text-foreground transition-colors hover:bg-hover-overlay disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('loadMore')}
          </button>
        </div>
      )}
    </div>
  )
}
