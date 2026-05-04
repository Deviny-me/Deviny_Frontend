'use client'

import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  Video,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  MapPin,
  Edit,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import {
  ScheduleEvent,
  CreateScheduleEventRequest,
  ScheduleEventType,
  ScheduleStats,
  GetEventsQuery,
  StartCallResponse,
} from '@/types/schedule'
import { useAccentColors } from '@/lib/theme/useAccentColors'
import { useRealtimeScopeRefresh } from '@/lib/signalr/useRealtimeScopeRefresh'

export interface ScheduleApiAdapter {
  getEvents(query?: GetEventsQuery): Promise<ScheduleEvent[]>
  getStats(weekStartISO: string): Promise<ScheduleStats>
  createEvent?(data: CreateScheduleEventRequest): Promise<ScheduleEvent>
  updateEvent?(id: string, data: CreateScheduleEventRequest): Promise<ScheduleEvent>
  cancelEvent?(id: string): Promise<void>
  startCall?(id: string): Promise<StartCallResponse>
}

interface StudentOption {
  id: string
  name: string
}

interface ScheduleContentProps {
  api: ScheduleApiAdapter
  fetchStudents?: () => Promise<StudentOption[]>
  readOnly?: boolean
  currentUserId?: string
}

type CalendarViewMode = 'day' | 'week' | 'month'

interface PositionedEvent {
  event: ScheduleEvent
  top: number
  height: number
  column: number
  columns: number
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_ROW_HEIGHT = 64

const toast = {
  success: (msg: string) => console.log('Success:', msg),
  error: (msg: string) => console.error('Error:', msg),
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getWeekStart(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

function getWeekDates(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

function getMonthGridStart(date: Date): Date {
  return getWeekStart(new Date(date.getFullYear(), date.getMonth(), 1))
}

function getMonthGridDates(date: Date): Date[] {
  const start = getMonthGridStart(date)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateForInput(date: Date): string {
  return getLocalDateKey(date)
}

function getViewRange(mode: CalendarViewMode, baseDate: Date): { from: Date; to: Date } {
  if (mode === 'day') {
    const from = startOfDay(baseDate)
    return { from, to: addDays(from, 1) }
  }

  if (mode === 'week') {
    const from = getWeekStart(baseDate)
    return { from, to: addDays(from, 7) }
  }

  const from = getMonthGridStart(baseDate)
  return { from, to: addDays(from, 42) }
}

function formatHour(hour: number, locale: string): string {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getEventTone(type: ScheduleEventType) {
  if (type === 'Gym') {
    return {
      chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-200',
      block: 'border-emerald-500/45 bg-emerald-500/14 text-emerald-900 dark:text-emerald-100',
      dot: 'bg-emerald-500',
    }
  }

  if (type === 'Consultation') {
    return {
      chip: 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-200',
      block: 'border-amber-500/45 bg-amber-500/15 text-amber-900 dark:text-amber-100',
      dot: 'bg-amber-500',
    }
  }

  return {
    chip: 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-200',
    block: 'border-sky-500/45 bg-sky-500/15 text-sky-900 dark:text-sky-100',
    dot: 'bg-sky-500',
  }
}

function layoutDayEvents(dayEvents: ScheduleEvent[]): PositionedEvent[] {
  if (dayEvents.length === 0) return []

  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  )

  const active: Array<{ end: number; column: number; group: number }> = []
  const temp: Array<{
    event: ScheduleEvent
    start: number
    end: number
    column: number
    group: number
  }> = []

  let groupId = -1

  for (const event of sorted) {
    const startDate = new Date(event.startAt)
    const start = startDate.getHours() * 60 + startDate.getMinutes()
    const end = start + Math.max(event.durationMinutes, 15)

    for (let i = active.length - 1; i >= 0; i -= 1) {
      if (active[i].end <= start) {
        active.splice(i, 1)
      }
    }

    if (active.length === 0) {
      groupId += 1
    }

    const used = new Set(active.map((a) => a.column))
    let column = 0
    while (used.has(column)) {
      column += 1
    }

    active.push({ end, column, group: groupId })
    temp.push({ event, start, end, column, group: groupId })
  }

  const groupMaxColumns = new Map<number, number>()
  for (const item of temp) {
    const current = groupMaxColumns.get(item.group) ?? 0
    groupMaxColumns.set(item.group, Math.max(current, item.column + 1))
  }

  return temp.map((item) => {
    const columns = groupMaxColumns.get(item.group) ?? 1
    const top = (item.start / 60) * HOUR_ROW_HEIGHT
    const height = Math.max((Math.max(item.end - item.start, 15) / 60) * HOUR_ROW_HEIGHT, 26)

    return {
      event: item.event,
      top,
      height,
      column: item.column,
      columns,
    }
  })
}

function findNextAvailableTimeForDay(dayEvents: ScheduleEvent[], durationMinutes: number): string {
  const requestedDuration = Math.max(durationMinutes, 15)
  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  )

  const isFree = (candidateStartMinutes: number) => {
    const candidateEndMinutes = candidateStartMinutes + requestedDuration

    return !sorted.some((event) => {
      const start = new Date(event.startAt)
      const eventStartMinutes = start.getHours() * 60 + start.getMinutes()
      const eventEndMinutes = eventStartMinutes + Math.max(event.durationMinutes, 15)

      return eventStartMinutes < candidateEndMinutes && eventEndMinutes > candidateStartMinutes
    })
  }

  const startScan = 8 * 60
  const endScan = 23 * 60 + 45
  for (let candidate = startScan; candidate <= endScan; candidate += 15) {
    if (isFree(candidate)) {
      const h = String(Math.floor(candidate / 60)).padStart(2, '0')
      const m = String(candidate % 60).padStart(2, '0')
      return `${h}:${m}`
    }
  }

  return '10:00'
}

function getStatusBadgeClass(status: ScheduleEvent['status']) {
  if (status === 'Confirmed') return 'bg-emerald-500/20 text-emerald-300'
  if (status === 'Completed') return 'bg-sky-500/20 text-sky-300'
  return 'bg-amber-500/20 text-amber-300'
}

export function ScheduleContent({ api, fetchStudents, readOnly, currentUserId }: ScheduleContentProps) {
  const accent = useAccentColors()
  const t = useTranslations('schedule')
  const tc = useTranslations('common')
  const locale = useLocale()

  const weekDays = [
    t('days.mon'),
    t('days.tue'),
    t('days.wed'),
    t('days.thu'),
    t('days.fri'),
    t('days.sat'),
    t('days.sun'),
  ]

  const eventTypes: { value: ScheduleEventType; label: string }[] = [
    { value: 'Gym', label: t('eventTypes.gym') },
    { value: 'Online', label: t('eventTypes.online') },
    { value: 'Consultation', label: t('eventTypes.consultation') },
  ]

  const viewOptions: { value: CalendarViewMode; label: string }[] = [
    { value: 'day', label: t('views.day') },
    { value: 'week', label: t('views.week') },
    { value: 'month', label: t('views.month') },
  ]

  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [calendarDate, setCalendarDate] = useState(startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()))
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) return 'day'
    return 'week'
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [startingCall, setStartingCall] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [detailEvent, setDetailEvent] = useState<ScheduleEvent | null>(null)

  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<ScheduleEventType>('Online')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [location, setLocation] = useState('')
  const [comment, setComment] = useState('')
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    loadEvents()
    loadStats()
  }, [calendarDate, viewMode])

  useEffect(() => {
    if (fetchStudents) {
      fetchStudents().then(setStudents).catch(() => setStudents([]))
    }
  }, [fetchStudents])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const range = getViewRange(viewMode, calendarDate)
      const data = await api.getEvents({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
      })
      setEvents(data)
    } catch (error) {
      console.error('Failed to load events:', error)
      toast.error(t('toasts.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const weekStart = getWeekStart(calendarDate)
      const data = await api.getStats(weekStart.toISOString())
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  useRealtimeScopeRefresh(['schedule'], () => {
    loadEvents()
    loadStats()
  })

  const resetForm = () => {
    setTitle('')
    setEventType('Online')
    setStartDate('')
    setStartTime('')
    setDuration('60')
    setLocation('')
    setComment('')
    setStudentId('')
    setEditingEvent(null)
  }

  const openCreateModal = () => {
    resetForm()
    setStartDate(formatDateForInput(selectedDate))
    const dayKey = getLocalDateKey(selectedDate)
    const dayEvents = visibleEvents.filter((event) => getLocalDateKey(new Date(event.startAt)) === dayKey)
    setStartTime(findNextAvailableTimeForDay(dayEvents, 60))
    setShowCreateModal(true)
  }

  const openEditModal = (event: ScheduleEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setEventType(event.type)
    const eventDate = new Date(event.startAt)
    setStartDate(formatDateForInput(eventDate))
    setStartTime(eventDate.toTimeString().slice(0, 5))
    setDuration(event.durationMinutes.toString())
    setLocation(event.location || '')
    setComment(event.comment || '')
    setStudentId(event.studentId || '')
    setShowCreateModal(true)
  }

  const closeModal = () => {
    setShowCreateModal(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !startDate || !startTime || !duration) {
      toast.error(t('toasts.fillRequired'))
      return
    }

    try {
      setSaving(true)

      const startAt = new Date(`${startDate}T${startTime}:00`).toISOString()
      const request: CreateScheduleEventRequest = {
        title,
        type: eventType,
        startAt,
        durationMinutes: parseInt(duration, 10),
        location: location || undefined,
        comment: comment || undefined,
        studentId: studentId || undefined,
      }

      if (editingEvent) {
        await api.updateEvent!(editingEvent.id, request)
        toast.success(t('toasts.updated'))
      } else {
        await api.createEvent!(request)
        toast.success(t('toasts.created'))
      }

      closeModal()

      const eventDate = startOfDay(new Date(`${startDate}T00:00:00`))
      setSelectedDate(eventDate)
      setCalendarDate(eventDate)
      loadEvents()
      loadStats()
    } catch (error) {
      console.error('Failed to save event:', error)
      const errorMessage = error instanceof Error ? error.message : null
      if (errorMessage && errorMessage.toLowerCase().includes('overlap')) {
        toast.error(errorMessage)
      } else {
        toast.error(editingEvent ? t('toasts.updateError') : t('toasts.createError'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm(t('toasts.cancelConfirm'))) return

    try {
      setDeleting(eventId)
      await api.cancelEvent!(eventId)
      toast.success(t('toasts.cancelled'))
      loadEvents()
      loadStats()
    } catch (error) {
      console.error('Failed to cancel event:', error)
      toast.error(t('toasts.cancelError'))
    } finally {
      setDeleting(null)
    }
  }

  const handleStartCall = async (eventId: string) => {
    if (!api.startCall || startingCall) return

    try {
      setStartingCall(eventId)
      const result = await api.startCall!(eventId)
      const popup = window.open(result.callUrl, '_blank', 'noopener,noreferrer')
      if (!popup) {
        toast.error(t('toasts.popupBlocked'))
      }
    } catch (error) {
      console.error('Failed to start call:', error)
      toast.error(t('toasts.callError'))
    } finally {
      setStartingCall(null)
    }
  }

  const moveCalendar = (direction: -1 | 1) => {
    let next = new Date(calendarDate)

    if (viewMode === 'day') {
      next = addDays(calendarDate, direction)
    } else if (viewMode === 'week') {
      next = addDays(calendarDate, direction * 7)
    } else {
      next = new Date(calendarDate)
      next.setMonth(next.getMonth() + direction)
    }

    const nextDay = startOfDay(next)
    setCalendarDate(nextDay)
    setSelectedDate(nextDay)
  }

  const goToToday = () => {
    const today = startOfDay(new Date())
    setCalendarDate(today)
    setSelectedDate(today)
  }

  const visibleEvents = useMemo(
    () => events.filter((event) => !event.isCancelled),
    [events]
  )

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>()

    for (const event of visibleEvents) {
      const key = getLocalDateKey(new Date(event.startAt))
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }

    for (const [key, list] of map) {
      map.set(
        key,
        list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
      )
    }

    return map
  }, [visibleEvents])

  const selectedDayEvents = useMemo(() => {
    const key = getLocalDateKey(selectedDate)
    return eventsByDate.get(key) ?? []
  }, [eventsByDate, selectedDate])

  const weekDates = useMemo(() => getWeekDates(getWeekStart(calendarDate)), [calendarDate])
  const monthDates = useMemo(() => getMonthGridDates(calendarDate), [calendarDate])

  const gridDates = viewMode === 'day' ? [calendarDate] : weekDates
  const today = startOfDay(new Date())

  const periodLabel = useMemo(() => {
    if (viewMode === 'day') {
      return calendarDate.toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }

    if (viewMode === 'week') {
      const start = getWeekStart(calendarDate)
      const end = addDays(start, 6)
      const sameMonth = start.getMonth() === end.getMonth()

      if (sameMonth) {
        return `${start.toLocaleDateString(locale, {
          day: 'numeric',
        })} - ${end.toLocaleDateString(locale, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}`
      }

      return `${start.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
      })} - ${end.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`
    }

    return calendarDate.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    })
  }, [calendarDate, locale, viewMode])

  const getListParticipantName = (event: ScheduleEvent) => {
    if (currentUserId && event.studentId === currentUserId) {
      return event.trainerName || event.studentName || null
    }

    if (currentUserId && event.trainerId === currentUserId) {
      return event.studentName || event.trainerName || null
    }

    return event.studentName || event.trainerName || null
  }

  const canManageEvent = (event: ScheduleEvent) => {
    return !readOnly && (!currentUserId || event.trainerId === currentUserId)
  }

  const canStartCall = (event: ScheduleEvent) => {
    if (readOnly || !api.startCall || event.type !== 'Online') return false
    if (!currentUserId) return true
    return event.trainerId === currentUserId || event.studentId === currentUserId
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>

        {!readOnly && (
          <button
            onClick={openCreateModal}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 h-10 text-sm font-semibold text-white shadow-md transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
          >
            <Plus className="h-4 w-4" />
            {t('addEvent')}
          </button>
        )}
      </div>

      <section className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle">
        <div className="space-y-4 p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => moveCalendar(-1)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => moveCalendar(1)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={goToToday}
                className="inline-flex items-center justify-center h-9 px-3 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-sm font-medium text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
              >
                {t('today')}
              </button>

              <h2 className="ml-1 text-base font-semibold capitalize text-foreground sm:text-lg">
                {periodLabel}
              </h2>
            </div>

            <div className="inline-flex w-full rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-1 sm:w-auto">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-[background,color,box-shadow] duration-200 sm:flex-none ${
                    viewMode === option.value
                      ? 'bg-surface-1 text-foreground shadow-xs ring-1 ring-inset ring-border-subtle'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-muted-foreground">{t('eventType')}:</span>
            {eventTypes.map((type) => {
              const tone = getEventTone(type.value)
              return (
                <span
                  key={type.value}
                  className={`inline-flex items-center gap-1.5 rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2.5 py-1 text-foreground`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                  {type.label}
                </span>
              )
            })}
          </div>

          {loading ? (
            <div className="flex h-[420px] items-center justify-center rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
              <Loader2 className={`h-6 w-6 animate-spin ${accent.text}`} />
            </div>
          ) : viewMode === 'month' ? (
            <div className="-mx-3 overflow-x-auto px-3 pb-1">
              <div className="min-w-[560px] sm:min-w-[760px] overflow-hidden rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle">
                <div className="grid grid-cols-7 border-b border-border-subtle/80">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="border-r border-border-subtle/60 bg-surface-3 px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground last:border-r-0"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7">
                  {monthDates.map((date) => {
                    const key = getLocalDateKey(date)
                    const dayEvents = eventsByDate.get(key) ?? []
                    const inCurrentMonth = date.getMonth() === calendarDate.getMonth()
                    const isSelected = isSameDay(date, selectedDate)
                    const isTodayDate = isSameDay(date, today)

                    return (
                      <div
                        key={key}
                        onClick={() => {
                          const nextDate = startOfDay(date)
                          setSelectedDate(nextDate)
                          setCalendarDate(nextDate)
                        }}
                        className={`min-h-[120px] cursor-pointer border-r border-t border-border-subtle/60 p-2 transition-colors ${
                          inCurrentMonth ? 'bg-surface-2/80' : 'bg-background/40'
                        } ${isSelected ? accent.bgMuted20 : 'hover:bg-hover-overlay'} ${
                          (monthDates.indexOf(date) + 1) % 7 === 0 ? 'border-r-0' : ''
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                              isTodayDate
                                ? `bg-gradient-to-r text-white ${accent.gradient}`
                                : isSelected
                                ? `${accent.bgMuted20} ${accent.text}`
                                : inCurrentMonth
                                ? 'text-foreground'
                                : 'text-faint-foreground'
                            }`}
                          >
                            {date.getDate()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => {
                            const tone = getEventTone(event.type)

                            return (
                              <button
                                key={event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDetailEvent(event)
                                }}
                                className={`w-full rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight ${tone.chip}`}
                              >
                                <div className="font-semibold">{formatTime(event.startAt, locale)}</div>
                                <div className="truncate">{event.title}</div>
                              </button>
                            )
                          })}

                          {dayEvents.length > 2 && (
                            <p className="text-[11px] text-muted-foreground">
                              {t('moreEvents', { count: dayEvents.length - 2 })}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="-mx-3 overflow-x-auto px-3 pb-1">
              <div
                className={`overflow-hidden rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle ${
                  viewMode === 'week' ? 'min-w-[640px] sm:min-w-[940px]' : 'min-w-[300px]'
                }`}
              >
                <div
                  className="grid border-b border-border-subtle"
                  style={{ gridTemplateColumns: `56px repeat(${gridDates.length}, minmax(0, 1fr))` }}
                >
                  <div className="bg-surface-3" />
                  {gridDates.map((date) => {
                    const isCurrent = isSameDay(date, today)
                    const isSelected = isSameDay(date, selectedDate)

                    return (
                      <button
                        key={getLocalDateKey(date)}
                        onClick={() => setSelectedDate(startOfDay(date))}
                        className={`border-l border-border-subtle px-2 py-3 text-center transition-colors ${
                          isSelected ? accent.bgMuted20 : 'bg-surface-3/70 hover:bg-hover-overlay'
                        }`}
                      >
                        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {date.toLocaleDateString(locale, { weekday: 'short' })}
                        </div>
                        <div
                          className={`mx-auto mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            isCurrent
                              ? `bg-gradient-to-r text-white ${accent.gradient}`
                              : isSelected
                              ? `${accent.text} ${accent.bgMuted20}`
                              : 'text-foreground'
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div
                  className="grid border-b border-border-subtle bg-background/70"
                  style={{ gridTemplateColumns: `56px repeat(${gridDates.length}, minmax(0, 1fr))` }}
                >
                  <div className="px-2 py-2 text-[10px] font-medium text-muted-foreground">{t('allDay')}</div>
                  {gridDates.map((date) => (
                    <div
                      key={`all-day-${getLocalDateKey(date)}`}
                      onClick={() => setSelectedDate(startOfDay(date))}
                      className="min-h-10 border-l border-border-subtle px-2 py-2"
                    />
                  ))}
                </div>

                <div className="relative overflow-y-auto" style={{ maxHeight: '72vh' }}>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `56px repeat(${gridDates.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <div
                      className="relative"
                      style={{ height: HOURS.length * HOUR_ROW_HEIGHT }}
                    >
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 px-2 text-[10px] font-medium tabular-nums text-faint-foreground"
                          style={{ top: hour * HOUR_ROW_HEIGHT + 4 }}
                        >
                          {formatHour(hour, locale)}
                        </div>
                      ))}
                    </div>

                    {gridDates.map((date) => {
                      const key = getLocalDateKey(date)
                      const dayEvents = eventsByDate.get(key) ?? []
                      const positioned = layoutDayEvents(dayEvents)

                      return (
                        <div
                          key={`grid-${key}`}
                          onClick={() => setSelectedDate(startOfDay(date))}
                          className="relative border-l border-border-subtle bg-background/20"
                          style={{ height: HOURS.length * HOUR_ROW_HEIGHT }}
                        >
                          {HOURS.map((hour) => (
                            <div
                              key={`${key}-${hour}`}
                              className="absolute left-0 right-0 border-t border-border-subtle/75"
                              style={{ top: hour * HOUR_ROW_HEIGHT }}
                            />
                          ))}

                          {positioned.map((item) => {
                            const tone = getEventTone(item.event.type)
                            const leftPercent = (item.column / item.columns) * 100
                            const widthPercent = 100 / item.columns

                            return (
                              <button
                                key={item.event.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDetailEvent(item.event)
                                }}
                                className={`absolute overflow-hidden rounded-md border px-2 py-1 text-left shadow-sm transition hover:brightness-110 ${tone.block}`}
                                style={{
                                  top: item.top + 2,
                                  height: item.height - 4,
                                  left: `calc(${leftPercent}% + 4px)`,
                                  width: `calc(${widthPercent}% - 8px)`,
                                }}
                              >
                                <p className="truncate text-[11px] font-semibold leading-tight">
                                  {item.event.title}
                                </p>
                                <p className="truncate text-[10px] opacity-90">
                                  {formatTime(item.event.startAt, locale)} - {item.event.durationMinutes} {tc('min')}
                                </p>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {selectedDate.toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h2>

        {selectedDayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle py-12 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 ring-1 ring-border-subtle mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('noEvents')}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDayEvents.map((event, index) => {
              const tone = getEventTone(event.type)
              const participant = getListParticipantName(event)

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setDetailEvent(event)}
                  className="group cursor-pointer rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4 transition-[box-shadow,transform] duration-200 hover:ring-border-strong hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className={`hidden h-14 w-1 rounded-full sm:block ${tone.dot}`} />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-foreground">{event.title}</h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2 py-0.5 text-[10px] font-semibold text-foreground">
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          {eventTypes.find((et) => et.value === event.type)?.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(event.status)}`}>
                          {event.status === 'Confirmed'
                            ? t('confirmed')
                            : event.status === 'Completed'
                            ? t('completed')
                            : t('pending')}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {formatTime(event.startAt, locale)} • {event.durationMinutes} {tc('min')}
                          </span>
                        </div>

                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}

                        {participant && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{participant}</span>
                          </div>
                        )}
                      </div>

                      {event.comment && <p className="mt-1 text-xs text-faint-foreground">{event.comment}</p>}
                    </div>

                    {(canStartCall(event) || canManageEvent(event)) && (
                      <div
                        className="flex items-center gap-1.5 self-stretch sm:self-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canStartCall(event) && (
                          <button
                            onClick={() => handleStartCall(event.id)}
                            disabled={startingCall === event.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
                            title={t('startCall')}
                          >
                            {startingCall === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            ) : (
                              <Video className="h-4 w-4 text-white" />
                            )}
                          </button>
                        )}

                        {canManageEvent(event) && (
                          <button
                            onClick={() => openEditModal(event)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        {canManageEvent(event) && (
                          <button
                            onClick={() => handleDelete(event.id)}
                            disabled={deleting === event.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-red-500 hover:ring-red-500/40 transition-[color,box-shadow] duration-200 disabled:opacity-50"
                          >
                            {deleting === event.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-border-subtle">
              <Calendar className={`h-4 w-4 ${accent.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-foreground">{selectedDayEvents.length}</p>
              <p className="text-xs text-muted-foreground">{t('totalEvents')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-border-subtle">
              <Users className={`h-4 w-4 ${accent.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-foreground">{stats?.upcomingEvents || 0}</p>
              <p className="text-xs text-muted-foreground">{t('upcoming')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-border-subtle">
              <Clock className={`h-4 w-4 ${accent.text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold tracking-tight text-foreground">
                {stats?.totalMinutes ? Math.round(stats.totalMinutes / 60) : 0}h
              </p>
              <p className="text-xs text-muted-foreground">{t('trainingHours')}</p>
            </div>
          </div>
        </div>
      </section>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle shadow-xl"
          >
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                  {editingEvent ? t('editEvent') : t('newEvent')}
                </h2>
                <button
                  onClick={closeModal}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('eventName')}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                    placeholder={t('eventNamePlaceholder')}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('eventType')}</label>
                  <div className="inline-flex w-full rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-1">
                    {eventTypes.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setEventType(type.value)}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-[background,color,box-shadow] duration-200 ${
                          eventType === type.value
                            ? 'bg-surface-1 text-foreground shadow-xs ring-1 ring-inset ring-border-subtle'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {students.length > 0 && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('student')}</label>
                    <select
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full h-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                    >
                      <option value="">{t('selectStudent')}</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('date')}</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('time')}</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('duration')}</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full h-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                  >
                    <option value="30">{t('duration30')}</option>
                    <option value="45">{t('duration45')}</option>
                    <option value="60">{t('duration60')}</option>
                    <option value="90">{t('duration90')}</option>
                    <option value="120">{t('duration120')}</option>
                  </select>
                </div>

                {eventType === 'Gym' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('location')}</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full h-10 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                      placeholder={t('locationPlaceholder')}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('comment')}</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle px-3.5 py-2.5 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)] transition-[box-shadow] duration-200"
                    placeholder={t('commentPlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingEvent ? t('saveChanges') : t('createEvent')}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface-1 ring-1 ring-inset ring-border-subtle shadow-xl"
          >
            <div className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">{t('eventDetails')}</h2>
                <button
                  onClick={() => setDetailEvent(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle text-muted-foreground hover:text-foreground hover:ring-border-strong transition-[color,box-shadow] duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">{detailEvent.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 ring-1 ring-inset ring-border-subtle px-2.5 py-1 text-[11px] font-semibold text-foreground">
                      <span className={`h-1.5 w-1.5 rounded-full ${getEventTone(detailEvent.type).dot}`} />
                      {eventTypes.find((et) => et.value === detailEvent.type)?.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClass(
                        detailEvent.status
                      )}`}
                    >
                      {detailEvent.status === 'Confirmed'
                        ? t('confirmed')
                        : detailEvent.status === 'Completed'
                        ? t('completed')
                        : t('pending')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Calendar className={`h-4 w-4 ${accent.text}`} />
                  <span>
                    {new Date(detailEvent.startAt).toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className={`h-4 w-4 ${accent.text}`} />
                  <span>
                    {formatTime(detailEvent.startAt, locale)} • {detailEvent.durationMinutes} {tc('min')}
                  </span>
                </div>

                {detailEvent.location && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <MapPin className={`h-4 w-4 ${accent.text}`} />
                    <span>{detailEvent.location}</span>
                  </div>
                )}

                {detailEvent.trainerName && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Users className={`h-4 w-4 ${accent.text}`} />
                    <span>
                      {t('trainerLabel')}: {detailEvent.trainerName}
                    </span>
                  </div>
                )}

                {detailEvent.studentName && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Users className={`h-4 w-4 ${accent.text}`} />
                    <span>
                      {t('student')}: {detailEvent.studentName}
                    </span>
                  </div>
                )}

                {detailEvent.comment && (
                  <div className="rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle p-3.5">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">{t('comment')}</p>
                    <p className="text-sm text-foreground">{detailEvent.comment}</p>
                  </div>
                )}

                <p className="text-xs text-faint-foreground">
                  {t('createdAt')}:{' '}
                  {new Date(detailEvent.createdAt).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {(canStartCall(detailEvent) || canManageEvent(detailEvent)) && (
                <div className="mt-5 flex flex-col gap-2 border-t border-border-subtle pt-4 sm:flex-row">
                  {canStartCall(detailEvent) && (
                    <button
                      onClick={() => {
                        handleStartCall(detailEvent.id)
                        setDetailEvent(null)
                      }}
                      disabled={startingCall === detailEvent.id}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})` }}
                    >
                      {startingCall === detailEvent.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Video className="h-4 w-4" />
                      )}
                      {t('startCall')}
                    </button>
                  )}

                  {canManageEvent(detailEvent) && (
                    <button
                      onClick={() => {
                        openEditModal(detailEvent)
                        setDetailEvent(null)
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-surface-2 ring-1 ring-inset ring-border-subtle py-2.5 text-sm font-semibold text-foreground hover:ring-border-strong transition-[box-shadow] duration-200"
                    >
                      <Edit className="h-4 w-4" />
                      {t('editEvent')}
                    </button>
                  )}

                  {canManageEvent(detailEvent) && (
                    <button
                      onClick={() => {
                        handleDelete(detailEvent.id)
                        setDetailEvent(null)
                      }}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 ring-1 ring-inset ring-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function formatTime(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
